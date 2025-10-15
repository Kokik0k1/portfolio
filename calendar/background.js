chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'switchCalendar') {
    const presetName = request.presetName;
    const appsScriptUrl = request.appsScriptUrl;
    
    fetch(`${appsScriptUrl}?preset=${encodeURIComponent(presetName)}`)
      .then(response => response.json())
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
});