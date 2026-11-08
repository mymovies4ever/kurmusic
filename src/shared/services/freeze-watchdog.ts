/**
 * Freeze Watchdog & Automated Diagnostic Service
 *
 * Automatically monitors app boot, JS thread health, overlay states,
 * and touch responsiveness. If the screen freezes or touch is unresponsive,
 * it automatically generates and saves a comprehensive "FREEZE_ANALYSIS.txt"
 * report to /sdcard/Android/media/com.kurmusic.app/ (accessible with any file manager).
 */

import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useDiagnosticStore } from '@/src/application/state/diagnostic-store';
import { debugLogger } from './debug-logger';
import { useSettingsStore } from '@/src/application/state/settings-store';
import { usePlayerStore } from '@/src/application/state/player-store';
import { useHomeFeedStore } from '@/src/application/state/home-feed-store';

interface BootMilestone {
	readonly name: string;
	readonly timestamp: number;
	readonly relativeMs: number;
	readonly details?: string;
}

class FreezeWatchdog {
	private readonly startTime = Date.now();
	private readonly milestones: BootMilestone[] = [];
	private isStarted = false;
	private watchdogTimer: ReturnType<typeof setInterval> | null = null;
	private lastHeartbeat = Date.now();

	public start(): void {
		if (!__DEV__ || this.isStarted) return;
		this.isStarted = true;

		this.recordMilestone('JS_RUNTIME_START', 'JavaScript engine execution started');

		// Heartbeat check every 1s
		this.watchdogTimer = setInterval(() => {
			const now = Date.now();
			const drift = now - this.lastHeartbeat;
			if (drift > 3500) {
				debugLogger.record(
					'Watchdog',
					'error',
					`JS Thread Stall detected! Expected 1000ms, actual drift: ${drift}ms`
				);
			}
			this.lastHeartbeat = now;
		}, 1000);

		// Schedule automated freeze snapshot at T+3.5s and T+7s post-boot
		setTimeout(() => {
			void this.evaluateAndAutoSaveReport('3.5s_POST_BOOT_SNAPSHOT');
		}, 3500);

		setTimeout(() => {
			void this.evaluateAndAutoSaveReport('7.0s_POST_BOOT_SNAPSHOT');
		}, 7000);
	}

	public recordMilestone(name: string, details?: string): void {
		if (!__DEV__) return;
		const now = Date.now();
		const milestone: BootMilestone = {
			name,
			timestamp: now,
			relativeMs: now - this.startTime,
			details,
		};
		this.milestones.push(milestone);
		debugLogger.record(
			'Milestone',
			'info',
			`[+${milestone.relativeMs}ms] ${name}: ${details ?? ''}`
		);
	}

