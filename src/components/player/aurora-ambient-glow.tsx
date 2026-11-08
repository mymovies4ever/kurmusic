/**
 * AuroraAmbientGlow Component
 *
 * Renders a breathing, multi-stop ambient light aura behind the album artwork.
 * Adapts dynamically to extracted album art colors and gently pulses when playing.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, AppState } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withTiming,
	withSequence,
	Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface AuroraAmbientGlowProps {
	readonly dominantColor?: string | null;
	readonly secondaryColor?: string | null;
	readonly isPlaying: boolean;
	readonly size?: number;
}

export function AuroraAmbientGlow({
	dominantColor: rawDominantColor,
	secondaryColor: rawSecondaryColor,
	isPlaying,
	size = 320,
}: AuroraAmbientGlowProps) {
	const dominantColor = rawDominantColor || '#7C3AED';
	const secondaryColor = rawSecondaryColor || '#3B82F6';
	const [isAppActive, setIsAppActive] = useState(() => AppState.currentState === 'active');
	const scale = useSharedValue(1);
	const opacity = useSharedValue(0.55);
	const rotation = useSharedValue(0);

	useEffect(() => {
		const sub = AppState.addEventListener('change', (nextState) => {
			setIsAppActive(nextState === 'active');
		});
		return () => sub.remove();
	}, []);

	useEffect(() => {
		if (isPlaying && isAppActive) {
			// Soft breathing pulse while audio is playing and app is in foreground
			scale.value = withRepeat(
				withSequence(
					withTiming(1.08, { duration: 3200, easing: Easing.inOut(Easing.quad) }),
					withTiming(0.96, { duration: 3200, easing: Easing.inOut(Easing.quad) })
				),
				-1,
				true
			);
			opacity.value = withRepeat(
				withSequence(
					withTiming(0.72, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
					withTiming(0.48, { duration: 2800, easing: Easing.inOut(Easing.quad) })
				),
				-1,
				true
			);
			rotation.value = withRepeat(
				withTiming(360, { duration: 24000, easing: Easing.linear }),
				-1,
				false
			);
		} else {
			scale.value = withTiming(0.98, { duration: 600 });
			opacity.value = withTiming(0.38, { duration: 600 });
		}
	}, [isPlaying, isAppActive, opacity, rotation, scale]);

	const glowAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
		opacity: opacity.value,
	}));

	const halfSize = size / 2;

	return (
		<View
			pointerEvents={'none'}
			style={[
				styles.container,
				{ width: size, height: size, marginLeft: -halfSize, marginTop: -halfSize },
			]}
		>
			<Animated.View style={[StyleSheet.absoluteFill, glowAnimatedStyle]}>
				{/* Primary Ambient Bloom */}
				<LinearGradient
					colors={[`${dominantColor}88`, `${dominantColor}44`, 'transparent']}
					start={{ x: 0.2, y: 0.2 }}
					end={{ x: 0.8, y: 0.8 }}
					style={[styles.glowBlob, { backgroundColor: `${dominantColor}33` }]}
				/>
				{/* Secondary Accent Bloom */}
				<LinearGradient
					colors={[`${secondaryColor}77`, `${secondaryColor}33`, 'transparent']}
					start={{ x: 0.8, y: 0.2 }}
					end={{ x: 0.2, y: 0.8 }}
					style={[styles.secondaryGlowBlob, { backgroundColor: `${secondaryColor}22` }]}
				/>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: -1,
	},
	glowBlob: {
		...StyleSheet.absoluteFillObject,
		borderRadius: 9999,
		transform: [{ scale: 1.15 }],
	},
	secondaryGlowBlob: {
		...StyleSheet.absoluteFillObject,
		borderRadius: 9999,
		transform: [{ scale: 0.9 }, { rotate: '45deg' }],
	},
});
