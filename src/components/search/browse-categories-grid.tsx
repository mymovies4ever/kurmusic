import { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { Disc } from 'lucide-react-native';

export interface BrowseCategory {
	readonly id: string;
	readonly title: string;
	readonly color: string;
	readonly query: string;
}

export const SPOTIFY_BROWSE_CATEGORIES: BrowseCategory[] = [
	{ id: 'bollywood', title: 'Bollywood', color: '#E8115B', query: 'Bollywood Hits' },
	{ id: 'pop', title: 'Pop', color: '#148A08', query: 'Pop Hits' },
	{ id: 'malayalam', title: 'Malayalam', color: '#27856A', query: 'Malayalam' },
	{ id: 'tamil', title: 'Tamil', color: '#1E3264', query: 'Tamil Hits' },
	{ id: 'punjabi', title: 'Punjabi', color: '#BC5900', query: 'Punjabi' },
	{ id: 'hip-hop', title: 'Hip-Hop', color: '#BA5D07', query: 'Hip Hop' },
	{ id: 'chill', title: 'Chill & Relax', color: '#8D67AB', query: 'Chill Lo-Fi' },
	{ id: 'rock', title: 'Rock & Metal', color: '#E91429', query: 'Rock' },
	{ id: 'party', title: 'Party & Dance', color: '#D84000', query: 'Party Hits' },
	{ id: 'indie', title: 'Indie India', color: '#7358FF', query: 'Indie' },
	{ id: 'workout', title: 'Workout', color: '#503750', query: 'Workout' },
	{ id: 'romance', title: 'Romance', color: '#8C1932', query: 'Romantic' },
];

interface BrowseCategoriesGridProps {
	readonly onSelectCategory: (query: string) => void;
}

export const BrowseCategoriesGrid = memo(function BrowseCategoriesGrid({
	onSelectCategory,
}: BrowseCategoriesGridProps) {
	return (
		<View style={styles.container}>
			<Text style={styles.sectionHeader}>Browse all</Text>
			<View style={styles.grid}>
				{SPOTIFY_BROWSE_CATEGORIES.map((cat) => (
					<Pressable
						key={cat.id}
						onPress={() => onSelectCategory(cat.query)}
						style={({ pressed }) => [
							styles.card,
							{ backgroundColor: cat.color },
							pressed && styles.pressed,
						]}
					>
						<Text style={styles.cardTitle}>{cat.title}</Text>
						<View style={styles.cardIconWrapper}>
							<Disc size={42} color={'rgba(255, 255, 255, 0.45)'} />
						</View>
					</Pressable>
				))}
			</View>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		paddingTop: 16,
		paddingBottom: 24,
	},
	sectionHeader: {
		fontSize: 18,
		fontWeight: '800',
		color: '#FFFFFF',
		marginBottom: 12,
		letterSpacing: -0.3,
	},
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		gap: 10,
	},
	card: {
		width: '48.5%',
		height: 94,
		borderRadius: 8,
		overflow: 'hidden',
		padding: 12,
		position: 'relative',
	},
	pressed: {
		opacity: 0.85,
		transform: [{ scale: 0.98 }],
	},
	cardTitle: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '800',
		letterSpacing: -0.2,
		maxWidth: '75%',
	},
	cardIconWrapper: {
		position: 'absolute',
		bottom: -6,
		right: -6,
		transform: [{ rotate: '25deg' }],
	},
});
