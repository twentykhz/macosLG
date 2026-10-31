# MAC-WebOSTV 3.6.36

- Reduce blur, shadows and animation; clip dock rendering and reduce background work while hidden. Fix multiline HOME observer messages.
- Keep wallpaper slideshow, preloading the next image 5 seconds before its deadline. A 5-second interval preloads immediately. Late downloads retain the current image until ready; hidden launchers release spare images.
- Display one or two weather locations using the settings page or launcher count button. The second configured location is retained when hidden.
- Use the pencil beside the dock, the green remote key, or Right from the last app to add/remove shortcuts and Save. Selections survive reopening and upgrades. This does not uninstall or unlock debloated apps. Existing long-OK ordering remains available.
- Retain existing root, YouTube AdFree, LGWS, backup and rollback workflows.

This release updates GitHub installers only. The current TV was not contacted or changed. Automated tests and local browser fixtures validate the changes; this release has not been deployed to a physical TV.
