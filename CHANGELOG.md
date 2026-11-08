# Changelog - Kur Music

All notable changes to the Kur Music application are documented in this file.

## [1.2.7] - 2026-11-08

### ✨ Features

- **Full Liquid Glass Default UI**: Frosted glass bottom navigation bar with hardware-accelerated blur, 1px specular top border, glowing indicator pills, and translucent header chrome.
- **Dynamic Island Notch Pill**: Interactive camera punch-hole notch pill that morphs smoothly into view at the top of your screen when playing audio outside the player. Includes spinning vinyl album disc, live 3-bar animated equalizer, and mini play/pause control.
- **Liquid Glass Floating Mini-Player**: Translucent frosted glass mini-player powered by native blur, squircle geometry, floating elevation, and responsive swipe-to-skip gestures (swipe left for next track, swipe right for previous, swipe up to open player, swipe down to pause).
- **Player Aurora Ambient Glow**: Breathing multi-stop ambient radial bloom behind the album artwork that dynamically adapts to the dominant and secondary colors of the active track with smooth pulsing animations.
- **Professional Studio Theming**: Replaced generic neon accents with 7 curated professional audio studio palettes (_Obsidian Violet, Titanium Slate, Vintage Amber, Cobalt Pacific, Emerald Sage, Luxury Bordeaux, Studio Monochrome_).
- **OLED Pitch Black AMOLED Mode**: Dedicated toggle in Appearance Settings to turn all background, surface, and container colors into pure `#000000` pitch black for maximum battery savings and contrast on OLED displays.
- **Zero Duplicate Download Storage**: Added "App Storage (No Duplicates)" download mode, saving 50% disk storage by eliminating redundant copies in the public music directory.
- **Categorized OTA Update Cards**: In-app OTA updater now presents release notes formatted into rich Material 3 categorized badge cards (Features, Performance, Fixes).

### ⚡ Performance

- **Aggressive APK Compression**: Dropped legacy 32-bit architecture to target modern pure `arm64-v8a`, enabled ProGuard/R8 Full Mode dead-code elimination, and enabled resource shrinking to compress the release APK size by over 50%.
- **512MB ExoPlayer Audio Disk Cache**: Seamless offline chunk caching for all streaming playback, enabling instant replay and zero cellular data usage on replayed tracks.
- **Background Battery Saver**: AppState-based animation throttling automatically halts 60 FPS GPU loops (Aurora pulse, Dynamic Island eq, disc rotation) when screen is off or app is minimized.
- **Zero Logging Overhead**: Completely disabled debug logging and freeze watchdog background disk writes in production release builds.

### 🛠️ Fixes

- **No Storage Permission Prompts**: Removed on-boot Storage Access Framework permission prompt in release builds.
- **Snapdragon Touch Freeze Resolution**: Eliminated root gesture responder interceptors causing touch unresponsiveness on Snapdragon 8+ Gen 1 and modern Android 14+ devices.

## [1.2.4] - 2026-10-02

### 📻 Fixed Radio Stations & Duplicate Shelves

- **Radio Station Resolver**: Fixed promo prefix matching bug in `home-feed-operations.ts` that erroneously intercepted radio modules with mixed feed parsers. Radio stations now correctly resolve and render their live streaming channels.
- **Duplicate Shelf Elimination**: Added processing guards to ensure radio and artist recommendation shelves are never processed twice in the feed.
- **Section-Level Deduplication**: Updated deduplication to operate within each carousel rather than stripping cards globally across different shelves, preserving full shelf lengths.

### ⚡ Maximized Home Feed Curation & Dynamic Recommendations

- **Parallel Pre-enrichment**: Added parallel recommendation fetching for track carousels during initial load. Shelves now load with 30–40 curated items horizontally right from the first fetch.
- **Infinite Horizontal Scroll**: Added automatic horizontal load-more detection when scrolling near the end of track carousels to seamlessly fetch and append more recommended tracks.
- **One-Tap Play All & Shuffle**: Added instant Play All and Shuffle buttons to the headers of track carousels for effortless continuous listening.

## [1.2.3] - 2026-08-22

### 💿 Fixed Missing New Release Albums on Home Feed

