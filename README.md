# Bastion Extension

Bastion Extension is a Chrome extension designed to block certain YouTube videos based on video IDs under categories selected by users. It is built using modern web technologies with a focus on speed and efficiency during development.

## Technologies Used

- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A statically typed superset of JavaScript that adds type safety to your code.
- **Vite**: A fast build tool and development server for modern web projects.
- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom user interfaces.
- **Turborepo**: A high-performance build system for JavaScript and TypeScript codebases.
- **MUI**: A popular React UI framework that implements Google's Material Design.
- **NextUI**: A modern, beautiful, and fast UI library for React.

## Project Structure

### ChromeExtension

Main app with background script and manifest:

- `manifest.js` - Manifest file for the Chrome extension.
- `lib/background` - Background script for the Chrome extension (`background.service_worker` in `manifest.json`).
- `public/content.css` - Content CSS for injecting styles into the user's page.

### Packages

Some shared packages:

- `dev-utils` - Utilities for Chrome extension development, including manifest parsing and logging.
- `hmr` - Custom HMR (Hot Module Replacement) plugin for Vite, including injection scripts for reload/refresh and a dev server.
- `shared` - Shared code for the entire project, including types, constants, custom hooks, and components.
- `tsconfig` - Shared TypeScript configuration for the entire project.

### Pages

Different components of the extension:

- `content` - Content script for the Chrome extension (`content_scripts` in `manifest.json`).
- `content-ui` - Content script for rendering UI elements in the user's page (`content_scripts` in `manifest.json`).
- `devtools` - DevTools extension page for Chrome (`devtools_page` in `manifest.json`).
- `devtools-panel` - Panel for DevTools.
- `newtab` - New tab override for Chrome (`chrome_url_overrides.newtab` in `manifest.json`).
- `options` - Options page for configuring the extension (`options_page` in `manifest.json`).
- `popup` - Popup page for the Chrome extension (`action.default_popup` in `manifest.json`).
- `sidepanel` - Sidepanel for Chrome extension (`side_panel.default_path` in `manifest.json`).