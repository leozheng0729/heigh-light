// import fabric from 'fabric';
// const fabric = require('fabric').fabric;
// import { Canvas, FabricObject } from "fabric"
import { fabric } from "fabric"
import type { Canvas } from "fabric/fabric-impl"

// 扩展Canvas类型以包含wrapperEl属性
declare module "fabric/fabric-impl" {
  interface Canvas {
    wrapperEl: HTMLElement;
  }
}

/**
 * 动态计算并调整画布高度
 * 根据页面滚动位置和屏幕尺寸智能调整画布高度
 * @returns {number} 计算后的画布高度
 */
// 屏幕物理高度（固定不变）
// console.log("屏幕高度:", screen.height);

// 浏览器视口高度（随窗口大小变化）
// console.log("视口高度:", window.innerHeight);

// 页面文档总高度（随内容变化）
// console.log("页面高度:", document.documentElement.scrollHeight);

export const calculateCanvasHeight = (): number => {
  // 页面尺寸计算
  const bodyElement = document.body;
  const documentElement = document.documentElement;
  const scrollTop =
    document.body.scrollTop || document.documentElement.scrollTop;

  // 获取页面总高度（取各种高度属性的最大值）
  console.log("页面高度1:", bodyElement.scrollHeight,
    bodyElement.offsetHeight,
    documentElement.clientHeight,
    documentElement.scrollHeight,
    documentElement.offsetHeight);
  requestAnimationFrame(() => {
    console.log("页面高度2:", bodyElement.scrollHeight,
      bodyElement.offsetHeight,
      documentElement.clientHeight,
      documentElement.scrollHeight,
      documentElement.offsetHeight);
  })
  const pageHeight = Math.max(
    bodyElement.scrollHeight,
    bodyElement.offsetHeight,
    documentElement.clientHeight,
    documentElement.scrollHeight,
    documentElement.offsetHeight
  )
  console.log("页面高度:", pageHeight);
  let canvasHeight = 7500

  // 动态调整画布高度：如果当前滚动位置+屏幕高度超过当前画布高度
  console.log("当位置:", scrollTop + screen.height);
  if (scrollTop + screen.height > canvasHeight) {
    // 如果当前滚动位置 + 整个屏幕高度 > 当前画布高度
    // 说明用户即将滚动到画布底部，需要扩展画布高度
    console.log("Expanding canvas height to:", scrollTop + screen.height);
    canvasHeight = scrollTop + screen.height
  }

  // 确保画布高度不超过页面总高度
  if (canvasHeight > pageHeight) {
    canvasHeight = pageHeight
  }

  return canvasHeight
}

const styleContent = `
  /** 高亮画布样式 */
  #pageMarker_canvas {
    /*cursor: crosshair;*/
    top: 0px;
    left: 0px;
    position: absolute !important;
    z-index: 2147483646;
    background-color: transparent;
    user-select: none !important;
    pointer-events: none;
    display: block;
  }
  #pageMarker_canvas.highlite-canvas-enabled {
    pointer-events: auto !important;
    display: block;
  }
}`

/**
 * 创建并配置一个全屏可绘制的Fabric.js画布
 * @param {number} canvasHeight - 画布的高度值
 * @param {string} canvasId - 画布元素的ID，默认为"c"
 * @param {Object} fabricOptions - 额外的Fabric画布配置选项
 * @returns {fabric.Canvas} 初始化完成的Fabric画布实例
 */
export const createDrawingCanvas = (
  canvasHeight: number,
  canvasId: string = "c",
  fabricOptions: object = {}
): fabric.Canvas => {
  // 合并用户自定义配置与默认配置
  const defaultOptions = {
    isDrawingMode: false,
    width: document.body.clientWidth,
    height: canvasHeight
  }

  const mergedOptions = {
    ...defaultOptions,
    ...fabricOptions,
    // renderOnAddRemove: false, // 减少自动重绘
    // skipOffscreen: true,      // 跳过屏幕外对象渲染
    enableRetinaScaling: false // 在动态调整尺寸时禁用视网膜缩放
  }

  // 创建画布实例
  const canvas = new fabric.Canvas(canvasId, mergedOptions)

  // 设置全局对象属性
  fabric.Object.prototype.transparentCorners = true;

  // 设置画布尺寸（确保与选项一致）
  canvas.setDimensions({
    width: mergedOptions.width,
    height: mergedOptions.height
  })

  // 添加样式文件
  const styleElement = document.createElement("style")
  styleElement.textContent = styleContent
  document.head.appendChild(styleElement)

  // 设置包装元素ID并添加到页面
  canvas.wrapperEl.id = "pageMarker_canvas"
  document.body.appendChild(canvas.wrapperEl)
  return canvas
}

const isCanvasEnabled = (canvas: Canvas) => canvas.wrapperEl.classList.value.includes('highlite-canvas-enabled');

export const removeDrawingCanvas = (canvas: Canvas) => {
  canvas.wrapperEl.remove()
}

export const showDrawingCanvas = (canvas: Canvas) => {
  if (isCanvasEnabled(canvas)) return;
  canvas.wrapperEl.classList.add("highlite-canvas-enabled")
}

export const hideDrawingCanvas = (canvas: Canvas) => {
  if (!isCanvasEnabled(canvas)) return;
  canvas.wrapperEl.classList.remove("highlite-canvas-enabled");
}