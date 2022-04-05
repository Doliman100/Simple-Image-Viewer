'use strict';

if (document.contentType.startsWith('image/') && !document.contentType.endsWith('+xml')) {
  // console.log('injecting...');

  new MutationObserver((mutations, observer) => {
    if (document.head) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('style.css');

      const script = document.createElement('script');
      // script.type = 'module';
      script.src = chrome.runtime.getURL('script.js');

      document.head.append(link, script);

      observer.disconnect();
    }
  }).observe(document.documentElement, {childList: true});
}
