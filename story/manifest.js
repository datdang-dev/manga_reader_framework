/**
 * STORY_MANIFEST
 * Configuration for the Manga/Novel Reader
 */

const STORY_MANIFEST = {
    id: 'framework_example_prologue',
    title: 'The Crimson Prologue',
    description: 'An example story to demonstrate the Manga Reader Framework capabilities.',
    author: 'Celia x Onii-chan',
    totalScenes: 1,
    imageExtension: '.png',
    thumbnail: 'assets/manga/thumb.png',
    tags: ['Romance', 'Sci-Fi', 'Ecchi', 'Example'],
    
    // Path configuration
    paths: {
        mangaImages: 'assets/manga/',
        novelText: 'assets/novel/'
    },

    // Theme & UI Customization
    theme: {
        accentColor: '#ff4081',
        intensityIcons: [
            { threshold: 0, icon: '🌸', label: 'Sweet' },
            { threshold: 30, icon: '🔥', label: 'Warm' },
            { threshold: 60, icon: '😈', label: 'Intense' },
            { threshold: 90, icon: '💥', label: 'Climax' }
        ]
    }
};
