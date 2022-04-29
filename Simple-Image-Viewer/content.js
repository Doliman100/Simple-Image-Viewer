'use strict';

if (document.contentType.startsWith('image/') && !document.contentType.endsWith('+xml')) {
  // load script sync
  const xhr = new XMLHttpRequest();
  xhr.open('GET', chrome.runtime.getURL('script.js'), false);
  xhr.send();

  // execute script sync
  eval(`${xhr.responseText}\n//# sourceURL=${chrome.runtime.getURL('script.js')}`);
}
