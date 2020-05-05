/**
 * 函数节流
 * @param fn 需要进行节流操作的事件函数
 * @param interval 间隔时间
 * @returns {Function}
 */
function throttle(fn, interval = 500) {
  let enterTime = 0;
  let gapTime = interval;
  return function() {
    let context = this;
    let backTime = new Date();
    if (backTime - enterTime > gapTime) {
      fn.call(context, arguments[0]);
      enterTime = backTime;
    }
  };
}

/**
 * 函数防抖
 * @param fn 需要进行防抖操作的事件函数
 * @param interval 间隔时间
 * @returns {Function}
 */
function debounce(fn, interval = 1000) {
  let timer;
  let gapTime = interval;
  return function() {
    clearTimeout(timer);
    let context = this;
    let args = arguments[0];
    timer = setTimeout(function() {
      fn.call(context, args);
    }, gapTime);
  };
}

/**
 * 格式化URL
 * @param url url格式
 * @returns {Object}
 */
function parseUrl(url) {
  let parse = {};
  let urlData = url.split('?')[1]; // 获取url参数
  if (urlData) {
    let urlArr = urlData.split('&');
    urlArr.forEach(item => {
      const [key, val] = item.split('=');
      parse[key] = val;
    });
  }
  return parse;
}

const promisoryMy = fn => {
  if (typeof fn !== 'function') return fn;
  return (args = {}) => {
    // 这个api的参数不是对象，直接返回方法（参数）
    if (typeof args !== 'object') {
      return fn(args);
    }
    // 这个api是有sussess和fail这样子的回调函数 就有promise方法
    return new Promise((resolve, reject) => {
      args.success = resolve;
      args.fail = reject;
      fn(args);
    });
  };
};

const cacheImage = url => {
  const activeDownloadFile = promisoryMy(my.downloadFile);
  return new Promise((resolve, reject) => {
    activeDownloadFile({ url })
      .then(res => {
        const fs = my.getFileSystemManager();
        fs.saveFile({
          tempFilePath: res.apFilePath,
          success(res) {
            resolve(res);
          },
          fail(e) {
            reject(e);
          }
        });
      })
      .catch(e => {
        reject(e);
      });
  });
};

export default {
  throttle,
  debounce,
  parseUrl,
  promisoryMy,
  cacheImage
};
