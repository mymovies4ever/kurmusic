/**
 * PlayerAwareScrollView
 *
 * A ScrollView that automatically adds bottom padding when the floating player
 * is visible, ensuring content can scroll past the player.
 */

import { ScrollView, type ScrollViewProps, StyleSheet, View } from 'react-native';
import { forwardRef } from 'react';
import { useHasActiveTrack } from '@/src/application/state/player-store';
import { FLOATING_PLAYER_HEIGHT } from '@/src/components/floating-player';
import { TAB_BAR_HEIGHT } from '@/lib/tab-config';

const BASE_TAB_PADDING = TAB_BAR_HEIGHT + 24;
const FLOATING_PLAYER_PADDING = FLOATING_PLAYER_HEIGHT + TAB_BAR_HEIGHT + 36;

export const PlayerAwareScrollView = forwardRef<ScrollView, ScrollViewProps>(
	({ contentContainerStyle, style, ...props }, ref) => {
		const hasActiveTrack = useHasActiveTrack();

		return (
			<View style={styles.container}>
				<ScrollView
					ref={ref}
					style={[style]}
					contentContainerStyle={[
						contentContainerStyle,
						{
							paddingBottom: hasActiveTrack
								? FLOATING_PLAYER_PADDING
								: BASE_TAB_PADDING,
						},
					]}
					{...props}
				/>
			</View>
		);
	}
);

PlayerAwareScrollView.displayName = 'PlayerAwareScrollView';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		overflow: 'hidden',
	},
});
