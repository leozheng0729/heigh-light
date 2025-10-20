import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import { useEffect, useState, useRef, useCallback } from "react";
import { Line, IText, PencilBrush, Rect, Shadow, Group, Textbox } from 'fabric';
import StickyNote, { type StickyNoteType, colors } from "./sticky-note";
import HighlightManager, { styleContent } from './hight-light';
import { calculateCanvasHeight, createDrawingCanvas } from "../utils";
import cssContent from "data-text:./content-style.css"

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
  const [notes, setNotes] = useState<StickyNoteType[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [maxZIndex, setMaxZIndex] = useState(1);
  const canvasObject = useRef(null);
  const currentLine = useRef(null);
  const isDrawingLine = useRef(false); // 正在画线
  const isLineDrawing = useRef(false); // 可以画线
  const isTextEditing = useRef(false); // 正在编辑文本
  const isTextActive = useRef(false); //  可以编辑文本
  const drawingBrush = useRef(null); // 画笔

  // 高亮组件
  const highlightManager = new HighlightManager();

  // 移动工具
  const activateMove = () => {
    canvasObject.current.isDrawingMode = false;
    canvasObject.current.getObjects().forEach(obj => {
      obj.selectable = true;
      obj.hoverCursor = "move";
    });
  }
  
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

  // 激活文本编辑
  const activateText = () => {
    isTextActive.current = true;
  }

  // 激活直线
  const activateLine = () => {
    isLineDrawing.current = true;
  }

  // 激活画线
  const activatePen = () => {
    canvasObject.current.freeDrawingBrush = drawingBrush.current;
  }

  // 创建便签
  const createStickyNote = () => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newNote: StickyNoteType = {
      id: Date.now().toString(),
      content: '',
      x: window.scrollX + 220 + (maxZIndex - 1) * 2,
      y: window.scrollY + 170 + (maxZIndex - 1) * 2,
      width: 200,
      height: 150,
      color: randomColor,
    };
    setNotes([...notes, newNote]);
    setMaxZIndex(prev => prev + 1);
  }

  // 便签-更新
  const updateNote = useCallback((id: string, updates: Partial<StickyNoteType>) => {
    setNotes(prevNotes => {
      // 创建新数组，确保引用改变
      return prevNotes.map(note => {
        if (note.id === id) { return { ...note, ...updates } }
        return note;
      });
    });
  }, []);

  // 便签-删除
  const deleteNote = useCallback((id: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
  }, []);

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
    const myCanvas = canvasObject.current =createDrawingCanvas(adjustedCanvasHeight, "myCanvas");

    // 创建画笔
    drawingBrush.current = new PencilBrush(myCanvas);
    drawingBrush.current.color = 'green';
    drawingBrush.current.width = 10;
    
    // 获取画布上下文
    myCanvas.getContext();
    // 开始编辑文本
    myCanvas.on("text:editing:entered", function(options) {
      isTextEditing.current = true;
    });
    // 结束文本编辑
    myCanvas.on("text:editing:exited", function(options) {
      isTextEditing.current = isTextActive.current = false;
      activateMove();
    });
    // 鼠标按下事件
    myCanvas.on("mouse:down", (options) => {
      if (isTextActive.current && !isTextEditing.current) {
        const event = options.e;
        const pointer = myCanvas.getScenePoint(event);
        const fontSize = 24; // const fontSize = 2 * parseInt(thicknessSlider.value);
        let x = pointer.x;
        let y = pointer.y;
        
        // 触摸事件
        if (event.type === "touchstart" && "targetTouches" in event) {
          const bounds = (event.target as Element).getBoundingClientRect();
          x = (event as TouchEvent).targetTouches[0].pageX - bounds.left;
          y = (event as TouchEvent).targetTouches[0].pageY - bounds.top;
        }

        // 创建文本对象
        const textObject = new IText("", {
          fontFamily: "arial",
          fontSize: fontSize,
          fill: 'red', // colorPicker.value
          left: x,
          top: y - fontSize / 2,// y - fontSize / 2
          lockScalingX: true,  // 锁定水平缩放
          lockScalingY: true,  // 锁定垂直缩放
          // 可选：隐藏控制点（视觉上更干净）
          hasControls: false,
          hasBorders: true     // 保留边框以便选中
        });
        
        myCanvas.add(textObject);
        myCanvas.setActiveObject(textObject);
        textObject.enterEditing();
      // 可以画线
      } else if (isLineDrawing) {
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

  return (
    <div id="pageMarker_canvas2025-wrapper-plasmo">
      {notes.length > 0 && notes.map(note => (
        <StickyNote
          key={note.id}
          note={note}
          onUpdate={updateNote}
          onDelete={deleteNote}
        />
      ))}
      {
        isVisible && (
          <div className="plasmo-overlay">
            <div className="plasmo-overlay-item">
              <svg width="128" height="128" viewBox="0 0 1024 1024"><path fill="#ee7100" d="M652.88 287.76c-41.57 20.34-88.29 31.78-137.68 31.78-49.01 0-95.39-11.25-136.71-31.29l-69.13 136.4a227.6 227.6 0 0 0-24.57 102.84v386.58c0 25.13 20.37 45.49 45.49 45.49h363.44c25.12 0 45.49-20.37 45.49-45.49V523.5c0-33.18-7.26-65.96-21.27-96.04z"/><path fill="#ee7100" d="M652.88 287.76 561.11 90.73c-16.03-34.41-64.66-35.22-81.82-1.36l-100.8 198.88c41.32 20.05 87.7 31.29 136.71 31.29 49.4 0 96.12-11.43 137.68-31.78"/><path fill="#515151" d="M652.88 287.76c-41.57 20.34-88.29 31.78-137.68 31.78-49.01 0-95.39-11.25-136.71-31.29l-69.13 136.4a227.6 227.6 0 0 0-24.57 102.84v386.58c0 25.13 20.37 45.49 45.49 45.49h363.44c25.12 0 45.49-20.37 45.49-45.49V523.5c0-33.18-7.26-65.96-21.27-96.04z" data-spm-anchor-id="a313x.search_index.0.i18.71e43a81AxmQZi"/><path fill="#fba600" d="M652.88 287.76 561.11 90.73c-16.03-34.41-64.66-35.22-81.82-1.36l-100.8 198.88c41.32 20.05 87.7 31.29 136.71 31.29 49.4 0 96.12-11.43 137.68-31.78" data-spm-anchor-id="a313x.search_index.0.i19.71e43a81AxmQZi"/></svg>
              <span>画笔</span>
            </div>
            <div className="plasmo-overlay-item">
              <div className="container">
                <div className="top-section">
                  <div className="top-circle top-circle-1"></div>
                  <div className="top-circle top-circle-2"></div>
                  <div className="top-circle top-circle-3 active"></div>
                  <div className="top-circle top-circle-4"></div>
                  <div className="top-circle top-circle-5"></div>
                </div>
                <div className="bottom-section">
                  <div className="color-circle color-circle-1"></div>
                  <div className="color-circle color-circle-2"></div>
                  <div className="color-circle color-circle-3"></div>
                  <div className="color-circle color-circle-4 active"></div>
                  <div className="color-circle color-circle-5"></div>
                  <div className="color-circle color-circle-6"></div>
                  <div className="color-circle color-circle-7"></div>
                  <div className="color-circle color-circle-8"></div>
                  <div className="color-circle color-circle-9"></div>
                  <div className="color-circle color-circle-10"></div>
                </div>
              </div>
              <svg width="128" height="128" data-spm-anchor-id="a313x.search_index.0.i3.71e43a81AxmQZi" viewBox="0 0 1024 1024"><path fill="#fba600" d="M644 376.94H390.75V189.59c0-12.2 5.81-23 14.43-26.9l211-94.49c13.7-6.12 27.82 7.54 27.82 26.89z" data-spm-anchor-id="a313x.search_index.0.i0.71e43a81AxmQZi"/><path fill="#464646" d="M862.16 905.39c-1-59.44.06-118.92-.45-178.37-.71-81.9-39.19-140.79-112.26-176.41-15.77-7.69-20.7-16.74-20.33-33.16.89-39.05.32-78.14.27-117.21-.07-53.06-12-72.38-55.81-76.73H357.86c-44.16 2.49-59.53 23.19-59.75 71.09-.17 39.07-1.22 78.2.42 117.2.91 21.56-5.86 33-25.92 42.9-61.82 30.41-96.51 81.3-103.27 150.2-6.65 67.79-1 135.82-3.32 203.68-.88 25.64 12.59 28 33.31 28.4 22 .38 30.1-6.76 29.67-29.26-1.15-61.14-.71-122.31-.24-183.47.47-60.11 36.74-107.65 94.2-124.83 33.4-10 38.66-17.28 38.45-52.63-.26-43.32.08-86.65-.77-129.95-.44-22.63 9-32.6 31.87-32.2 40 .69 79.94.19 119.91.15s80-.27 119.92 0c28.71.23 36.66 7.69 37 36.09.56 43.31.08 86.64.24 130 .14 35.79 2.54 38.71 38.16 49 50.91 14.77 85.47 55.33 91.08 107.93 7 66.07 2.68 132.39 2.79 198.59 0 23.39 7.59 30.39 30.73 30.71 24.73.39 30.2-9.66 29.82-31.72"/></svg>
              <span>荧光笔</span>
            </div>
            <div className="plasmo-overlay-item">
              <svg width="128" height="128" viewBox="0 0 1024 1024"><path fill="#515151" d="M851.968 167.936v109.568h-281.6V865.28H453.632V277.504h-281.6V167.936z"/></svg>
              <span>文字</span>
            </div>
            <div className="plasmo-overlay-item">
              <svg width="128" height="128" viewBox="0 0 1024 1024"><path fill="#515151" d="M113.778 967.111h568.889l227.555-227.555V56.889H113.778zm56.889-56.889V113.778h682.666V713.5L666.34 910.222z"/><path fill="#515151" d="M625.778 967.111h56.889V739.556h227.555v-56.89H625.778zM341.333 341.333h341.334v56.89H341.333zm0 170.667h341.334v56.889H341.333z"/></svg>
              <span>便签</span>
            </div>
            <div className="plasmo-overlay-item">
              <svg width="128" height="128" viewBox="0 0 1024 1024"><path fill="#515151" d="M362.88 341.12V512l-256-213.12 256-213.76V256H576a341.76 341.76 0 0 1 0 682.88H192v-85.76h384a256 256 0 0 0 0-512z"/></svg>
              <span>撤销</span>
            </div>
            <div className="plasmo-overlay-item">
              <svg width="128" height="128" viewBox="0 0 1024 1024"><path fill="#d81e06" d="M231.373 910.746V327.68h-76.8v659.866h714.803V204.8h-76.8v705.946H231.424zM657.92 89.6v84.48h76.8V12.8H289.28v161.28h76.8V89.6z"/><path fill="#d81e06" d="M579.942 343.654V704h76.8V343.654zm-136.499-.614.615 38.4 4.454 278.374.614 38.4-76.8 1.23-.614-38.4-4.454-278.426-.564-38.4 76.8-1.178zM972.8 243.2H51.2v-76.8h921.6z"/></svg>
              <span>清空</span>
            </div>
            <div className="plasmo-overlay-item">
              <svg width="128" height="128" viewBox="0 0 1024 1024"><path fill="#515151" d="M473.6 617.024V120.96a19.2 19.2 0 0 1 19.2-19.2h38.4a19.2 19.2 0 0 1 19.2 19.2v496l240.896-240.832a19.2 19.2 0 0 1 27.136 0l27.136 27.136a19.2 19.2 0 0 1 0 27.136L539.136 736.832a38.4 38.4 0 0 1-54.272 0L178.432 430.464a19.2 19.2 0 0 1 0-27.136l27.136-27.136a19.2 19.2 0 0 1 27.136 0L473.6 616.96zm424.64 285.12a19.2 19.2 0 0 1-19.2 19.2h-729.6a19.2 19.2 0 0 1-19.2-19.2v-38.4a19.2 19.2 0 0 1 19.2-19.2h729.6a19.2 19.2 0 0 1 19.2 19.2z"/></svg>
              <span>保存</span>
            </div>
            {/* <button onClick={() => captureScreenshot()}>截屏（使用默认名称）</button>
            <button onClick={() => toggleHighlighting()}>高亮文本</button>
            <button onClick={() => activateLine()}>线条</button>
            <button onClick={() => activateText()}>文字</button>
            <button onClick={() => activatePen()}>画笔</button>
            <button onClick={() => createStickyNote()}>创建便签</button> */}
          </div>
        )
      }
    </div>
  );
}

export default PlasmoOverlay;

window.addEventListener("load", () => {
  // 添加样式文件
  const styleElement = document.createElement("style");
  styleElement.textContent = styleContent;
  document.head.appendChild(styleElement);
})