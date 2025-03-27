// background.js - Service worker for the Chrome extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Mealman recipe extension installed');
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle message types
  if (message.type === 'GET_CURRENT_URL') {
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({ url: tabs[0].url });
      } else {
        sendResponse({ url: null });
      }
    });
    // Return true to indicate we'll respond asynchronously
    return true;
  }
  
  if (message.type === 'LOG') {
    // For debugging purposes
    console.log('Extension log:', message.data);
  }
});

// Optional: Add context menu for right-click functionality
chrome.contextMenus?.create({
  id: 'save-recipe',
  title: 'Save recipe from this page',
  contexts: ['page', 'link']
});

chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-recipe') {
    // Open extension popup
    chrome.action.openPopup();
  }
});
