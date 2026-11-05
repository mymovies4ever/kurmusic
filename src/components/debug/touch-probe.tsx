/**
 * TouchProbe Component
 *
 * Transparent root overlay that passively records hardware touches
 * without consuming or intercepting them (returns false from capture).
 * Draws a visual indicator where the finger touched to verify
 * hardware touch response on OriginOS / Snapdragon 8+ Gen 1.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDiagnosticStore } from '@/src/application/state/diagnostic-store';
import { debugLogger } from '@/src/shared/services/debug-logger';

export function TouchProbe() {
	const lastTouch = useDiagnosticStore((state) => state.lastTouch);
	const [visibleDot, setVisibleDot] = useState<{ x: number; y: number } | null>(null);

	useEffect(() => {
		if (!lastTouch) return;
		setVisibleDot({ x: lastTouch.x, y: lastTouch.y });
		const timer = setTimeout(() => {
			setVisibleDot(null);
		}, 600);
		return () => clearTimeout(timer);
	}, [lastTouch]);

	return (
		<View
			style={StyleSheet.absoluteFill}
			pointerEvents="box-none"
			onStartShouldSetResponderCapture={(evt) => {
				const { pageX, pageY } = evt.nativeEvent;
				useDiagnosticStore.getState().registerTouch(pageX, pageY);
				debugLogger.record(
					'Touch',
					'info',
					`Touch detected at (${Math.round(pageX)}, ${Math.round(pageY)})`
				);
				// Return false so we NEVER capture or steal the touch from buttons/scrollviews
				return false;
			}}
		>
			{visibleDot && (
				<View
					pointerEvents="none"
					style={[
						styles.touchDot,
						{
							left: visibleDot.x - 24,
							top: visibleDot.y - 24,
						},
					]}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	touchDot: {
		position: 'absolute',
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: 'rgba(239, 68, 68, 0.45)', // Semitransparent red ripple
		borderWidth: 2,
		borderColor: '#ef4444',
		zIndex: 999998,
	},
});
