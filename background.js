// background.js

chrome.action.onClicked.addListener((tab) => {
    
    chrome.tabs.get(tab.id, (currentTab) => {
        if (chrome.runtime.lastError) {
            console.error("Error getting tab info:", chrome.runtime.lastError.message);
            return;
        }

        if (currentTab.status === 'complete') {
            ensureContentScriptLoaded(tab.id, () => {
                sendToggleMessage(tab.id);
            });
        } else {

            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    ensureContentScriptLoaded(tab.id, () => {
                        sendToggleMessage(tab.id);
                    });
                }
            });
        }
    });
});

function ensureContentScriptLoaded(tabId, callback) {
    chrome.tabs.sendMessage(tabId, { action: "ping" }, response => {
        if (chrome.runtime.lastError) {
            console.log("Content script not ready, waiting...");
            setTimeout(() => ensureContentScriptLoaded(tabId, callback), 100);
        } else {
            console.log("Content script is ready");
            callback();
        }
    });
}

function sendToggleMessage(tabId, retries = 3) {
    chrome.tabs.sendMessage(tabId, { action: "toggleReadingMode" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message);
            if (retries > 0) {
                console.log(`Retrying... (${retries} attempts left)`);
                setTimeout(() => sendToggleMessage(tabId, retries - 1), 1000);
            } else {
                console.error("Max retries reached. Unable to toggle reading mode.");
            }
        } else if (response && response.status) {
            console.log("Response from content script:", response.status);
        } else {
            console.warn("No valid response from content script");
        }
    });
}