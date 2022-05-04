# Simple Image Viewer

### Features
* No false positives. Detects image tabs in the same way as the browser.
* No flicker. Loads before the default viewer.
* No appearance changes. It can be changed by other extensions.
* Changing the fitting type stretches small images.
* Resizing the window centers the image.
* Zoom both to the window center and to the cursor.
* Integration into the default zoom system. Doesn't affect the page's origin.
* Panning uses scrollbars.
* Support for custom passive scrollbars.

### Shortcuts
* [R] - Rotate CW 90 degrees
* [Shift]+[R] - Rotate CCW 90 degrees
* [1] - Actual size
* [2] - Fill (Cover)
* [3] - Fit
* [LMB drag] - Panning

### To do
* Improve relative scroll rounding.
* Migrate to TypeScript. Make *script.js* compileable.
* Migrate to MV3. [[1]](https://crbug.com/1219825)
* Shortcuts settings.
