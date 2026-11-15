import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { useSettingsStore, type SettingsState } from '../state/settings-store';
import { useLibraryStore } from '../state/library-store';
import { useDownloadStore } from '../state/download-store';
import { useEqualizerStore } from '../state/equalizer-store';
import {
	createPendingDownload,
	createCompletedDownload,
	type DownloadedTrackMetadata,
} from '../../domain/value-objects/download-state';
import { getLogger } from '@shared/services/logger';

const { StorageAccessFramework } = FileSystem;
const logger = getLogger('BackupService');

export interface KurMusicBackupPayload {
	version: number;
	exportedAt: string;
	appName: string;
	settings: Partial<SettingsState>;
	equalizer: {
		isEnabled: boolean;
		selectedPresetId: string;
		customGains: number[];
	};
	library: {
		tracks: any[];
		playlists: any[];
		favoriteIds: string[];
	};
	downloads: DownloadedTrackMetadata[];
}

export interface BackupResult {
	success: boolean;
	message: string;
	details?: string;
}

export interface ImportResult {
	success: boolean;
	message: string;
	importedCount?: {
		settings: boolean;
		tracks: number;
		playlists: number;
		favorites: number;
		downloads: number;
	};
}

/**
 * Gathers app state into a JSON backup payload.
 */
export function createBackupPayload(): KurMusicBackupPayload {
	const settings = useSettingsStore.getState();
	const library = useLibraryStore.getState();
	const downloads = useDownloadStore.getState();
	const equalizer = useEqualizerStore.getState();

	return {
		version: 1,
		exportedAt: new Date().toISOString(),
		appName: 'KurMusic',
		settings: {
			themePreference: settings.themePreference,
			defaultTab: settings.defaultTab,
			accentColor: settings.accentColor,
			uiStyle: settings.uiStyle,
			preferredStreamQuality: settings.preferredStreamQuality,
			autoplaySimilarOnQueueEnd: settings.autoplaySimilarOnQueueEnd,
			openPlayerOnTrackClick: settings.openPlayerOnTrackClick,
			showProviderLabel: settings.showProviderLabel,
			progressBarStyle: settings.progressBarStyle,
			playerBackground: settings.playerBackground,
			homeContentPreferences: settings.homeContentPreferences,
			tabOrder: settings.tabOrder,
			enabledTabs: settings.enabledTabs,
			downloadLocationMode: settings.downloadLocationMode,
		},
		equalizer: {
			isEnabled: equalizer.isEnabled,
			selectedPresetId: equalizer.selectedPresetId,
			customGains: [...equalizer.customGains],
		},
		library: {
			tracks: library.tracks,
			playlists: library.playlists,
			favoriteIds: Array.from(library.favorites),
		},
		downloads: downloads.getAllDownloadedTracks(),
	};
}

/**
 * Prompts user to select destination folder (on Android) and saves JSON backup.
 */
