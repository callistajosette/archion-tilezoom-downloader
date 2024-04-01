/**
 * Fetch processed xhr response bodies to display in pop-up
 */
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

/**
 * Toggle allow recording or not so we don't bother capturing smaller than full size images
 */
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

/**
 * Try draw original image from components
 */
document.addEventListener('DOMContentLoaded', async function() {
    const listElement = document.getElementById('xhr-list');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    listElement.appendChild(canvas);

    chrome.storage.local.get(['xhrData'], async function(result) {
        const xhrData = result.xhrData || [];
        const allTiles = [];

        xhrData.forEach(data => {
            if (data.tiles) {
                data.tiles.forEach(tile => {
                    allTiles.push(tile);
                });
            }
        });

        // Sort tiles by their coordinates
        allTiles.sort((a, b) => {
            const [ax, ay] = a.tile.split(',').map(Number);
            const [bx, by] = b.tile.split(',').map(Number);
            return ax - bx || ay - by;
        });

        if (allTiles.length > 0) {
            // Assuming all tiles are of equal size and calculating the total image size
            const tileSize = 256; // Change this according to actual tile size
            const maxX = Math.max(...allTiles.map(t => parseInt(t.tile.split(',')[0]))) + 1;
            const maxY = Math.max(...allTiles.map(t => parseInt(t.tile.split(',')[1]))) + 1;
            canvas.width = maxX * tileSize;
            canvas.height = maxY * tileSize;

            for (const tile of allTiles) {
                const img = await loadImage(tile.fullUrl);
                const [x, y] = tile.tile.split(',').map(Number);
                ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
            }
        }
    });
});

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}
