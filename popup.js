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
    const listElement = document.getElementById('imageDropdown');
    const downloadBtn = document.getElementById('downloadBtn');
    const tileGrid = document.createElement('div');

//Setup grid
    const gridHeight = 5;
    const gridWidth = 5;
    const numTiles = gridHeight*gridWidth; // Fixed 5x5 grid

    //Load in a fixed representation grid
    tileGrid.id = 'tileGrid';
    tileGrid.style.display = 'grid'; // Initially hidden
    tileGrid.style.gridTemplateColumns = `repeat(${gridWidth}, 1fr)`; // Fixed 5x5 grid
    tileGrid.style.gridTemplateRows = `repeat(${gridHeight}, 1fr)`; // Fixed 5x5 grid
    tileGrid.style.gap = '2px';
    tileGrid.style.width = '300px';
    tileGrid.style.height = '300px';
    document.body.insertBefore(tileGrid, listElement); // Insert grid above image dropdown

    //Split svg
    const svgUrl = 'https://www.archion.de/typo3conf/ext/archion_sitepackage/Resources/Public/Images/archion_logo_teaser_search.svg';
    const svg = await fetchSvg(svgUrl);
    const [x, y, width, height] = svg.getAttribute('viewBox').split(' ').map(Number);
//    const tileWidth = width / gridWidth; // Divide SVG into 5x5 grid
//    const tileHeight = height / gridHeight;

    // **Precompute the svg `viewBox` data to prevent jittering**
    const paddingFactor = 0.3; // 30% padding

    // Compute padding offsets
    const paddingX = (width * paddingFactor) / 2; // Half the padding on each side
    const paddingY = (height * paddingFactor) / 2;

    // Update viewBox to shrink dimensions and center the logo
    const paddedX = x - paddingX; // Add padding to the left
    const paddedY = y - paddingY; // Add padding to the top
    const paddedWidth = width + 2 * paddingX; // Subtract padding from both sides
    const paddedHeight = height + 2 * paddingY; // Subtract padding from both sides
    const tileWidth = paddedWidth / gridWidth; // Divide padded width
    const tileHeight = paddedHeight / gridHeight; // Divide padded height

    // Update the SVG viewBox
    svg.setAttribute('viewBox', `${paddedX} ${paddedY} ${paddedWidth} ${paddedHeight}`);

    // Store computed SVG tile positions
    const svgTilePositions = [];
    for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
            const tileX = paddedX + col * tileWidth; // Use padded coordinates
            const tileY = paddedY + row * tileHeight; // Use padded coordinates
            svgTilePositions.push({
                viewBox: `${tileX} ${tileY} ${tileWidth} ${tileHeight}`
            });
        }
    }
    
    // Create placeholders for the 5x5 grid
    const gridTiles = [];
    for (let i = 0; i < numTiles; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile-placeholder');
        tile.style.width = '100%';
        tile.style.height = '100%';
        tile.style.background = '#b0c4de'; // Light blue (unloaded)
        tile.style.borderRadius = '4px';
        tile.style.transition = 'background 0.3s ease-in-out';
        tileGrid.appendChild(tile);
        gridTiles.push(tile);
    }

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

        let loadedTiles = 0;

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
                
                loadedTiles++;

                // **Update the grid based on loading progress**
                const progress = Math.floor((loadedTiles / allTiles.length) * 25);
                for (let i = 0; i < progress; i++) {
                    // Use precomputed `viewBox` to prevent jittering
                    const tileSvg = svg.cloneNode(true);
                    tileSvg.setAttribute('viewBox', svgTilePositions[i].viewBox);
                    tileSvg.setAttribute('width', '100%');
                    tileSvg.setAttribute('height', '100%');
                    tileSvg.setAttribute('preserveAspectRatio', 'none'); // Prevent scaling issues
                    tileSvg.style.display = 'block'; // Ensure tiles align properly

                    // Add shimmer effect via existing CSS class
                    gridTiles[i].classList.add('tile-loaded'); 
                    gridTiles[i].innerHTML = ''; 
                    gridTiles[i].appendChild(tileSvg);
                }
            }

            downloadBtn.disabled = false;
        }
    });
});

// Fetch and process the SVG
async function fetchSvg(url) {
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    return parser.parseFromString(text, 'image/svg+xml').querySelector('svg');
}

// Function to load images
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';  // Handle CORS if necessary
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