export async function exportBackupAsync(): Promise<BackupResult> {
	try {
		const payload = createBackupPayload();
		const jsonString = JSON.stringify(payload, null, 2);
		const dateStr = new Date().toISOString().split('T')[0];
		const baseFileName = `KurMusic_Backup_${dateStr}`;

		if (Platform.OS === 'android' && StorageAccessFramework) {
			const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync();
			if (!permission.granted) {
				return {
					success: false,
					message: 'Export cancelled: storage permission not granted',
				};
			}

			const fileUri = await StorageAccessFramework.createFileAsync(
				permission.directoryUri,
				baseFileName,
				'application/json'
			);

			await FileSystem.writeAsStringAsync(fileUri, jsonString, {
				encoding: FileSystem.EncodingType.UTF8,
			});

			logger.info(`Backup exported successfully to ${fileUri}`);
			return {
				success: true,
				message: 'Backup exported successfully',
				details: `Saved ${payload.library.tracks.length} tracks, ${payload.library.playlists.length} playlists, and ${payload.downloads.length} downloads.`,
			};
		}

		// Fallback for non-SAF environments (internal documents)
		const docDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
		const targetUri = `${docDir}${baseFileName}.json`;
		await FileSystem.writeAsStringAsync(targetUri, jsonString, {
			encoding: FileSystem.EncodingType.UTF8,
		});

		return {
			success: true,
			message: 'Backup exported to documents directory',
			details: targetUri,
		};
	} catch (error) {
		logger.error('Failed to export backup', error instanceof Error ? error : undefined);
		return {
			success: false,
			message: 'Failed to export backup',
			details: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Launches native document picker to select and restore a KurMusic backup JSON file.
 */
export async function importBackupAsync(): Promise<ImportResult> {
	try {
		const res = await DocumentPicker.getDocumentAsync({
			type: ['application/json', 'text/json', '*/*'],
			copyToCacheDirectory: true,
		});

		if (res.canceled || !res.assets || res.assets.length === 0) {
			return { success: false, message: 'Import cancelled' };
		}

		const fileUri = res.assets[0].uri;
		const content = await FileSystem.readAsStringAsync(fileUri, {
			encoding: FileSystem.EncodingType.UTF8,
		});

		const data = JSON.parse(content) as KurMusicBackupPayload;

		if (!data || typeof data !== 'object') {
			return { success: false, message: 'Invalid backup file: empty or corrupted format' };
		}

		// 1. Restore Settings
		if (data.settings && typeof data.settings === 'object') {
			useSettingsStore.setState((state) => ({
				...state,
				...data.settings,
				// Safety overrides for smooth performance
				uiStyle: data.settings.uiStyle === 'neo' ? 'neo' : 'clean',
			}));
		}

		// 2. Restore Equalizer
		if (data.equalizer && typeof data.equalizer === 'object') {
			useEqualizerStore.setState((state) => ({
				...state,
				isEnabled: Boolean(data.equalizer.isEnabled),
				selectedPresetId: data.equalizer.selectedPresetId || 'flat',
				customGains: Array.isArray(data.equalizer.customGains)
					? data.equalizer.customGains
					: state.customGains,
			}));
		}

		// 3. Restore Library
		let tracksCount = 0;
		let playlistsCount = 0;
		let favoritesCount = 0;

		if (data.library && typeof data.library === 'object') {
			const lib = data.library;
			const existingTracks = useLibraryStore.getState().tracks;
			const newTracks = Array.isArray(lib.tracks) ? lib.tracks : [];
			const trackMap = new Map<string, any>();

			existingTracks.forEach((t) => trackMap.set(t.id?.value ?? String(t.id), t));
			newTracks.forEach((t) => trackMap.set(t.id?.value ?? String(t.id), t));

			const mergedTracks = Array.from(trackMap.values());
			tracksCount = mergedTracks.length;

			const existingPlaylists = useLibraryStore.getState().playlists;
			const newPlaylists = Array.isArray(lib.playlists) ? lib.playlists : [];
			const playlistMap = new Map<string, any>();

			existingPlaylists.forEach((p) => playlistMap.set(p.id, p));
			newPlaylists.forEach((p) => playlistMap.set(p.id, p));

			const mergedPlaylists = Array.from(playlistMap.values());
			playlistsCount = mergedPlaylists.length;

			const favSet = new Set<string>(useLibraryStore.getState().favorites);
			if (Array.isArray(lib.favoriteIds)) {
				lib.favoriteIds.forEach((id) => favSet.add(id));
			}
			favoritesCount = favSet.size;

			useLibraryStore.setState({
				tracks: mergedTracks,
				playlists: mergedPlaylists,
				favorites: favSet,
			});
		}

		// 4. Restore Downloaded Tracks Metadata
		let downloadsCount = 0;
		if (Array.isArray(data.downloads)) {
			const downloadStore = useDownloadStore.getState();
			const currentDownloaded = new Map(downloadStore.downloadedTracks);
			const currentDownloads = new Map(downloadStore.downloads);

			for (const item of data.downloads) {
				if (!item.trackId) continue;
				currentDownloaded.set(item.trackId, item);

				const pending = createPendingDownload(item.trackId, {
					title: item.title,
					artistName: item.artistName,
					artworkUrl: item.artworkUrl,
				});
				currentDownloads.set(
					item.trackId,
					createCompletedDownload(pending, item.filePath, item.fileSize)
				);
			}

			downloadsCount = currentDownloaded.size;
			useDownloadStore.setState({
				downloadedTracks: currentDownloaded,
				downloads: currentDownloads,
			});
		}

		logger.info('Backup imported and merged successfully');
		return {
			success: true,
			message: 'Backup restored successfully',
			importedCount: {
				settings: Boolean(data.settings),
				tracks: tracksCount,
				playlists: playlistsCount,
				favorites: favoritesCount,
				downloads: downloadsCount,
			},
		};
	} catch (error) {
		logger.error('Failed to import backup', error instanceof Error ? error : undefined);
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Failed to import backup file',
		};
	}
}
