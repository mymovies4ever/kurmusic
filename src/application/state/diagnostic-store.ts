/**
 * Diagnostic Store
 *
 * Manages runtime diagnostics state, hardware touch tracking,
 * JS thread heartbeat, and isolation toggles for OriginOS / Snapdragon debugging.
 */

import { create } from 'zustand';

interface DiagnosticState {
	readonly touchCount: number;
	readonly lastTouch: { readonly x: number; readonly y: number; readonly time: number } | null;
	readonly jsHeartbeat: number;
	readonly bypassFreeze: boolean;
	readonly bypassSceneClip: boolean;
	readonly bypassPortal: boolean;
	readonly bypassSplash: boolean;
	readonly isPanelOpen: boolean;
	readonly activeTab: string;

	// Actions
	registerTouch: (x: number, y: number) => void;
	updateHeartbeat: () => void;
	toggleFreezeBypass: () => void;
	toggleSceneClipBypass: () => void;
	togglePortalBypass: () => void;
	toggleSplashBypass: () => void;
	setPanelOpen: (isOpen: boolean) => void;
	setActiveTab: (tab: string) => void;
	resetTouches: () => void;
}

export const useDiagnosticStore = create<DiagnosticState>((set) => ({
	touchCount: 0,
	lastTouch: null,
	jsHeartbeat: Date.now(),
	bypassFreeze: false,
	bypassSceneClip: false,
	bypassPortal: false,
	bypassSplash: false,
	isPanelOpen: false,
	activeTab: 'feed',

	registerTouch: (x, y) =>
		set((state) => ({
			touchCount: state.touchCount + 1,
			lastTouch: { x, y, time: Date.now() },
		})),

	updateHeartbeat: () => set({ jsHeartbeat: Date.now() }),

	toggleFreezeBypass: () => set((state) => ({ bypassFreeze: !state.bypassFreeze })),
	toggleSceneClipBypass: () => set((state) => ({ bypassSceneClip: !state.bypassSceneClip })),
	togglePortalBypass: () => set((state) => ({ bypassPortal: !state.bypassPortal })),
	toggleSplashBypass: () => set((state) => ({ bypassSplash: !state.bypassSplash })),

	setPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),
	setActiveTab: (tab) => set({ activeTab: tab }),
	resetTouches: () => set({ touchCount: 0, lastTouch: null }),
}));
