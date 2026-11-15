import { memo, useCallback } from 'react';
import { ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '@/lib/theme';
import type { FeedFilterChip } from '@/src/domain/entities/feed-section';

interface FeedFilterChipsProps {
	readonly chips: FeedFilterChip[];
	readonly activeIndex: number | null;
	readonly onSelect: (chipText: string, index: number) => void;
	readonly onDeselect?: () => void;
}

export const FeedFilterChips = memo(function FeedFilterChips({
	chips,
	activeIndex,
	onSelect,
	onDeselect,
}: FeedFilterChipsProps) {
	const handlePress = useCallback(
		(index: number) => {
			onSelect(chips[index].text, index);
		},
		[chips, onSelect]
	);

	if (chips.length === 0) return null;

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.container}
		>
			{chips.map((chip, index) => (
				<FilterChip
					key={chip.text}
					index={index}
					text={chip.text}
					isActive={activeIndex === index}
					onPress={handlePress}
					onDeselect={onDeselect}
				/>
			))}
		</ScrollView>
	);
});

interface FilterChipProps {
	readonly index: number;
	readonly text: string;
	readonly isActive: boolean;
	readonly onPress: (index: number) => void;
	readonly onDeselect?: () => void;
}

const FilterChip = memo(function FilterChip({
	index,
	text,
	isActive,
	onPress,
	onDeselect,
}: FilterChipProps) {
	const { colors } = useAppTheme();

	const handlePress = useCallback(() => {
		if (isActive) {
			onDeselect?.();
		} else {
			onPress(index);
		}
	}, [isActive, onPress, onDeselect, index]);

	return (
		<Pressable
			onPress={handlePress}
			style={[
				styles.chip,
				{
					backgroundColor: isActive ? colors.primary : '#2A2A2A',
				},
			]}
		>
			<Text
				variant={'labelMedium'}
				style={{
					color: isActive ? '#000000' : '#FFFFFF',
					fontWeight: '600',
				}}
			>
				{text}
			</Text>
		</Pressable>
	);
});

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		gap: 8,
		paddingVertical: 4,
	},
	chip: {
		paddingHorizontal: 16,
		paddingVertical: 7,
		borderRadius: 20,
	},
});
