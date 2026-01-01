/**
 * Manga Novel Reader - Generic Engine
 * Loads content based on 'story/manifest.js'
 */

// Check if manifest is loaded
if (typeof STORY_MANIFEST === 'undefined') {
    console.error("CRITICAL: STORY_MANIFEST not found. Please ensure 'story/manifest.js' is loaded.");
    alert("Error: Story Manifest missing.");
}

const CONFIG = {
    mangaBasePath: STORY_MANIFEST.paths.mangaImages,
    pagesBasePath: STORY_MANIFEST.paths.novelText,
    totalPages: STORY_MANIFEST.totalScenes, 
    title: STORY_MANIFEST.title,
    imageExt: STORY_MANIFEST.imageExtension,
    mangaId: STORY_MANIFEST.id || 'default'
};

// Progress Storage Helper
const Progress = {
    storageKey: `manga_reader_${CONFIG.mangaId}`,
    
    save(pageIndex) {
        try {
            const data = {
                currentPage: pageIndex,
                totalPages: CONFIG.totalPages,
                lastRead: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save progress:', e);
        }
    },
    
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('Failed to load progress:', e);
            return null;
        }
    }
};

let pages = [];
let currentPageIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
    await init();
});

async function init() {
    const novelContent = document.getElementById('novel-content');
    novelContent.innerHTML = '<div style="padding:20px; text-align:center">Loading Data...</div>';

    await loadAllPages();
    
    if (pages.length === 0) {
        novelContent.innerHTML = 'Error: No pages found.';
        return;
    }

    renderAllPages();
    
    // Set Dynamic Title
    document.getElementById('chapter-title').textContent = CONFIG.title;
    document.title = CONFIG.title;

    // Load saved progress
    const savedProgress = Progress.load();
    let startPage = 0;
    
    if (savedProgress && savedProgress.currentPage > 0) {
        const resumePage = savedProgress.currentPage;
        if (resumePage < pages.length) {
            startPage = resumePage;
            console.log(`Resuming from page ${resumePage + 1}`);
        }
    }
    
    goToPage(startPage);
    attachEventListeners();
    console.log("Reader Initialized.");
}

async function loadAllPages() {
    pages = [];
    for (let i = 1; i <= CONFIG.totalPages; i++) {
        const textPad = String(i).padStart(3, '0');
        const imgRaw = i;

        try {
            const response = await fetch(`${CONFIG.pagesBasePath}${textPad}.md`);
            if (response.ok) {
                const markdown = await response.text();
                pages.push({
                    id: i,
                    pageRef: `${imgRaw}${CONFIG.imageExt}`, 
                    content: parseMarkdownToHTML(markdown),
                    raw: markdown
                });
            } else {
                console.warn(`Missing: ${textPad}.md`);
            }
        } catch (e) {
            console.error(e);
        }
    }
}

