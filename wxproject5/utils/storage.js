// storage.js 文件完整代码
/**
 * 本地存储封装
 * 对 wx.setStorageSync 的增强封装
 */

// 基础存储方法
const setItem = (key, value) => {
  try {
    wx.setStorageSync(key, value);
    return { success: true };
  } catch (error) {
    console.error('存储失败:', error);
    return { success: false, error };
  }
};

const getItem = (key, defaultValue = null) => {
  try {
    const value = wx.getStorageSync(key);
    return value !== undefined && value !== null ? value : defaultValue;
  } catch (error) {
    console.error('读取失败:', error);
    return defaultValue;
  }
};

const removeItem = (key) => {
  try {
    wx.removeStorageSync(key);
    return { success: true };
  } catch (error) {
    console.error('删除失败:', error);
    return { success: false, error };
  }
};

const clear = () => {
  try {
    wx.clearStorageSync();
    return { success: true };
  } catch (error) {
    console.error('清空失败:', error);
    return { success: false, error };
  }
};

// 作业相关存储（你的核心功能）
const AssignmentStorage = {
  // 获取所有作业
  getAll: () => {
    return getItem('assignments', []);
  },
  
  // 保存所有作业
  saveAll: (assignments) => {
    return setItem('assignments', assignments);
  },
  
  // 添加作业
  add: (assignment) => {
    const assignments = AssignmentStorage.getAll();
    
    // 生成唯一ID
    const newId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const newAssignment = {
      id: newId,
      ...assignment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: assignment.status || 0, // 0=未完成, 1=进行中, 2=已完成
      priority: assignment.priority || 1, // 0=低, 1=中, 2=高
    };
    
    assignments.push(newAssignment);
    const result = AssignmentStorage.saveAll(assignments);
    
    if (result.success) {
      return { success: true, data: newAssignment };
    }
    return { success: false, error: '保存失败' };
  },
  
  // 更新作业
  update: (id, updates) => {
    const assignments = AssignmentStorage.getAll();
    const index = assignments.findIndex(item => item.id === id);
    
    if (index === -1) {
      return { success: false, error: '作业不存在' };
    }
    
    assignments[index] = {
      ...assignments[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return AssignmentStorage.saveAll(assignments);
  },
  
  // 删除作业
  delete: (id) => {
    const assignments = AssignmentStorage.getAll();
    const filtered = assignments.filter(item => item.id !== id);
    
    if (assignments.length === filtered.length) {
      return { success: false, error: '删除失败，作业不存在' };
    }
    
    return AssignmentStorage.saveAll(filtered);
  },
  
  // 根据ID获取作业
  getById: (id) => {
    const assignments = AssignmentStorage.getAll();
    return assignments.find(item => item.id === id) || null;
  },
  
  // 根据课程获取作业
  getByCourse: (courseId) => {
    const assignments = AssignmentStorage.getAll();
    return assignments.filter(item => item.courseId === courseId);
  },
  
  // 获取即将到期的作业
  getUpcoming: (days = 7) => {
    const assignments = AssignmentStorage.getAll();
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return assignments
      .filter(item => {
        if (!item.dueDate || item.status === 2) return false;
        const due = new Date(item.dueDate);
        return due >= now && due <= future;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  },
  
  // 获取今日作业
  getToday: () => {
    const assignments = AssignmentStorage.getAll();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    return assignments.filter(item => {
      if (!item.dueDate || item.status === 2) return false;
      return item.dueDate.split('T')[0] === today;
    });
  }
};

// 课程相关存储
const CourseStorage = {
  getAll: () => getItem('courses', []),
  saveAll: (courses) => setItem('courses', courses),
  
  add: (course) => {
    const courses = CourseStorage.getAll();
    const newId = Date.now();
    const newCourse = { id: newId, ...course };
    courses.push(newCourse);
    CourseStorage.saveAll(courses);
    return newCourse;
  }
};

// 导出
module.exports = {
  // 基础方法
  setItem,
  getItem,
  removeItem,
  clear,
  
  // 作业存储
  AssignmentStorage,
  
  // 课程存储
  CourseStorage
};