/**
 * STORY MANIFEST TEMPLATE
 * Copy this file to manifest.js and configure your story data.
 */
const STORY_MANIFEST = {
    // Unique identifier for your manga (used for progress tracking)
    id: "manga_unique_id",
    
    // Display metadata
    title: "Your Manga Title",
    author: "Author Name",
    description: "Brief description of the manga...",
    thumbnail: "assets/manga/cover.jpg", // Path to cover image
    tags: ["tag1", "tag2", "tag3"],
    
    // Content configuration
    totalScenes: 10, // Total number of pages/scenes
    imageExtension: ".webp", // Extension of manga images
    
    // Path configuration
    paths: {
        mangaImages: "assets/manga/", // Directory containing 1.webp, 2.webp...
        novelText: "assets/novel/"    // Directory containing 1.md, 2.md... (if using novel mode)
    },
    
    // Theme configuration
    theme: {
        primaryColor: "#ff4081", // Accent color
        secondaryColor: "#121212", // Background color
        
        // Intensity/Progress icons (optional)
        intensityIcons: [
            { threshold: 0, icon: "🙂", label: "Normal" },
            { threshold: 50, icon: "😳", label: "Intense" },
            { threshold: 100, icon: "🥵", label: "Climax" }
        ]
    }
};
