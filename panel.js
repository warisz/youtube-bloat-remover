document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('shortsToggle');
    const counter = document.getElementById('shortsCounter');
    
    // Load saved state and counter
    chrome.storage.sync.get(['shortsRemovalEnabled', 'totalShortsBlocked'], (result) => {
        toggle.checked = result.shortsRemovalEnabled !== false;
        counter.textContent = result.totalShortsBlocked || 0;
    });

    // Save state on change
    toggle.addEventListener('change', () => {
        chrome.storage.sync.set({
            shortsRemovalEnabled: toggle.checked
        });
    });

    // Listen for counter updates
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.totalShortsBlocked) {
            counter.textContent = changes.totalShortsBlocked.newValue;
        }
    });
}); 