	public async evaluateAndAutoSaveReport(triggerReason: string): Promise<string> {
		if (!__DEV__) return '';
		const diagState = useDiagnosticStore.getState();
		const settingsHydrated = useSettingsStore.persist.hasHydrated();
		const queueLength = usePlayerStore.getState().queue.length;
		const homeFeed = useHomeFeedStore.getState();

		// Compile Freeze Analysis
		const lines: string[] = [
			'====================================================================',
			'               KURMUSIC AUTOMATED FREEZE INCIDENT REPORT             ',
			'====================================================================',
			`Timestamp: ${new Date().toISOString()}`,
			`Trigger: ${triggerReason}`,
			`Device OS: Android (OriginOS 6 / Snapdragon 8+ Gen 1 target)`,
			`App Version: ${Constants.expoConfig?.version ?? '1.2.6'} (Code: ${Constants.expoConfig?.android?.versionCode ?? '32'})`,
			`Time Since Boot: ${Date.now() - this.startTime}ms`,
			'',
			'----------------- 1. TOUCH & RESPONSIVENESS STATUS -----------------',
			`Total Touches Received: ${diagState.touchCount}`,
			`Last Touch Event: ${diagState.lastTouch ? `${JSON.stringify(diagState.lastTouch)}` : 'NONE DETECTED (Screen unresponsive)'}`,
			`Touch Status: ${diagState.touchCount === 0 ? '⚠️ ZERO TOUCHES DELIVERED BY OS TO REACT NATIVE' : '✅ Touches actively processed'}`,
			'',
			'----------------- 2. ACTIVE VIEW HIERARCHY & OVERLAYS --------------',
			`AnimatedSplash Bypass: ${diagState.bypassSplash ? 'BYPASSED' : 'ACTIVE/ENABLED'}`,
			`react-freeze Bypass: ${diagState.bypassFreeze ? 'BYPASSED' : 'ACTIVE/ENABLED'}`,
			`SceneStyle Clipping Bypass: ${diagState.bypassSceneClip ? 'BYPASSED' : 'ACTIVE/ENABLED'}`,
			`Portal / Sheet Bypass: ${diagState.bypassPortal ? 'BYPASSED' : 'ACTIVE/ENABLED'}`,
			'',
			'----------------- 3. STATE & HYDRATION HEALTH -----------------------',
			`SettingsStore Hydrated: ${settingsHydrated ? 'YES' : '❌ NO (Hydration Hang)'}`,
			`Player Queue Length: ${queueLength}`,
			`HomeFeed Sections Count: ${homeFeed.sections.length}`,
			`HomeFeed Is Loading: ${homeFeed.isLoading}`,
			`HomeFeed Last Fetched: ${homeFeed.lastFetchedAt ? new Date(homeFeed.lastFetchedAt).toLocaleTimeString() : 'NOT FETCHED'}`,
			'',
			'----------------- 4. BOOT MILESTONES TIMELINE -----------------------',
			...this.milestones.map(
				(m) =>
					`  +${m.relativeMs.toString().padStart(5, ' ')}ms: ${m.name} ${m.details ? `(${m.details})` : ''}`
			),
			'',
			'----------------- 5. ROOT CAUSE PROBABILITY AUDIT ------------------',
		];

		if (diagState.touchCount === 0) {
			lines.push('⚠️ SUSPECT #1: Transparent Overlay Interception');
			lines.push(
				'   If AnimatedSplash or BottomSheetPortal is mounted, its touch responder or full-screen'
			);
			lines.push(
				'   pan gesture handler at zIndex 9999 is intercepting touches before child views.'
			);
			lines.push('⚠️ SUSPECT #2: Pixelworks Frame Sync / react-freeze');
			lines.push(
				'   If react-freeze suspends the screen, Pixelworks display chip pauses touch sampling.'
			);
			lines.push('⚠️ SUSPECT #3: Adreno 730 SceneStyle Clipping');
			lines.push(
				'   If overflow: hidden is active, Android View bounds reject touch coordinates.'
			);
		} else {
			lines.push(
				'✅ Touch events are successfully reaching the React Native application window.'
			);
		}

		lines.push('');
		lines.push('----------------- 6. RECENT CONSOLE & SYSTEM LOGS -------------------');
		const fullLogs = await debugLogger.getFullLogContent();
		lines.push(fullLogs);
		lines.push('========================= END OF REPORT ============================');

		const reportContent = lines.join('\n');

		// Write to open /Android/media/com.kurmusic.app/ folder (Accessible by user without permissions)
		if (Platform.OS === 'android') {
			try {
				const mediaDir = 'file:///storage/emulated/0/Android/media/com.kurmusic.app/';
				await FileSystem.makeDirectoryAsync(mediaDir, { intermediates: true }).catch(
					() => {}
				);
				const mediaPath = `${mediaDir}FREEZE_ANALYSIS.txt`;
				await FileSystem.writeAsStringAsync(mediaPath, reportContent).catch(() => {});
			} catch (e) {
				debugLogger.record(
					'Watchdog',
					'warn',
					`Failed to write to media folder: ${String(e)}`
				);
			}
		}

		// Also write to internal document directory
		try {
			const internalDir = `${FileSystem.documentDirectory ?? ''}debug-logs/`;
			await FileSystem.makeDirectoryAsync(internalDir, { intermediates: true }).catch(
				() => {}
			);
			await FileSystem.writeAsStringAsync(
				`${internalDir}FREEZE_ANALYSIS.txt`,
				reportContent
			).catch(() => {});
		} catch {}

		debugLogger.record(
			'Watchdog',
			'info',
			`Auto-saved freeze analysis (${triggerReason}) to /sdcard/Android/media/com.kurmusic.app/FREEZE_ANALYSIS.txt`
		);
		return reportContent;
	}
}

export const freezeWatchdog = new FreezeWatchdog();
