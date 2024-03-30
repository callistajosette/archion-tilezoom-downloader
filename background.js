// Initialize an array to hold the details of XHR requests and responses
let xhrDetails = [];

// Function to save the XHR details to chrome.storage
function saveXHRDetails() {
  chrome.storage.local.set({xhrDetails: xhrDetails}, function() {
    console.log('XHR details saved');
  });
}

// Listen for XHR requests
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.type === "xmlhttprequest") {
      xhrDetails.push({url: details.url, method: details.method, type: 'Request'});
      saveXHRDetails();
    }
  },
  {urls: ["<all_urls>"]},
  ["requestBody"]
);

// Listen for XHR responses
chrome.webRequest.onCompleted.addListener(
  function(details) {
    if (details.type === "xmlhttprequest") {
      xhrDetails.push({url: details.url, statusCode: details.statusCode, type: 'Response'});
      saveXHRDetails();
    }
  },
  {urls: ["<all_urls>"]}
);

// Limit the size of xhrDetails to avoid exceeding storage limits
chrome.webRequest.onCompleted.addListener(() => {
  if (xhrDetails.length > 100) { // Keep the latest 100 entries
    xhrDetails = xhrDetails.slice(-100);
    saveXHRDetails();
  }
}, {urls: ["<all_urls>"]});
