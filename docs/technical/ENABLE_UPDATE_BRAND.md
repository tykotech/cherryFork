# Re-enabling Update and Branding Features

This document explains how to re-enable the update and branding features that have been disabled in this fork.

## Disabled Features

The following features have been disabled in the UI:

1. **Update Check** - Automatic and manual update checking
2. **Auto Update** - Automatic downloading and installation of updates
3. **Release Notes** - Viewing release notes and changelogs
4. **Official Website** - Link to the official website
5. **Feedback** - Submitting feedback or issues
6. **License** - Viewing the software license
7. **Contact** - Contacting support
8. **Debug** - Developer tools and debugging options

## How to Re-enable Features

To re-enable these features, you'll need to modify the source code. Follow these steps:

1. Open the file `src/renderer/src/pages/settings/AboutSettings.tsx`
2. Remove or comment out the following lines that disable the features:
   - The `disabled` prop from all Buttons
   - The `checked={false}` and `disabled` props from the Switch component
   - The Tooltip components that show the disabled message
3. Uncomment or restore the original functionality in the component

### Example for Re-enabling a Button

Change this:
```tsx
<Button disabled>{t('settings.about.website.button')}</Button>
```

Back to this:
```tsx
<Button onClick={() => onOpenWebsite('https://cherry-ai.com')}>
  {t('settings.about.website.button')}
</Button>
```

### Example for Re-enabling the Update Check

Change this:
```tsx
<Switch checked={false} disabled />
```

Back to this:
```tsx
<Switch value={autoCheckUpdate} onChange={(v) => setAutoCheckUpdate(v)} />
```

## Restoring Original Functionality

To fully restore all original functionality, you'll also need to:

1. Uncomment and restore the original handler functions at the top of the component
2. Re-add any imports that were removed
3. Restore the version checking logic

## Important Notes

- Re-enabling these features will restore connections to the original update servers and websites
- Make sure you have the necessary permissions to modify the application
- Consider the security implications of re-enabling automatic updates
- Remember to rebuild the application after making these changes

## Support

If you need assistance with re-enabling these features, please refer to the original project's documentation or support channels.
