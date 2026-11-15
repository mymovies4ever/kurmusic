/**
 * AccentColorPicker Types
 *
 * Shared types, interfaces, and color preset data.
 */

import { SEED_COLOR } from '@/lib/theme/colors';
import type { useAppTheme } from '@/lib/theme';

export const CUSTOM_COLORS = [
	{ value: '#1D8CF8', label: 'Spotify Electric Blue' },
	{ value: '#1DB954', label: 'Spotify Classic Green' },
	{ value: '#38BDF8', label: 'Cyan Glow' },
	{ value: '#6366F1', label: 'Obsidian Violet' },
	{ value: '#2563EB', label: 'Cobalt Pacific' },
	{ value: '#059669', label: 'Emerald Sage' },
	{ value: '#D97706', label: 'Vintage Amber' },
	{ value: '#9D174D', label: 'Luxury Bordeaux' },
] as const;

// null = dynamic/Material You colors (wallpaper-extracted on Android 12+)
export const DYNAMIC_COLOR = { value: null, label: 'Dynamic', color: SEED_COLOR } as const;

export const ALL_COLORS = [...CUSTOM_COLORS.map((c) => ({ ...c, color: c.value })), DYNAMIC_COLOR];

export interface AccentColorPickerProps {
	readonly value: string | null;
	readonly onValueChange: (color: string | null) => void;
}

export type ThemeColors = ReturnType<typeof useAppTheme>['colors'];
