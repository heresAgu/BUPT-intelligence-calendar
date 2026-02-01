// request.js 文件完整代码
/**
 * 网络请求封装
 * 统一处理请求、响应、错误
 */

// 基础配置
const baseURL = 'https://your-api-server.com/api'; // 替换为你的API地址
const defaultConfig = {
  timeout: 10000, // 10秒超时
  header: {
    'Content-Type': 'application/json'
  }
};

// 显示加载提示
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title: title,
    mask: true
  });
};

// 隐藏加载提示
const hideLoading = () => {
  wx.hideLoading();
};

// 显示错误提示
const showError = (title, content = '') => {
  wx.showModal({
    title: title,
    content: content,
    showCancel: false,
    confirmText: '确定'
  });
};

// 处理HTTP错误
const handleHttpError = (statusCode) => {
  const errors = {
    400: '请求参数错误',
    401: '未授权，请重新登录',
    403: '拒绝访问',
    404: '请求地址不存在',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务不可用',
    504: '网关超时'
  };
  
  return errors[statusCode] || `请求失败，错误码：${statusCode}`;
};

// 主请求函数
const request = (options) => {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'GET',
      data = {},
      header = {},
      loading = true,
      loadingText = '加载中...'
    } = options;
    
    // 显示加载
    if (loading) {
      showLoading(loadingText);
    }
    
    // 合并请求头
    const requestHeader = {
      ...defaultConfig.header,
      ...header
    };
    
    // 添加认证token
    const token = wx.getStorageSync('token');
    if (token) {
      requestHeader['Authorization'] = `Bearer ${token}`;
    }
    
    // 发起请求
    wx.request({
      url: url.startsWith('http') ? url : `${baseURL}${url}`,
      method: method,
      data: data,
      header: requestHeader,
      timeout: defaultConfig.timeout,
      
      success: (res) => {
        if (loading) hideLoading();
        
        // HTTP状态码判断
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 根据后端返回结构调整
          if (res.data && res.data.code === 0) {
            resolve(res.data.data || res.data);
          } else {
            const errorMsg = res.data.message || '请求失败';
            showError('操作失败', errorMsg);
            reject(new Error(errorMsg));
          }
        } else {
          const errorMsg = handleHttpError(res.statusCode);
          showError('请求失败', errorMsg);
          reject(new Error(errorMsg));
        }
      },
      
      fail: (error) => {
        if (loading) hideLoading();
        
        // 网络错误
        wx.showToast({
          title: '网络连接失败',
          icon: 'none',
          duration: 2000
        });
        reject(error);
      }
    });
  });
};

// GET请求快捷方法
const get = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  });
};

// POST请求快捷方法
const post = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  });
};

// PUT请求快捷方法
const put = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  });
};

// DELETE请求快捷方法
const del = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  });
};

// 导出
module.exports = {
  request,
  get,
  post,
  put,
  del
};