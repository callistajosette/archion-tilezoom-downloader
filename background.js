/**
 * Fetch and parse archion.de XHR response bodies to tile image urls
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'XHR_INTERCEPTED') {
        chrome.storage.local.get(['isRecording', 'xhrData'], function(result) {
            if (result.isRecording) {
                try {
                    // Assuming the response is JSON and has the structure mentioned
                    const data = JSON.parse(request.data.body);
                    if (data.baseurl && data.tiles) {
                        // Remove leading slashes from baseurl if present
                        const baseUrl = `https://www.archion.de/${data.baseurl.replace(/^\//, '')}`;
                        const tiles = data.tiles.map(tile => ({
                            ...tile,
                            fullUrl: `${baseUrl}${tile.src.replace(/^\//, '')}`
                        }));

                        // Include tiles in saved data
                        const updatedData = [...(result.xhrData || []), { ...request.data, tiles }];
                        chrome.storage.local.set({xhrData: updatedData});
                    }
                } catch (error) {
                    console.error('Error parsing XHR response:', error);
                }
            }
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
  
