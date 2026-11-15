/**
 * PlayerContent Component
 *
 * The inner content of the floating player: artwork, track info, and controls.
 */

import React, { useCallback, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { IconButton, Text } from 'react-native-paper';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react-native';
import { AudioWaveform } from '@/src/components/ui/audio-waveform';
import { useAppTheme } from '@/lib/theme';
import type { PlayerContentProps } from './types';

export const PlayerContent = React.memo(function PlayerContent({
	artworkUrl,
	trackId,
	title,
	artistNames,
	isPlaying,
	showLoadingIndicator,
	isLoading,
	onPlayPause,
	onSkipPrevious,
	onSkipNext,
	onOpenQueue,
}: PlayerContentProps) {
	const { colors } = useAppTheme();
	const titleStyle = useMemo(
		() => ({ color: '#FFFFFF', fontWeight: '700' as const, fontSize: 13 }),
		[]
	);
	const subtitleStyle = useMemo(() => ({ color: '#B3B3B3', fontSize: 11 }), []);

	const playPauseIcon = useCallback(
		({ size, color }: { size: number; color: string }) =>
			isPlaying ? (
				<Pause size={size} color={color} fill={color} strokeWidth={0} />
			) : (
				<Play size={size} color={color} fill={color} strokeWidth={0} />
			),
		[isPlaying]
	);

	const skipBackIcon = useCallback(
		({ size, color }: { size: number; color: string }) => (
			<SkipBack size={size} color={color} fill={color} />
		),
		[]
	);

	const skipForwardIcon = useCallback(
		({ size, color }: { size: number; color: string }) => (
			<SkipForward size={size} color={color} fill={color} />
		),
		[]
	);

	return (
		<View style={styles.content}>
			<View style={styles.artworkContainer}>
				<Image
					source={{ uri: artworkUrl }}
					style={styles.artwork}
					contentFit={'cover'}
					transition={200}
					cachePolicy={'memory-disk'}
					recyclingKey={trackId}
				/>
				{isPlaying && <AudioWaveform />}
				{showLoadingIndicator && (
					<View style={styles.loadingOverlay}>
						<ActivityIndicator size={'small'} color={'white'} />
					</View>
				)}
			</View>

			<View style={styles.trackInfo}>
				<Text numberOfLines={1} style={[styles.title, titleStyle]}>
					{title}
				</Text>
				<Text numberOfLines={1} style={[styles.subtitle, subtitleStyle]}>
					{artistNames}
				</Text>
			</View>

			<View style={styles.controls}>
				<IconButton
					icon={skipBackIcon}
					size={18}
					iconColor={'#FFFFFF'}
					onPress={onSkipPrevious}
					accessibilityLabel={'Skip to previous track'}
					style={styles.controlButton}
				/>
				<IconButton
					icon={playPauseIcon}
					size={20}
					iconColor={'#000000'}
					onPress={onPlayPause}
					disabled={isLoading}
					style={[
						styles.controlButton,
						styles.primaryControlButton,
						{ backgroundColor: colors.primary },
					]}
				/>
				<IconButton
					icon={skipForwardIcon}
					size={18}
					iconColor={'#FFFFFF'}
					onPress={onSkipNext}
					accessibilityLabel={'Skip to next track'}
					style={styles.controlButton}
				/>
			</View>
		</View>
	);
});

const styles = StyleSheet.create({
	content: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 6,
	},
	artworkContainer: {
		position: 'relative',
		overflow: 'hidden',
		borderRadius: 4,
	},
	artwork: {
		width: 42,
		height: 42,
		borderRadius: 4,
	},
	loadingOverlay: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(0,0,0,0.3)',
		borderRadius: 4,
	},
	trackInfo: {
		flex: 1,
		minWidth: 0,
		marginHorizontal: 10,
		paddingRight: 4,
		justifyContent: 'center',
	},
	title: {
		fontSize: 13,
		fontWeight: '700',
	},
	subtitle: {
		fontSize: 11,
		marginTop: 2,
	},
	controls: {
		flexDirection: 'row',
		alignItems: 'center',
		flexShrink: 0,
		gap: 2,
	},
	controlButton: {
		margin: 0,
	},
	primaryControlButton: {
		width: 34,
		height: 34,
		borderRadius: 17,
	},
});
