// date.js 文件完整代码
/**
 * 日期处理工具
 */

// 格式化日期
function formatDate(date, format = 'YYYY-MM-DD HH:mm') {
  if (!date) return '';
  
  const d = parseDate(date); // 使用修复后的解析函数
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
}


// 获取友好时间（如：3天后截止）
const getRelativeTime = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return '已过期';
  } else if (diffDays === 0) {
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    if (diffHours <= 0) {
      return '即将截止';
    }
    return `${diffHours}小时后截止`;
  } else if (diffDays === 1) {
    return '明天截止';
  } else if (diffDays <= 7) {
    return `${diffDays}天后截止`;
  } else {
    return formatDate(date, 'MM-DD');
  }
};

// 获取星期几
const getWeekday = (date) => {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const d = new Date(date);
  return `星期${weekdays[d.getDay()]}`;
};

// 获取当前学期（示例）
const getCurrentSemester = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  if (month >= 2 && month <= 7) {
    return `${year}年春季学期`;
  } else {
    return `${year}年秋季学期`;
  }
};

// 导出所有方法
module.exports = {
  formatDate,
  getRelativeTime,
  getWeekday,
  getCurrentSemester
};