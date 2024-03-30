document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['response'], function(result) {
      document.getElementById('response').textContent = result.response || 'No response captured';
    });
  });
  