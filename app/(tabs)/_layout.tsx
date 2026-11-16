import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, router } from 'expo-router';
import { View, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, IconButton } from 'react-native-paper';
import { LanguagesIcon, SettingsIcon } from 'lucide-react-native';
import { useAppTheme, resolveDisplayFont } from '@/lib/theme';
import { useActiveDownloadsCount } from '@/src/application/state/download-store';
import {
	useTabOrder,
	useEnabledTabs,
	type TabId,
	DEFAULT_TAB_ORDER,
} from '@/src/application/state/settings-store';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TAB_CONFIG, TAB_BAR_HEIGHT } from '@/lib/tab-config';
import { LottieTabIcon } from '@/src/components/ui/lottie-tab-icon';
import { StaticTabIcon } from '@/src/components/ui/static-tab-icon';
import { Icon } from '@/src/components/ui/icon';

// Lightweight pub/sub so the tab bar can notify the header of active tab
// changes without re-rendering the parent TabLayout (which would recreate
// Tabs.Screen children and trigger full screen unmount/remount).
type ActiveTabListener = (tabId: TabId) => void;
const activeTabListeners = new Set<ActiveTabListener>();

function emitActiveTab(tabId: TabId): void {
	activeTabListeners.forEach((fn) => fn(tabId));
}

function useActiveTabListener(initial: TabId): TabId {
	const [tabId, setTabId] = useState<TabId>(initial);

	useEffect(() => {
		activeTabListeners.add(setTabId);
		return () => {
			activeTabListeners.delete(setTabId);
		};
	}, []);

	return tabId;
}

export default function TabLayout() {
	const tabOrder = useTabOrder();
	const enabledTabs = useEnabledTabs();

	const validTabOrder = useMemo(() => {
		const safeTabOrder =
			Array.isArray(tabOrder) && tabOrder.length > 0 ? tabOrder : DEFAULT_TAB_ORDER;
		const safeEnabledTabs =
			Array.isArray(enabledTabs) && enabledTabs.length > 0 ? enabledTabs : DEFAULT_TAB_ORDER;

		const validTabs = safeTabOrder.filter((id) => id in TAB_CONFIG);
		if (validTabs.length !== DEFAULT_TAB_ORDER.length) {
			const filtered = DEFAULT_TAB_ORDER.filter((id) => safeEnabledTabs.includes(id));
			return filtered.length > 0 ? filtered : DEFAULT_TAB_ORDER;
		}
		const filtered = validTabs.filter((id) => safeEnabledTabs.includes(id));
		return filtered.length > 0 ? filtered : DEFAULT_TAB_ORDER;
	}, [tabOrder, enabledTabs]);

	const { colors } = useAppTheme();

	const screenOptions = useMemo(
		() => ({
			headerShown: false,
			animation: 'shift' as const,
			lazy: false,
			freezeOnBlur: false,
			sceneStyle: {
				backgroundColor: colors.background,
			},
		}),
		[colors.background]
	);

	// Stabilize the tabBar render callback so the navigator never receives a
	// new function reference on re-render.
	const renderTabBar = useCallback(
		(props: BottomTabBarProps) => (
			<CustomTabBar {...props} tabOrder={validTabOrder} onActiveTabChange={emitActiveTab} />
		),
		[validTabOrder]
	);

	return (
		<View style={styles.layoutRoot}>
			<TabHeader initialTabId={validTabOrder[0]} />
			<Tabs screenOptions={screenOptions} tabBar={renderTabBar}>
				<Tabs.Screen name={'index'} options={{ href: null }} />
				{Object.entries(TAB_CONFIG).map(([tabId, config]) => {
					const isEnabled = validTabOrder.includes(tabId as TabId);
					return (
						<Tabs.Screen
							key={tabId}
							name={tabId}
							options={{
								...config,
								href: isEnabled ? undefined : null,
							}}
						/>
					);
				})}
			</Tabs>
		</View>
	);
}

function getGreeting(): string {
	const hour = new Date().getHours();
	if (hour < 12) return 'Good morning';
	if (hour < 18) return 'Good afternoon';
	return 'Good evening';
}

function TabHeader({ initialTabId }: { readonly initialTabId: TabId }) {
	const currentTabId = useActiveTabListener(initialTabId);
	const { colors } = useAppTheme();
	const insets = useSafeAreaInsets();
	const title = TAB_CONFIG[currentTabId]?.title ?? '';
	const isHomeFeed = currentTabId === 'feed';

	return (
		<View
			style={[
				styles.tabHeader,
				{
					paddingTop: insets.top + 4,
					backgroundColor: colors.background,
				},
			]}
		>
			{isHomeFeed ? (
				<>
					<View style={styles.spotifyHomeHeaderLeft}>
						<View
							style={[
								styles.brandLogoWrapper,
								{ backgroundColor: colors.surfaceContainerHigh },
							]}
						>
							<Image
								source={require('@/assets/images/kur-logo.png')}
								style={styles.brandLogo}
								contentFit={'cover'}
							/>
						</View>
						<Text
							variant={'headlineSmall'}
							style={[
								styles.spotifyGreeting,
								{ fontFamily: resolveDisplayFont('700'), color: colors.onSurface },
							]}
						>
							{getGreeting()}
						</Text>
					</View>
					<View style={styles.spotifyHeaderActions}>
						<IconButton
							icon={() => (
								<Icon
									as={LanguagesIcon}
									size={22}
									color={colors.onSurfaceVariant}
								/>
							)}
							onPress={() =>
								router.push({
									pathname: '/settings',
									params: { homeLanguages: '1' },
								})
							}
							accessibilityLabel={'Home languages'}
						/>
						<IconButton
							icon={() => (
								<Icon as={SettingsIcon} size={22} color={colors.onSurfaceVariant} />
							)}
							onPress={() => router.push('/settings')}
							accessibilityLabel={'Settings'}
						/>
					</View>
				</>
			) : (
				<View style={styles.spotifyOtherHeader}>
					<Text
						variant={'headlineMedium'}
						style={[
							styles.spotifyPageTitle,
							{ fontFamily: resolveDisplayFont('700'), color: colors.onSurface },
						]}
					>
						{title}
					</Text>
				</View>
			)}
		</View>
	);
}

