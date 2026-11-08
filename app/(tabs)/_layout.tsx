import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Tabs, router } from 'expo-router';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text, IconButton } from 'react-native-paper';
import { LanguagesIcon } from 'lucide-react-native';
import { useAppTheme, resolveDisplayFont } from '@/lib/theme';
import { useActiveDownloadsCount } from '@/src/application/state/download-store';
import {
	useTabOrder,
	useEnabledTabs,
	useUIStyle,
	type TabId,
	DEFAULT_TAB_ORDER,
} from '@/src/application/state/settings-store';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TAB_CONFIG, TAB_BAR_HEIGHT } from '@/lib/tab-config';
import { LottieTabIcon } from '@/src/components/ui/lottie-tab-icon';
import { StaticTabIcon } from '@/src/components/ui/static-tab-icon';
import { Icon } from '@/src/components/ui/icon';

const INDICATOR_HEIGHT = 32;
const INDICATOR_TOP = 10;

const TAB_SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.5 };

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

function TabHeader({ initialTabId }: { readonly initialTabId: TabId }) {
	const currentTabId = useActiveTabListener(initialTabId);
	const { colors, isDark } = useAppTheme();
	const uiStyle = useUIStyle();
	const isGlass = uiStyle === 'glass';
	const insets = useSafeAreaInsets();
	const title = TAB_CONFIG[currentTabId]?.title ?? '';
	const isHomeFeed = currentTabId === 'feed';

	const glassHeaderBg = isDark ? 'rgba(16, 16, 22, 0.76)' : 'rgba(255, 255, 255, 0.84)';
	const glassHeaderBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

	return (
		<>
			<View
				style={[
					styles.tabHeader,
					{
						paddingTop: insets.top,
						backgroundColor: isGlass ? glassHeaderBg : colors.background,
						borderBottomWidth: isGlass ? 1 : 0,
						borderBottomColor: isGlass ? glassHeaderBorder : 'transparent',
					},
				]}
			>
				<View style={styles.headerActions}>
					{isHomeFeed && (
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
					)}
				</View>
				<Text
					variant={'headlineMedium'}
					style={[
						styles.headerTitle,
						{ fontFamily: resolveDisplayFont('700'), color: colors.onSurface },
					]}
				>
					{title}
				</Text>
				<View style={styles.headerActionSpacer}>
					{isHomeFeed && (
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
					)}
				</View>
			</View>
		</>
	);
}

interface CustomTabBarProps extends BottomTabBarProps {
	readonly tabOrder: TabId[];
	readonly onActiveTabChange: (tabId: TabId) => void;
}

