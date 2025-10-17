import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import HighlightManager from './hight-light';
import { calculateCanvasHeight, createDrawingCanvas } from "../utils";
import cssContent from "data-text:./content-style.scss"
import { useEffect, useState, useRef } from "react";
import { Line } from 'fabric';

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
  const currentLine = useRef(null);
  const isDrawingLine = useRef(false); // 正在画线
  const isLineDrawing = useRef(false); // 可以画线

  // 高亮组件
  const highlightManager = new HighlightManager();
  
  // 截屏函数
  const captureScreenshot = () => {
    browserAPI.runtime.sendMessage({
      type: "captureScreenshot",
      payload: {}
    });
  }

  // 高亮
  const toggleHighlighting = () => {
    highlightManager.startHighlighting("blue");
  }


  // 接收消息处理
  const handleMessage = (message, sender, sendResponse) => {
    const { type, payload } = message;
    switch (type) {
      case 'toggleToolbar':
        if (!isVisible) {
          // 初始化 Canvas 面板
          // initCanvas();
        } else {
          // 去除内容
        }
        // 显示组件
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

  // 画布初始化
  const initCanvas = () => {
    const adjustedCanvasHeight = calculateCanvasHeight();
    const myCanvas = createDrawingCanvas(adjustedCanvasHeight, "myCanvas");
    
    // 获取画布上下文
    myCanvas.getContext();
    // 鼠标按下事件
    myCanvas.on("mouse:down", (options) => {
      // 可以画线
      if (isLineDrawing) {
        isDrawingLine.current = true;
        const pointer = myCanvas.getScenePoint(options.e);
        currentLine.current = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          strokeWidth: 12, // 可设置线条宽度
          fill: "#000",
          stroke: "#000", // 可设置线条颜色
          originX: "center",
          originY: "center",
          selectable: false,
          hoverCursor: "normal",
          targetFindTolerance: true
        });
        myCanvas.add(currentLine.current);
      }
    });
    // 鼠标移动事件
    myCanvas.on("mouse:move", (options) => {
      if (isDrawingLine.current && isLineDrawing.current) {
        const pointer = myCanvas.getScenePoint(options.e);
        currentLine.current.set({x2: pointer.x, y2: pointer.y});
        myCanvas.renderAll();
      }
    });
    // 鼠标释放事件
    myCanvas.on("mouse:up", (options) => {
      if (isLineDrawing.current) {
        isDrawingLine.current = false;
        currentLine.current.setCoords();
      }
    });
  }

  useEffect(() => {
    browserAPI.runtime.onMessage.addListener(handleMessage)
    return () => {
      browserAPI.runtime.onMessage.removeListener(handleMessage)
    }
  }, [])

  if (!isVisible) return null;
  return <div className="plasmo-overlay" id="pageMarker_canvas-wrapper">
    <button onClick={() => captureScreenshot()}>截屏（使用默认名称）</button>
    <button onClick={() => toggleHighlighting()}>高亮文本</button>
  </div>
}

export default PlasmoOverlay;