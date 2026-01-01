# Integration Guideline

This document provides instructions for developers to integrate content into the Manga Reader Framework.

## Directory Structure

```
manga_reader_framework/
├── assets/
│   ├── manga/          # Place your manga page images here
│   └── novel/          # Place your markdown text files here
├── story/
│   └── manifest.js     # Your configuration file (start from manifest_example.js)
├── index.html          # Main reader app
├── launcher.html       # Library launcher
└── ...
```

## Adding a Story

The framework currently supports a "Single Story Mode" by default via `story/manifest.js`.

### 1. Asset Preparation
*   **Images**: Name your files sequentially: `1.webp`, `2.webp`, ... `N.webp`.
    *   Supported extensions: `.webp`, `.jpg`, `.png` (configure in manifest).
*   **Text**: Use Markdown format. Name files sequentially: `1.md`, `2.md`...
    *   Text matches the image number (e.g., `1.md` corresponds to `1.webp`).

### 2. Manifest Configuration
Create `story/manifest.js` with the following structure:

```javascript
const STORY_MANIFEST = {
    id: "my_manga_01",         // Unique ID for save data
    title: "My Awesome Manga",
    author: "Developer Name",
    totalScenes: 25,           // Total number of pages
    imageExtension: ".webp",   // Image file type
    paths: {
        mangaImages: "assets/manga/",
        novelText: "assets/novel/"
    },
    // ... metadata for library
    description: "Story description...",
    thumbnail: "assets/manga/thumb.webp",
    tags: ["tag1", "tag2"]
};
```

## Advanced: Multiple Stories

To support multiple stories in the library:

1.  Create a `stories/` directory.
2.  Create subfolders for each story (e.g., `stories/manga_a/`, `stories/manga_b/`).
3.  Place `manifest.js` and `assets/` inside each subfolder.
4.  Update `library.js` to fetch from a registry or discover folders (requires custom implementation or existing `stories/registry.json`).

*Note: The default `library.js` is configured to look for `story/manifest.js` for quick setup.*

## Theming

You can customize the accent colors in `manifest.js`:

```javascript
theme: {
    primaryColor: "#ff4081",
    secondaryColor: "#121212"
}
```

This will update the reader's buttons, progress bars, and highlights.
