import { useEffect, useRef } from 'react';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { useAccentColor } from '@/src/application/state/settings-store';
import { MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import {
	DarkTheme as NavigationDarkTheme,
	DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { M3Colors, M3ColorScheme, SEED_COLOR, OLED_OVERRIDE } from './colors';
import { M3Typography, FontFamily } from './typography';

export type AppTheme = typeof MD3DarkTheme & {
	colors: typeof MD3DarkTheme.colors & M3ColorScheme;
};

function createPaperTheme(colors: M3ColorScheme) {
	const baseTheme = MD3DarkTheme;

	return {
		...baseTheme,
		fonts: {
			default: {
				fontFamily: FontFamily.regular,
				fontWeight: '400' as const,
				letterSpacing: 0,
			},
			...M3Typography,
		},
		colors: {
			...baseTheme.colors,
			...colors,
			elevation: {
				level0: colors.elevation.level0,
				level1: colors.elevation.level1,
				level2: colors.elevation.level2,
				level3: colors.elevation.level3,
				level4: colors.elevation.level4,
				level5: colors.elevation.level5,
			},
		},
	} as AppTheme;
}

const { DarkTheme: AdaptedDarkTheme } = adaptNavigationTheme({
	reactNavigationLight: NavigationDefaultTheme,
	reactNavigationDark: NavigationDarkTheme,
});

export function useDynamicTheme() {
	const isDark = true;
	const accentColor = useAccentColor();

	const {
		theme: dynamicTheme,
		updateTheme,
		resetTheme,
	} = useMaterial3Theme({
		fallbackSourceColor: accentColor ?? SEED_COLOR,
	});

	const prevAccentColorRef = useRef<string | null | undefined>(undefined);

	useEffect(() => {
		if (prevAccentColorRef.current === accentColor) {
			return;
		}
		prevAccentColorRef.current = accentColor;

		if (accentColor) {
			updateTheme(accentColor);
		} else {
			resetTheme();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [accentColor]);

	const baseColors = dynamicTheme ? dynamicTheme.dark : M3Colors.dark;

	const colors = {
		...baseColors,
		...OLED_OVERRIDE,
		elevation: {
			...baseColors.elevation,
			...OLED_OVERRIDE.elevation,
		},
	};

	const paperTheme = createPaperTheme(colors as unknown as M3ColorScheme);

	const navigationTheme = {
		...AdaptedDarkTheme,
		colors: {
			...AdaptedDarkTheme.colors,
			primary: colors.primary,
			background: colors.background,
			card: colors.surfaceContainerHigh,
			text: colors.onSurface,
			border: colors.outlineVariant,
			notification: colors.error,
		},
	};

	return {
		paperTheme,

		navigationTheme,

		isDynamic: !!dynamicTheme,

		isDark,

		colors,

		updateTheme,

		resetTheme,
	};
}

export function getStaticTheme() {
	return createPaperTheme(M3Colors.dark as unknown as M3ColorScheme);
}
