# Public Assets

This directory contains static assets that are copied directly to the extension's root directory during build.

## _locales

The `_locales` directory contains internationalization (i18n) files for the Chrome extension.

**Important**: These files are copied from `src/assets/_locales/` and should be kept in sync.

- **Source**: `src/assets/_locales/`
- **Build output**: `.output/chrome-mv3/_locales/`

### Structure

```
_locales/
├── en/
│   └── messages.json       # English translations
└── zh_CN/
    └── messages.json       # Chinese (Simplified) translations
```

### Updating translations

To update translations:

1. Edit the source files in `src/assets/_locales/`
2. Run `cp -r src/assets/_locales public/` to sync to public/
3. Or let the build process handle it automatically (if configured)

### Adding new languages

1. Create a new directory under `src/assets/_locales/` (e.g., `ja/` for Japanese)
2. Copy `messages.json` from an existing locale and translate
3. Sync to `public/_locales/`
4. Rebuild the extension

For more information about Chrome extension i18n, see:
https://developer.chrome.com/docs/extensions/reference/api/i18n
