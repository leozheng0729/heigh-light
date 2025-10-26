/**
 * 高亮管理器 - 处理文本高亮功能
 */
import iconBase64blue from "data-base64:~img/oceanblue.svg";
import iconBase64purple from "data-base64:~img/purple.svg";
import iconBase64red from "data-base64:~img/red.svg";
import iconBase64orange from "data-base64:~img/orange.svg";
import iconBase64yellow from "data-base64:~img/yellow.svg";
import iconBase64green from "data-base64:~img/green.svg";
import iconBase64cyan from "data-base64:~img/cyan.svg";
import iconBase64indigo from "data-base64:~img/indigo.svg";

export const styleContent = `
  /** 高亮文本样式 */
  :root {
    --cursor-highlight-oceanblue: url('${iconBase64blue}') 10 32, auto;
    --cursor-highlight-purple: url('${iconBase64purple}') 10 32, auto;
    --cursor-highlight-red: url('${iconBase64red}') 10 32, auto;
    --cursor-highlight-orange: url('${iconBase64orange}') 10 32, auto;
    --cursor-highlight-yellow: url('${iconBase64yellow}') 10 32, auto;
    --cursor-highlight-green: url('${iconBase64green}') 10 32, auto;
    --cursor-highlight-cyan: url('${iconBase64cyan}') 10 32, auto;
    --cursor-highlight-indigo: url('${iconBase64indigo}') 10 32, auto;
  }
  
  .highlite-cursor-20251028_oceanblue {
    cursor: var(--cursor-highlight-oceanblue) !important;
  }
  .highlite-cursor-20251028_oceanblue a {
    pointer-events: none !important;
    cursor: var(--cursor-highlight-oceanblue) !important;
  }
  .highlite-cursor-20251028_purple {
    cursor: var(--cursor-highlight-purple) !important;
  }
  .highlite-cursor-20251028_purple a {
    pointer-events: none !important;
    cursor: var(--cursor-highlight-purple) !important;
  }
  .highlite-cursor-20251028_red {
    cursor: var(--cursor-highlight-red) !important;
  }
  .highlite-cursor-20251028_red a {
    pointer-events: none !important;
    cursor: var(--cursor-highlight-red) !important;
  }
  .highlite-cursor-20251028_orange {
    cursor: var(--cursor-highlight-orange) !important;
  }
  .highlite-cursor-20251028_orange a {
    pointer-events: none !important;
    cursor: var(--cursor-highlight-orange) !important;
  }
  .highlite-cursor-20251028_yellow {
    cursor: var(--cursor-highlight-yellow) !important;
  }
  .highlite-cursor-20251028_yellow a {
    pointer-events: none !important;
    cursor: var(--cursor-highlight-yellow) !important;
  }
    .highlite-cursor-20251028_green {
    cursor: var(--cursor-highlight-green) !important;
  }
  .highlite-cursor-20251028_green a {
    pointer-events: none !important;
    cursor: var(--cursor-highlight-green) !important;
  }
    .highlite-cursor-20251028_cyan {
    cursor: var(--cursor-highlight-cyan) !important;
  }
  .highlite-cursor-20251028_cyan a {
    pointer-events: none !important;
    cursor: var(--cursor-highlight-cyan) !important;
  }
    .highlite-cursor-20251028_indigo {
    cursor: var(--cursor-highlight-indigo) !important;
  }
  .highlite-cursor-20251028_indigo a {
    pointer-events: none !important;
    cursor: var(--cursor-highlight-indigo) !important;
  }

  .text-highlight {
    position: relative;
    display: inline;
    border-radius: 2px;
    transition: background-color 0.2s ease;
  }

  .text-highlight-oceanblue { background-color: #FFFF5C; }
  .text-highlight-purple { background-color: #C8E6C9; }
  .text-highlight-red { background-color: #B3E5FC; }
  .text-highlight-orange { background-color: #ff9800; }
  .text-highlight-yellow { background-color: #FFCCBC; }
  .text-highlight-green { background-color: #94c7ef; }
  .text-highlight-cyan { background-color: #F8BBD0; }
  .text-highlight-indigo { background-color: #E0E0E0; }

  .highlight-remove-btn {
    position: absolute;
    top: 0;
    left: 0;
    width: 16px;
    height: 16px;
    color: #fff;
    border: none;
    cursor: pointer;
    font-size: 18px;
    border-radius: 0;
    display: none;
    z-index: 1000;
    line-height: unset;
    font-weight: bold;
    justify-content: center;
    align-items: center;
    background-color: rgb(81, 81, 81);
  }

  .text-highlight:hover .highlight-remove-btn {
    display: flex;
  }
}`

interface HeighLightTextProps {
  startOffset: number,
  highlightId: string,
  endOffset: number,
  partIndex: number,
  textNode: Node,
  color: string
}

export default class HighlightManager {
  stateManager: any
  highlightCounter: number
  isHighlighting: boolean
  updateState: () => void
  constructor(callback: () => void) {
    this.highlightCounter = 0
    this.isHighlighting = false
    this.updateState = callback;
  }

  // 开始高亮模式
  startHighlighting(color: string) {
    if (this.isHighlighting) return

    this.isHighlighting = true
    document.body.classList.add(`highlite-cursor-20251028_${color}`)

    // 添加选择监听
    document.addEventListener("mouseup", this.handleTextSelection.bind(this, color), { once: true })
    document.addEventListener("selectstart", this.preventSelection.bind(this))
  }

  // 停止高亮模式
  stopHighlighting(color: string) {
    if (!this.isHighlighting) return

    this.isHighlighting = false;
    document.body.classList.remove(`highlite-cursor-20251028_${color}`)
    document.removeEventListener("mouseup", this.handleTextSelection.bind(this))
    document.removeEventListener("selectstart", this.preventSelection.bind(this))
    this.updateState();
  }

