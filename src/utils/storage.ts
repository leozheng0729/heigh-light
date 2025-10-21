// 存储封装 
class ChromeStorageManager {
  storage: chrome.storage.LocalStorageArea;
  constructor() {
    this.storage = chrome.storage.local;
  }

  /**
   * 设置数据
   * @param {Object} items - 要存储的数据对象
   * @returns {ChromeStorageManager} - 返回 this 以支持链式调用
   */
  set(items) {
    this.storage.set(items, () => {
      if (chrome.runtime.lastError) {
        console.log('设置数据时出错:', chrome.runtime.lastError);
      }
    });
    return this;
  }

  /**
   * 获取数据
   * @param {string|Array<string>} keys - 要获取的键名或键名数组
   * @returns {Promise<Object>} - 返回一个 Promise，解析为获取的数据对象
   */
  async get(keys) {
    return new Promise((resolve, reject) => {
      this.storage.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(result);
      });
    });
  }

  /**
   * 删除数据
   * @param {string|Array<string>} keys - 要删除的键名或键名数组
   * @returns {ChromeStorageManager} - 返回 this 以支持链式调用
   */
  remove(keys) {
    this.storage.remove(keys, () => {
      if (chrome.runtime.lastError) {
        console.log('删除数据时出错:', chrome.runtime.lastError);
      }
    });
    return this;
  }

  /**
   * 清空所有数据
   * @returns {ChromeStorageManager} - 返回 this 以支持链式调用
   */
  clear() {
    this.storage.clear(() => {
      if (chrome.runtime.lastError) {
        console.log('清空数据时出错:', chrome.runtime.lastError);
      }
    });
    return this;
  }
}

export const heighbrushColor = 'HbrushColor';
export const heighpencilColor = 'HpencilColor';
export const heighpencilSize = 'HpencilSize';

const storageManager = new ChromeStorageManager();

export default storageManager;

