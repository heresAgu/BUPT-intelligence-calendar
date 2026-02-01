// pages/index/index.js
Page({
  data: {
    currentDate: '', // 当前选中日期
    assignments: [], // 当日作业
    markedDates: {}, // 有作业的日期标记
  },

  onLoad: function() {
    this.initData();
  },
  
  onShow: function() {
    this.loadAssignments();
  },

  // 初始化数据
  initData: function() {
    const now = new Date();
    const currentDate = this.formatDate(now, 'YYYY-MM-DD');
    
    this.setData({
      currentDate: currentDate
    });
  },

  // 日期格式化函数
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

  // 加载作业数据
  loadAssignments: function() {
    console.log('📱 首页加载作业数据');
    
    // 统一从本地存储获取数据
    const allAssignments = wx.getStorageSync('assignments') || [];
    const courses = wx.getStorageSync('courses') || [];
    const markedDates = {};
    
    console.log('📊 总作业数:', allAssignments.length);
    
    // 关联课程信息
    const assignmentsWithCourse = allAssignments.map(assignment => {
      const course = courses.find(c => String(c.id) === String(assignment.courseId)) || {};
      return {
        ...assignment,
        courseName: course.name || '未分类',
        courseColor: course.color || '#1890ff',
        formattedDueTime: assignment.dueDate ? this.formatDate(assignment.dueDate, 'MM-DD HH:mm') : '无截止时间'
      };
    });
    
    // 标记有作业的日期
    assignmentsWithCourse.forEach(assignment => {
      if (assignment.dueDate) {
        try {
          const dueDate = new Date(assignment.dueDate);
          const dateStr = this.formatDate(dueDate, 'YYYY-MM-DD');
          
          if (!markedDates[dateStr]) {
            markedDates[dateStr] = {
              marked: true,
              dotColor: this.getPriorityColor(assignment.priority)
            };
          }
        } catch (e) {
          console.error('日期解析错误:', e);
        }
      }
    });

    // 获取当日作业
    const today = new Date();
    const todayStr = this.formatDate(today, 'YYYY-MM-DD');
    const todayAssignments = assignmentsWithCourse.filter(item => {
      if (!item.dueDate) return false;
      
      try {
        const dueDate = new Date(item.dueDate);
        const dueDateStr = this.formatDate(dueDate, 'YYYY-MM-DD');
        return dueDateStr === todayStr;
      } catch (e) {
        return false;
      }
    });

    this.setData({
      assignments: todayAssignments,
      markedDates: markedDates
    });
    
    console.log('📅 今日作业:', todayAssignments.length, '个');
    console.log('📅 标记日期:', Object.keys(markedDates).length, '个');
  },

  // 根据优先级获取颜色
  getPriorityColor: function(priority) {
    const colors = {
      0: '#52c41a', // 低优先级 - 绿色
      1: '#faad14', // 中优先级 - 橙色
      2: '#ff4d4f'  // 高优先级 - 红色
    };
    return colors[priority] || '#d9d9d9';
  },

  // 日期选择事件
  onDateChange: function(e) {
    const selectedDate = e.detail.value;
    console.log('📅 选择日期:', selectedDate);
    
    this.setData({
      currentDate: selectedDate
    });
    this.filterAssignmentsByDate(selectedDate);
  },

  // 根据日期筛选作业
  filterAssignmentsByDate: function(date) {
    const allAssignments = wx.getStorageSync('assignments') || [];
    const courses = wx.getStorageSync('courses') || [];
    
    const filtered = allAssignments.filter(item => {
      if (!item.dueDate) return false;
      
      try {
        const dueDate = new Date(item.dueDate);
        const dueDateStr = this.formatDate(dueDate, 'YYYY-MM-DD');
        return dueDateStr === date;
      } catch (e) {
        return false;
      }
    });
    
    // 关联课程信息
    const assignmentsWithCourse = filtered.map(assignment => {
      const course = courses.find(c => String(c.id) === String(assignment.courseId)) || {};
      return {
        ...assignment,
        courseName: course.name || '未分类',
        courseColor: course.color || '#1890ff',
        formattedDueTime: assignment.dueDate ? this.formatDate(assignment.dueDate, 'MM-DD HH:mm') : '无截止时间'
      };
    });
    
    this.setData({
      assignments: assignmentsWithCourse
    });
    
    console.log('🔍 按日期筛选结果:', assignmentsWithCourse.length, '个作业');
  },

  // 跳转到添加作业页面
  goToAddAssignment: function() {
    console.log('➕ 跳转到添加作业页面');
    wx.navigateTo({
      url: '/pages/add-assignment/add-assignment'
    });
  },

  // 跳转到作业详情
  goToAssignmentDetail: function(e) {
    const assignmentId = e.currentTarget.dataset.id;
    console.log('🔍 查看作业详情:', assignmentId);
    
    if (!assignmentId) {
      wx.showToast({
        title: '无法查看详情',
        icon: 'error'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/assignment-detail/assignment-detail?id=${assignmentId}`
    });
  },

  // 标记作业完成
  markAsComplete: function(e) {
    e.stopPropagation();
    
    const assignmentId = e.currentTarget.dataset.id;
    console.log('✅ 标记完成，作业ID:', assignmentId);
    
    wx.showModal({
      title: '确认完成',
      content: '标记为已完成？',
      success: (res) => {
        if (res.confirm) {
          // 获取所有作业
          const assignments = wx.getStorageSync('assignments') || [];
          const index = assignments.findIndex(item => 
            String(item.id) === String(assignmentId)
          );
          
          if (index !== -1) {
            assignments[index].status = 2; // 标记为已完成
            assignments[index].completedAt = new Date().toISOString();
            
            // 保存到存储
            wx.setStorageSync('assignments', assignments);
            
            // 重新加载数据
            this.loadAssignments();
            
            wx.showToast({
              title: '已完成',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: '作业不存在',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 跳转到全部作业页面
  viewAllAssignments: function() {
    console.log('📋 跳转到全部作业页面');
    wx.switchTab({
      url: '/pages/assignment/assignment'
    });
  },

  // 扫码添加作业（模拟功能）
  scanAssignment: function() {
    console.log('📷 扫码添加作业');
    
    wx.showModal({
      title: '扫码添加',
      content: '扫描作业二维码或条形码快速添加',
      confirmText: '模拟扫描',
      success: (res) => {
        if (res.confirm) {
          // 模拟扫描到的数据
          const scannedData = {
            title: '扫描添加的作业',
            course: '自动识别课程',
            dueDate: '2026-06-01'
          };
          
          wx.showModal({
            title: '扫描结果',
            content: `标题: ${scannedData.title}\n课程: ${scannedData.course}\n截止: ${scannedData.dueDate}`,
            confirmText: '添加',
            success: (result) => {
              if (result.confirm) {
                // 跳转到添加页面
                wx.navigateTo({
                  url: '/pages/add-assignment/add-assignment'
                });
              }
            }
          });
        }
      }
    });
  }
});