  // 处理文本选择
  handleTextSelection(color: string) {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      this.stopHighlighting(color)
      return
    }

    const range = selection.getRangeAt(0)
    if (range.toString().trim().length === 0) {
      this.stopHighlighting(color)
      return
    }

    this.highlightRange(range, color)
    selection.removeAllRanges()
    this.stopHighlighting(color)
  }

  // 高亮文本范围
  highlightRange(range: Range, color: string) {
    const highlightId = `highlight_${++this.highlightCounter}`
    this.processRange(range, highlightId, color)
  }

  // 处理范围中的文本节点
  processRange(range: Range, highlightId: string, color: string) {
    const textNodes = this.getTextNodesInRange(range)

    textNodes.forEach((textNode, index) => {
      const startOffset = textNode === range.startContainer ? range.startOffset : 0;
      const endOffset = textNode === range.endContainer ? range.endOffset : textNode.textContent.length;
      if (startOffset >= endOffset) return

      this.highlightTextNode({
        textNode,
        startOffset,
        endOffset,
        highlightId,
        partIndex: index,
        color
      })
    })
  }

  // 获取范围内的文本节点
  getTextNodesInRange(range: Range) {
    const textNodes = []
    if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
      textNodes.push(range.startContainer)
      return textNodes
    }

    // 精细遍历并筛选出落在指定 DOM 范围（Range）内的文本节点
    const treeWalker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) =>
          range.intersectsNode(node)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT
      }
    )

    // 遍历树形结构
    let currentNode: Node
    while ((currentNode = treeWalker.nextNode())) {
      if (
        currentNode.textContent &&
        currentNode.textContent.trim().length > 0
      ) {
        textNodes.push(currentNode)
      }
    }

    return textNodes
  }

  // 高亮单个文本节点
  highlightTextNode(props: HeighLightTextProps) {
    const { textNode, startOffset, endOffset, highlightId, partIndex, color } = props;
    const highlightSpan = document.createElement("span");
    highlightSpan.className = `text-highlight text-highlight-${color}`;
    highlightSpan.setAttribute("data-highlight-seq", 'highlite');
    highlightSpan.setAttribute("data-highlight-id", highlightId);
    highlightSpan.setAttribute("data-highlight-part", partIndex.toString());

    const textContent = textNode.textContent
    const beforeText = textContent.substring(0, startOffset)
    const highlightText = textContent.substring(startOffset, endOffset)
    const afterText = textContent.substring(endOffset)

    const parentNode = textNode.parentNode
    const fragments = []

    if (beforeText) fragments.push(document.createTextNode(beforeText))

    highlightSpan.textContent = highlightText

    // 只在第一个部分添加删除按钮
    if (partIndex === 0) {
      const removeButton = this.createRemoveButton(highlightId)
      highlightSpan.appendChild(removeButton)
    }

    fragments.push(highlightSpan)
    if (afterText) fragments.push(document.createTextNode(afterText))

    const wrapper = document.createElement("div")
    fragments.forEach((fragment) => wrapper.appendChild(fragment))

    while (wrapper.firstChild) {
      parentNode.insertBefore(wrapper.firstChild, textNode)
    }

    parentNode.removeChild(textNode)
    return highlightSpan
  }

  // 创建删除按钮
  createRemoveButton(highlightId: string) {
    const divEle = document.createElement("div")
    divEle.className = "highlight-remove-btn"
    divEle.innerHTML = '<svg width="12" height="12" viewBox="0 0 1024 1024"><path fill="#fff" d="M371.2 512 89.77 793.43a100.096 100.096 0 0 0-.17 140.97 99.413 99.413 0 0 0 140.97-.17L512 652.8l281.43 281.43a100.096 100.096 0 0 0 140.97.17 99.413 99.413 0 0 0-.17-140.97L652.8 512l281.43-281.43a100.096 100.096 0 0 0 .17-140.97 99.413 99.413 0 0 0-140.97.17L512 371.2 230.57 89.77A100.096 100.096 0 0 0 89.6 89.6a99.413 99.413 0 0 0 .17 140.97z"/></svg>';
    divEle.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.removeHighlight(highlightId);
    }
    return divEle
  }

  // 移除高亮
  removeHighlight(highlightId: string) {
    const highlights = document.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
    highlights.forEach((highlight) => {
      const parent = highlight.parentNode
      let textContent = ""

      highlight.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          textContent += child.textContent || ""
        }
      })

      const textNode = document.createTextNode(textContent)
      parent.replaceChild(textNode, highlight)
    });

    // 规范化文本节点
    const parents = new Set<Node>();
    highlights.forEach((highlight) => {
      const parent = highlight.parentNode
      if (parent) parents.add(parent as Node)
    })

    parents.forEach((parent: Node) => parent.normalize())
  }

  // 移除所有高亮
  removeAllHighlight() {
    const highlights = document.querySelectorAll('[data-highlight-seq="highlite"]');
    highlights.forEach((highlight) => {
      const parent = highlight.parentNode
      let textContent = ""

      highlight.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          textContent += child.textContent || ""
        }
      })

      const textNode = document.createTextNode(textContent)
      parent.replaceChild(textNode, highlight)
    });

    // 规范化文本节点
    const parents = new Set<Node>();
    highlights.forEach((highlight) => {
      const parent = highlight.parentNode
      if (parent) parents.add(parent as Node)
    })

    parents.forEach((parent: Node) => parent.normalize())
  }

  // 阻止选择事件
  preventSelection() {
    // 空函数，用于阻止默认选择行为
  }
}
