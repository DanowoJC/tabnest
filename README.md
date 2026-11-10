<h1 align="center">TabNest</h1>

<p align="center">
  A smart tab session manager for Chromium browsers.<br>
  Save and restore sessions, auto-group tabs by task, archive idle tabs, close duplicates, hibernate tabs and search everything.
</p>

<p align="center">
  <img alt="Manifest V3" src="https://img.shields.io/badge/Manifest-V3-4285F4">
  <img alt="Chromium" src="https://img.shields.io/badge/browser-Chrome%20%7C%20Brave%20%7C%20Edge-orange">
  <img alt="Languages" src="https://img.shields.io/badge/UI-English%20%7C%20Espa%C3%B1ol-8a2be2">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green">
  <a href="https://ko-fi.com/jasdanjc"><img alt="Ko-fi" src="https://img.shields.io/badge/Ko--fi-support-FF5E5B?logo=kofi&logoColor=white"></a>
</p>

<p align="center">
  <a href="#installation"><b>Installation</b></a> ·
  <a href="#features"><b>Features</b></a> ·
  <a href="#how-it-works"><b>How it works</b></a>
</p>

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Popup and search](#popup-and-search)
  - [Manager](#manager)
  - [Settings](#settings)
  - [Keyboard shortcuts](#keyboard-shortcuts)
- [How it works](#how-it-works)
- [Troubleshooting](#troubleshooting)
- [Privacy](#privacy)
- [Support](#support)
- [License](#license)

---

## Features

### Sessions
- **Save** the current window, all windows or only the selected tabs as a named session.
- **Restore** in a new window or the current one. Tab groups (name, color, collapsed state) and pinned tabs are recreated.
- **Lazy restore**: restored tabs show a lightweight placeholder and only load when you open them, so restoring 50 tabs doesn't freeze the browser.
- **Edit** sessions: rename, replace with the current window, add the current tab, remove single tabs, merge sessions, pin favorites, export as HTML.

### Automatic grouping (native tab groups)
- **Rules**: tabs whose address matches your patterns go to a named, colored group (e.g. *University* → `campus.example.edu`, `moodle.example.edu`).
- **Smart mode**: when a window has N tabs of the same site, they are grouped automatically.
- **Group now** button to organize a messy window in one click.
- Groups you create by hand are never touched. Tabs opened from a grouped tab join its group natively.

### Cleanup
- **Auto-archive**: tabs unused for X days are closed and saved in the **Archive** instead of being lost. Pinned tabs, grouped tabs and whitelisted sites can be excluded.
- **Duplicates**: detected and marked; close them all in one click, or let TabNest switch to the existing tab when you open a duplicate.
- **Hibernation**: free memory from inactive tabs (manually, per group or automatically after X minutes) without closing them.

### Search and recovery
- **Global search** (`Ctrl+Shift+K`) across open tabs and every saved session, archive and backup. Use ↑ ↓ and Enter.
- **Automatic backups** of all windows every few minutes (only when something changed).
- **Previous browser session**: after a crash or an accidental close, the last backup is offered on the next start.

### Manager and statistics
- Full manager in the **side panel** (or a tab): open tabs by window and group, sessions, archive, backups and statistics.
- Statistics: open tabs, windows, hibernated and duplicate tabs, 7-day history, most-open sites.

### Import / export
- Export everything as **JSON** (backup) or **HTML** (clickable links).
- Import from **TabNest JSON**, **OneTab** exports, **Session Buddy / Tab Session Manager** JSON and plain lists of URLs.

### Language
- Interface in **English** and **Spanish**, selectable in Settings (or automatic from the browser).

---

## Installation

**Requirements:** a desktop Chromium browser, version 121 or newer (Chrome, Brave, Edge, Opera, Vivaldi).

TabNest is not on the Chrome Web Store yet, so it is installed as an *unpacked extension*:

1. **Download** this repository: green **Code** button → **Download ZIP**, then extract it.
2. Open your browser's extensions page: `chrome://extensions` · `brave://extensions` · `edge://extensions`
3. Enable **Developer mode** (top-right corner).
4. Click **Load unpacked** and select the **`extension`** folder.
5. The settings page opens. Choose your language and review the options.
6. *(Optional)* Pin TabNest: puzzle-piece icon → pin **TabNest**.

> [!IMPORTANT]
> Don't delete or move the extracted folder: the browser loads the extension from it.

**Updating:** download the new version, replace the folder's contents and click ↻ (*Reload*) on the extension's card. Your sessions and settings are kept.

---

## Usage

### Popup and search
Click the TabNest icon (or press `Ctrl+Shift+K`):

| Element | What it does |
|---|---|
| Search box | Type to search open tabs and saved sessions. Enter opens the first result. |
| **Save window** / ⋯ | Save the window, all windows or the selected tabs. |
| **Auto-group now** | Group the current window using your rules + same-site tabs. |
| **Close duplicates (N)** | Close every duplicate tab, keeping the most recently used copy. |
| **Hibernate inactive tabs** | Free the memory of every tab except the active ones. |
| Recent sessions | Click one to restore it. |
| ▣ / ⚙ | Open the manager / settings. |

### Manager
Open it from the popup or with `Alt+Shift+M`. It opens in the browser's side panel (or in a tab if the side panel is not available).

| Section | Contents |
|---|---|
| **Open tabs** | Every window with its groups and tabs. Tags show *pinned*, *playing*, *hibernated* and *duplicate*. Hover a tab or group to archive, hibernate or close it. Click to jump to a tab. |
| **Sessions** | Saved sessions with filter and sorting. Expand one to see and edit its tabs; ⋮ for every action. |
| **Archive** | Tabs closed by auto-archive or archived by hand. Click to reopen (it leaves the archive). |
| **Backups** | *Previous browser session* and the automatic backups. Restore or save one as a session. |
| **Statistics** | Numbers, 7-day history and most-open sites. |

### Settings

| Setting | Default |
|---|---|
| Language | Automatic |
| Lazy restore · Recreate groups · Restore target | On · On · New window |
| Backup every · Backups kept | 5 min · 12 |
| Grouping mode · Same-site threshold · Rules | Only my rules · 4 tabs · none |
| Auto-archive after · exclude pinned · exclude grouped · whitelist | Off (7 days) · On · Off · empty |
| Switch to existing tab on duplicate · Ignore `#` | Off · On |
| Hibernate after | Off (60 min) |

Rule patterns: `github.com` (site and subdomains), `*.google.com`, `campus.example.edu/courses/*` (path prefix).

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+K` | Open the popup with search |
| `Alt+Shift+S` | Save the current window |
| `Alt+Shift+M` | Open the manager |
| *(unassigned)* | Close duplicates |

Change them at `chrome://extensions/shortcuts`.

---

## How it works

| Topic | Details |
|---|---|
| **Platform** | Manifest V3. A service worker handles tab events and alarms (backups every N minutes, maintenance every 15 minutes, statistics every hour). |
| **Storage** | `chrome.storage.local` with `unlimitedStorage`. Each session is its own key, so pages never overwrite each other's changes. |
| **Lazy restore** | Restored tabs open an internal placeholder page that shows the title and favicon and navigates to the real address only when the tab becomes visible. Saving a window that still has placeholders stores the real addresses. |
| **Groups** | Uses `chrome.tabGroups`. Only ungrouped, unpinned tabs are moved. |
| **Idle time** | Uses each tab's `lastAccessed` time (Chromium 121+). |
| **Hibernation** | `chrome.tabs.discard`: the tab stays in the tab strip and reloads when selected. Active and audio-playing tabs are skipped. |
| **Favicons** | Read from the browser's favicon cache (`favicon` permission). No network requests. |

**Permissions:** `tabs`, `tabGroups`, `storage`, `unlimitedStorage`, `alarms`, `sidePanel`, `favicon`. No host permissions: TabNest cannot read or change the content of any web page.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| The manager opens in a tab instead of the side panel | Your browser doesn't support the extension side panel. Everything works the same in the tab. |
| A restored tab shows "Click or select this tab to load it" | That's lazy restore. Select the tab and it loads. Disable *Lazy restore* in Settings if you prefer. |
| Tabs aren't grouped automatically | Check *Grouping mode* is not *Off*, and that your rule patterns match (e.g. `github.com`, not `https://github.com/`). Tabs already in a group are never moved. |
| Auto-archive closed a tab I needed | Open **Archive** and click it. Add the site to the whitelist to protect it. |
| Shortcut doesn't work | Another extension may use it. Change it at `chrome://extensions/shortcuts`. |

---

## Privacy

All data (sessions, archive, backups, statistics, settings) is stored **only in your browser**. TabNest makes no network requests, has no analytics and cannot access page contents.

---

## Support

TabNest is free and open source. If it saves you from tab chaos, you can support its development:

<p align="center">
  <a href="https://ko-fi.com/jasdanjc"><img alt="Support me on Ko-fi" src="https://storage.ko-fi.com/cdn/kofi3.png?v=6" height="40"></a>
</p>

Bug reports and ideas are welcome in [Issues](https://github.com/DanowoJC/tabnest/issues).

---

## License

Distributed under the [MIT License](LICENSE). © 2026 DanowoJC
