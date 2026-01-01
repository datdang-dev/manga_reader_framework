/**
 * Manga Library - Discovery & Progress Engine
 * Handles manga discovery, progress tracking, and library display
 */

const LIBRARY_CONFIG = {
    assetsPath: 'assets/',
    registryFile: 'assets/registry.json',
    storagePrefix: 'manga_reader_',
    readerPath: 'index.html'
};

// Storage Helper for Progress Tracking
const Storage = {
    getAllProgress() {
        const allProgress = {};
        const prefix = LIBRARY_CONFIG.storagePrefix;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                try {
                    const mangaId = key.replace(prefix, '');
                    const data = JSON.parse(localStorage.getItem(key));
                    allProgress[mangaId] = data;
                } catch (e) {
                    console.warn(`Failed to parse storage for ${key}`);
                }
            }
        }
        return allProgress;
    },
    
    getProgress(mangaId) {
        try {
            const data = localStorage.getItem(LIBRARY_CONFIG.storagePrefix + mangaId);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
};

// Library Manager
const Library = {
    mangas: [],
    progressData: {},
    
    async init() {
        try {
            this.showLoading(true);
            this.progressData = Storage.getAllProgress();
            
            // Load manga list from registry
            await this.loadMangaRegistry();
            
            this.showLoading(false);
            this.render();
            this.updateStats();
        } catch (error) {
            console.error('Library Initialization failed:', error);
            this.showError('System load failed. Please refresh or check connection.');
        }
    },
    
    async loadMangaRegistry() {
        try {
            const response = await fetch(LIBRARY_CONFIG.registryFile);
            if (response.ok) {
                const registry = await response.json();
                const discoveryPromises = registry.mangas.map(m => this.loadSingleManga(m.folder));
                const results = await Promise.all(discoveryPromises);
                this.mangas = results.filter(m => m !== null);
            }
        } catch (e) {
            console.error('Failed to load registry:', e);
            // Fallback: Check example folder if registry fails
            await this.discoverMangas();
        }
    },

    async loadSingleManga(folder) {
        try {
            const response = await fetch(`${LIBRARY_CONFIG.assetsPath}${folder}/manifest.js`);
            if (response.ok) {
                const text = await response.text();
                const manifest = this.parseManifest(text);
                if (manifest) {
                    manifest._folder = folder;
                    return manifest;
                }
            }
        } catch (e) {
            console.warn(`Failed to load manifest for ${folder}`);
        }
        return null;
    },
    
    async discoverMangas() {
        // Fallback for demo
        const demo = await this.loadSingleManga('framework_example_prologue');
        if (demo) this.mangas.push(demo);
    },
    
    parseManifest(jsContent) {
        try {
            const match = jsContent.match(/const\s+STORY_MANIFEST\s*=\s*(\{[\s\S]*?\});/);
            if (match) {
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
                    <p class="empty-state-text">Check assets/registry.json and subfolders</p>
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
        const folder = manga._folder;
        
        let thumbnailPath = manga.thumbnail;
        if (thumbnailPath && !thumbnailPath.startsWith('http') && !thumbnailPath.startsWith('assets/')) {
            thumbnailPath = `${LIBRARY_CONFIG.assetsPath}${folder}/${manga.thumbnail}`;
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
        const folder = manga._folder;
        window.location.href = `index.html?manga=${encodeURIComponent(folder)}`;
    },
    
    showError(msg) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">⚠️</div>
                    <h3 class="empty-state-title">Loading Error</h3>
                    <p class="empty-state-text">${msg}</p>
                    <button onclick="location.reload()" class="btn-read" style="margin-top:20px">Retry</button>
                </div>
            `;
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Library.init();
});
