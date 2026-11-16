import { memo, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native-paper';
import { Play, Heart, Music } from 'lucide-react-native';
import { useRecentlyPlayed } from '@/src/application/state/history-store';
import { usePlaylists, useFavoriteTracks } from '@/src/application/state/library-store';
import { usePlayerActions } from '@/src/hooks/use-player';
import { getBestArtwork } from '@/src/domain/value-objects/artwork';
import { useAppTheme } from '@/lib/theme';
import { router } from 'expo-router';
import type { Track } from '@/src/domain/entities/track';

interface QuickAccessItem {
	id: string;
	title: string;
	type: 'special-likes' | 'playlist' | 'track';
	artworkUrl?: string;
	trackCount?: number;
	tracks?: Track[];
	playlist?: any;
	track?: Track;
}

export const QuickAccessGrid = memo(function QuickAccessGrid() {
	const { colors, isDark } = useAppTheme();
	const recentlyPlayed = useRecentlyPlayed(6);
	const favoriteTracks = useFavoriteTracks();
	const playlists = usePlaylists();
	const { play, playQueue } = usePlayerActions();

	// Combine top favorites, recent tracks, and playlists into up to 6 quick-access cards
	const items = useMemo<QuickAccessItem[]>(() => {
		const result: QuickAccessItem[] = [];

		if (favoriteTracks.length > 0) {
			result.push({
				id: 'liked-songs',
				title: 'Liked Songs',
				type: 'special-likes' as const,
				trackCount: favoriteTracks.length,
				tracks: favoriteTracks,
			});
		}

		for (const p of playlists) {
			if (result.length >= 6) break;
			const artwork = getBestArtwork(p.artwork, 150)?.url;
			result.push({
				id: `playlist-${p.id}`,
				title: p.name,
				type: 'playlist' as const,
				artworkUrl: artwork,
				playlist: p,
			});
		}

		for (const t of recentlyPlayed) {
			if (result.length >= 6) break;
			if (result.some((i) => i.id === t.id.value)) continue;
			const artwork = getBestArtwork(t.artwork, 150)?.url;
			result.push({
				id: t.id.value,
				title: t.title,
				type: 'track' as const,
				artworkUrl: artwork,
				track: t,
			});
		}

		return result;
	}, [favoriteTracks, playlists, recentlyPlayed]);

	// Keep an even number of cards (2, 4, or 6) so there are no awkward orphaned cards in the 2-column grid
	const displayedItems = useMemo(() => {
		const max = Math.min(6, items.length);
		const evenCount = max - (max % 2);
		return items.slice(0, evenCount);
	}, [items]);

	const handleItemPress = useCallback(
		(item: QuickAccessItem) => {
			if (item.type === 'special-likes' && item.tracks) {
				playQueue(item.tracks, 0);
			} else if (item.type === 'track' && item.track) {
				play(item.track);
			} else if (item.type === 'playlist' && item.playlist) {
				router.push(`/playlist/${item.playlist.id}` as any);
			}
		},
		[play, playQueue]
	);

	if (displayedItems.length === 0) return null;

	return (
		<View style={styles.container}>
			<View style={styles.grid}>
				{displayedItems.map((item) => {
					return (
						<Pressable
							key={item.id}
							onPress={() => handleItemPress(item)}
							style={({ pressed }) => [
								styles.card,
								{
									backgroundColor: pressed
										? isDark
											? '#2E2E2E'
											: '#E4E4E6'
										: isDark
											? '#242424'
											: '#F0F0F2',
								},
							]}
						>
							<View style={styles.artContainer}>
								{item.type === 'special-likes' ? (
									<View
										style={[
											styles.likesGradient,
											{ backgroundColor: colors.primary },
										]}
									>
										<Heart size={20} color={'#FFFFFF'} fill={'#FFFFFF'} />
									</View>
								) : item.artworkUrl ? (
									<Image
										source={{ uri: item.artworkUrl }}
										style={styles.artwork}
										contentFit={'cover'}
									/>
								) : (
									<View
										style={[
											styles.fallbackArt,
											{ backgroundColor: isDark ? '#1E1E1E' : '#E0E0E2' },
										]}
									>
										<Music size={20} color={isDark ? '#888888' : '#777777'} />
									</View>
								)}
							</View>
							<Text
								numberOfLines={2}
								style={[
									styles.cardTitle,
									{ color: isDark ? '#FFFFFF' : '#121212' },
								]}
							>
								{item.title}
							</Text>
							<View style={[styles.miniPlayBtn, { backgroundColor: colors.primary }]}>
								<Play size={12} color={'#FFFFFF'} fill={'#FFFFFF'} />
							</View>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 16,
	},
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		rowGap: 8,
	},
	card: {
		width: '48.8%',
		height: 54,
		borderRadius: 4,
		overflow: 'hidden',
		flexDirection: 'row',
		alignItems: 'center',
		paddingRight: 8,
	},
	artContainer: {
		width: 54,
		height: 54,
		marginRight: 8,
	},
	artwork: {
		width: 54,
		height: 54,
	},
	likesGradient: {
		width: 54,
		height: 54,
		alignItems: 'center',
		justifyContent: 'center',
	},
	fallbackArt: {
		width: 54,
		height: 54,
		backgroundColor: '#1E1E1E',
		alignItems: 'center',
		justifyContent: 'center',
	},
	cardTitle: {
		flex: 1,
		fontSize: 12,
		fontWeight: '700',
		lineHeight: 16,
	},
	miniPlayBtn: {
		width: 26,
		height: 26,
		borderRadius: 13,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 3,
		elevation: 3,
		marginLeft: 4,
	},
});
