/**
 * Fetch and parse archion.de XHR response bodies to tile image urls
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'XHR_INTERCEPTED') {
        chrome.storage.local.get(['isRecording', 'xhrData', 'zoomLevel'], function(result) {
            if (result.isRecording) {
                try {
                    const data = JSON.parse(request.data.body);
                    if (data.baseurl && data.tiles) {
                        const baseUrl = `https://www.archion.de/${data.baseurl.replace(/^\//, '')}`;
                        const currentZoom = result.zoomLevel || 1; // Default to 1 if not set
                        
                        const tiles = data.tiles.map(tile => ({
                            ...tile,
                            fullUrl: `${baseUrl}${tile.src.replace(/^\//, '')}`,
                            zoom: currentZoom  // Store the zoom level with each tile
                        }));

                        chrome.storage.local.get(['xhrData'], function(store) {
                            let updatedData = store.xhrData || [];

                            // Remove tiles from previous higher zoom levels
                            updatedData = updatedData.filter(tile => tile.zoom <= currentZoom);

                            updatedData.push({ ...request.data, tiles });

                            chrome.storage.local.set({ xhrData: updatedData });
                        });
                    }
                } catch (error) {
                    console.error('Error parsing XHR response:', error);
                }
            }
        });
    }

    if (request.type === 'ZOOM_LEVEL_CHANGED') {
        chrome.storage.local.get(['xhrData'], function(store) {
            let updatedData = store.xhrData || [];

            // Remove tiles from higher zoom levels
            updatedData = updatedData.filter(tile => tile.zoom <= request.zoom);

            chrome.storage.local.set({ zoomLevel: request.zoom, xhrData: updatedData });
        });
    }
});


/**
 * Do not clutter storage overtime-- clear saved XHR response bodies on reload/switch tab/etc.
 */
// Listen for tab updates 
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // Check if the tab is reloaded and the page is fully loaded
    if (changeInfo.status === 'complete') {
      // Clear storage
      chrome.storage.local.set({xhrData: []}, function() {
        console.log('Storage cleared on page reload.');
      });
    }
  });
  
