// pages/add-course/add-course.js
Page({
  data: {
    mode: 'add', // 'add' 或 'edit'
    formData: {
      id: '',
      name: '',
      teacher: '',
      time: '',
      classroom: '',
      color: '#1890ff'
    },
    errors: {},
    
    // 颜色选项
    colorOptions: [
      { value: '#ff4d4f', name: '红色' },
      { value: '#1890ff', name: '蓝色' },
      { value: '#52c41a', name: '绿色' },
      { value: '#faad14', name: '橙色' },
      { value: '#722ed1', name: '紫色' },
      { value: '#13c2c2', name: '青色' },
      { value: '#f759ab', name: '粉色' },
      { value: '#73d13d', name: '亮绿' }
    ]
  },

  onLoad: function(options) {
    console.log('课程编辑页加载，参数:', options);
    
    if (options.id && options.edit === 'true') {
      this.setData({ mode: 'edit' });
      this.loadCourseData(options.id);
      wx.setNavigationBarTitle({ title: '编辑课程' });
    } else {
      wx.setNavigationBarTitle({ title: '添加课程' });
    }
  },

  // 加载课程数据 - 修复版
  loadCourseData: function(courseId) {
    console.log('加载课程数据，ID:', courseId, '类型:', typeof courseId);
    
    const courses = wx.getStorageSync('courses') || [];
    console.log('存储中的所有课程ID类型:', courses.map(c => ({id: c.id, type: typeof c.id})));
    
    // 修复：将存储的ID和传入的ID都转为字符串比较
    const course = courses.find(c => {
      return String(c.id) === String(courseId);
    });
    
    if (course) {
      console.log('✅ 找到课程:', course);
      this.setData({
        'formData': { 
          ...course,
          id: String(course.id)  // 确保ID是字符串
        }
      });
    } else {
      console.error('❌ 课程不存在，查找的ID:', courseId, '类型:', typeof courseId);
      console.error('可用的课程:', courses);
      
      wx.showToast({
        title: '课程不存在',
        icon: 'error',
        duration: 1500
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 表单输入
  onInputChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    console.log(`输入 ${field}:`, value);
    
    this.setData({
      [`formData.${field}`]: value,
      [`errors.${field}`]: ''
    });
  },

  // 选择颜色
  onColorSelect: function(e) {
    const color = e.currentTarget.dataset.color;
    console.log('选择颜色:', color);
    
    this.setData({
      'formData.color': color
    });
  },

  // 表单验证
  validateForm: function() {
    const { formData } = this.data;
    const errors = {};
    let isValid = true;
    
    // 验证课程名称
    if (!formData.name || formData.name.trim() === '') {
      errors.name = '请输入课程名称';
      isValid = false;
    } else if (formData.name.length > 20) {
      errors.name = '课程名称不能超过20个字';
      isValid = false;
    }
    
    // 验证教师名称长度
    if (formData.teacher && formData.teacher.length > 10) {
      errors.teacher = '教师姓名不能超过10个字';
      isValid = false;
    }
    
    this.setData({ errors });
    return isValid;
  },

  // 保存课程
  onSave: function() {
    console.log('保存课程，模式:', this.data.mode);
    
    if (!this.validateForm()) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'error'
      });
      return;
    }
    
    const { mode, formData } = this.data;
    const courses = wx.getStorageSync('courses') || [];
    
    if (mode === 'add') {
      // 添加新课程
      const newCourse = {
        ...formData,
        id: 'course_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      };
      
      console.log('添加新课程:', newCourse);
      
      courses.push(newCourse);
      
      wx.showToast({
        title: '添加成功',
        icon: 'success',
        duration: 1500
      });
      
    } else {
      // 编辑课程
      const index = courses.findIndex(c => String(c.id) === String(formData.id));  // 修复：使用字符串比较
      
      if (index !== -1) {
        console.log('编辑课程，索引:', index, '新数据:', formData);
        
        // 保留原始ID和其他可能存在的字段
        courses[index] = { 
          ...courses[index],  // 保留可能存在的其他字段
          ...formData         // 用新数据覆盖
        };
        
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1500
        });
      } else {
        console.error('课程不存在，无法编辑');
        wx.showToast({
          title: '保存失败',
          icon: 'error'
        });
        return;
      }
    }
    
    // 保存到存储
    wx.setStorageSync('courses', courses);
    console.log('课程保存完成，总数:', courses.length);
    
    // 延迟返回
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  // 删除课程
  onDelete: function() {
    const { formData } = this.data;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除课程"${formData.name}"吗？\n删除后相关作业也会被删除。`,
      confirmColor: '#ff4d4f',
      confirmText: '删除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.confirmDelete();
        }
      }
    });
  },

  // 确认删除
  confirmDelete: function() {
    const { formData } = this.data;
    
    try {
      // 1. 删除课程
      const courses = wx.getStorageSync('courses') || [];
      const filteredCourses = courses.filter(course => String(course.id) !== String(formData.id));  // 修复：使用字符串比较
      
      // 2. 删除相关作业
      const assignments = wx.getStorageSync('assignments') || [];
      const filteredAssignments = assignments.filter(
        assignment => String(assignment.courseId) !== String(formData.id)  // 修复：使用字符串比较
      );
      
      // 3. 保存数据
      wx.setStorageSync('courses', filteredCourses);
      wx.setStorageSync('assignments', filteredAssignments);
      
      console.log(`删除课程 ${formData.name} 成功，剩余课程: ${filteredCourses.length} 门`);
      
      wx.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 1500
      });
      
      // 延迟返回课程列表
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      
    } catch (error) {
      console.error('删除课程失败:', error);
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    }
  },

  // 取消
  onCancel: function() {
    wx.navigateBack();
  }
});