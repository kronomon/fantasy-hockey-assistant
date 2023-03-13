
// update stats when a new webrequest is completed
chrome.webRequest.onCompleted.addListener(
    function(details) {
        console.debug("Webrequest: ", details);
        if (details.type === 'xmlhttprequest') {
            let queryOptions = { active: true, lastFocusedWindow: true };
            chrome.tabs.query(queryOptions, function(tabs) {
                if (tabs && tabs[0].url.startsWith("https://hockey.fantasysports.yahoo.com")) {
                    console.debug("Send update message");
                    chrome.tabs.sendMessage(tabs[0].id, {msg: "update"});
                }
            });
        }
    }, {urls: ["https://hockey.fantasysports.yahoo.com/*"]}
  );