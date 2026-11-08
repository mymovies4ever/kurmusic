import { container, ServiceKeys } from '@shared/di';
import { asyncStorageRepository } from '@/src/infrastructure';
import { rntpPlaybackProvider } from '@plugins/playback/react-native-track-player';
import { getLogger } from '@shared/services/logger';
import { noOpEventBus } from '@plugins/core/noop-event-bus';

const playbackLogger = getLogger('PlaybackProvider');

export async function initializeContainer(): Promise<void> {
	container.registerInstance(ServiceKeys.STORAGE_REPOSITORY, asyncStorageRepository);

	const playbackInitResult = await rntpPlaybackProvider.onInit({
		manifest: rntpPlaybackProvider.manifest,
		eventBus: noOpEventBus,
		config: {},
		logger: playbackLogger,
	});

	if (!playbackInitResult.success) {
		throw new Error(
			`Failed to initialize playback provider: ${playbackInitResult.error.message}`
		);
	}

	container.registerInstance('PlaybackProvider', rntpPlaybackProvider);
}

export async function disposeContainer(): Promise<void> {
	if (container.has('PlaybackProvider')) {
		const playbackProvider = container.resolve<typeof rntpPlaybackProvider>('PlaybackProvider');
		await playbackProvider.onDestroy();
	}

	container.clear();
}

export function getStorageRepository() {
	return container.resolve<typeof asyncStorageRepository>(ServiceKeys.STORAGE_REPOSITORY);
}

export function getPlaybackProvider() {
	return container.resolve<typeof rntpPlaybackProvider>('PlaybackProvider');
}

export function getMetadataProvider(providerId: string) {
	const key = `MetadataProvider:${providerId}`;
	if (!container.has(key)) {
		throw new Error(`Metadata provider not found: ${providerId}`);
	}
	return container.resolve(key);
}

export { container, ServiceKeys };
