// pages/assignment-detail/assignment-detail.js
const utils = require('../../utils/index.js');

Page({
  data: {
    // 页面状态
    isLoading: true,
    isError: false,
    errorMsg: '',
    
    // 作业数据
    assignment: {
      id: '',
      title: '加载中...',
      courseId: '',
      courseName: '',
      dueDate: '',
      formattedDueTime: '',
      priority: 1,
      status: 0,
      description: '',
      teacher: '',
      createdAt: '',
      createdAtText: '',
      completedAt: '',
      completedAtText: '',
      timeLeftText: '计算中...',
      urgentClass: 'normal'
    },
    
    // 当前作业ID
    assignmentId: ''
  },

  onLoad: function(options) {
    console.log('📱 作业详情页加载，参数:', options);
    
    // 检查是否有传递作业ID
    if (!options || !options.id) {
      this.setData({
        isLoading: false,
        isError: true,
        errorMsg: '未指定作业ID'
      });
      return;
    }
    
    const assignmentId = options.id;
    this.setData({ assignmentId });
    
    // 加载作业数据
    this.loadAssignmentData(assignmentId);
  },

  onShow: function() {
    // 页面显示时刷新数据（从编辑页返回时可能需要）
    if (this.data.assignmentId && !this.data.isLoading) {
      console.log('🔄 页面显示，刷新数据');
      this.loadAssignmentData(this.data.assignmentId);
    }
  },

  // 加载作业数据
  loadAssignmentData: function(assignmentId) {
    this.setData({ isLoading: true, isError: false });
    
    // 获取所有作业
    const allAssignments = wx.getStorageSync('assignments') || [];
    const courses = wx.getStorageSync('courses') || [];
    
    console.log('🔍 查找作业，ID:', assignmentId);
    console.log('📊 总作业数:', allAssignments.length);
    
    // 查找指定作业
    const assignment = allAssignments.find(item => item.id === assignmentId);
    
    if (!assignment) {
      console.error('❌ 未找到作业:', assignmentId);
      this.setData({
        isLoading: false,
        isError: true,
        errorMsg: '作业不存在或已被删除'
      });
      return;
    }
    
    console.log('✅ 找到作业:', assignment);
    
    // 关联课程信息
    const course = courses.find(c => c.id === assignment.courseId) || {};
    
    // 处理日期
    const createdAtText = assignment.createdAt ? 
      this.formatDate(assignment.createdAt, 'YYYY-MM-DD HH:mm') : '';
    
    const completedAtText = assignment.completedAt ? 
      this.formatDate(assignment.completedAt, 'YYYY-MM-DD HH:mm') : '';
    
    const formattedDueTime = assignment.dueDate ? 
      this.formatDate(assignment.dueDate, 'YYYY-MM-DD HH:mm') : '无截止时间';
    
    // 计算剩余时间
    const timeLeftText = this.getTimeLeftText(assignment.dueDate);
    const urgentClass = this.getUrgentClass(assignment.dueDate, assignment.status);
    
    // 更新页面数据
    this.setData({
      isLoading: false,
      assignment: {
        ...assignment,
        courseName: course.name || '未分类',
        teacher: course.teacher || assignment.teacher || '',
        createdAtText,
        completedAtText,
        formattedDueTime,
        timeLeftText,
        urgentClass
      }
    });
    
    // 更新页面标题
    wx.setNavigationBarTitle({
      title: assignment.title.length > 10 ? 
        assignment.title.substring(0, 10) + '...' : assignment.title
    });
  },

  // 日期格式化函数
  formatDate: function(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    
    try {
      // 处理不同格式的日期字符串
      let dateStr = date;
      if (typeof dateStr === 'string') {
        // 将 "YYYY-MM-DD HH:mm" 转为 "YYYY-MM-DDTHH:mm:00"
        if (dateStr.includes(' ') && !dateStr.includes('T')) {
          dateStr = dateStr.replace(' ', 'T') + ':00';
        }
      }
      
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return date; // 返回原始字符串
      }
      
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
    } catch (error) {
      console.error('日期格式化错误:', error, date);
      return date;
    }
  },

  // 获取剩余时间文本
  getTimeLeftText: function(dueDate) {
    if (!dueDate) return '无截止时间';
    
    try {
      const now = new Date();
      const due = new Date(dueDate);
      const diffMs = due - now;
      
      if (diffMs < 0) {
        return '已过期';
      }
      
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        return `${diffDays}天后截止`;
      } else if (diffHours > 0) {
        return `${diffHours}小时后截止`;
      } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes <= 0) {
          return '即将截止';
        }
        return `${diffMinutes}分钟后截止`;
      }
    } catch (error) {
      return '时间错误';
    }
  },

  // 获取紧急程度样式类
  getUrgentClass: function(dueDate, status) {
    if (status === 2) return 'normal'; // 已完成
    
    if (!dueDate) return 'normal';
    
    try {
      const now = new Date();
      const due = new Date(dueDate);
      const diffHours = (due - now) / (1000 * 60 * 60);
      
      if (diffHours < 24) return 'urgent';
      if (diffHours < 72) return 'warning';
      return 'normal';
    } catch (error) {
      return 'normal';
    }
  },

  // 标记为已完成
  markAsComplete: function() {
    const { assignment } = this.data;
    
    wx.showModal({
      title: '确认完成',
      content: `确定要将"${assignment.title}"标记为已完成吗？`,
      success: (res) => {
        if (res.confirm) {
          this.updateAssignmentStatus(2, '已完成');
        }
      }
    });
  },

  // 取消完成（标记为未完成）
  markAsIncomplete: function() {
    const { assignment } = this.data;
    
    wx.showModal({
      title: '取消完成',
      content: `确定要将"${assignment.title}"标记为未完成吗？`,
      success: (res) => {
        if (res.confirm) {
          this.updateAssignmentStatus(0, '未开始');
        }
      }
    });
  },

  // 更新作业状态
  updateAssignmentStatus: function(newStatus, statusText) {
    const { assignmentId } = this.data;
    
    // 获取所有作业
    const assignments = wx.getStorageSync('assignments') || [];
    const index = assignments.findIndex(item => item.id === assignmentId);
    
    if (index === -1) {
      wx.showToast({
        title: '作业不存在',
        icon: 'error'
      });
      return;
    }
    
    // 更新作业状态
    assignments[index].status = newStatus;
    
    if (newStatus === 2) {
      // 标记完成时记录完成时间
      assignments[index].completedAt = new Date().toISOString();
    } else {
      // 取消完成时清除完成时间
      assignments[index].completedAt = '';
    }
    
    // 保存到存储
    wx.setStorageSync('assignments', assignments);
    
    // 重新加载数据
    this.loadAssignmentData(assignmentId);
    
    // 显示成功提示
    wx.showToast({
      title: `已标记为${statusText}`,
      icon: 'success',
      duration: 2000
    });
    
    // 返回上一页（可选）
    setTimeout(() => {
      this.goBackToList();
    }, 1500);
  },

  // 编辑作业
  editAssignment: function() {
    const { assignmentId } = this.data;
    
    console.log('📝 编辑作业:', assignmentId);
    
    wx.navigateTo({
      url: `/pages/add-assignment/add-assignment?id=${assignmentId}&edit=true`
    });
  },

  // 删除作业
  deleteAssignment: function() {
    const { assignment } = this.data;
    
    wx.showModal({
      title: '删除确认',
      content: `确定要删除"${assignment.title}"吗？此操作不可恢复。`,
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
    const { assignmentId } = this.data;
    
    // 获取所有作业
    const assignments = wx.getStorageSync('assignments') || [];
    const filtered = assignments.filter(item => item.id !== assignmentId);
    
    if (assignments.length === filtered.length) {
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
      return;
    }
    
    // 保存到存储
    wx.setStorageSync('assignments', filtered);
    
    wx.showToast({
      title: '删除成功',
      icon: 'success',
      duration: 1500
    });
    
    // 延迟返回列表页
    setTimeout(() => {
      this.goBackToList();
    }, 1500);
  },

  // 返回列表页
  goBackToList: function() {
    // 尝试返回上一页
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      // 如果没有上一页，跳转到作业列表页
      wx.switchTab({
        url: '/pages/assignment/assignment'
      });
    }
  },

  // 返回按钮（用于错误状态）
  goBack: function() {
    this.goBackToList();
  },

  // 分享功能
  onShareAppMessage: function() {
    const { assignment } = this.data;
    
    return {
      title: `作业：${assignment.title}`,
      path: `/pages/assignment-detail/assignment-detail?id=${assignment.id}`,
      imageUrl: '/assets/images/share-cover.png'
    };
  }
});