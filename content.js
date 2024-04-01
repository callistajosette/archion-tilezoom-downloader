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
    if (event.source == window && event.data.type && event.data.type == 'XHR_INTERCEPTED') {
        chrome.runtime.sendMessage(event.data);
    }
});
