import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo";
import StickyNote, { type StickyNoteType, colors } from "./sticky-note";
import HighlightManager, { styleContent } from './hight-light';
import { calculateCanvasHeight, createDrawingCanvas } from "../utils";
import cssContent from "data-text:./content-style.css"
import { useEffect, useState, useRef, useCallback } from "react";
import { Line, IText, PencilBrush, Rect, Shadow, Group, Textbox } from 'fabric';

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
          initCanvas();
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
          <div className="plasmo-overlay" id="pageMarker_canvas-wrapper">
            <button onClick={() => captureScreenshot()}>截屏（使用默认名称）</button>
            <button onClick={() => toggleHighlighting()}>高亮文本</button>
            <button onClick={() => activateLine()}>线条</button>
            <button onClick={() => activateText()}>文字</button>
            <button onClick={() => activatePen()}>画笔</button>
            <button onClick={() => createStickyNote()}>创建便签</button>
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