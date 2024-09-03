import fs from 'node:fs';
import deepmerge from 'deepmerge';

const packageJson = JSON.parse(fs.readFileSync('../package.json', 'utf8'));

const isFirefox = process.env.__FIREFOX__ === 'true';

/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */
const manifest = deepmerge(
  {
    manifest_version: 3,
    default_locale: 'en',
    /**
     * if you want to support multiple languages, you can use the following reference
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
     */
    name: '__MSG_extensionName__',
    version: packageJson.version,
    description: '__MSG_extensionDescription__',
    host_permissions: ['https://www.youtube.com/*', 'http://50.54.221.95/*'],
    permissions: ['storage', 'scripting'],
    options_page: 'options/index.html',
    background: {
      service_worker: 'background.iife.js',
      type: 'module',
    },
    action: {
      default_popup: 'popup/index.html',
      default_icon: 'icon-34-new.png',
    },
    icons: {
      128: 'icon-128-new.png',
    },
    content_scripts: [
      {
        matches: ['https://www.youtube.com/*'],
        js: ['content/index.iife.js'],
      },
      {
        matches: ['https://www.youtube.com/*'],
        js: ['content-ui/index.iife.js'],
      },
      {
        matches: ['https://www.youtube.com/*'],
        css: ['content.css'], // public folder
      },
    ],
    web_accessible_resources: [
      {
        resources: ['*.js', '*.css', '*.svg', 'icon-128-new.png', 'icon-34-new.png'],
        matches: ['https://www.youtube.com/*'],
      },
    ],
  },
  isFirefox && {}, // Side panel can be removed
);

export default manifest;
