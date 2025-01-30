let isEnabled = true;

// Check if enabled
chrome.storage.sync.get(['shortsRemovalEnabled'], (result) => {
    isEnabled = result.shortsRemovalEnabled !== false;
});


// Debounce function to limit how often we run the removal
function debounce(func, wait) {
    let timeout = null;  // Initialize timeout as null
    
    return function(...args) {
        // Clear any existing timeout
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        
        // Set new timeout
        timeout = setTimeout(() => {
            func(...args);
            timeout = null;  // Reset timeout after function runs
        }, wait);
    };
}

function removeBloat() {
    console.log("Testing shorts removal");
    const shortsSelectors = [
        'ytd-mini-guide-entry-renderer',
        'ytm-mini-guide-entry-renderer',

        'ytd-guide-entry-renderer:has(a[title="Shorts"])',

        'ytd-rich-section-renderer[is-shorts]', // note: this gets the actual short video since it has an attribute is-shorts
        'ytd-grid-video-renderer:has(a[href*="shorts"])',
        'ytd-video-renderer:has(a[href*="shorts"])',
        'a[href*="shorts"]',

        'a[href="/playables"]', // note: this only gets the playables as a title. 
        'a[href="playables"]',

        // '.ytd-shelf-renderer',
        '.ytm-shelf-renderer',

        // 'ytm-reel-shelf-renderer',
        'ytd-reel-shelf-renderer'
    ];

    try {
        let removedCount = 0;
        const combinedSelector = shortsSelectors.join(', ');

        document.querySelectorAll(combinedSelector).forEach(el => {

                // If it's the guide entry renderer (sidebar item), remove it directly
                if (el.tagName.toLowerCase() === 'ytd-guide-entry-renderer') {
                    console.log("Removing sidebar Shorts");
                    el.remove();
                    removedCount++;
                }

                // Find the parent with either ytm- or ytd- prefix
                const parentElement = el.closest('ytm-rich-shelf-renderer, ytm-rich-section-renderer, ytm-reel-shelf-renderer, ytd-rich-section-renderer, ytd-rich-shelf-renderer, ytd-reel-shelf-renderer, ytd-horizontal-card-list-renderer, ytm-horizontal-card-list-renderer');
                if (parentElement) {
                    console.log("Removing parent element:", parentElement);
                    parentElement.remove();
                    
                } else {
                    console.log("No parent element found for:", el);
                    el.remove(); // Fallback to removing the original element if parent not found
                }
                removedCount++;
        });
        console.log("Shorts removed!");
        if (removedCount > 0) {
            chrome.storage.sync.get(['totalShortsBlocked'], (result) => {
                const newTotal = (result.totalShortsBlocked || 0) + removedCount;
                chrome.storage.sync.set({ totalShortsBlocked: newTotal });
            });
        }
    } catch (error) {
        console.error("Error removing shorts:", error);
    }
}

// Debounced version of removeShorts that only runs once every 100ms
const debouncedRemoveShorts = debounce(removeBloat, 10);

if (isEnabled) {
    // NEED FIRST PASS IMMEDIATELY
    removeBloat();
}

// Create a MutationObserver to handle dynamically loaded content
const observer = new MutationObserver((mutations) => {
    // Only process mutations that add nodes
    if (isEnabled && mutations.some(mutation => mutation.addedNodes.length > 0)) {
        debouncedRemoveShorts();
    }
});

// Start observing the document with the configured parameters
observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true
});

