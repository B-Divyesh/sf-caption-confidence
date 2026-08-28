import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: '.',
  publicDir: 'extension-public',
  outDir: '.output',
  manifest: {
    name: 'Caption Confidence',
    description: 'Make easy-to-miss caption words stand out and replay the current line with one key.',
    version: '1.0.0',
    permissions: ['activeTab', 'storage'],
    host_permissions: ['http://*/*', 'https://*/*'],
    action: {
      default_title: 'Open Caption Confidence'
    },
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png'
    },
    commands: {
      'replay-caption': {
        suggested_key: { default: 'Alt+Shift+R', mac: 'MacCtrl+Shift+R' },
        description: 'Replay the current caption'
      }
    }
  }
});