interface CustomTabBarProps extends BottomTabBarProps {
	readonly tabOrder: TabId[];
	readonly onActiveTabChange: (tabId: TabId) => void;
}

function CustomTabBar({ state, navigation, tabOrder, onActiveTabChange }: CustomTabBarProps) {
	const { colors, isDark } = useAppTheme();
	const insets = useSafeAreaInsets();
	const activeDownloadsCount = useActiveDownloadsCount();
	const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;

	const currentRouteName = state.routes[state.index]?.name as TabId;

	useEffect(() => {
		onActiveTabChange(currentRouteName);
	}, [currentRouteName, onActiveTabChange]);

	const handleTabPress = useCallback(
		(_visualIdx: number, routeIndex: number, routeName: string) => {
			const event = navigation.emit({
				type: 'tabPress',
				target: state.routes[routeIndex].key,
				canPreventDefault: true,
			});

			if (!event.defaultPrevented) {
				navigation.navigate(routeName);
			}
		},
		[navigation, state.routes]
	);

	return (
		<View style={styles.tabBarContainer}>
			<View
				style={[
					StyleSheet.absoluteFill,
					{
						backgroundColor: isDark ? '#000000' : '#FFFFFF',
						borderTopWidth: 1,
						borderTopColor: isDark ? '#282828' : '#EAEAEA',
					},
				]}
			/>
			<View
				style={[
					styles.tabBar,
					{
						height: tabBarHeight,
						paddingBottom: insets.bottom,
					},
				]}
			>
				<View style={styles.tabsContainer}>
					{tabOrder.map((tabId, visualIdx) => {
						const config = TAB_CONFIG[tabId];
						if (!config) return null;
						const route = state.routes.find((r) => r.name === tabId);
						if (!route) return null;
						const routeIndex = state.routes.indexOf(route);
						const isFocused = state.index === routeIndex;
						const isDownloadsTab = tabId === 'downloads';
						const downloadBadgeCount = isDownloadsTab
							? activeDownloadsCount || undefined
							: undefined;
						const inactiveColor = isDark ? '#A0A0A0' : '#555555';

						return (
							<Pressable
								key={tabId}
								onPress={() => handleTabPress(visualIdx, routeIndex, tabId)}
								style={styles.tabButton}
								accessibilityRole={'tab'}
								accessibilityLabel={config.title}
								accessibilityState={{ selected: isFocused }}
							>
								{config.lottieSource ? (
									<LottieTabIcon
										source={config.lottieSource}
										isFocused={isFocused}
										focusedColor={colors.primary}
										inactiveColor={inactiveColor}
										badgeCount={downloadBadgeCount}
									/>
								) : (
									<StaticTabIcon
										icon={config.icon}
										isFocused={isFocused}
										focusedColor={colors.primary}
										inactiveColor={inactiveColor}
									/>
								)}
								<Text
									numberOfLines={1}
									style={[
										styles.tabLabel,
										{
											color: isFocused ? colors.primary : inactiveColor,
											fontWeight: isFocused ? '700' : '500',
										},
									]}
								>
									{config.title}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	layoutRoot: {
		flex: 1,
	},
	tabHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingBottom: 6,
	},
	spotifyHomeHeaderLeft: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingLeft: 16,
	},
	spotifyGreeting: {
		fontWeight: '700',
		fontSize: 22,
	},
	spotifyHeaderActions: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingRight: 6,
	},
	spotifyOtherHeader: {
		flex: 1,
		paddingHorizontal: 16,
		paddingVertical: 4,
	},
	spotifyPageTitle: {
		fontWeight: '800',
		fontSize: 26,
	},
	brandLogoWrapper: {
		width: 34,
		height: 34,
		borderRadius: 17,
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.15)',
	},
	brandLogo: {
		width: 34,
		height: 34,
	},
	tabBarContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		zIndex: 20,
	},
	tabBar: {
		flexDirection: 'row',
		borderTopWidth: 0,
		elevation: 0,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
	},
	tabsContainer: {
		flex: 1,
		flexDirection: 'row',
	},
	tabButton: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		height: TAB_BAR_HEIGHT,
		gap: 4,
	},
	tabLabel: {
		fontSize: 11,
		fontWeight: '600',
		width: '100%',
		textAlign: 'center',
	},
});
