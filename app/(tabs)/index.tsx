import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useDefaultTab, useSettingsStore } from '@/src/application/state/settings-store';

export default function DefaultTabRedirect() {
	const defaultTab = useDefaultTab();
	const [isHydrated, setIsHydrated] = useState(() => useSettingsStore.persist.hasHydrated());

	useEffect(() => {
		if (useSettingsStore.persist.hasHydrated()) {
			setIsHydrated(true);
			return;
		}
		const unsub = useSettingsStore.persist.onFinishHydration(() => {
			setIsHydrated(true);
		});
		// Safety fallback so the redirect never hangs if hydration is slow or already completed
		const timer = setTimeout(() => setIsHydrated(true), 250);
		return () => {
			unsub?.();
			clearTimeout(timer);
		};
	}, []);

	const targetTab = defaultTab || 'feed';
	if (!isHydrated) return null;

	return <Redirect href={`/${targetTab}`} />;
}
