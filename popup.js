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
 * Try draw original image from components; minor issue 4/1/2024 missing strips of data near 
 * top-right and bottom-left but good enough
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
            // Assuming default tile size for non-edge tiles
            const tileSize = 256; // Default tile size
            const maxX = Math.max(...allTiles.map(t => parseInt(t.tile.split(',')[0])));
            const maxY = Math.max(...allTiles.map(t => parseInt(t.tile.split(',')[1])));
            const edgeTiles = allTiles.filter(t => {
                const [x, y] = t.tile.split(',').map(Number);
                return x === maxX || y === maxY;
            });

            // Initial canvas dimensions, assuming all non-edge tiles are 256x256
            canvas.width = (maxX + 1) * tileSize;
            canvas.height = (maxY + 1) * tileSize;

            for (const tile of allTiles) {
                const img = await loadImage(tile.fullUrl);
                const [x, y] = tile.tile.split(',').map(Number);

                // Determine if the tile is an edge tile
                const isEdgeTile = edgeTiles.includes(tile);

                // Draw the tile on the canvas
                if (isEdgeTile) {
                    // For edge tiles, use the natural size of the image
                    ctx.drawImage(img, x * tileSize, y * tileSize, img.naturalWidth, img.naturalHeight);
                } else {
                    // For non-edge tiles, use the default size
                    ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }
    });
});

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Handle CORS if necessary
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

/**
 * Try allow download of canvassed/reconstructed image
 */
document.addEventListener('DOMContentLoaded', function() {
    // Other existing code for canvas setup and image loading

    // Add click event listener for the download button
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.addEventListener('click', function() {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            // Create a data URL for the canvas
            const imageUrl = canvas.toDataURL('image/png');

            // Create a temporary link to trigger the download
            const link = document.createElement('a');
            link.download = 'constructed-image.png';
            link.href = imageUrl;
            link.click(); // Trigger the download
        }
    });
});


