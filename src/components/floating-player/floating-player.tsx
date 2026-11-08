/**
 * FloatingPlayer Component
 *
 * Mini player that appears at the bottom of the screen when navigating away from player.
 * Uses M3 Surface elevation and theming.
 */

import { View, Pressable, StyleSheet, PanResponder } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
	useAnimatedStyle,
	withTiming,
	withSpring,
	interpolate,
	Extrapolation,
	useSharedValue,
	runOnJS,
} from 'react-native-reanimated';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAppTheme } from '@/lib/theme';

import { FloatingProgressBar } from './floating-progress-bar';
import { PlayerContent } from './player-content';

import { usePlayerActions } from '@/src/hooks/use-player';
import {
	useCurrentTrack,
	useIsPlaying,
	useIsLoading,
	useIsBuffering,
} from '@/src/application/state/player-store';
import { usePlayerUIStore } from '@/src/application/state/player-ui-store';
import { getArtistNames } from '@/src/domain/entities/track';
import { getLargestArtwork } from '@/src/domain/value-objects/artwork';
import { TAB_BAR_HEIGHT, TAB_ROUTES } from '@/lib/tab-config';
import { FLOATING_PLAYER_HEIGHT } from '@shared/constants/layout';
import { playbackService } from '@/src/application/services/playback-service';

export { FLOATING_PLAYER_HEIGHT };

export function FloatingPlayer() {
	const pathname = usePathname();
	const insets = useSafeAreaInsets();
	const { isDark } = useAppTheme();
	const currentTrack = useCurrentTrack();
	const shouldShow = pathname !== '/player' && currentTrack !== null;
	const isTabRoute = TAB_ROUTES.includes(pathname);
	const bottomOffset = isTabRoute ? TAB_BAR_HEIGHT + insets.bottom + 8 : insets.bottom + 8;

	const visibility = useSharedValue(shouldShow ? 1 : 0);
	const translateX = useSharedValue(0);
	const translateY = useSharedValue(0);
	const [isVisible, setIsVisible] = useState(shouldShow);

	useEffect(() => {
		if (shouldShow) {
			translateX.value = 0;
			translateY.value = 0;
			setIsVisible(true);
			visibility.value = withTiming(1, { duration: 300 });
		} else {
			visibility.value = withTiming(0, { duration: 200 }, (finished) => {
				if (finished) {
					runOnJS(setIsVisible)(false);
				}
			});
		}
	}, [shouldShow, visibility, translateX, translateY]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: visibility.value,
		transform: [
			{
				translateY:
					interpolate(visibility.value, [0, 1], [100, 0], Extrapolation.CLAMP) +
					translateY.value,
			},
			{
				translateX: translateX.value,
			},
		],
	}));

	const handlePress = useCallback(() => {
		router.push('/player');
	}, []);

	const swipeResponder = useMemo(
		() =>
			PanResponder.create({
				onMoveShouldSetPanResponder: (_event, gestureState) =>
					Math.abs(gestureState.dx) > 14 || Math.abs(gestureState.dy) > 14,
				onPanResponderMove: (_event, gestureState) => {
					if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
						translateX.value = gestureState.dx * 0.4;
					} else if (gestureState.dy > 0) {
						translateY.value = gestureState.dy;
					}
				},
				onPanResponderRelease: (_event, gestureState) => {
					if (
						Math.abs(gestureState.dx) > 35 &&
						Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
					) {
						if (gestureState.dx < -35) {
							// Swiped Left -> Skip to Next
							playbackService.skipToNext();
						} else {
							// Swiped Right -> Skip to Previous
							playbackService.skipToPrevious();
						}
						translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
					} else if (gestureState.dy < -25) {
						// Swiped Up -> Open Full Player
						router.push('/player');
						translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
					} else if (gestureState.dy > 30 || gestureState.vy > 0.4) {
						// Swiped Down -> Dismiss Mini Player & Stop Playback
						translateY.value = withTiming(160, { duration: 180 }, (finished) => {
							if (finished) {
								runOnJS(playbackService.stop)();
							}
						});
					} else {
						translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
						translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
					}
				},
				onPanResponderTerminate: () => {
					translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
					translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
				},
			}),
		[translateX, translateY]
	);

	if (!isVisible && !shouldShow) {
		return <View style={styles.hidden} />;
	}

	const glassBgColor = isDark ? 'rgba(12, 12, 16, 0.72)' : 'rgba(255, 255, 255, 0.85)';
	const glassBorderColor = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)';

	return (
		<Animated.View
			key={'floating-player'}
			style={[
				styles.container,
				{
					bottom: bottomOffset,
					borderColor: glassBorderColor,
				},
				animatedStyle,
			]}
			pointerEvents={shouldShow ? 'auto' : 'none'}
			{...swipeResponder.panHandlers}
		>
			<BlurView
				intensity={80}
				tint={isDark ? 'dark' : 'light'}
				experimentalBlurMethod={'dimezisBlurView'}
				style={[StyleSheet.absoluteFill, { backgroundColor: glassBgColor }]}
			/>
			<Pressable onPress={handlePress} style={styles.pressable}>
				<View style={styles.progressContainer}>
					<FloatingProgressBar />
				</View>

				<FloatingTrackInfo />
			</Pressable>
		</Animated.View>
	);
}

/**
 * Isolated zone for track info + controls.
 * Re-renders only on track change or playback status change, NOT on progress ticks.
 */
function FloatingTrackInfo() {
	const currentTrack = useCurrentTrack();
	const isPlaying = useIsPlaying();
	const isLoading = useIsLoading();
	const isBuffering = useIsBuffering();
	const { togglePlayPause, skipToPrevious, skipToNext } = usePlayerActions();

	const artwork = currentTrack ? getLargestArtwork(currentTrack.artwork) : null;
	const artworkUrl = artwork?.url;
	const artistNames = currentTrack ? getArtistNames(currentTrack) : '';
	const showLoadingIndicator = isLoading || isBuffering;

	const handlePlayPause = useCallback(() => {
		togglePlayPause();
	}, [togglePlayPause]);

	const handleSkipPrevious = useCallback(() => {
		skipToPrevious();
	}, [skipToPrevious]);

	const handleSkipNext = useCallback(() => {
		skipToNext();
	}, [skipToNext]);

	const handleOpenQueue = useCallback(() => {
		usePlayerUIStore.getState().openQueueSheet();
	}, []);

	return (
		<PlayerContent
			artworkUrl={artworkUrl}
			trackId={currentTrack?.id.value}
			title={currentTrack?.title}
			artistNames={artistNames}
			isPlaying={isPlaying}
			showLoadingIndicator={showLoadingIndicator}
			isLoading={isLoading}
			onPlayPause={handlePlayPause}
			onSkipPrevious={handleSkipPrevious}
			onSkipNext={handleSkipNext}
			onOpenQueue={handleOpenQueue}
		/>
	);
}

const styles = StyleSheet.create({
	hidden: {
		position: 'absolute',
		width: 0,
		height: 0,
	},
	container: {
		position: 'absolute',
		left: 12,
		right: 12,
		height: FLOATING_PLAYER_HEIGHT,
		borderRadius: 24,
		overflow: 'hidden',
		borderWidth: 1,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.25,
		shadowRadius: 14,
		elevation: 8,
	},
	pressable: {
		flex: 1,
	},
	progressContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		zIndex: 10,
	},
});
