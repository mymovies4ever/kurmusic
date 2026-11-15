export const SEED_COLOR = '#1D8CF8';

export const SpotifyColors = {
	black: '#000000',
	darkBase: '#121212',
	surface: '#181818',
	surfaceElevated: '#242424',
	surfaceHighlight: '#2A2A2A',
	border: '#282828',
	borderSubtle: 'rgba(255, 255, 255, 0.08)',
	blue: '#1D8CF8',
	blueHover: '#3B9DF8',
	green: '#1DB954',
	textPrimary: '#FFFFFF',
	textSecondary: '#B3B3B3',
	textSubdued: '#6A6A6A',
} as const;

export const M3Colors = {
	light: {
		primary: '#1D8CF8',
		onPrimary: '#FFFFFF',
		primaryContainer: '#D6E9FF',
		onPrimaryContainer: '#001D36',

		secondary: '#535F70',
		onSecondary: '#FFFFFF',
		secondaryContainer: '#D7E3F8',
		onSecondaryContainer: '#101C2B',

		tertiary: '#6B5778',
		onTertiary: '#FFFFFF',
		tertiaryContainer: '#F3DAFF',
		onTertiaryContainer: '#251432',

		error: '#B3261E',
		onError: '#FFFFFF',
		errorContainer: '#F9DEDC',
		onErrorContainer: '#410E0B',

		background: '#FFFFFF',
		onBackground: '#121212',

		surface: '#FFFFFF',
		onSurface: '#121212',
		surfaceVariant: '#F2F2F4',
		onSurfaceVariant: '#666666',

		outline: '#DCDCDC',
		outlineVariant: '#EAEAEA',

		surfaceContainerLowest: '#FFFFFF',
		surfaceContainerLow: '#F7F7F8',
		surfaceContainer: '#F2F2F4',
		surfaceContainerHigh: '#EAEAEB',
		surfaceContainerHighest: '#E2E2E5',

		inverseSurface: '#181818',
		inverseOnSurface: '#FFFFFF',
		inversePrimary: '#1D8CF8',

		shadow: '#000000',
		scrim: '#000000',

		surfaceTint: '#1D8CF8',

		elevation: {
			level0: 'transparent',
			level1: '#F7F7F8',
			level2: '#F2F2F4',
			level3: '#EAEAEB',
			level4: '#E5E5E8',
			level5: '#E0E0E4',
		},
	},

	dark: {
		primary: '#1D8CF8',
		onPrimary: '#FFFFFF',
		primaryContainer: '#164E87',
		onPrimaryContainer: '#D6E9FF',

		secondary: '#B3B3B3',
		onSecondary: '#121212',
		secondaryContainer: '#282828',
		onSecondaryContainer: '#FFFFFF',

		tertiary: '#38BDF8',
		onTertiary: '#001E2E',
		tertiaryContainer: '#004C6D',
		onTertiaryContainer: '#C7E7FF',

		error: '#F2B8B5',
		onError: '#601410',
		errorContainer: '#8C1D18',
		onErrorContainer: '#F9DEDC',

		background: '#121212',
		onBackground: '#FFFFFF',

		surface: '#121212',
		onSurface: '#FFFFFF',
		surfaceVariant: '#181818',
		onSurfaceVariant: '#B3B3B3',

		outline: '#282828',
		outlineVariant: '#383838',

		surfaceContainerLowest: '#000000',
		surfaceContainerLow: '#121212',
		surfaceContainer: '#181818',
		surfaceContainerHigh: '#242424',
		surfaceContainerHighest: '#2A2A2A',

		inverseSurface: '#E6E1E5',
		inverseOnSurface: '#121212',
		inversePrimary: '#1D8CF8',

		shadow: '#000000',
		scrim: '#000000',

		surfaceTint: '#1D8CF8',

		elevation: {
			level0: 'transparent',
			level1: '#161616',
			level2: '#181818',
			level3: '#202020',
			level4: '#242424',
			level5: '#282828',
		},
	},
} as const;

export const OLED_OVERRIDE = {
	background: '#000000',
	surface: '#000000',
	surfaceContainerLowest: '#000000',
	surfaceContainerLow: '#0A0A0A',
	surfaceContainer: '#121212',
	surfaceContainerHigh: '#181818',
	surfaceContainerHighest: '#242424',
	elevation: {
		level0: 'transparent',
		level1: '#0D0D0D',
		level2: '#121212',
		level3: '#181818',
		level4: '#202020',
		level5: '#242424',
	},
} as const;

export const GlassColors = {
	light: {
		glassSurface: 'rgba(255, 255, 255, 0.75)',
		glassBorder: 'rgba(255, 255, 255, 0.4)',
		glassHighlight: 'rgba(255, 255, 255, 0.8)',
		glassScrim: 'rgba(0, 0, 0, 0.1)',
	},
	dark: {
		glassSurface: 'rgba(16, 16, 22, 0.58)',
		glassBorder: 'rgba(255, 255, 255, 0.16)',
		glassHighlight: 'rgba(255, 255, 255, 0.22)',
		glassScrim: 'rgba(0, 0, 0, 0.40)',
	},
	oled: {
		glassSurface: 'rgba(8, 8, 12, 0.65)',
		glassBorder: 'rgba(255, 255, 255, 0.18)',
		glassHighlight: 'rgba(255, 255, 255, 0.25)',
		glassScrim: 'rgba(0, 0, 0, 0.55)',
	},
} as const;

export type M3ColorScheme = typeof M3Colors.light | typeof M3Colors.dark;
