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

export const LANGUAGE_CATEGORIES: BrowseCategory[] = [
	{ id: 'malayalam', title: 'Malayalam', color: '#27856A', query: 'Malayalam Hits' },
	{ id: 'tamil', title: 'Tamil', color: '#1E3264', query: 'Tamil Hits' },
	{ id: 'bollywood', title: 'Bollywood / Hindi', color: '#E8115B', query: 'Bollywood Hits' },
	{ id: 'punjabi', title: 'Punjabi', color: '#BC5900', query: 'Punjabi Hits' },
	{ id: 'telugu', title: 'Telugu', color: '#BA5D07', query: 'Telugu Hits' },
	{ id: 'english', title: 'English / Pop', color: '#148A08', query: 'Pop Global Hits' },
];

export const MOOD_CATEGORIES: BrowseCategory[] = [
	{ id: 'romance', title: 'Romance & Love', color: '#8C1932', query: 'Romantic' },
	{ id: 'chill', title: 'Chill & Lo-Fi', color: '#8D67AB', query: 'Chill Lo-Fi' },
	{ id: 'party', title: 'Party & Dance', color: '#D84000', query: 'Party Dance' },
	{ id: 'workout', title: 'Workout & Energy', color: '#503750', query: 'Workout Motivation' },
	{ id: 'indie', title: 'Indie India', color: '#7358FF', query: 'Indie India' },
	{ id: 'rock', title: 'Rock & Metal', color: '#E91429', query: 'Rock' },
];

export const SPOTIFY_BROWSE_CATEGORIES: BrowseCategory[] = [
	...LANGUAGE_CATEGORIES,
	...MOOD_CATEGORIES,
];

interface BrowseCategoriesGridProps {
	readonly onSelectCategory: (query: string) => void;
}

export const BrowseCategoriesGrid = memo(function BrowseCategoriesGrid({
	onSelectCategory,
}: BrowseCategoriesGridProps) {
	return (
		<View style={styles.container}>
			<Text style={styles.sectionHeader}>Explore by Language</Text>
			<View style={styles.grid}>
				{LANGUAGE_CATEGORIES.map((cat) => (
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

			<Text style={[styles.sectionHeader, { marginTop: 24 }]}>Moods & Genres</Text>
			<View style={styles.grid}>
				{MOOD_CATEGORIES.map((cat) => (
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
