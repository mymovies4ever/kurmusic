/**
 * Diagnostic HUD & Control Panel Component
 *
 * Provides a floating on-screen indicator and modal control center for
 * debugging OriginOS 6 / Snapdragon 8+ Gen 1 issues.
 * Supports direct log sharing, SAF folder export with permissions,
 * and live isolation switches to troubleshoot touch freeze.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	Modal,
	ScrollView,
	Switch,
	Alert,
	SafeAreaView,
	Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiagnosticStore } from '@/src/application/state/diagnostic-store';
import { debugLogger, type LogEntry } from '@/src/shared/services/debug-logger';

export function DiagnosticHud() {
	const insets = useSafeAreaInsets();
	const touchCount = useDiagnosticStore((state) => state.touchCount);
	const bypassFreeze = useDiagnosticStore((state) => state.bypassFreeze);
	const bypassSceneClip = useDiagnosticStore((state) => state.bypassSceneClip);
	const bypassPortal = useDiagnosticStore((state) => state.bypassPortal);
	const bypassSplash = useDiagnosticStore((state) => state.bypassSplash);
	const isPanelOpen = useDiagnosticStore((state) => state.isPanelOpen);
	const setPanelOpen = useDiagnosticStore((state) => state.setPanelOpen);
	const toggleFreezeBypass = useDiagnosticStore((state) => state.toggleFreezeBypass);
	const toggleSceneClipBypass = useDiagnosticStore((state) => state.toggleSceneClipBypass);
	const togglePortalBypass = useDiagnosticStore((state) => state.togglePortalBypass);
	const toggleSplashBypass = useDiagnosticStore((state) => state.toggleSplashBypass);
	const resetTouches = useDiagnosticStore((state) => state.resetTouches);

	const [logs, setLogs] = useState<readonly LogEntry[]>([]);
	const [heartbeatTick, setHeartbeatTick] = useState(0);

	// JS Thread Heartbeat: If this stops ticking, JS thread is deadlocked
	useEffect(() => {
		const interval = setInterval(() => {
			setHeartbeatTick((prev) => (prev + 1) % 2);
			useDiagnosticStore.getState().updateHeartbeat();
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	// Subscribe to live log updates when panel is open
	useEffect(() => {
		if (!isPanelOpen) return;
		return debugLogger.subscribe(setLogs);
	}, [isPanelOpen]);

	const handleShareLog = useCallback(async () => {
		const result = await debugLogger.shareLog();
		if (!result.success) {
			Alert.alert('Share Failed', result.error.message);
		}
	}, []);

	const handleExportToFolder = useCallback(async () => {
		const result = await debugLogger.exportLogToFolder();
		if (result.success) {
			Alert.alert('Log Exported', `Saved successfully as:\n${result.data}`);
		} else {
			Alert.alert('Export Failed', result.error.message);
		}
	}, []);

	const handleClearLogs = useCallback(async () => {
		await debugLogger.clearLogs();
		resetTouches();
	}, [resetTouches]);

	return (
		<>
			{/* Floating Top Diagnostic Pill */}
			<View
				style={[styles.floatingContainer, { top: Math.max(insets.top, 8) }]}
				pointerEvents="box-none"
			>
				<Pressable style={styles.floatingPill} onPress={() => setPanelOpen(true)}>
					<View
						style={[
							styles.heartbeatDot,
							heartbeatTick === 1 ? styles.heartbeatOn : styles.heartbeatOff,
						]}
					/>
					<Text style={styles.floatingText}>
						Touches: <Text style={styles.touchHighlight}>{touchCount}</Text>
					</Text>
					<Text style={styles.floatingButtonText}>⚙️ Logs</Text>
				</Pressable>
			</View>

			{/* Full Control Center Modal */}
			<Modal
				visible={isPanelOpen}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => setPanelOpen(false)}
			>
				<SafeAreaView style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<View>
							<Text style={styles.modalTitle}>OriginOS 6 Diagnostic Hub</Text>
							<Text style={styles.modalSubtitle}>
								Snapdragon 8+ Gen 1 • Touches: {touchCount}
							</Text>
						</View>
						<Pressable style={styles.closeButton} onPress={() => setPanelOpen(false)}>
							<Text style={styles.closeButtonText}>Done</Text>
						</Pressable>
					</View>

					{/* Log Export Action Buttons */}
					<View style={styles.actionsContainer}>
						<Pressable
							style={[styles.actionBtn, styles.shareBtn]}
							onPress={handleShareLog}
						>
							<Text style={styles.actionBtnText}>📤 Share Log Sheet</Text>
						</Pressable>
						<Pressable
							style={[styles.actionBtn, styles.saveBtn]}
							onPress={handleExportToFolder}
						>
							<Text style={styles.actionBtnText}>📁 Save to Downloads (SAF)</Text>
						</Pressable>
					</View>
					<View style={styles.secondaryActions}>
						<Pressable style={styles.smallBtn} onPress={handleClearLogs}>
							<Text style={styles.smallBtnText}>Clear Logs</Text>
						</Pressable>
						<Pressable style={styles.smallBtn} onPress={resetTouches}>
							<Text style={styles.smallBtnText}>Reset Touches</Text>
						</Pressable>
					</View>

					{/* Live Isolation Toggles */}
					<View style={styles.togglesSection}>
						<Text style={styles.sectionHeader}>
							Live Isolation Toggles (Test Fixes)
						</Text>

						<View style={styles.toggleRow}>
							<View style={styles.toggleInfo}>
								<Text style={styles.toggleLabel}>Bypass react-freeze</Text>
								<Text style={styles.toggleDesc}>
									Disables screen suspension for Pixelworks chip
								</Text>
							</View>
							<Switch value={bypassFreeze} onValueChange={toggleFreezeBypass} />
						</View>

						<View style={styles.toggleRow}>
							<View style={styles.toggleInfo}>
								<Text style={styles.toggleLabel}>Remove sceneStyle overflow</Text>
								<Text style={styles.toggleDesc}>
									Removes overflow:hidden clipping on Adreno 730
								</Text>
							</View>
							<Switch value={bypassSceneClip} onValueChange={toggleSceneClipBypass} />
						</View>

						<View style={styles.toggleRow}>
							<View style={styles.toggleInfo}>
								<Text style={styles.toggleLabel}>Unmount Portal Overlays</Text>
								<Text style={styles.toggleDesc}>
									Bypasses background sheets at zIndex: 9999
								</Text>
							</View>
							<Switch value={bypassPortal} onValueChange={togglePortalBypass} />
						</View>

						<View style={styles.toggleRow}>
							<View style={styles.toggleInfo}>
								<Text style={styles.toggleLabel}>Bypass Animated Splash</Text>
								<Text style={styles.toggleDesc}>
									Skips splash overlay entirely on boot
								</Text>
							</View>
							<Switch value={bypassSplash} onValueChange={toggleSplashBypass} />
						</View>
					</View>

					{/* Live Terminal Log Viewer */}
					<View style={styles.logsSection}>
						<Text style={styles.sectionHeader}>
							Live Console & System Logs ({logs.length})
						</Text>
						<ScrollView style={styles.logsScroll} nestedScrollEnabled>
							{logs
								.slice()
								.reverse()
								.map((item) => (
									<View key={item.id} style={styles.logItem}>
										<Text style={styles.logMeta}>
											[{item.timestamp}] [{item.level.toUpperCase()}] [
											{item.tag}]
										</Text>
										<Text
											style={[
												styles.logMessage,
												item.level === 'error' && styles.logError,
												item.level === 'warn' && styles.logWarn,
											]}
										>
											{item.message}
										</Text>
									</View>
								))}
							{logs.length === 0 && (
								<Text style={styles.emptyLogsText}>No logs recorded yet</Text>
							)}
						</ScrollView>
					</View>
				</SafeAreaView>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	floatingContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		alignItems: 'center',
		zIndex: 999999,
	},
	floatingPill: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(17, 24, 39, 0.92)',
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: '#374151',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.35,
		shadowRadius: 4,
		elevation: 6,
		gap: 8,
	},
	heartbeatDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	heartbeatOn: {
		backgroundColor: '#10b981', // green
	},
	heartbeatOff: {
		backgroundColor: '#374151',
	},
	floatingText: {
		color: '#e5e7eb',
		fontSize: 12,
		fontWeight: '600',
	},
	touchHighlight: {
		color: '#38bdf8',
		fontWeight: 'bold',
	},
	floatingButtonText: {
		color: '#facc15',
		fontSize: 12,
		fontWeight: 'bold',
		marginLeft: 4,
	},
	modalContainer: {
		flex: 1,
		backgroundColor: '#0f172a',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#1e293b',
	},
	modalTitle: {
		color: '#f8fafc',
		fontSize: 18,
		fontWeight: 'bold',
	},
	modalSubtitle: {
		color: '#94a3b8',
		fontSize: 12,
		marginTop: 2,
	},
	closeButton: {
		backgroundColor: '#334155',
		paddingHorizontal: 14,
		paddingVertical: 6,
		borderRadius: 14,
	},
	closeButtonText: {
		color: '#f8fafc',
		fontWeight: '600',
	},
	actionsContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingTop: 12,
		gap: 8,
	},
	actionBtn: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
	},
	shareBtn: {
		backgroundColor: '#2563eb',
	},
	saveBtn: {
		backgroundColor: '#059669',
	},
	actionBtnText: {
		color: '#ffffff',
		fontSize: 12,
		fontWeight: 'bold',
	},
	secondaryActions: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingTop: 8,
		gap: 8,
	},
	smallBtn: {
		backgroundColor: '#1e293b',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
	},
	smallBtnText: {
		color: '#94a3b8',
		fontSize: 11,
	},
	togglesSection: {
		paddingHorizontal: 16,
		paddingTop: 14,
	},
	sectionHeader: {
		color: '#38bdf8',
		fontSize: 13,
		fontWeight: 'bold',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 8,
	},
	toggleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 6,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#1e293b',
	},
	toggleInfo: {
		flex: 1,
		paddingRight: 12,
	},
	toggleLabel: {
		color: '#f1f5f9',
		fontSize: 13,
		fontWeight: '600',
	},
	toggleDesc: {
		color: '#64748b',
		fontSize: 11,
	},
	logsSection: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 14,
		paddingBottom: 8,
	},
	logsScroll: {
		flex: 1,
		backgroundColor: '#020617',
		borderRadius: 8,
		padding: 10,
		borderWidth: 1,
		borderColor: '#1e293b',
	},
	logItem: {
		marginBottom: 8,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#0f172a',
		paddingBottom: 4,
	},
	logMeta: {
		color: '#64748b',
		fontSize: 10,
		fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
	},
	logMessage: {
		color: '#cbd5e1',
		fontSize: 12,
		fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
		marginTop: 2,
	},
	logWarn: {
		color: '#facc15',
	},
	logError: {
		color: '#f87171',
	},
	emptyLogsText: {
		color: '#475569',
		textAlign: 'center',
		marginTop: 20,
		fontStyle: 'italic',
	},
});
