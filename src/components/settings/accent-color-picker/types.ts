/**
 * AccentColorPicker Types
 *
 * Shared types, interfaces, and color preset data.
 */

import { SEED_COLOR } from '@/lib/theme/colors';
import type { useAppTheme } from '@/lib/theme';

export const CUSTOM_COLORS = [
	{ value: '#6366F1', label: 'Obsidian Violet' },
	{ value: '#64748B', label: 'Titanium Slate' },
	{ value: '#D97706', label: 'Vintage Amber' },
	{ value: '#2563EB', label: 'Cobalt Pacific' },
	{ value: '#059669', label: 'Emerald Sage' },
	{ value: '#9D174D', label: 'Luxury Bordeaux' },
	{ value: '#334155', label: 'Studio Monochrome' },
] as const;

// null = dynamic/Material You colors (wallpaper-extracted on Android 12+)
export const DYNAMIC_COLOR = { value: null, label: 'Dynamic', color: SEED_COLOR } as const;

export const ALL_COLORS = [...CUSTOM_COLORS.map((c) => ({ ...c, color: c.value })), DYNAMIC_COLOR];

export interface AccentColorPickerProps {
	readonly value: string | null;
	readonly onValueChange: (color: string | null) => void;
}

export type ThemeColors = ReturnType<typeof useAppTheme>['colors'];
