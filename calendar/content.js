chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'reloadCalendar') {
    setTimeout(() => {
      window.location.reload();
    }, 1500);
    sendResponse({ success: true });
    return true;
  }
});