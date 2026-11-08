/**
 * PlayerThemeContext
 *
 * Provides artwork-derived or app-theme colors to all player children.
 * Mirrors the DetailsPageContext pattern from details-page.tsx.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAppTheme } from '@/lib/theme';
import { usePlayerBackground } from '@/src/application/state/settings-store';
import type { PlayerBackground } from '@/src/application/state/settings-store';
import type { M3ColorScheme } from '@/lib/theme/colors';

interface PlayerThemeContextValue {
	readonly colors: M3ColorScheme;
	readonly hasCustomColors: boolean;
	readonly backgroundStyle: PlayerBackground;
	/** Dominant color from app palette */
	readonly dominantColor: string | null;
}

const PlayerThemeContext = createContext<PlayerThemeContextValue | null>(null);

interface PlayerThemeProviderProps {
	readonly artworkUrl?: string | undefined;
	readonly children: ReactNode;
}

export function PlayerThemeProvider({ children }: PlayerThemeProviderProps) {
	const { colors: appColors } = useAppTheme();

	const value = useMemo<PlayerThemeContextValue>(() => {
		return {
			colors: appColors,
			hasCustomColors: false,
			backgroundStyle: 'theme-color',
			dominantColor: null,
		};
	}, [appColors]);

	return <PlayerThemeContext.Provider value={value}>{children}</PlayerThemeContext.Provider>;
}

/**
 * Hook to access player-scoped theme colors.
 * Falls back to app theme colors if used outside PlayerThemeProvider.
 */
export function usePlayerTheme(): PlayerThemeContextValue {
	const context = useContext(PlayerThemeContext);
	const { colors } = useAppTheme();
	const backgroundStyle = usePlayerBackground();

	if (context) return context;

	return {
		colors,
		hasCustomColors: false,
		backgroundStyle,
		dominantColor: null,
	};
}
