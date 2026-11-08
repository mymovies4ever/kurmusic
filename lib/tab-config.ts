import {
	NewspaperIcon,
	MusicIcon,
	DownloadIcon,
	SearchIcon,
	SparklesIcon,
	SettingsIcon,
	type LucideIcon,
} from 'lucide-react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { AnimationObject } from 'lottie-react-native';
import type { TabId } from '@/src/application/state/settings-store';

import FeedLottie from '@/assets/animation/system-solid-76-newspaper-hover-newspaper.json';
import LibraryLottie from '@/assets/animation/system-regular-106-headphones-hover-hearphones.json';
import DownloadsLottie from '@/assets/animation/system-regular-81-download-save-hover-pinch.json';
import SearchLottie from '@/assets/animation/system-solid-42-search-hover-pinch.json';
import SettingsLottie from '@/assets/animation/system-regular-63-settings-cog-hover-cog-1.json';

export type TabConfig = BottomTabNavigationOptions & {
	readonly icon: LucideIcon;
	readonly lottieSource?: AnimationObject;
};

export const TAB_CONFIG: Record<TabId, TabConfig> = {
	feed: {
		title: 'Home',
		icon: NewspaperIcon,
		lottieSource: FeedLottie,
	},
	search: {
		title: 'Search',
		icon: SearchIcon,
		lottieSource: SearchLottie,
	},
	library: {
		title: 'Library',
		icon: MusicIcon,
		lottieSource: LibraryLottie,
	},
	downloads: {
		title: 'Downloads',
		icon: DownloadIcon,
		lottieSource: DownloadsLottie,
	},
	settings: {
		title: 'Settings',
		icon: SettingsIcon,
		lottieSource: SettingsLottie,
	},
	rewind: {
		title: 'Rewind',
		icon: SparklesIcon,
	},
};

export const TAB_ROUTES = ['/feed', '/search', '/library', '/downloads', '/settings', '/rewind'];

export const TAB_BAR_HEIGHT = 75;
