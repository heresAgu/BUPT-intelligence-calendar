// pages/index/index.js
Page({
  data: {
    currentDate: '', // 当前选中日期
    assignments: [], // 当日作业
    markedDates: {}, // 有作业的日期标记
    calendarConfig: {
      firstDayOfWeek: 1, // 周一为第一天
      showLunar: false,
      highlightToday: true
    }
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
    const currentDate = now.toISOString().split('T')[0];
    
    this.setData({
      currentDate: currentDate
    });
  },

  // 加载作业数据
  loadAssignments: function() {
    const app = getApp();
    const allAssignments = app.globalData.assignments;
    const markedDates = {};
    
    // 标记有作业的日期
    allAssignments.forEach(assignment => {
      if (assignment.dueDate) {
        const dateStr = assignment.dueDate.split(' ')[0];
        if (!markedDates[dateStr]) {
          markedDates[dateStr] = {
            marked: true,
            dotColor: this.getPriorityColor(assignment.priority)
          };
        }
      }
    });

    // 获取当日作业
    const todayAssignments = allAssignments.filter(item => {
      const dueDate = item.dueDate ? item.dueDate.split(' ')[0] : '';
      return dueDate === this.data.currentDate;
    });

    this.setData({
      assignments: todayAssignments,
      markedDates: markedDates
    });
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
    this.setData({
      currentDate: selectedDate
    });
    this.filterAssignmentsByDate(selectedDate);
  },

  // 根据日期筛选作业
  filterAssignmentsByDate: function(date) {
    const app = getApp();
    const allAssignments = app.globalData.assignments;
    
    const filtered = allAssignments.filter(item => {
      const dueDate = item.dueDate ? item.dueDate.split(' ')[0] : '';
      return dueDate === date;
    });
    
    this.setData({
      assignments: filtered
    });
  },

  // 跳转到添加作业页面
  goToAddAssignment: function() {
    wx.navigateTo({
      url: '/pages/add-assignment/add-assignment'
    });
  },

  // 跳转到作业详情
  goToAssignmentDetail: function(e) {
    const assignmentId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/assignment-detail/assignment-detail?id=${assignmentId}`
    });
  },

  // 标记作业完成
  markAsComplete: function(e) {
    const assignmentId = e.currentTarget.dataset.id;
    const app = getApp();
    
    // 更新作业状态
    const assignments = app.globalData.assignments;
    const index = assignments.findIndex(item => item.id === assignmentId);
    
    if (index !== -1) {
      assignments[index].status = 2; // 标记为已完成
      app.globalData.assignments = assignments;
      wx.setStorageSync('assignments', assignments);
      
      // 重新加载数据
      this.loadAssignments();
      
      wx.showToast({
        title: '已完成',
        icon: 'success'
      });
    }
  }
});