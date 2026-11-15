import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

const ICON_SIZE = 24;

interface StaticTabIconProps {
	readonly icon: LucideIcon;
	readonly isFocused: boolean;
	readonly focusedColor: string;
	readonly inactiveColor: string;
}

export const StaticTabIcon = memo(function StaticTabIcon({
	icon: IconComponent,
	isFocused,
	focusedColor,
	inactiveColor,
}: StaticTabIconProps) {
	const currentColor = isFocused ? focusedColor : inactiveColor;

	return (
		<View style={styles.iconContainer}>
			<IconComponent size={ICON_SIZE} color={currentColor} />
		</View>
	);
});

const styles = StyleSheet.create({
	iconContainer: {
		width: ICON_SIZE,
		height: ICON_SIZE,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
