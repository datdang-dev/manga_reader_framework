/**
 * STORY MANIFEST: Zutto Shinjiteru
 * Configuration for the Manga/Novel Reader
 */
const STORY_MANIFEST = {
    id: "zutto_shinjiteru_corruption",
    title: "Zutto Shinjiteru - I've Always Believed In You",
    author: "Refined by Celia",
    description: "The complete fall of Haruka, from a top athlete to a broken, semen-filled toy. A story of absolute corruption and duality.",
    thumbnail: "manga/thumb.webp",
    tags: ["NTR", "Gangbang", "Corruption", "Public/Exhibition", "Ahegao"],
    
    totalScenes: 38,
    imageExtension: ".webp",
    
    paths: {
        mangaImages: "manga/",
        novelText: "novel/"
    },
    
    theme: {
        primaryColor: "#ff006e",
        secondaryColor: "#0a0a0a",
        intensityIcons: [
            { threshold: 0, icon: "🌸", label: "Pure" },
            { threshold: 10, icon: "💧", label: "Dripping" },
            { threshold: 30, icon: "🔥", label: "Heating" },
            { threshold: 50, icon: "🔞", label: "Corrupted" },
            { threshold: 75, icon: "😈", label: "Toy Status" },
            { threshold: 95, icon: "💥", label: "Total Ego Death" }
        ]
    }
};
