// utils/index.js
// 统一导出所有工具函数

// 引入各个工具模块
const dateUtil = require('./date.js');
const storageUtil = require('./storage.js');
const requestUtil = require('./request.js');

// 统一导出
module.exports = {
  // 日期工具
  formatDate: dateUtil.formatDate,
  getRelativeTime: dateUtil.getRelativeTime,
  getWeekday: dateUtil.getWeekday,
  getCurrentSemester: dateUtil.getCurrentSemester,
  
  // 存储工具
  setItem: storageUtil.setItem,
  getItem: storageUtil.getItem,
  removeItem: storageUtil.removeItem,
  clear: storageUtil.clear,
  AssignmentStorage: storageUtil.AssignmentStorage,
  CourseStorage: storageUtil.CourseStorage,
  
  // 请求工具
  request: requestUtil.request,
  get: requestUtil.get,
  post: requestUtil.post,
  put: requestUtil.put,
  del: requestUtil.del
};