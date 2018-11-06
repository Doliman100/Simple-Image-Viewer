let tabs = new Set();

function inject(tabId)
{
	chrome.tabs.insertCSS(tabId, { file: "style.css", runAt: "document_start" });
	chrome.tabs.executeScript(tabId, { file: "content.js", runAt: "document_end" });
}

function onHeadersReceived(details)
{
	if (!tabs.has(details.tabId))
		details.responseHeaders.some(function(header)
		{
			if (header.name.toLowerCase() === "content-type" && header.value.slice(0, 5) === "image")
			{
				tabs.add(details.tabId);

				return true;
			}
		});
}

function onTabUpdated(_, _, tab)
{
	if (/^file:\/\/\/.+\.(jpg|png|gif|bmp|jpeg|webp)$/.test(tab.url) || tabs.has(tab.id))
	{
		inject(tab.id);

		tabs.delete(tab.id);
	}
}

chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, { types: [ "main_frame" ], urls: [ "http://*/*", "https://*/*" ] }, [ "responseHeaders" ]);

chrome.tabs.onUpdated.addListener(onTabUpdated);
