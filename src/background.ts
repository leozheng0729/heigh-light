export {}
console.log("HELLO WORLD FROM BGSCRIPTS")

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    // Send message to content script to toggle toolbar
    chrome.tabs.sendMessage(tab.id, { action: 'toggleToolbar' })
  }
})
