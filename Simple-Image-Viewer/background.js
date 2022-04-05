'use strict';

chrome.browserAction.onClicked.addListener(() => chrome.tabs.create({url: `chrome://extensions/?id=${chrome.runtime.id}`}));

function init() {
  chrome.extension.isAllowedFileSchemeAccess((hasAccess) => {
    if (hasAccess) {
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
