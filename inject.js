(function() {
    const oldOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        this.addEventListener('load', function() {
            const data = {url: url, body: this.responseText};
            window.postMessage({type: 'XHR_INTERCEPTED', data: data}, '*');
        });
        oldOpen.apply(this, arguments);
    };
})();
