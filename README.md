# Bastion Extension

Bastion Extension is a Chrome extension designed to block certain YouTube videos based on video IDs under categories selected by users. It is built using React, TypeScript, and Vite, focusing on a fast and efficient development experience.

## Project Structure

### ChromeExtension

Main app with background script, manifest:

- `manifest.js` - manifest for the Chrome extension.
- `lib/background` - background script for the Chrome extension (`background.service_worker` in `manifest.json`).
- `public/content.css` - content CSS for user page injection.

### Packages

Some shared packages:

- `dev-utils` - utilities for Chrome extension development (manifest-parser, logger).
- `hmr` - custom HMR plugin for Vite, injection script for reload/refresh, HMR dev-server.
- `shared` - shared code for the entire project (types, constants, custom hooks, components, etc.).
- `tsconfig` - shared tsconfig for the entire project.

### Pages

- `content` - content script for Chrome extension (`content_scripts` in `manifest.json`).
- `content-ui` - content script for rendering UI in the user's page (`content_scripts` in `manifest.json`).
- `devtools` - devtools for Chrome extension (`devtools_page` in `manifest.json`).
- `devtools-panel` - devtools panel for `devtools`.
- `newtab` - new tab for Chrome extension (`chrome_url_overrides.newtab` in `manifest.json`).
- `options` - options page for Chrome extension (`options_page` in `manifest.json`).
- `popup` - popup for Chrome extension (`action.default_popup` in `manifest.json`).
- `sidepanel` - sidepanel for Chrome extension (`side_panel.default_path` in `manifest.json`).
