/**
 * FloatingProgressBar Component
 *
 * Compact waveform-inspired progress track for the floating mini player.
 * Uses an animated clipped overlay so progress updates stay smooth without
 * re-rendering the whole floating player subtree.
 */

import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useAnimatedProgress } from '@/src/hooks/use-animated-progress';
import { useAppTheme } from '@/lib/theme';

export const FloatingProgressBar = memo(function FloatingProgressBar() {
	const progress = useAnimatedProgress();
	const { colors } = useAppTheme();

	const progressStyle = useAnimatedStyle(() => ({
		width: `${Math.max(0, Math.min(1, progress.value)) * 100}%`,
	}));

	return (
		<View style={styles.track}>
			<Animated.View
				style={[styles.fill, { backgroundColor: colors.primary }, progressStyle]}
			/>
		</View>
	);
});

const styles = StyleSheet.create({
	track: {
		height: 2.5,
		width: '100%',
		backgroundColor: 'rgba(255, 255, 255, 0.15)',
		overflow: 'hidden',
	},
	fill: {
		height: 2.5,
	},
});
