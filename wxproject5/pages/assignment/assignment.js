// pages/assignment/assignment.js
const utils = require('../../utils/index.js');

Page({
  data: {
    // 搜索和筛选
    searchKeyword: '',
    activeFilter: 'all', // 改为 'all' 作为默认值
    showFilterPanel: false,
    
    // 作业数据
    allAssignments: [],    // 所有原始作业
    filteredAssignments: [], // 筛选后的作业
    todayAssignments: [],
    weekAssignments: [],
    futureAssignments: [],
    
    // 空状态
    showEmptyState: false,
    
    // 当前日期
    todayDate: ''
  },

  onLoad: function(options) {
    this.initPage();
  },

  onShow: function() {
    this.loadAssignments();
  },

  // 初始化页面
  initPage: function() {
    const today = new Date();
    this.setData({
      todayDate: this.formatDate(today, 'MM月DD日')
    });
  },

  // 简单的日期格式化函数
  formatDate: function(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    const d = new Date(date);
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
    console.log('开始加载作业数据...');
    
    // 直接从存储获取数据
    const allAssignments = wx.getStorageSync('assignments') || [];
    const courses = wx.getStorageSync('courses') || [];
    
    console.log('原始作业数据:', allAssignments);
    
    // 如果没有数据，创建示例数据
    if (allAssignments.length === 0) {
      this.createSampleData();
      return;
    }
    
    // 关联课程信息
    const assignmentsWithCourse = allAssignments.map(assignment => {
      const course = courses.find(c => c.id === assignment.courseId) || {};
      return {
        ...assignment,
        courseName: course.name || '未分类',
        courseColor: course.color || '#1890ff',
        formattedDueTime: this.formatDate(assignment.dueDate, 'MM-DD HH:mm'),
        timeLeftText: this.getTimeLeftText(assignment.dueDate),
        urgentClass: this.getUrgentClass(assignment.dueDate, assignment.status),
        priorityClass: this.getPriorityClass(assignment.priority)
      };
    });

    // 保存原始数据
    this.setData({
      allAssignments: assignmentsWithCourse
    });
    
    // 应用筛选
    this.applyFilters();
  },

  // 创建示例数据
  createSampleData: function() {
    console.log('创建示例数据...');
    
    const now = new Date();
    const sampleAssignments = [
      {
        id: 'sample_1',
        title: '高等数学作业第三章',
        courseId: 1,
        dueDate: new Date(now.getTime() + 86400000).toISOString(), // 明天
        description: '完成课后习题1-10题',
        priority: 2,
        status: 0,
        createdAt: now.toISOString()
      },
      {
        id: 'sample_2',
        title: '英语作文：人工智能',
        courseId: 2,
        dueDate: new Date(now.getTime() + 259200000).toISOString(), // 3天后
        description: '写一篇关于AI的议论文',
        priority: 1,
        status: 1,
        createdAt: now.toISOString()
      },
      {
        id: 'sample_3',
        title: '数据结构实验报告（已完成）',
        courseId: 3,
        dueDate: new Date(now.getTime() - 86400000).toISOString(), // 昨天
        description: '二叉树遍历算法实现',
        priority: 0,
        status: 2,
        createdAt: now.toISOString()
      }
    ];
    
    const sampleCourses = [
      { id: 1, name: '高等数学', color: '#ff4d4f' },
      { id: 2, name: '大学英语', color: '#1890ff' },
      { id: 3, name: '数据结构', color: '#52c41a' }
    ];
    
    wx.setStorageSync('assignments', sampleAssignments);
    wx.setStorageSync('courses', sampleCourses);
    
    console.log('示例数据已创建');
    this.loadAssignments(); // 重新加载
  },

  // 应用所有筛选条件
  applyFilters: function() {
    const { allAssignments, searchKeyword, activeFilter } = this.data;
    
    let filtered = [...allAssignments];
    
    // 1. 状态筛选
    filtered = this.filterByStatus(filtered);
    
    // 2. 搜索筛选
    if (searchKeyword && searchKeyword.trim()) {
      filtered = this.filterByKeyword(filtered);
    }
    
    // 保存筛选结果
    this.setData({
      filteredAssignments: filtered
    });
    
    // 3. 时间分组
    this.groupAssignmentsByTime(filtered);
    
    // 判断空状态
    this.setData({
      showEmptyState: filtered.length === 0
    });
  },

  // 状态筛选
  filterByStatus: function(assignments) {
    const { activeFilter } = this.data;
    
    if (activeFilter === 'all') {
      return assignments;
    }
    
    const now = new Date();
    
    return assignments.filter(item => {
      const isOverdue = item.dueDate && new Date(item.dueDate) < now && item.status !== 2;
      
      switch(activeFilter) {
        case 'pending':
          return item.status === 0; // 未完成
        case 'inProgress':
          return item.status === 1; // 进行中
        case 'completed':
          return item.status === 2; // 已完成
        case 'overdue':
          return isOverdue; // 已过期
        default:
          return true;
      }
    });
  },

  // 关键词搜索筛选
  filterByKeyword: function(assignments) {
    const { searchKeyword } = this.data;
    const keyword = searchKeyword.toLowerCase().trim();
    
    return assignments.filter(item => {
      return (
        item.title.toLowerCase().includes(keyword) ||
        (item.courseName && item.courseName.toLowerCase().includes(keyword)) ||
        (item.description && item.description.toLowerCase().includes(keyword))
      );
    });
  },

  // 时间分组
  groupAssignmentsByTime: function(assignments) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const todayAssignments = [];
    const weekAssignments = [];
    const futureAssignments = [];
    
    assignments.forEach(assignment => {
      if (!assignment.dueDate) {
        futureAssignments.push(assignment);
        return;
      }
      
      const dueDate = new Date(assignment.dueDate);
      const assignmentDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      
      // 比较日期（忽略时间）
      if (assignmentDate.getTime() === today.getTime()) {
        todayAssignments.push(assignment);
      } else if (assignmentDate > today && assignmentDate <= oneWeekLater) {
        weekAssignments.push(assignment);
      } else {
        futureAssignments.push(assignment);
      }
    });
    
    // 按截止时间排序
    const sortByDueDate = (a, b) => new Date(a.dueDate) - new Date(b.dueDate);
    todayAssignments.sort(sortByDueDate);
    weekAssignments.sort(sortByDueDate);
    futureAssignments.sort(sortByDueDate);
    
    this.setData({
      todayAssignments,
      weekAssignments,
      futureAssignments
    });
  },

  // 获取剩余时间文本
  getTimeLeftText: function(dueDate) {
    if (!dueDate) return '无截止时间';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due - now;
    
    if (diffMs < 0) {
      return '已过期';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}天后`;
    } else if (diffHours > 0) {
      return `${diffHours}小时后`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}分钟后`;
    }
  },

  // 获取紧急程度样式类
  getUrgentClass: function(dueDate, status) {
    if (status === 2) return 'normal'; // 已完成
    
    if (!dueDate) return 'normal';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffHours = (due - now) / (1000 * 60 * 60);
    
    if (diffHours < 24) return 'urgent';
    if (diffHours < 72) return 'warning';
    return 'normal';
  },

  // 获取优先级样式类
  getPriorityClass: function(priority) {
    return ['low-priority', 'medium-priority', 'high-priority'][priority] || '';
  },

  // 事件处理函数
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    
    // 防抖处理
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    
    this.searchTimer = setTimeout(() => {
      this.applyFilters();
    }, 300);
  },

  // 状态筛选切换
  changeFilter: function(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      activeFilter: filter
    }, () => {
      this.applyFilters();
    });
  },

  // 查看详情
  viewAssignmentDetail: function(e) {
    const assignmentId = e.currentTarget.dataset.id;
    console.log('查看作业详情:', assignmentId);
    
  //   wx.showModal({
  //     title: '作业详情',
  //     content: '作业ID: ' + assignmentId + '\n（详情页功能待实现）',
  //     showCancel: false
  //   });
  // },
    wx.navigateTo({
    url: `/pages/assignment-detail/assignment-detail?id=${assignmentId}`
  });
},

  // 标记完成
  markAsComplete: function(e) {
    // 1. 先获取数据，再阻止事件冒泡
    const assignmentId = e.currentTarget.dataset.id;
    
    // 2. 使用正确的方式阻止事件冒泡
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    } else {
      // 如果e没有stopPropagation方法，使用catchtap已经阻止了冒泡
      console.log('事件对象异常，但继续执行标记完成逻辑');
    }
    
    wx.showModal({
      title: '确认完成',
      content: '标记为已完成？',
      success: (res) => {
        if (res.confirm) {
          // 获取当前所有作业
          const assignments = wx.getStorageSync('assignments') || [];
          const index = assignments.findIndex(item => item.id === assignmentId);
          
          if (index !== -1) {
            // 更新作业状态
            assignments[index].status = 2;
            assignments[index].completedAt = new Date().toISOString();
            
            // 保存到存储
            wx.setStorageSync('assignments', assignments);
            
            // 重新加载数据
            this.loadAssignments();
            
            wx.showToast({
              title: '已完成',
              icon: 'success'
            });
          }
        }
      }
    });
  },

  // 编辑作业
  editAssignment: function(e) {
    e.stopPropagation();
    const assignmentId = e.currentTarget.dataset.id;
    console.log('编辑作业:', assignmentId);
    
    wx.showToast({
      title: '编辑功能待实现',
      icon: 'none'
    });
  },

  // 添加作业
  goToAddAssignment: function() {
    wx.navigateTo({
      url: '/pages/add-assignment/add-assignment'
    });
  },

  // 显示筛选面板
  showFilterPanel: function() {
    this.setData({
      showFilterPanel: true
    });
  },

  // 隐藏筛选面板
  hideFilterPanel: function() {
    this.setData({
      showFilterPanel: false
    });
  }
});













