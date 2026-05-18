import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'vacancy-kit',
  description: 'AI helpers for hh.ru and rabota.by — cover letters, resume audit, match score.',
  version: pkg.version,
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'vacancy-kit',
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: [
        'https://*.hh.ru/*',
        'https://hh.ru/*',
        'https://*.rabota.by/*',
        'https://rabota.by/*',
      ],
      js: ['src/content/index.tsx'],
      run_at: 'document_idle',
    },
  ],
  permissions: ['storage', 'activeTab'],
  host_permissions: [
    'https://*.hh.ru/*',
    'https://*.rabota.by/*',
  ],
})
