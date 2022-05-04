'use strict';

chrome.runtime.onMessage.addListener((message, {tab: {id: tabId}}, sendResponse) => {
  if (typeof message === 'number') {
    chrome.tabs.setZoom(tabId, message, () => {
      sendResponse();
    });
  } else {
    chrome.tabs.setZoomSettings(tabId, {mode: 'manual'}, () => {
      sendResponse();
    });
  }
  return true;
});

// zoomchange event mapping
chrome.tabs.onZoomChange.addListener(({tabId, oldZoomFactor, newZoomFactor}) => {
  if (oldZoomFactor === newZoomFactor) {
    return; // skip origin tab updates
  }

  chrome.tabs.sendMessage(tabId, newZoomFactor, () => {
    chrome.runtime.lastError; // ignore
  });
});

chrome.browserAction.onClicked.addListener(() => chrome.tabs.create({url: `chrome://extensions/?id=${chrome.runtime.id}`}));

function init() {
  chrome.extension.isAllowedFileSchemeAccess((hasAccess) => {
    if (hasAccess) {
      chrome.browserAction.setBadgeText({text: ''});
      chrome.browserAction.disable();
    } else {
      chrome.browserAction.setTitle({title: 'No access to file URLs'});
      chrome.browserAction.setBadgeBackgroundColor({color: '#fbbc04'});
      chrome.browserAction.setBadgeText({text: '!'});
    }
  });
}
chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);
chrome.management.onEnabled.addListener(init);
