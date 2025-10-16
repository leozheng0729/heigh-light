export {}
console.log("HELLO WORLD FROM BGSCRIPTS")

// 浏览器API兼容性处理
const browserAPI = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;

// 工具函数

// 下载截图
const downloadScreenshot = async (imageUrl: string) => {
  try {
    const filename = `Screenshot-${new Date().toISOString().replaceAll(":", "-")}.png`;
    await browserAPI.downloads.download({
      url: imageUrl,
      filename: filename
    });
  } catch (error) {
    console.log('downloads failed', error);
  }
}

// 截图
const captureScreenshot = async () => {
  try {
    const imageUrl = await browserAPI.tabs.captureVisibleTab();
    await downloadScreenshot(imageUrl);
  } catch (error) {
    console.log('Cannot capture screenshot of current tab', error);
  }
}

// 发送消息
const sendMessageToTab = async (message, tabId, options) => {
  const targetTabId = tabId || (await browserAPI.tabs.query({ active: true, currentWindow: true }))[0].id;
  return new Promise((resolve, reject) => {
    const callback = (response) => {
      const error = browserAPI.runtime.lastError;
      if (error) return reject(new Error(error.message));
      resolve(response);
    }
    
    if (options?.frameId !== undefined) {
      browserAPI.tabs.sendMessage(targetTabId, message, { frameId: options.frameId }, callback);
    } else {
      browserAPI.tabs.sendMessage(targetTabId, message, callback);
    }
  });
}

// 监听浏览器动作按钮点击事件
browserAPI.action.onClicked.addListener((tab) => {
  if (tab.id) {
    browserAPI.tabs.sendMessage(tab.id, {
      type: "toggleToolbar",
      payload: {},
    })
  }
})

// 监听来自内容脚本的消息
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'captureScreenshot':
      (async () => {
        try {
          const tabId = sender.tab?.id;
          if (tabId === null) throw new Error('No tabId on sender');

          // 01. 截屏之前 content 隐藏工具栏 + 添加水印
          const preScreenshotMessage = { type: 'preScreenshot', payload: {} };
          await sendMessageToTab(preScreenshotMessage, tabId, { frameId: sender.frameId });

          // 等待 100ms 确保页面准备就绪
          await new Promise(resolve => setTimeout(resolve, 100));

          // 02. 截图
          await captureScreenshot();

          // 03. 截屏之后 content 显示工具栏 + 隐藏水印
          const tailScreenshotMessage = { type: 'tailScreenshot', payload: {} };
          await sendMessageToTab(tailScreenshotMessage, tabId, { frameId: sender.frameId });

          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: String(error) });
        }
      })()
      break;
    default:
      console.log('default');
  }
})