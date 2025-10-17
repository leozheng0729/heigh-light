// import fabric from 'fabric';
// const fabric = require('fabric').fabric;
import { Canvas, FabricObject } from "fabric"

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
  const bodyElement = document.body
  const documentElement = document.documentElement
  const scrollTop =
    document.body.scrollTop || document.documentElement.scrollTop

  // 获取页面总高度（取各种高度属性的最大值）
  const pageHeight = Math.max(
    bodyElement.scrollHeight,
    bodyElement.offsetHeight,
    documentElement.clientHeight,
    documentElement.scrollHeight,
    documentElement.offsetHeight
  )

  let canvasHeight = 7500

  // 动态调整画布高度：如果当前滚动位置+屏幕高度超过当前画布高度
  if (scrollTop + screen.height > canvasHeight) {
    // 如果当前滚动位置 + 整个屏幕高度 > 当前画布高度
    // 说明用户即将滚动到画布底部，需要扩展画布高度
    canvasHeight += ((scrollTop + screen.height) / 7500) * 7500
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
  }
  #pageMarker_canvas.highlite-canvas-enabled {
    pointer-events: none !important;
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
): Canvas => {
  // 合并用户自定义配置与默认配置
  const defaultOptions = {
    isDrawingMode: true,
    width: document.body.clientWidth,
    height: canvasHeight
  }

  const mergedOptions = { ...defaultOptions, ...fabricOptions }

  // 创建画布实例
  const canvas = new Canvas(canvasId, mergedOptions)

  // 设置全局对象属性
  // FabricObject.prototype.transparentCorners = true;

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
