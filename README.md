# TypeFlux

<p align="center">
  <img src="icons/icon128.png" alt="TypeFlux Logo" width="128" height="128">
</p>

<p align="center">
  <strong>Live typography preview for any website. Test fonts, spacing, and hierarchy with instant results.</strong>
</p>

## Overview
**TypeFlux** is a lightweight Chrome extension that lets designers, developers, and typography enthusiasts experiment with font styles directly on any live webpage. Unlike browser DevTools — which require navigating nested element trees and writing raw CSS — TypeFlux provides an intuitive, slider-driven interface that applies changes instantly across the entire page or to individually selected elements.

The extension dynamically injects a content script into the active tab and applies temporary CSS overrides. All changes are purely visual previews — nothing is saved, nothing is modified permanently. Refreshing the page restores the original design. TypeFlux connects to **Google Fonts** to load font families on demand, giving you access to 30 curated typefaces without any setup.

A built-in **element selection mode** lets you click any text element on the page and style it independently from the rest of the document — ideal for testing how a specific heading, paragraph, or button looks with a different font or weight.

Every operation runs locally in your browser with zero external data collection.

## Features
*   **Google Fonts Integration:** Search and apply from 30 curated Google Fonts instantly. Fonts are loaded on demand via the Google Fonts CSS API with full weight support (100–900).
*   **Unified Weight Control:** Adjust font weight for all text, headings only, or body text only — from a single dropdown interface. Supports all 9 standard weight values from Thin (100) to Black (900).
*   **Individual Heading Control:** Set H1–H6 sizes manually with individual sliders. H1–H3 are always visible, with H4–H6 available via a "Show More" toggle for a cleaner interface.
*   **Body Style Tuning:** Fine-tune body font size (8–48px), line height (0.5–5.0×), and letter spacing (-5–20px) with linked slider + input controls.
*   **Element Selection Mode:** Click the cursor icon, then click any text element on the page to style it individually. Non-text elements (images, SVGs, iframes) are automatically filtered out. A toast notification confirms your selection.
*   **Smart Validation System:** Warnings appear when values exceed recommended slider ranges — with inline warning icons next to affected labels and an auto-dismissing toast notification. Validation is disabled during element editing mode.
*   **Section-Level & Global Reset:** Reset typography, heading sizes, or body styles independently with per-section reset buttons — or reset everything at once with the global reset.
*   **Restricted Page Detection:** Graceful error handling on Chrome Web Store, `chrome://` pages, and other restricted URLs — displays a clear warning instead of silently failing.
*   **Live Preview:** All changes are applied in real-time with no page reload. CSS overrides are injected via a dynamically managed `<style>` element.

## How It Works

### Typography Engine

TypeFlux applies changes through a **CSS injection pipeline** managed by the content script:

#### 1. Global Styles
When no element is selected, changes apply to the entire page:

| Control | CSS Target |
|---------|------------|
| **Font Family** | `body, body * { font-family: ... }` |
| **Heading Weight** | `h1, h2, h3, h4, h5, h6 { font-weight: ... }` |
| **Body Weight** | `body, body p, body span, body li, body a, body td, body div:not(:has(*)) { font-weight: ... }` |
| **Heading Sizes** | `h1 { font-size: ... }` through `h6 { font-size: ... }` |
| **Body Size** | Same selector as body weight |
| **Line Height** | `body, body * { line-height: ... }` |
| **Letter Spacing** | `body, body * { letter-spacing: ... }` |

#### 2. Element-Specific Styles
When an element is selected via selection mode, it receives a `data-tf-styled="true"` attribute. All subsequent changes target only that attribute:

```css
[data-tf-styled="true"] { font-family: 'Inter', sans-serif !important; }
[data-tf-styled="true"] { font-weight: 600 !important; }
[data-tf-styled="true"] { font-size: 18px !important; }
```

This ensures element-level overrides don't interfere with global styles.

#### 3. Element Selection Filtering
The selection mode filters out non-text elements to prevent accidental targeting:

