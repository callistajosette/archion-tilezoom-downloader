/**
 * XHR response interceptor; sends data back to content.js and from there to background.js
 */
(function() {
    const oldOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        this.addEventListener('load', function() {
            const data = { url: url, body: this.responseText };
            window.postMessage({ type: 'XHR_INTERCEPTED', data: data }, '*');
        });
        oldOpen.apply(this, arguments);
    };

    // Hook into TileZoom to detect zoom level changes
    function setupTileZoomListener() {
        if (window.TileZoom && window.TileZoom.getZoom) {
            document.addEventListener('wheel', () => {
                const currentZoom = window.TileZoom.getZoom();
                window.postMessage({ type: 'ZOOM_LEVEL_CHANGED', zoom: currentZoom }, '*');
            });
        } else {
            setTimeout(setupTileZoomListener, 500); // Retry if TileZoom isn't ready
        }
    }

    setupTileZoomListener(); // Start monitoring zoom level
})();
