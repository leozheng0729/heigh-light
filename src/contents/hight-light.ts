/**
 * 高亮管理器 - 处理文本高亮功能
 */
export const styleContent = `
  /** 高亮文本样式 */
  .text-highlight {
    position: relative;
    display: inline;
    border-radius: 2px;
    transition: background-color 0.2s ease;
  }

  .text-highlight-yellow { background-color: #FFFF5C; }
  .text-highlight-pink { background-color: #f8879b; }
  .text-highlight-blue { background-color: #00CFFF; }
  .text-highlight-green { background-color: #7CFC00; }
  .text-highlight-orange { background-color: #FF9E00; }

  .highlight-remove-btn {
    position: absolute;
    top: -8px;
    left: -8px;
    width: 16px;
    height: 16px;
    color: #555;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    display: none;
    z-index: 1000;
    font-weight: bold;
    background-color: transparent;
  }

  .text-highlight:hover .highlight-remove-btn {
    display: block;
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
  constructor() {
    // this.stateManager = stateManager
    this.highlightCounter = 0
    this.isHighlighting = false
  }

  // 开始高亮模式
  startHighlighting(color: string) {
    if (this.isHighlighting) return

    this.isHighlighting = true
    document.body.classList.add("highlite-cursor")

    // 添加选择监听
    document.addEventListener("mouseup", this.handleTextSelection.bind(this, color), { once: true })
    document.addEventListener("selectstart", this.preventSelection.bind(this))

    // this.stateManager.setIsHighlighting(true)
  }

  // 停止高亮模式
  stopHighlighting() {
    if (!this.isHighlighting) return

    this.isHighlighting = false;
    document.body.classList.remove("highlite-cursor")
    document.removeEventListener("mouseup", this.handleTextSelection.bind(this))
    document.removeEventListener("selectstart", this.preventSelection.bind(this))

    // this.stateManager.setIsHighlighting(false)
  }

  // 处理文本选择
  handleTextSelection(color: string) {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      this.stopHighlighting()
      return
    }

    const range = selection.getRangeAt(0)
    if (range.toString().trim().length === 0) {
      this.stopHighlighting()
      return
    }

    this.highlightRange(range, color)
    selection.removeAllRanges()
    this.stopHighlighting()
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
    const { textNode, startOffset, endOffset, highlightId, partIndex, color } = props
    const highlightSpan = document.createElement("span")
    highlightSpan.className = `text-highlight text-highlight-${color}`
    highlightSpan.setAttribute("data-highlight-id", highlightId)
    highlightSpan.setAttribute("data-highlight-part", partIndex.toString())

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
    const button = document.createElement("button")
    button.className = "highlight-remove-btn"
    button.textContent = "×"
    button.onclick = (event) => {
      event.stopPropagation()
      this.removeHighlight(highlightId)
    }
    return button
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
      if (parent) parents.add(parent)
    })

    parents.forEach((parent) => parent.normalize())
  }

  // 阻止选择事件
  preventSelection() {
    // 空函数，用于阻止默认选择行为
  }
}
