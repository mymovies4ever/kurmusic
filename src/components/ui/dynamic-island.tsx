/**
 * DynamicIsland Component
 *
 * In-app interactive camera punch-hole notch pill.
 * Morphs into view at the top of the screen when playing music,
 * displaying live album art disc, animated equalizer bars, and quick playback controls.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, AppState } from 'react-native';
import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Text } from 'react-native-paper';
import { Play, Pause } from 'lucide-react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withSpring,
	withTiming,
	withRepeat,
	withSequence,
	interpolate,
	Extrapolation,
	Easing,
} from 'react-native-reanimated';
import { useCurrentTrack, useIsPlaying } from '@/src/application/state/player-store';
import { usePlayerActions } from '@/src/hooks/use-player';
import { getLargestArtwork } from '@/src/domain/value-objects/artwork';
import { useAppTheme } from '@/lib/theme';

export function DynamicIsland() {
	const pathname = usePathname();
	const insets = useSafeAreaInsets();
	const currentTrack = useCurrentTrack();
	const isPlaying = useIsPlaying();
	const { togglePlayPause } = usePlayerActions();
	const { colors } = useAppTheme();
	const [isAppActive, setIsAppActive] = useState(() => AppState.currentState === 'active');

	useEffect(() => {
		const sub = AppState.addEventListener('change', (nextState) => {
			setIsAppActive(nextState === 'active');
		});
		return () => sub.remove();
	}, []);

	// Only show when there is a track loaded and user is not inside full-screen player
	const shouldShow = currentTrack !== null && pathname !== '/player';

	const expandProgress = useSharedValue(shouldShow ? 1 : 0);
	const discRotation = useSharedValue(0);

	// Equalizer bar heights
	const bar1 = useSharedValue(4);
	const bar2 = useSharedValue(10);
	const bar3 = useSharedValue(6);

	useEffect(() => {
		expandProgress.value = withSpring(shouldShow ? 1 : 0, {
			damping: 18,
			stiffness: 180,
		});
	}, [shouldShow, expandProgress]);

	useEffect(() => {
		if (isPlaying && isAppActive) {
			discRotation.value = withRepeat(
				withTiming(360, { duration: 8000, easing: Easing.linear }),
				-1,
				false
			);

			bar1.value = withRepeat(
				withSequence(withTiming(14, { duration: 320 }), withTiming(4, { duration: 280 })),
				-1,
				true
			);
			bar2.value = withRepeat(
				withSequence(withTiming(5, { duration: 260 }), withTiming(16, { duration: 340 })),
				-1,
				true
			);
			bar3.value = withRepeat(
				withSequence(withTiming(12, { duration: 300 }), withTiming(3, { duration: 300 })),
				-1,
				true
			);
		} else {
			bar1.value = withTiming(4, { duration: 200 });
			bar2.value = withTiming(4, { duration: 200 });
			bar3.value = withTiming(4, { duration: 200 });
		}
	}, [isPlaying, isAppActive, bar1, bar2, bar3, discRotation]);

	const containerAnimatedStyle = useAnimatedStyle(() => ({
		opacity: expandProgress.value,
		transform: [
			{
				translateY: interpolate(
					expandProgress.value,
					[0, 1],
					[-50, 0],
					Extrapolation.CLAMP
				),
			},
			{
				scale: interpolate(expandProgress.value, [0, 1], [0.75, 1], Extrapolation.CLAMP),
			},
		],
	}));

	const discAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${discRotation.value}deg` }],
	}));

	const bar1Style = useAnimatedStyle(() => ({ height: bar1.value }));
	const bar2Style = useAnimatedStyle(() => ({ height: bar2.value }));
	const bar3Style = useAnimatedStyle(() => ({ height: bar3.value }));

	const handlePress = useCallback(() => {
		router.push('/player');
	}, []);

	const handlePlayPause = useCallback(
		(e: { stopPropagation: () => void }) => {
			e.stopPropagation();
			togglePlayPause();
		},
		[togglePlayPause]
	);

	if (!currentTrack) return null;

	const artwork = getLargestArtwork(currentTrack.artwork);
	const topPosition = Math.max(insets.top, 8);

	return (
		<Animated.View
			pointerEvents={shouldShow ? 'box-none' : 'none'}
			style={[styles.wrapper, { top: topPosition }, containerAnimatedStyle]}
		>
			<Pressable style={styles.island} onPress={handlePress}>
				<BlurView
					intensity={80}
					tint={'dark'}
					experimentalBlurMethod={'dimezisBlurView'}
					style={StyleSheet.absoluteFill}
				/>
				{/* Dark specular fill */}
				<View style={styles.islandOverlay} />

				{/* Left: Spinning Album Art Disc */}
				<View style={styles.discContainer}>
					<Animated.View style={[styles.discWrapper, discAnimatedStyle]}>
						{artwork?.url ? (
							<Image
								source={{ uri: artwork.url }}
								style={styles.discImage}
								contentFit={'cover'}
								cachePolicy={'memory-disk'}
							/>
						) : (
							<View style={[styles.discImage, { backgroundColor: colors.primary }]} />
						)}
					</Animated.View>
				</View>

				{/* Center: Live Equalizer + Track Title */}
				<View style={styles.centerSection}>
					<View style={styles.eqBars}>
						<Animated.View
							style={[styles.eqBar, bar1Style, { backgroundColor: colors.primary }]}
						/>
						<Animated.View
							style={[styles.eqBar, bar2Style, { backgroundColor: colors.primary }]}
						/>
						<Animated.View
							style={[styles.eqBar, bar3Style, { backgroundColor: colors.primary }]}
						/>
					</View>
					<Text numberOfLines={1} style={styles.trackTitle}>
						{currentTrack.title}
					</Text>
				</View>

				{/* Right: Mini Play/Pause Quick Control */}
				<Pressable hitSlop={8} onPress={handlePlayPause} style={styles.controlButton}>
					{isPlaying ? (
						<Pause size={13} color={'#FFFFFF'} fill={'#FFFFFF'} strokeWidth={0} />
					) : (
						<Play size={13} color={'#FFFFFF'} fill={'#FFFFFF'} strokeWidth={0} />
					)}
				</Pressable>
			</Pressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		position: 'absolute',
		left: 0,
		right: 0,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 9990,
	},
	island: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 36,
		minWidth: 196,
		maxWidth: 250,
		borderRadius: 20,
		paddingHorizontal: 8,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.16)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.4,
		shadowRadius: 10,
		elevation: 10,
	},
	islandOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(10, 10, 14, 0.86)',
	},
	discContainer: {
		width: 24,
		height: 24,
		borderRadius: 12,
		overflow: 'hidden',
		marginRight: 6,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.2)',
	},
	discWrapper: {
		width: '100%',
		height: '100%',
	},
	discImage: {
		width: '100%',
		height: '100%',
		borderRadius: 12,
	},
	centerSection: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 8,
		minWidth: 0,
	},
	eqBars: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		height: 16,
		gap: 2,
		marginRight: 6,
	},
	eqBar: {
		width: 2.5,
		borderRadius: 1.5,
	},
	trackTitle: {
		color: '#FFFFFF',
		fontSize: 12,
		fontWeight: '600',
		letterSpacing: 0.1,
		flexShrink: 1,
	},
	controlButton: {
		width: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: 'rgba(255, 255, 255, 0.18)',
		alignItems: 'center',
		justifyContent: 'center',
	},
});
