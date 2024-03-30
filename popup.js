document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get(['xhrDetails'], function(result) {
      const detailsList = document.getElementById('xhrDetails');
      const xhrDetails = result.xhrDetails || [];
      if (xhrDetails.length === 0) {
          detailsList.innerHTML = '<li>No XHR details captured.</li>';
      } else {
          xhrDetails.forEach(detail => {
              const item = document.createElement('li');
              item.className = 'xhr-item ' + detail.type.toLowerCase();
              item.innerHTML = `<strong>${detail.type}:</strong> ${detail.url} 
                                ${detail.method ? `- Method: ${detail.method}` : ''} 
                                ${detail.statusCode ? `- Status: ${detail.statusCode}` : ''}
                                - Time: ${new Date(detail.timeStamp).toLocaleTimeString()}`;
              detailsList.appendChild(item);
          });
      }
  });
});
