import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import { useEffect, useState, useRef, useCallback } from "react";
import { Line, IText, PencilBrush, Rect, Shadow, Group, Textbox } from 'fabric';
import StickyNote, { type StickyNoteType, colors } from "./sticky-note";
import HighlightManager, { styleContent } from './hight-light';
import { calculateCanvasHeight, createDrawingCanvas } from "../utils";
import cssContent from "data-text:./content-style.css"

// 颜色选择
const brushColors = ['#1976d2', '#f800ff', '#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#80deea', '#2196f3'];

// 画笔粗细
const brushSizes = [5, 10, 15, 20, 25];

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
  const [brushColor, setBrushColor] = useState(3); // 高亮颜色索引
  const [pencilBrush, setPencilBrush] = useState(2); // 画笔类型
  const [pencilMedium, setPencilMedium] = useState(brushSizes[0]); // 画笔粗细
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
            <div className="plasmo-overlay-item">
              <div className="container">
                <h2>荧光笔设置</h2>
                <div className="bottom-section">
                  {
                    brushColors.map((color, index) => (<div
                      key={color}
                      onClick={() => { setBrushColor(index); }}
                      className={`color-circle color-circle-1 ${index === brushColor ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                    ></div>))
                  }
                </div>
                <h2>画笔设置</h2>
                <div className="top-section">
                  {
                    brushSizes.map((size, index) => (<div
                      key={`${size}-${index}`}
                      onClick={() => { setPencilMedium(size); }}
                      className={`top-circle top-circle-${index + 1} ${size === pencilMedium ? 'active' : ''}`}
                    ></div>))
                  }
                </div>
                <div className="bottom-section">
                  {
                    brushColors.map((color, index) => (<div
                      key={color}
                      onClick={() => { setPencilBrush(index); }}
                      className={`color-circle ${index === pencilBrush ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                    ></div>))
                  }
                </div>
                <div className="module-action"></div>
              </div>
              <svg width="135.5" height="128" viewBox="0 0 1084 1024"><path fill="#515151" d="M1072.148 406.226c-6.331-33.456-26.762-55.073-52.047-55.073-.324 0-.652.003-.83.01h-4.656c-73.125 0-132.618-59.493-132.618-132.619 0-23.731 11.447-50.336 11.546-50.566 13.104-29.498 3.023-65.672-23.428-84.127l-1.602-1.127-134.4-74.662-1.7-.745c-8.754-3.806-18.335-5.735-28.48-5.735-20.789 0-41.235 8.344-54.683 22.306-14.742 15.216-65.623 58.65-104.721 58.65-39.45 0-90.634-44.287-105.439-59.785C425.571 8.506 404.962 0 383.963 0c-9.946 0-19.354 1.862-27.959 5.532l-1.746.74-139.142 76.432-1.643 1.14c-26.538 18.438-36.676 54.579-23.585 84.062.115.265 11.58 26.725 11.58 50.635 0 73.126-59.492 132.618-132.619 132.618h-4.581q-.479-.01-.952-.01c-25.26 0-45.673 21.618-52.003 55.08C10.851 408.683 0 466.852 0 512.347s10.851 103.66 11.315 106.12c6.334 33.458 26.759 55.076 52.036 55.076.32 0 .652-.006.843-.012h4.655c73.127 0 132.619 59.492 132.619 132.617 0 23.76-11.445 50.333-11.546 50.565-13.094 29.474-3.042 65.646 23.395 84.152l1.57 1.093 131.838 73.727 1.676.738c8.75 3.843 18.305 5.79 28.397 5.79 21.083 0 41.677-8.705 55.09-23.29 18.724-20.348 69.526-62.363 107.047-62.363 40.626 0 92.726 47.1 107.76 63.584 13.442 14.831 34.176 23.69 55.47 23.696h.007c9.895 0 19.279-1.883 27.894-5.598l1.711-.74 136.66-75.531 1.616-1.13c26.493-18.456 36.602-54.6 23.54-84.015-.116-.268-11.596-27.083-11.596-50.677 0-73.125 59.493-132.616 132.618-132.616l4.517-.002q.45.01.9.01c25.33-.002 45.785-21.62 52.107-55.056.112-.59 11.325-59.507 11.325-106.14 0-45.704-10.854-103.671-11.316-106.119m-694.661 539.43-115.328-64.488c5.082-13.052 15.438-43.518 15.438-75.017 0-109.383-84.176-199.817-192.587-208.135-2.648-15.427-8.874-54.967-8.874-85.667 0-30.657 6.223-70.233 8.869-85.672 108.416-8.312 192.592-98.745 192.592-208.134 0-31.417-10.3-61.798-15.372-74.855l122.722-67.403.008.001c4.423 4.52 22.121 22.08 46.558 39.494 39.93 28.463 77.953 42.895 113.014 42.895 34.717 0 72.438-14.152 112.115-42.064 24.283-17.08 41.897-34.303 46.31-38.746l.025-.006 118.302 65.726c-5.078 13.055-15.416 43.5-15.416 74.959 0 109.39 84.175 199.823 192.59 208.135 2.646 15.462 8.873 55.107 8.873 85.671 0 30.688-6.224 70.242-8.87 85.674-108.414 8.31-192.592 98.744-192.592 208.134 0 31.45 10.317 61.852 15.393 74.904L701.474 947.26c-5.168-5.49-22.604-23.363-46.74-41.288-40.701-30.224-79.662-45.55-115.8-45.55-35.792 0-74.459 15.04-114.927 44.695-23.787 17.437-41.34 35.137-46.52 40.538m353.785-434.01c0-105.803-86.082-191.88-191.888-191.88-105.804 0-191.881 86.077-191.881 191.88 0 105.804 86.077 191.883 191.88 191.883 105.809 0 191.889-86.079 191.889-191.882M539.384 395.904c63.825 0 115.75 51.923 115.75 115.744 0 63.825-51.925 115.75-115.75 115.75-63.822 0-115.744-51.925-115.744-115.75 0-63.823 51.922-115.744 115.744-115.744"/></svg>
              <span>设置</span>
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