function parseMarkdownToHTML(markdown) {
    let content = markdown;

    // 1. EXTRACT "RESULT" ONLY
    const phase2Start = "## ✍️ PHASE 2: SENSORY PROSE";
    const memoryLogStart = "## 🧠 MEMORY UPDATE LOG";
    
    if (content.includes(phase2Start)) {
        const startIndex = content.indexOf(phase2Start) + phase2Start.length;
        const endIndex = content.includes(memoryLogStart) 
            ? content.indexOf(memoryLogStart) 
            : content.length;
        content = content.substring(startIndex, endIndex).trim();
    } 
    
    // 2. STYLING
    let html = content
        .replace(/<!--[\s\S]*?-->/g, '')
        // Dialogue
        .replace(/「([^」]+)」/g, '<div class="dialogue">「$1」</div>')
        // SFX
        .replace(/\*\*\*([^*]+)\*\*\*/g, '<div class="sfx">$1</div>')
        // Bold
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Narration *Text* -> Strip asterisks and wrap in p.narration
        .replace(/^\*([^*]+)\*$/gm, '<p class="narration">$1</p>')
        // Formatting
        .replace(/^#\s+(.+)$/gm, '') 
        .replace(/^[*-]{3,}$/gm, '<hr class="scene-divider">')
        .replace(/\n\n/g, '</p><p>')
        .trim();
    
    if (!html.startsWith('<')) html = '<p>' + html + '</p>';
    return html;
}

function renderAllPages() {
    const container = document.getElementById('novel-content');
    container.innerHTML = '';
    
    pages.forEach((page, index) => {
        const div = document.createElement('div');
        div.className = 'scene';
        div.dataset.index = index;
        div.innerHTML = `
            <div class="scene-ref">Page ${page.id}</div>
            ${page.content}
        `;
        div.addEventListener('click', () => goToPage(index));
        container.appendChild(div);
    });
}

function goToPage(index) {
    if (index < 0 || index >= pages.length) return;
    currentPageIndex = index;
    
    document.querySelectorAll('.scene').forEach((el, i) => {
        const isActive = i === index;
        el.classList.toggle('active', isActive);
        if (isActive) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    const img = document.getElementById('manga-image');
    img.src = CONFIG.mangaBasePath + pages[index].pageRef;
    
    document.getElementById('current-scene').textContent = index + 1;
    document.getElementById('total-scenes').textContent = pages.length;
    
    const pct = ((index + 1) / pages.length) * 100;
    document.querySelector('.intensity-fill').style.width = `${pct}%`;
    document.getElementById('intensity-value').textContent = `${Math.round(pct)}%`;

    // Update Intensity Icon/Label from Manifest
    if (STORY_MANIFEST.theme && STORY_MANIFEST.theme.intensityIcons) {
        const icons = STORY_MANIFEST.theme.intensityIcons;
        // Find the highest threshold that is less than or equal to current pct
        const currentLevel = icons.slice().reverse().find(level => pct >= level.threshold) || icons[0];
        
        const labelEl = document.querySelector('.intensity-label');
        if (labelEl && currentLevel) {
            labelEl.textContent = `${currentLevel.icon} ${currentLevel.label}`;
        }
    }
    
    // Save reading progress
    Progress.save(index);
    
    // Update page selector dropdown
    updatePageSelector(index);
}

function attachEventListeners() {
    // Navigation buttons
    document.getElementById('prev-btn').addEventListener('click', () => goToPage(currentPageIndex - 1));
    document.getElementById('next-btn').addEventListener('click', () => goToPage(currentPageIndex + 1));
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Skip if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        
        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            goToPage(currentPageIndex + 1);
        }
        if (e.key === 'ArrowLeft') goToPage(currentPageIndex - 1);
        if (e.key === 'Escape') handleEscapeKey();
        if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    });
    
    // Menu button
    document.getElementById('menu-btn').addEventListener('click', toggleSidebar);
    
    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) settingsBtn.addEventListener('click', toggleSettings);
    
    // Fullscreen button
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // View mode button
    const viewModeBtn = document.getElementById('view-mode-btn');
    if (viewModeBtn) viewModeBtn.addEventListener('click', cycleViewMode);
    
    // Page selector
    const pageSelect = document.getElementById('page-select');
    if (pageSelect) {
        pageSelect.addEventListener('change', (e) => {
            goToPage(parseInt(e.target.value));
        });
    }
    
    // Font size slider
    const fontSizeRange = document.getElementById('font-size-range');
    if (fontSizeRange) {
        fontSizeRange.addEventListener('input', (e) => {
            setFontSize(e.target.value);
        });
    }
    
    // Auto-scroll toggle
    const autoScrollToggle = document.getElementById('auto-scroll-toggle');
    if (autoScrollToggle) {
        autoScrollToggle.checked = true; // Default on
    }
    
    // Initialize page selector
    initPageSelector();
}

// ========================================
// UI CONTROL FUNCTIONS
// ========================================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.toggle('hidden');
    overlay.classList.toggle('hidden');
}

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.toggle('hidden');
    
    // Close sidebar if open
    const sidebar = document.getElementById('sidebar');
    if (!sidebar.classList.contains('hidden')) {
        toggleSidebar();
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen error:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

function handleEscapeKey() {
    // Close sidebar first
    const sidebar = document.getElementById('sidebar');
    if (!sidebar.classList.contains('hidden')) {
        toggleSidebar();
        return;
    }
    
    // Close settings modal
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal.classList.contains('hidden')) {
        toggleSettings();
        return;
    }
    
    // Toggle quick hide
    const quickHide = document.getElementById('quick-hide');
    if (quickHide) {
        quickHide.classList.toggle('hidden');
    }
}

// View Mode
let currentViewMode = 'split';

function setViewMode(mode) {
    currentViewMode = mode;
    const mainContent = document.querySelector('.main-content');
    
    // Remove all mode classes
    mainContent.classList.remove('novel-only', 'manga-only');
    
    // Add new mode class
    if (mode === 'novel') {
        mainContent.classList.add('novel-only');
    } else if (mode === 'manga') {
        mainContent.classList.add('manga-only');
    }
    
    // Update button states
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

function cycleViewMode() {
    const modes = ['split', 'novel', 'manga'];
    const currentIndex = modes.indexOf(currentViewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setViewMode(modes[nextIndex]);
}

// Font Size
function setFontSize(size) {
    const novelContent = document.querySelector('.novel-content');
    if (novelContent) {
        novelContent.style.fontSize = `${size}px`;
    }
    
    const fontSizeValue = document.getElementById('font-size-value');
    if (fontSizeValue) {
        fontSizeValue.textContent = `${size}px`;
    }
}

// Page Selector
function initPageSelector() {
    const pageSelect = document.getElementById('page-select');
    if (!pageSelect || pages.length === 0) return;
    
    pageSelect.innerHTML = '';
    pages.forEach((page, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${index + 1}`;
        pageSelect.appendChild(option);
    });
}

function updatePageSelector(index) {
    const pageSelect = document.getElementById('page-select');
    if (pageSelect) {
        pageSelect.value = index;
    }
}