- **Fallback Album Parser**: Updated `mapMixedFeedItems` in `home-feed-operations.ts` with a fallback album parser (`mapAlbum`) when `type` is missing or non-standard in provider launch payloads.
- **Language-Specific Section Matching**: Expanded section definition matchers and section priority sorting so language-specific album modules (e.g. `new_albums_hindi`, `new_albums_malayalam`, `new_albums_tamil`) match properly and are placed at top priority on the Home Feed.

## [1.2.2] - 2026-08-22

### 📻 Radio Station Track Accuracy Fix

- **Artist Radio Resolution**: Updated `JioSaavnProvider.getArtistStationTracks` to prioritize `createArtistStation` over generic featured stations. Now tapping artist radio stations accurately resolves tracks by the target artist and similar artist recommendations.

### ⚡ Seamless Queue Transition & Suppressed Error Popups

- **Queue Stream Pre-caching**: Updated `playback-operations.ts` to utilize pre-cached stream URLs and headers for upcoming queue tracks directly in the native player queue.
- **Transient Error Suppression**: Updated `event-handler.ts` and `playback-service.ts` to filter out placeholder 404/dummy URL transition error events, eliminating false-alarm `"Unable to fetch song"` / `"Playback failed"` toast popups.

### 📚 Home Feed Album-wise Listings Scope

- **Expanded Album Matching**: Updated home feed section definition matchers to include `'new albums'`, `'latest albums'`, `'albums'`, and `'top albums'`, ensuring full shelf prominence for new and trending album releases.

## [1.2.1] - 2026-07-25

### 📊 "Kur Rewind" & Local Listening Statistics Dashboard

- **Personalized Listening Analytics**: Added a visual **"Kur Rewind"** dashboard in the Library tab displaying total minutes listened, top played artists carousel, and most played songs ranking.
- **"Your Daily Mix" Generator**: Added a one-tap action to queue up your top played tracks into a fresh live mix.

### 🌊 Soundwave Spectrum Visualizer & Glassmorphism Aesthetics

- **Animated Audio Visualizer**: Added an animated 9-bar soundwave visualizer directly beneath the album cover on the Now Playing screen (`SoundwaveVisualizer`).
- **Dynamic Artwork Palette Extraction**: Updated player theme context to smoothly adapt primary accents and background gradient tints to the active track's artwork colors.

### 📻 Universal Radio Resolution & Automated Changelogs

- **Featured & Artist Radio Resolution**: Fixed radio track fetching so tapping any Featured Radio station or Artist Radio card resolves all 25 live streaming tracks.
- **Automated OTA Release Notes**: Configured GitHub Actions to automatically extract version release notes from `CHANGELOG.md` and display them inside the app's OTA update dialog.

## [1.2.0] - 2026-07-25

### 📻 Radio Feature Overhaul & Language-Tuned Featured Stations

- **Language-Tuned Featured Radio Shelf**: Added a dedicated **Featured Radio Stations** section on the Home Feed. Dynamically displays ~28 live radio stations tailored to your selected content languages in Settings (Malayalam, Hindi, Tamil, English, Telugu, Punjabi).
- **Featured Radio API Integration**: Added `createFeaturedStation` endpoint support in `JioSaavnClient` (`webradio.createFeaturedStation`).
- **Radio Playback Resolution & Fallback**: Updated `JioSaavnProvider.getArtistStationTracks` to automatically resolve both **Featured Radio** stations and **Artist Radio** stations, eliminating playback failures when tapping radio cards.

### 🎨 Brand Identity & Splash Animation Redesign

- **100% Alpha Transparent Brand Suite**: Regenerated all app logo and launcher icon PNG assets with crisp alpha channel transparency (zero dark/white bounding box backgrounds).
- **Reworked Startup Equalizer Visualizer**: Added an expanding glowing aura ring and a 5-bar animated audio equalizer visualizer on the startup splash screen (`AnimatedSplash`).

### 📦 OTA & Android Package Installer Reliability

- **Document Directory Storage**: Updated `update-service.ts` to download OTA APK files to `FileSystem.documentDirectory` (`/data/user/0/com.kurmusic.app/files/`) for 100% file permission compatibility across Samsung, Xiaomi, Vivo, and Oppo Android package installers.
- **Strict versionCode Increment**: Bumped `versionCode` to `16` to prevent Android `INSTALL_FAILED_VERSION_DOWNGRADE` errors during OTA updates.
