/**
 * @author SoldierAb
 * @description 文件上传
 * @param {any} option
 * @since 18-12-29
 * @example
 *
 * upload({
 *   headers:headers,                                           //响应头
 *   withCredentials: withCredentials,                          //是否包含cookie
 *   file: file,                                                //文件
 *   data: data,                                                //数据
 *   action: action,                                            //接口
 *   filename: name,                                            //文件名
 *   onProgress: e => {                                         //当前进度回调
 *       this.handleProgress(e, file);
 *   },
 *   onSuccess: res => {                                        //上传成功回调
 *       this.handleSuccess(res, file);
 *   },
 *   onError: (err, response) => {                              //上传出错回调
 *       this.handleError(err, response, file);
 *   }
 * });
 *
 * @returns
 *
 */


export const uploadFetch = ({ action, data, file }) => new Promise((resolve, reject) => {
  upload({
    data,
    file,
    action,
    filename:"file",
    onProgress: () => {
    },
    onSuccess: e => {
      resolve(e);
    },
    onError: e => {
      reject(e);
    },
  });
})

const upload = (option, type = "post") => {
  if (typeof XMLHttpRequest === "undefined") {
    return;
  }

  const xhr = new XMLHttpRequest();
  const action = option.action; //请求url

  if (xhr.upload) {
    xhr.upload.onprogress = function progress(e) {
      if (e.total > 0) {
        e.percent = (e.loaded / e.total) * 100;
      }
      option.onProgress(e);
    };
  }
  //文件formData
  const formData = new FormData();
  if (option.data) {
    Object.keys(option.data).forEach(key => {
      formData.append(key, option.data[key]);
    });
  }
  if (option.filename && option.file){
    formData.append(option.filename, option.file);
  }


  xhr.onerror = function error(e) {
    option.onError(e);
  };

  xhr.onload = function onload() {
    if (xhr.status < 200 || xhr.status >= 300) {
      return option.onError(getError(action, option, xhr, type), getBody(xhr));
    }

    option.onSuccess(getBody(xhr));
  };

  xhr.open(type, action, true);

  //是否cookie
  if (option.withCredentials && "withCredentials" in xhr) {
    xhr.withCredentials = true;
  }

  const headers = option.headers || {};

  // if (headers['X-Requested-With'] !== null) {
  //   xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  // }

  for (let item in headers) {
    if (headers.hasOwnProperty(item) && headers[item] !== null) {
      xhr.setRequestHeader(item, headers[item]);
    }
  }

  xhr.send(formData);
};

/**
 *
 * @description 错误获取
 * @param {any} action
 * @param {any} option
 * @param {any} xhr
 * @returns
 */
const getError = (action, option, xhr, type) => {
  const msg = `fail to ${type} ${action} ${xhr.status}`;
  const err = new Error(msg);
  err.status = xhr.status;
  err.method = type;
  err.url = action;
  return err;
};

/**
 *
 * @description 返回内容获取
 * @param {any} xhr
 * @returns
 */
const getBody = xhr => {
  const text = xhr.responseText || xhr.response;
  if (!text) {
    return text;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
};




export default upload;