function CustomTabBar({ state, navigation, tabOrder, onActiveTabChange }: CustomTabBarProps) {
	const { colors, isDark } = useAppTheme();
	const uiStyle = useUIStyle();
	const isGlass = uiStyle === 'glass';
	const insets = useSafeAreaInsets();
	const { width: windowWidth } = useWindowDimensions();
	const activeDownloadsCount = useActiveDownloadsCount();
	const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;

	const glassBgColor = isDark ? 'rgba(16, 16, 22, 0.58)' : 'rgba(255, 255, 255, 0.82)';
	const glassBorderColor = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)';

	const tabCount = Math.max(1, tabOrder.length);
	const tabWidth = windowWidth / tabCount;
	const indicatorWidth = Math.min(56, tabWidth - 10);

	const currentRouteName = state.routes[state.index]?.name as TabId;
	const visualIndex = tabOrder.indexOf(currentRouteName);
	const initialX = Math.max(0, visualIndex) * tabWidth + (tabWidth - indicatorWidth) / 2;

	const indicatorX = useSharedValue(initialX);

	useEffect(() => {
		onActiveTabChange(currentRouteName);
		const newVisualIndex = tabOrder.indexOf(currentRouteName);
		if (newVisualIndex >= 0) {
			const newX = newVisualIndex * tabWidth + (tabWidth - indicatorWidth) / 2;
			indicatorX.value = withSpring(newX, {
				damping: 24,
				stiffness: 190,
				mass: 0.5,
			});
		}
	}, [currentRouteName, tabOrder, tabWidth, indicatorWidth, indicatorX, onActiveTabChange]);

	const animatedIndicatorStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: indicatorX.value }],
		};
	});

	const handleTabPress = useCallback(
		(visualIdx: number, routeIndex: number, routeName: string) => {
			const newX = visualIdx * tabWidth + (tabWidth - indicatorWidth) / 2;
			indicatorX.value = withSpring(newX, {
				damping: 24,
				stiffness: 190,
				mass: 0.5,
			});

			const event = navigation.emit({
				type: 'tabPress',
				target: state.routes[routeIndex].key,
				canPreventDefault: true,
			});

			if (!event.defaultPrevented) {
				navigation.navigate(routeName);
			}
		},
		[navigation, state.routes, indicatorX, tabWidth, indicatorWidth]
	);

	return (
		<View style={styles.tabBarContainer}>
			{isGlass && (
				<BlurView
					intensity={85}
					tint={isDark ? 'dark' : 'light'}
					experimentalBlurMethod={'dimezisBlurView'}
					style={[
						StyleSheet.absoluteFill,
						{
							backgroundColor: glassBgColor,
							borderTopWidth: 1,
							borderTopColor: glassBorderColor,
						},
					]}
				/>
			)}
			<View
				style={[
					styles.tabBar,
					{
						backgroundColor: isGlass ? 'transparent' : colors.surfaceContainer,
						height: tabBarHeight,
						paddingBottom: insets.bottom,
					},
				]}
			>
				<View style={styles.tabsContainer}>
					<Animated.View
						style={[
							styles.indicator,
							{
								width: indicatorWidth,
								backgroundColor: isGlass
									? `${colors.primary}25`
									: colors.secondaryContainer,
								borderWidth: isGlass ? 1 : 0,
								borderColor: isGlass ? `${colors.primary}50` : 'transparent',
								top: INDICATOR_TOP,
							},
							animatedIndicatorStyle,
						]}
					/>

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
										inactiveColor={colors.onSurfaceVariant}
										badgeCount={downloadBadgeCount}
									/>
								) : (
									<StaticTabIcon
										icon={config.icon}
										isFocused={isFocused}
										focusedColor={colors.primary}
										inactiveColor={colors.onSurfaceVariant}
									/>
								)}
								<TabLabel
									label={config.title ?? ''}
									isFocused={isFocused}
									color={colors.primary}
								/>
							</Pressable>
						);
					})}
				</View>
			</View>
		</View>
	);
}

interface TabLabelProps {
	label: string;
	isFocused: boolean;
	color: string;
}

const TabLabel = memo(function TabLabel({ label, isFocused, color }: TabLabelProps) {
	const opacity = useSharedValue(isFocused ? 1 : 0);
	const translateY = useSharedValue(isFocused ? 0 : 4);

	useEffect(() => {
		opacity.value = withSpring(isFocused ? 1 : 0, TAB_SPRING_CONFIG);
		translateY.value = withSpring(isFocused ? 0 : 4, TAB_SPRING_CONFIG);
	}, [isFocused, opacity, translateY]);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ translateY: translateY.value }],
	}));

	return (
		<Animated.Text numberOfLines={1} style={[styles.tabLabel, { color }, animatedStyle]}>
			{label}
		</Animated.Text>
	);
});

const styles = StyleSheet.create({
	layoutRoot: {
		flex: 1,
	},
	tabHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 4,
		paddingBottom: 4,
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
		width: 112,
	},
	headerActionSpacer: {
		width: 112,
		alignItems: 'flex-end',
	},
	brandLogoWrapper: {
		width: 42,
		height: 42,
		borderRadius: 12,
		overflow: 'hidden',
		marginRight: 12,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
	},
	brandLogo: {
		width: 42,
		height: 42,
		borderRadius: 12,
	},
	headerTitle: {
		flex: 1,
		textAlign: 'center',
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
	indicator: {
		position: 'absolute',
		left: 0,
		height: INDICATOR_HEIGHT,
		borderRadius: 16,
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
