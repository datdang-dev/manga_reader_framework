/**
 * Manga Library - Discovery & Progress Engine
 * Handles manga discovery, progress tracking, and library display
 */

const LIBRARY_CONFIG = {
    storiesPath: 'story/',           // Current structure uses 'story' folder
    storagePrefix: 'manga_reader_',
    defaultThumbnail: null,
    readerPath: 'index.html'         // Direct reader access
};

// Storage helper
const Storage = {
    getProgress(mangaId) {
        try {
            const data = localStorage.getItem(`${LIBRARY_CONFIG.storagePrefix}${mangaId}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('Failed to read progress:', e);
            return null;
        }
    },
    
    setProgress(mangaId, progress) {
        try {
            localStorage.setItem(`${LIBRARY_CONFIG.storagePrefix}${mangaId}`, JSON.stringify(progress));
        } catch (e) {
            console.warn('Failed to save progress:', e);
        }
    },
    
    getAllProgress() {
        const progress = {};
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(LIBRARY_CONFIG.storagePrefix)) {
                    const mangaId = key.replace(LIBRARY_CONFIG.storagePrefix, '');
                    progress[mangaId] = JSON.parse(localStorage.getItem(key));
                }
            }
        } catch (e) {
            console.warn('Failed to read all progress:', e);
        }
        return progress;
    }
};

// Library Manager
const Library = {
    mangas: [],
    progressData: {},
    
    async init() {
        this.showLoading(true);
        this.progressData = Storage.getAllProgress();
        
        // Load manga list from registry
        await this.loadMangaRegistry();
        
        this.showLoading(false);
        this.render();
        this.updateStats();
    },
    
    async loadMangaRegistry() {
        // Try to load manga registry
        try {
            const response = await fetch('stories/registry.json');
            if (response.ok) {
                const registry = await response.json();
                this.mangas = registry.mangas || [];
                return;
            }
        } catch (e) {
            console.log('No registry found, using fallback discovery');
        }
        
        // Fallback: Check predefined folders
        await this.discoverMangas();
    },
    
    async discoverMangas() {
        // Load manifest from story/ folder directly (current structure)
        try {
            const response = await fetch('story/manifest.js');
            if (response.ok) {
                const text = await response.text();
                const manifest = this.parseManifest(text);
                if (manifest) {
                    manifest._folder = 'current';  // Mark as current story
                    this.mangas.push(manifest);
                }
            }
        } catch (e) {
            console.log('No manifest found in story/ folder');
        }
    },
    
    parseManifest(jsContent) {
        // Extract STORY_MANIFEST object from JS file
        try {
            // Simple extraction - look for the object literal
            const match = jsContent.match(/const\s+STORY_MANIFEST\s*=\s*(\{[\s\S]*?\});/);
            if (match) {
                // Use Function constructor to safely evaluate the object
                const func = new Function(`return ${match[1]}`);
                return func();
            }
        } catch (e) {
            console.warn('Failed to parse manifest:', e);
        }
        return null;
    },
    
    getProgressInfo(manga) {
        const id = manga.id || manga._folder;
        const saved = this.progressData[id];
        
        if (!saved) {
            return { 
                currentPage: 0, 
                totalPages: manga.totalScenes || 0, 
                percent: 0, 
                status: 'new' 
            };
        }
        
        const total = manga.totalScenes || 1;
        const current = saved.currentPage || 0;
        const percent = Math.round((current / total) * 100);
        
        let status = 'reading';
        if (current === 0) status = 'new';
        else if (current >= total - 1) status = 'completed';
        
        return { currentPage: current, totalPages: total, percent, status };
    },
    
    showLoading(show) {
        const loading = document.getElementById('loading');
        const grid = document.getElementById('manga-grid');
        
        if (loading) loading.style.display = show ? 'flex' : 'none';
        if (grid) grid.style.display = show ? 'none' : 'grid';
    },
    
    render() {
        const grid = document.getElementById('manga-grid');
        if (!grid) return;
        
        if (this.mangas.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">📚</div>
                    <h3 class="empty-state-title">No Manga Found</h3>
                    <p class="empty-state-text">Add manga folders to the 'stories' directory</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.mangas.map(manga => this.renderCard(manga)).join('');
        
        // Attach click handlers
        grid.querySelectorAll('.manga-card').forEach((card, index) => {
            card.addEventListener('click', () => this.openReader(this.mangas[index]));
        });
    },
    
    renderCard(manga) {
        const progress = this.getProgressInfo(manga);
        const folder = manga._folder || manga.id || 'unknown';
        
        let thumbnailPath;
        if (manga._folder === 'current') {
            thumbnailPath = manga.thumbnail;
        } else {
            thumbnailPath = manga.thumbnail 
                ? `stories/${folder}/${manga.thumbnail}`
                : null;
        }
        
        let progressBadgeClass = '';
        let progressBadgeText = '';
        
        if (progress.status === 'new') {
            progressBadgeClass = 'new';
            progressBadgeText = 'NEW';
        } else if (progress.status === 'completed') {
            progressBadgeClass = 'completed';
            progressBadgeText = '✓ DONE';
        } else {
            progressBadgeText = `${progress.percent}%`;
        }
        
        const tagsHtml = (manga.tags || []).slice(0, 3).map(tag => 
            `<span class="tag">${tag}</span>`
        ).join('');
        
        return `
            <article class="manga-card" data-folder="${folder}">
                <div class="card-thumbnail">
                    ${thumbnailPath 
                        ? `<img src="${thumbnailPath}" alt="${manga.title}" loading="lazy">`
                        : `<div class="card-thumbnail-placeholder">
                            <span class="icon">📖</span>
                            <span>No Cover</span>
                           </div>`
                    }
                    <span class="progress-badge ${progressBadgeClass}">${progressBadgeText}</span>
                </div>
                <div class="card-overlay">
                    <button class="btn-read">
                        ${progress.status === 'new' ? '▶ Start Reading' : '▶ Continue'}
                    </button>
                </div>
                <div class="card-info">
                    <h3 class="card-title">${manga.title || 'Untitled'}</h3>
                    <p class="card-author">by ${manga.author || 'Unknown'}</p>
                    <div class="card-meta">
                        <span class="card-pages">📄 ${manga.totalScenes || 0} pages</span>
                    </div>
                    ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
                    <div class="card-progress">
                        <div class="card-progress-fill" style="width: ${progress.percent}%"></div>
                    </div>
                </div>
            </article>
        `;
    },
    
    updateStats() {
        const totalManga = this.mangas.length;
        const completed = this.mangas.filter(m => 
            this.getProgressInfo(m).status === 'completed'
        ).length;
        const inProgress = this.mangas.filter(m => 
            this.getProgressInfo(m).status === 'reading'
        ).length;
        
        const statTotalEl = document.getElementById('stat-total');
        const statCompletedEl = document.getElementById('stat-completed');
        const statReadingEl = document.getElementById('stat-reading');
        
        if (statTotalEl) statTotalEl.textContent = totalManga;
        if (statCompletedEl) statCompletedEl.textContent = completed;
        if (statReadingEl) statReadingEl.textContent = inProgress;
    },
    
    openReader(manga) {
        // Navigate to reader directly (current structure)
        // Pass manga id for progress tracking
        const mangaId = manga.id || 'default';
        window.location.href = `index.html?manga=${encodeURIComponent(mangaId)}`;
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Library.init();
});
