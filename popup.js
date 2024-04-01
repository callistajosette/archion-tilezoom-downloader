document.addEventListener('DOMContentLoaded', function() {
  const listElement = document.getElementById('xhr-list');
  
  chrome.storage.local.get(['xhrData'], function(result) {
      const xhrData = result.xhrData || [];
      xhrData.forEach(data => {
          if (data.tiles) {
              data.tiles.forEach(tile => {
                  const item = document.createElement('div');
                  item.classList.add('xhr-item');
                  item.textContent = `Tile: ${tile.tile}, URL: ${tile.fullUrl}`;
                  listElement.appendChild(item);
              });
          }
      });
  });
});
  
  document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('recordToggle');
    
    // Send the initial state of recording to the background script
    chrome.storage.local.get(['isRecording'], function(result) {
        toggle.checked = result.isRecording || false; // Default to false if not set
    });

    // Listen for toggle changes
    toggle.addEventListener('change', function() {
        const isRecording = toggle.checked;
        chrome.storage.local.set({isRecording: isRecording});
        
        // Send message to background.js or content scripts
        chrome.runtime.sendMessage({type: "RECORDING_TOGGLE", isRecording: isRecording});
    });
});
