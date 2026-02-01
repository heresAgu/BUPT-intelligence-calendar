// pages/import-course/import-course.js
Page({
  data: {
    inputText: '',
    parsedCourses: [],
    selectedCount: 0,
    isAllSelected: false,
    hasParsed: false,
    colorPresets: [
      '#ff4d4f', '#1890ff', '#52c41a', '#faad14',
      '#722ed1', '#13c2c2', '#f759ab', '#73d13d'
    ]
  },

  onLoad: function() {
    // 可以预加载一些示例文本
  },

  // 文本输入
  onTextInput: function(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  // 清空输入
  clearInput: function() {
    this.setData({
      inputText: '',
      parsedCourses: [],
      selectedCount: 0,
      isAllSelected: false,
      hasParsed: false
    });
  },

  // 解析文本
  parseText: function() {
    const text = this.data.inputText.trim();
    if (!text) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    // 按行分割
    const lines = text.split('\n').filter(line => line.trim());
    const courses = [];

    lines.forEach((line, index) => {
      // 尝试用多种分隔符分割：逗号、空格、制表符
      const parts = line.split(/[,，\s\t]+/).filter(part => part);
      
      if (parts.length === 0) return;

      // 根据字段数量解析
      const course = {
        tempId: Date.now() + '_' + index, // 临时ID
        name: parts[0] || '未命名课程',
        teacher: parts[1] || '',
        time: parts[2] || '',
        classroom: parts[3] || '',
        color: this.data.colorPresets[index % this.data.colorPresets.length],
        selected: true
      };

      // 如果只有两个字段，第二个可能是时间（如“周一1-2节”）
      if (parts.length === 2 && (parts[1].includes('节') || parts[1].includes('周'))) {
        course.time = parts[1];
        course.teacher = '';
      }

      courses.push(course);
    });

    this.setData({
      parsedCourses: courses,
      selectedCount: courses.length,
      isAllSelected: courses.length > 0,
      hasParsed: true
    });

    wx.showToast({
      title: `解析到 ${courses.length} 门课程`,
      icon: 'success'
    });
  },

  // 选择/取消选择单门课程
  toggleSelect: function(e) {
    const index = e.currentTarget.dataset.index;
    const courses = this.data.parsedCourses;
    courses[index].selected = !courses[index].selected;
    
    const selectedCount = courses.filter(c => c.selected).length;
    const isAllSelected = selectedCount === courses.length;

    this.setData({
      parsedCourses: courses,
      selectedCount,
      isAllSelected
    });
  },

  // 全选/取消全选
  toggleSelectAll: function() {
    const selectAll = !this.data.isAllSelected;
    const courses = this.data.parsedCourses.map(course => ({
      ...course,
      selected: selectAll
    }));

    this.setData({
      parsedCourses: courses,
      selectedCount: selectAll ? courses.length : 0,
      isAllSelected: selectAll
    });
  },

  // 编辑单门课程
  editCourse: function(e) {
    const index = e.currentTarget.dataset.index;
    const course = this.data.parsedCourses[index];
    
    wx.showModal({
      title: '编辑课程',
      content: '是否跳转到课程编辑页面修改详情？',
      confirmText: '去编辑',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 这里可以跳转到一个专门的编辑页，或使用弹窗就地编辑
          // 简单起见，我们先在控制台记录
          console.log('编辑课程:', course);
          wx.showToast({ title: '请在列表中直接修改字段', icon: 'none' });
        }
      }
    });
  },

  // 确认导入
  confirmImport: function() {
    const selectedCourses = this.data.parsedCourses.filter(c => c.selected);
    
    if (selectedCourses.length === 0) {
      wx.showToast({ title: '请选择课程', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认导入',
      content: `确定要导入 ${selectedCourses.length} 门课程吗？`,
      confirmText: '导入',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.doImport(selectedCourses);
        }
      }
    });
  },

  // 执行导入
  doImport: function(coursesToImport) {
    wx.showLoading({ title: '导入中...' });

    try {
      const existingCourses = wx.getStorageSync('courses') || [];
      const existingNames = new Set(existingCourses.map(c => c.name));
      
      // 过滤掉已存在的课程，并为新课程生成正式ID
      const newCourses = coursesToImport
        .filter(course => !existingNames.has(course.name))
        .map(course => ({
          id: 'course_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          name: course.name,
          teacher: course.teacher,
          time: course.time,
          classroom: course.classroom,
          color: course.color
        }));

      if (newCourses.length === 0) {
        wx.hideLoading();
        wx.showToast({ title: '没有新课程可导入', icon: 'info' });
        return;
      }

      // 合并并保存
      const allCourses = [...existingCourses, ...newCourses];
      wx.setStorageSync('courses', allCourses);

      wx.hideLoading();
      wx.showToast({
        title: `成功导入 ${newCourses.length} 门课程`,
        icon: 'success',
        duration: 2000
      });

      // 返回课程列表页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (error) {
      wx.hideLoading();
      console.error('导入失败:', error);
      wx.showToast({ title: '导入失败', icon: 'error' });
    }
  },

  // 返回
  onBack: function() {
    wx.navigateBack();
  }
});