// app.js
App({
  onLaunch: function () {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-8gp2izmn9146f1c9',  // 你的环境ID
        traceUser: true
      })
    }
    // 初始化检查
    this.checkUpdate();
    this.initSystemInfo();
    this.initStorage();
    
    // 检查登录状态
    this.checkLoginStatus();
  },
  
  onShow: function () {
    // 小程序显示时检查提醒
    this.checkReminders();
  },
  
  globalData: {
    userInfo: null,
    systemInfo: null,
    courses: [], // 课程数据
    assignments: [], // 作业数据
    themeColor: '#1890ff',
    isLogin: false
  },
  
  // 检查更新
  checkUpdate: function() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate(function (res) {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            wx.showModal({
              title: '更新提示',
              content: '新版本已准备好，是否重启应用？',
              success: function (res) {
                if (res.confirm) {
                  updateManager.applyUpdate();
                }
              }
            });
          });
        }
      });
    }
  },
  
  // 获取系统信息
  initSystemInfo: function() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;
      console.log('系统信息:', systemInfo);
    } catch (e) {
      console.error('获取系统信息失败:', e);
    }
  },
  
  // 初始化本地存储
  initStorage: function() {
    // 检查是否有初始化数据
    const courses = wx.getStorageSync('courses') || [];
    const assignments = wx.getStorageSync('assignments') || [];
    
    if (courses.length === 0) {
      // 初始化示例课程
      const defaultCourses = [
        { id: 1, name: '高等数学', color: '#ff4d4f', teacher: '张老师' },
        { id: 2, name: '大学英语', color: '#1890ff', teacher: '李老师' },
        { id: 3, name: '数据结构', color: '#52c41a', teacher: '王老师' }
      ];
      wx.setStorageSync('courses', defaultCourses);
      this.globalData.courses = defaultCourses;
    } else {
      this.globalData.courses = courses;
    }
    
    if (assignments.length === 0) {
      // 初始化示例作业
      const defaultAssignments = [
        {
          id: 1,
          title: '高数作业第三章',
          courseId: 1,
          dueDate: '2026-02-05 23:59',
          description: '完成课后习题1-10题',
          priority: 2,
          status: 0, // 0=未完成, 1=进行中, 2=已完成
          reminder: ['2026-02-04 20:00']
        }
      ];
      wx.setStorageSync('assignments', defaultAssignments);
      this.globalData.assignments = defaultAssignments;
    } else {
      this.globalData.assignments = assignments;
    }
  },
  
  // 检查登录状态
  checkLoginStatus: function() {
    const token = wx.getStorageSync('token');
    this.globalData.isLogin = !!token;
    
    if (!token) {
      // 可以跳转到登录页
      // wx.navigateTo({ url: '/pages/login/login' });
    }
  },
  
  // 检查提醒
  checkReminders: function() {
    const now = new Date();
    const assignments = this.globalData.assignments;
    
    assignments.forEach(assignment => {
      if (assignment.reminder && assignment.status === 0) {
        assignment.reminder.forEach(reminderTime => {
          const reminderDate = new Date(reminderTime);
          if (reminderDate <= now && reminderDate > now - 60000) { // 1分钟内
            this.showReminderNotification(assignment);
          }
        });
      }
    });
  },
  
  // 显示提醒通知
  showReminderNotification: function(assignment) {
    wx.showModal({
      title: '作业提醒',
      content: `${assignment.title} 即将截止`,
      confirmText: '查看详情',
      cancelText: '稍后提醒',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/assignment-detail/assignment-detail?id=${assignment.id}`
          });
        }
      }
    });
  }
});
