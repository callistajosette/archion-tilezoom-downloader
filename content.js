// Create a script element that points to an external script file
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
(document.head || document.documentElement).appendChild(script);

// Clean up the script tag once it's loaded to keep the DOM clean
script.onload = function() {
    this.remove();
};

// Listen for messages from the injected script
window.addEventListener('message', event => {
    if (event.source == window) {
        if (event.data.type === 'XHR_INTERCEPTED') {
            chrome.runtime.sendMessage(event.data);
        }

        if (event.data.type === 'ZOOM_LEVEL_CHANGED') {
            chrome.runtime.sendMessage(event.data);

            // Clear and reload only the current zoom level's tiles
            chrome.storage.local.get(['xhrData'], function(result) {
                if (result.xhrData) {
                    const currentZoom = event.data.zoom;
                    const filteredTiles = result.xhrData.filter(tile => tile.zoom === currentZoom);
                    
                    chrome.storage.local.set({ xhrData: filteredTiles });
                }
            });
        }
    }
});
