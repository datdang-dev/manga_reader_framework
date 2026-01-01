# Manga Reader Framework

A customizable, web-based framework for creating immersive R18 Light Novel & Manga experiences.

## Features
- **Dual-Panel Reader**: Split view for Light Novel text and Manga pages.
- **Library System**: Built-in launcher to browse and manage multiple stories.
- **Progress Tracking**: LocalStorage-based reading progress persistence.
- **Immersive UI**: Black-pink aesthetic with animations, stats, and sidebar navigation.
- **Mobile Responsive**: Optimized for both desktop and touch devices.

## Quick Start

1.  **Prepare your data**:
    *   Place manga images in `assets/manga/` (named `1.webp`, `2.webp`, etc.).
    *   (Optional) Place novel text files in `assets/novel/` (named `1.md`, `2.md`, etc.).

2.  **Configure Manifest**:
    *   Rename `story/manifest_example.js` to `story/manifest.js`.
    *   Update the `STORY_MANIFEST` object with your story details (title, pages, ID).

3.  **Run the Reader**:
    *   Execute `python server.py` to start the local server.
    *   Open `http://localhost:8000/launcher.html` to view the library.
    *   Or open `http://localhost:8000/index.html` to read directly.

## Customization
See `INTEGRATION_GUIDELINE.md` for detailed instructions on adding new stories, customizing themes, and advanced configuration.
