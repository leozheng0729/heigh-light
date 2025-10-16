import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";

import cssContent from "data-text:./content-style.scss"
import { useEffect, useState } from "react";

// 浏览器API兼容性处理
const browserAPI = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style");
  style.textContent = cssContent;
  return style
}

const PlasmoOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  const captureScreenshot = () => {
    browserAPI.runtime.sendMessage({
      type: "captureScreenshot",
      payload: {}
    });
  }

  // 接收消息处理
  const handleMessage = (message, sender, sendResponse) => {
    const { type, payload } = message;
    switch (type) {
      case 'toggleToolbar':
        setIsVisible(prev => !prev);
        break;
      case 'preScreenshot': {
        setIsVisible(false);
        sendResponse({ success: true });
        break;
      }
      case 'tailScreenshot': {
        setIsVisible(true);
        sendResponse({ success: true })
        break;
      }
      default:
        break;
    }
  }

  useEffect(() => {
    browserAPI.runtime.onMessage.addListener(handleMessage)
    return () => {
      browserAPI.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])


  if (!isVisible) return null;
  return <div className="plasmo-overlay">
    <button onClick={() => captureScreenshot()}>截屏（使用默认名称）</button>
  </div>
}

export default PlasmoOverlay;