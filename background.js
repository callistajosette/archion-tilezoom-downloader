// Function to save the XHR details to chrome.storage.local
const saveXHRDetails = (xhrDetails) => {
  chrome.storage.local.set({xhrDetails}, () => {
    console.log('XHR details saved');
  });
};

chrome.storage.local.get({xhrDetails: []}, (result) => {
  let xhrDetails = result.xhrDetails;

  // Listen for XHR requests
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (details.type === "xmlhttprequest") {
        xhrDetails.push({
          url: details.url,
          method: details.method,
          type: 'Request',
          timeStamp: details.timeStamp
        });
        // Keep the latest 100 entries
        if (xhrDetails.length > 100) {
          xhrDetails = xhrDetails.slice(-100);
        }
        saveXHRDetails(xhrDetails);
      }
    },
    {urls: ["<all_urls>"]},
    ["requestBody"]
  );

  // Listen for XHR responses
  chrome.webRequest.onCompleted.addListener(
    (details) => {
      if (details.type === "xmlhttprequest") {
        xhrDetails.push({
          url: details.url,
          statusCode: details.statusCode,
          type: 'Response',
          timeStamp: details.timeStamp
        });
        // Keep the latest 100 entries
        if (xhrDetails.length > 100) {
          xhrDetails = xhrDetails.slice(-100);
        }
        saveXHRDetails(xhrDetails);
      }
    },
    {urls: ["<all_urls>"]}
  );
});