| Ignored Elements |
|------------------|
| `img`, `video`, `audio`, `canvas` |
| `svg`, `path`, `g`, `circle`, `rect`, `line`, `polygon`, `polyline` |
| `iframe`, `embed`, `object` |
| `picture`, `source`, `track` |
| `br`, `hr`, `area`, `map` |
| `html`, `body` |

If a click lands on an ignored element, the selection bubbles up to the nearest valid parent.


## Use Cases
*   **UI/UX Designers:** Quickly test how different fonts and weights affect the visual hierarchy of a live page — without opening Figma or writing CSS. Compare typefaces side-by-side by switching fonts in seconds.
*   **Frontend Developers:** Validate typography during design-to-code handoff. Use individual heading sliders to verify that heading sizes follow a consistent visual hierarchy before committing to a CSS system.
*   **Content Strategists:** Evaluate readability of long-form content by adjusting line height, letter spacing, and body font size in real-time. Find the optimal reading experience before requesting design changes.
*   **Accessibility Auditors:** Test font size compliance and readability thresholds on live pages. Quickly identify text that's too small, too tightly spaced, or using hard-to-read weights.
*   **Typography Enthusiasts:** Experiment with Google Fonts on any website to see how different typefaces look in a real-world context — not just a font preview tool.

## Privacy
TypeFlux is a strictly **local-first, zero-telemetry** extension. Your data never leaves your machine.

*   **100% Client-Side Processing:** All typography changes, CSS injection, and DOM analysis run entirely within your browser's JavaScript sandbox. There is no server component.
*   **Zero Data Collection:** No browsing history, page content, personal identifiers, cookies, or metadata are ever captured, stored, or transmitted.
*   **One External Connection:** The only network request TypeFlux makes is to `fonts.googleapis.com` to load Google Fonts selected by the user. No user data is included in these requests.
*   **Minimal Permissions:** Only requires `activeTab` (to inject the content script on the current page) and `scripting` (to programmatically execute the typography engine). No background service worker, no persistent storage, no cross-origin access.

See our [Privacy Policy](PRIVACY_POLICY.md) for the full policy.

## Tech Stack
*   **Core:** Vanilla JavaScript (ES6+), CSS3 with Custom Properties, HTML5
*   **Architecture:** Chrome Extension Manifest V3 — popup + on-demand content script injection via `chrome.scripting.executeScript`
*   **Typography Engine:** Dynamic `<style>` element injection with attribute-based selectors for element-level overrides
*   **Font Loading:** Google Fonts CSS API with full weight range (100–900) loaded via `<link>` element injection
*   **UI Framework:** Custom accordion system with CSS Grid animation trick (`grid-template-rows: 0fr → 1fr`), glassmorphic toast notifications, and linked slider + input controls
*   **Validation:** Real-time range checking with inline SVG warning icons and auto-dismissing toast notifications
*   **Communication:** Bidirectional `chrome.runtime.sendMessage` / `onMessage` bridge for real-time popup ↔ content script synchronization

## Installation

### From Chrome Web Store
[Install TypeFlux](https://chromewebstore.google.com/detail/typeflux/nemkilhkadhfoafhdbmomnoaanodeehh)

### Manual Installation (Developer Mode)
1.  **Clone** this repository.
2.  Open Chrome and go to `chrome://extensions/`.
3.  Enable **Developer mode** in the top right.
4.  Click **Load unpacked**.
5.  Select the directory where you cloned this repository.

## Project Structure
```text
TypeFlux/
├── icons/             # Extension application icons
├── content.js         # Content script — CSS injection & element selection
├── popup.html         # Popup UI layout
├── popup.js           # Popup logic & controls
├── popup.css          # Popup styles (dark theme)
├── manifest.json      # Extension configuration (Manifest V3)
├── PRIVACY_POLICY.md  # Privacy policy
└── README.md          # Documentation
```

## License
Distributed under the MIT License. See `LICENSE` for more information.

---
Built by **heykaan.dev**
