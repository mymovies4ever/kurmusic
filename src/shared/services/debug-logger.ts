/**
 * Debug Logger Service
 *
 * Captures live logs, errors, and system events for diagnosing
 * device-specific issues (e.g. OriginOS / iQOO Neo 7 Pro touch freeze).
 * Supports in-memory rolling buffer, persistence to internal storage,
 * Storage Access Framework (SAF) public folder export, and native sharing.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import { Platform, Share } from 'react-native';
import Constants from 'expo-constants';
import { ok, err, type Result } from '@/src/shared/types/result';

export interface LogEntry {
	readonly id: string;
	readonly timestamp: string;
	readonly level: 'log' | 'info' | 'warn' | 'error';
	readonly tag: string;
	readonly message: string;
}

const MAX_IN_MEMORY_LOGS = 300;
const DEBUG_LOG_DIR = 'debug-logs';
const DEBUG_LOG_FILE = 'kurmusic-debug.log';

class DebugLogger {
	private readonly logs: LogEntry[] = [];
	private readonly listeners = new Set<(logs: readonly LogEntry[]) => void>();
	private writeQueue: Promise<void> = Promise.resolve();
	private isInitialized = false;

	public init(): void {
		if (this.isInitialized) return;
		this.isInitialized = true;

		this.record(
			'init',
			'info',
			`DebugLogger initialized on ${Platform.OS} (v${Constants.expoConfig?.version ?? '1.2.6'})`
		);
		this.hookConsole();
	}

	private hookConsole(): void {
		const originalLog = console.log;
		const originalWarn = console.warn;
		const originalError = console.error;

		console.log = (...args: unknown[]) => {
			originalLog(...args);
			this.formatAndRecord('log', 'Console', args);
		};

		console.warn = (...args: unknown[]) => {
			originalWarn(...args);
			this.formatAndRecord('warn', 'Console', args);
		};

		console.error = (...args: unknown[]) => {
			originalError(...args);
			this.formatAndRecord('error', 'Console', args);
		};
	}

	private formatAndRecord(level: LogEntry['level'], tag: string, args: unknown[]): void {
		const message = args
			.map((arg) => {
				if (typeof arg === 'string') return arg;
				try {
					return JSON.stringify(arg);
				} catch {
					return String(arg);
				}
			})
			.join(' ');

		this.record(tag, level, message);
	}

	public record(tag: string, level: LogEntry['level'], message: string): void {
		const entry: LogEntry = {
			id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			timestamp: new Date().toLocaleTimeString(),
			level,
			tag,
			message,
		};

		this.logs.push(entry);
		if (this.logs.length > MAX_IN_MEMORY_LOGS) {
			this.logs.shift();
		}

		this.notifyListeners();
		this.queueFileWrite(entry);
	}

	public getLogs(): readonly LogEntry[] {
		return [...this.logs];
	}

	public subscribe(listener: (logs: readonly LogEntry[]) => void): () => void {
		this.listeners.add(listener);
		listener(this.getLogs());
		return () => {
			this.listeners.delete(listener);
		};
	}

	private notifyListeners(): void {
		const currentLogs = this.getLogs();
		this.listeners.forEach((fn) => fn(currentLogs));
	}

	private getLogFilePath(): string | null {
		const base = FileSystem.documentDirectory;
		if (!base) return null;
		return `${base}${DEBUG_LOG_DIR}/${DEBUG_LOG_FILE}`;
	}

	private async ensureDirectory(): Promise<string | null> {
		const base = FileSystem.documentDirectory;
		if (!base) return null;
		const dir = `${base}${DEBUG_LOG_DIR}/`;
		await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
		return dir;
	}

	private queueFileWrite(entry: LogEntry): void {
		this.writeQueue = this.writeQueue
			.then(async () => {
				const dir = await this.ensureDirectory();
				if (!dir) return;

				const filePath = `${dir}${DEBUG_LOG_FILE}`;
				const line = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.tag}] ${entry.message}\n`;
				const existing = await FileSystem.readAsStringAsync(filePath).catch(() => '');
				// Cap internal log file at ~2MB to prevent unbounded disk growth
				const trimmed = existing.length > 2_000_000 ? existing.slice(-1_000_000) : existing;
				await FileSystem.writeAsStringAsync(filePath, trimmed + line);
			})
			.catch(() => {});
	}

	public async getFullLogContent(): Promise<string> {
		const filePath = this.getLogFilePath();
		if (filePath) {
			const content = await FileSystem.readAsStringAsync(filePath).catch(() => '');
			if (content.trim()) return content;
		}

		return this.logs
			.map((e) => `[${e.timestamp}] [${e.level.toUpperCase()}] [${e.tag}] ${e.message}`)
			.join('\n');
	}

	/**
	 * Share logs using native Android Share Sheet (bypasses /Android/data/ restrictions)
	 */
	public async shareLog(): Promise<Result<void, Error>> {
		try {
			const content = await this.getFullLogContent();
			if (!content.trim()) {
				return err(new Error('No log content available yet'));
			}

			await Share.share({
				title: 'KurMusic OriginOS 6 Debug Log',
				message: content,
			});

			return ok(undefined);
		} catch (error) {
			return err(error instanceof Error ? error : new Error(String(error)));
		}
	}

	/**
	 * Prompt user for folder permission (Storage Access Framework) and export log to selected public folder
	 */
	public async exportLogToFolder(): Promise<Result<string, Error>> {
		try {
			const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
			if (!permissions.granted) {
				return err(new Error('Folder permission was denied'));
			}

			const content = await this.getFullLogContent();
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const fileName = `kurmusic-debug-${timestamp}.txt`;

			const fileUri = await StorageAccessFramework.createFileAsync(
				permissions.directoryUri,
				fileName,
				'text/plain'
			);

			await FileSystem.writeAsStringAsync(fileUri, content, {
				encoding: FileSystem.EncodingType.UTF8,
			});

			this.record('Export', 'info', `Log successfully saved to ${fileName}`);
			return ok(fileName);
		} catch (error) {
			return err(error instanceof Error ? error : new Error(String(error)));
		}
	}

	public async clearLogs(): Promise<void> {
		this.logs.length = 0;
		this.notifyListeners();
		const filePath = this.getLogFilePath();
		if (filePath) {
			await FileSystem.deleteAsync(filePath, { idempotent: true }).catch(() => {});
		}
		this.record('init', 'info', 'Logs cleared by user');
	}
}

export const debugLogger = new DebugLogger();
