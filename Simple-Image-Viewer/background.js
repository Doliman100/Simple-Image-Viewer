const tabs = new Set();

function inject(tabId) {
  chrome.tabs.insertCSS(tabId, {file: 'style.css', runAt: 'document_start'});
  chrome.tabs.executeScript(tabId, {file: 'content.js', runAt: 'document_end'});
}

function onHeadersReceived(details) {
  if (!tabs.has(details.tabId)) {
    details.responseHeaders.some(function(header) {
      if (header.name.toLowerCase() === 'content-type' && /^image\/(jpeg|png|gif|(x-|vnd\.microsoft\.)icon|bmp|webp)$/.test(header.value)) {
        tabs.add(details.tabId);

        return true;
      }
    });
  }
}

function onTabUpdated(_, changeInfo, tab) {
  if (/^file:\/\/\/.+\.(jpe?g|png|gif|ico|bmp|webp|jfif|pjp(eg)?)$/.test(tab.url) && changeInfo.status === 'loading' || tabs.has(tab.id)) {
    // console.log(changeInfo, tab);

    inject(tab.id);

    tabs.delete(tab.id);
  }
}

chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, {types: ['main_frame'], urls: ['http://*/*', 'https://*/*']}, ['responseHeaders']);

chrome.tabs.onUpdated.addListener(onTabUpdated);
