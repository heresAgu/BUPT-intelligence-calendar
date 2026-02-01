// pages/add-assignment/add-assignment.js
Page({
  data: {
    // 页面模式：add 添加 / edit 编辑
    mode: 'add',
    
    // 表单数据
    formData: {
      id: '',
      title: '',
      courseId: '',
      dueDate: '',
      priority: 1, // 0:低, 1:中, 2:高
      status: 0,   // 0:未开始, 1:进行中, 2:已完成
      description: '',
      reminder: false
    },
    
    // 课程列表
    courses: [],
    
    // 当前选中的课程索引
    courseIndex: 0,
    
    // 当前显示的课程名
    selectedCourseName: '请选择课程',
    
    // 表单验证错误
    errors: {
      title: '',
      courseId: ''
    },
    
    // 时间选择器
    date: '',
    time: '',
    
    // 今天日期（用于限制最小日期）
    today: '',
    
    // 最大可选日期（一年后）
    maxDate: ''
  },

  onLoad: function(options) {
    console.log('📱 添加/编辑页加载，参数:', options);
    
    // 初始化日期
    this.initDates();
    
    // 加载课程列表
    this.loadCourses();
    
    // 判断模式
    if (options.id && options.edit === 'true') {
      this.setData({ mode: 'edit' });
      this.loadAssignmentData(options.id);
      wx.setNavigationBarTitle({ title: '编辑作业' });
    } else {
      this.initAddMode();
    }
  },

  // 初始化日期
  initDates: function() {
    const now = new Date();
    const today = this.formatDate(now, 'YYYY-MM-DD');
    const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    const maxDate = this.formatDate(oneYearLater, 'YYYY-MM-DD');
    
    this.setData({
      today,
      maxDate
    });
  },

  // 加载课程列表
  loadCourses: function() {
    const courses = wx.getStorageSync('courses') || [];
    
    // 如果没有课程，创建默认课程
    if (courses.length === 0) {
      const defaultCourses = [
        { id: 1, name: '高等数学', color: '#ff4d4f', teacher: '张老师' },
        { id: 2, name: '大学英语', color: '#1890ff', teacher: '李老师' },
        { id: 3, name: '数据结构', color: '#52c41a', teacher: '王老师' }
      ];
      wx.setStorageSync('courses', defaultCourses);
      this.setData({ 
        courses: defaultCourses,
        selectedCourseName: defaultCourses[0].name
      });
    } else {
      this.setData({ 
        courses,
        selectedCourseName: courses[0]?.name || '请选择课程'
      });
    }
    
    console.log('📚 课程列表:', this.data.courses.length, '门');
  },

  // 加载作业数据（编辑模式）
  loadAssignmentData: function(assignmentId) {
    console.log('📥 加载作业数据，ID:', assignmentId);
    
    const assignments = wx.getStorageSync('assignments') || [];
    
    // 使用字符串比较查找
    const assignment = assignments.find(item => 
      String(item.id) === String(assignmentId)
    );
    
    if (!assignment) {
      console.error('❌ 未找到作业:', assignmentId);
      wx.showToast({
        title: '作业不存在',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    console.log('✅ 找到作业:', assignment);
    
    // 处理日期
    let date = '', time = '';
    if (assignment.dueDate) {
      const dueDate = new Date(assignment.dueDate);
      date = this.formatDate(dueDate, 'YYYY-MM-DD');
      time = this.formatDate(dueDate, 'HH:mm');
    }
    
    // 计算课程索引
    const { courses } = this.data;
    const courseIndex = courses.findIndex(c => 
      String(c.id) === String(assignment.courseId)
    );
    
    const selectedCourse = courses[courseIndex] || courses[0];
    
    // 更新表单数据
    this.setData({
      'formData': {
        ...assignment,
        id: String(assignment.id),
        courseId: assignment.courseId ? String(assignment.courseId) : '',
        priority: Number(assignment.priority) || 1,
        status: Number(assignment.status) || 0
      },
      date,
      time,
      courseIndex: courseIndex >= 0 ? courseIndex : 0,
      selectedCourseName: selectedCourse ? selectedCourse.name : '请选择课程'
    });
  },

  // 初始化添加模式
  initAddMode: function() {
    // 设置默认时间为明天同一时间
    const tomorrow = new Date(Date.now() + 86400000);
    const date = this.formatDate(tomorrow, 'YYYY-MM-DD');
    const time = this.formatDate(tomorrow, 'HH:mm');
    
    this.setData({
      date,
      time,
      'formData.dueDate': tomorrow.toISOString()
    });
  },

  // 表单输入处理
  onInputChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [`formData.${field}`]: value,
      [`errors.${field}`]: ''  // 清空错误
    });
  },

  // 课程选择
  onCourseChange: function(e) {
    const index = e.detail.value;
    const { courses } = this.data;
    
    if (index >= 0 && index < courses.length) {
      const course = courses[index];
      this.setData({
        'formData.courseId': String(course.id),
        'errors.courseId': '',
        courseIndex: index,
        selectedCourseName: course.name
      });
    }
  },

  // 日期选择
  onDateChange: function(e) {
    const date = e.detail.value;
    this.setData({ date }, () => {
      this.updateDueDate();
    });
  },

  // 时间选择
  onTimeChange: function(e) {
    const time = e.detail.value;
    this.setData({ time }, () => {
      this.updateDueDate();
    });
  },

  // 更新截止时间
  updateDueDate: function() {
    const { date, time } = this.data;
    if (date && time) {
      const dueDate = new Date(`${date}T${time}:00`);
      this.setData({
        'formData.dueDate': dueDate.toISOString()
      });
    }
  },

  // 优先级选择
  onPriorityChange: function(e) {
    const priority = parseInt(e.currentTarget.dataset.priority);
    this.setData({
      'formData.priority': priority
    });
  },

  // 状态选择
  onStatusChange: function(e) {
    const status = parseInt(e.currentTarget.dataset.status);
    this.setData({
      'formData.status': status
    });
  },

  // 提醒开关
  onReminderChange: function(e) {
    this.setData({
      'formData.reminder': e.detail.value
    });
  },

  // 表单验证
  validateForm: function() {
    const { formData } = this.data;
    const errors = {};
    let isValid = true;
    
    // 验证标题
    if (!formData.title || formData.title.trim() === '') {
      errors.title = '请输入作业标题';
      isValid = false;
    } else if (formData.title.length > 50) {
      errors.title = '标题不能超过50个字';
      isValid = false;
    }
    
    // 验证课程
    if (!formData.courseId) {
      errors.courseId = '请选择课程';
      isValid = false;
    }
    
    this.setData({ errors });
    return isValid;
  },

  // 保存作业
  onSave: function() {
    if (!this.validateForm()) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'error'
      });
      return;
    }
    
    const { mode, formData } = this.data;
    const assignments = wx.getStorageSync('assignments') || [];
    
    console.log(`💾 ${mode === 'add' ? '添加' : '编辑'}作业:`, formData.title);
    
    if (mode === 'add') {
      // 添加新作业
      const newAssignment = {
        ...formData,
        id: 'assignment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      assignments.push(newAssignment);
      
      wx.showToast({
        title: '添加成功',
        icon: 'success',
        duration: 1500
      });
      
    } else {
      // 编辑现有作业
      const index = assignments.findIndex(item => 
        String(item.id) === String(formData.id)
      );
      
      if (index === -1) {
        wx.showToast({
          title: '作业不存在',
          icon: 'error'
        });
        return;
      }
      
      // 保留创建时间
      const createdAt = assignments[index].createdAt;
      
      assignments[index] = {
        ...assignments[index],
        ...formData,
        createdAt, // 保留原创建时间
        updatedAt: new Date().toISOString()
      };
      
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1500
      });
    }
    
    // 保存到存储
    wx.setStorageSync('assignments', assignments);
    
    // 延迟返回
    setTimeout(() => {
      this.goBack();
    }, 1500);
  },

  // 删除作业（仅编辑模式）
  onDelete: function() {
    const { formData } = this.data;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${formData.title}"吗？此操作不可恢复。`,
      confirmColor: '#ff4d4f',
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
    const assignments = wx.getStorageSync('assignments') || [];
    
    const filtered = assignments.filter(item => 
      String(item.id) !== String(formData.id)
    );
    
    if (assignments.length === filtered.length) {
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
      return;
    }
    
    wx.setStorageSync('assignments', filtered);
    
    wx.showToast({
      title: '删除成功',
      icon: 'success',
      duration: 1500
    });
    
    // 返回列表页
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/assignment/assignment'
      });
    }, 1500);
  },

  // 返回
  goBack: function() {
    if (this.data.mode === 'add') {
      // 添加模式返回列表页
      wx.switchTab({
        url: '/pages/assignment/assignment'
      });
    } else {
      // 编辑模式返回详情页
      wx.navigateBack();
    }
  },

  // 取消编辑
  onCancel: function() {
    wx.navigateBack();
  },

  // 工具函数：日期格式化
  formatDate: function(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
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
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '添加作业',
      path: '/pages/add-assignment/add-assignment'
    };
  }
});