import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"

import cssContent from "data-text:./content-style.scss"
import { useEffect, useState } from "react";

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
  

  useEffect(() => {
    const handleMessage = (request: any) => {
      console.log("Received message in content script:", request);
      if (request.action === 'toggleToolbar') {
        setIsVisible(prev => !prev)
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])


  if (!isVisible) return null;
  return <div className="plasmo-overlay">HELLO FROM CONTENT SCRIPT OVERLAY 222</div>
}

export default PlasmoOverlay;