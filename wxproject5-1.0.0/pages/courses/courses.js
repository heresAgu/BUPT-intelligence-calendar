// pages/courses/courses.js
Page({
  data: {
    // 课程列表
    courses: [],
    
    // 搜索和筛选
    searchKeyword: '',
    showFilter: false,
    
    // 操作状态
    selectedCourseId: '',
    showActionSheet: false,
    
    // 空状态
    showEmptyState: false
  },

  onLoad: function() {
    // 初始化一些测试数据
    this.initTestData();
    this.loadCourses();
  },

  onShow: function() {
    this.loadCourses();
  },

  // 初始化测试数据
initTestData: function() {
  const courses = wx.getStorageSync('courses') || [];
  
  if (courses.length === 0) {
    const testCourses = [
      {
        id: '1',  // 改为简单ID，与编辑按钮传递的一致
        name: '高等数学',
        teacher: '张老师',
        time: '周一1-2节',
        classroom: 'A101',
        color: '#ff4d4f'
      },
      {
        id: '2',  // 改为简单ID
        name: '大学英语',
        teacher: '李老师',
        time: '周二3-4节',
        classroom: 'B201',
        color: '#1890ff'
      },
      {
        id: '3',  // 改为简单ID
        name: '数据结构',
        teacher: '王老师',
        time: '周三5-6节',
        classroom: 'C301',
        color: '#52c41a'
      }
    ];
    
    wx.setStorageSync('courses', testCourses);
    console.log('初始化测试数据完成，ID:', testCourses.map(c => c.id));
  }
},

  // 加载课程数据
  loadCourses: function() {
    const courses = wx.getStorageSync('courses') || [];
    
    // 为每个课程添加统计信息
    const assignments = wx.getStorageSync('assignments') || [];
    
    const coursesWithStats = courses.map(course => {
      const courseAssignments = assignments.filter(
        assignment => String(assignment.courseId) === String(course.id)
      );
      
      return {
        ...course,
        assignmentCount: courseAssignments.length,
        completedCount: courseAssignments.filter(a => a.status === 2).length,
        pendingCount: courseAssignments.filter(a => a.status !== 2).length
      };
    });
    
    this.setData({
      courses: coursesWithStats,
      showEmptyState: coursesWithStats.length === 0
    });
    
    console.log('加载课程完成，数量:', coursesWithStats.length);
  },

  // 搜索课程
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
    
    // 防抖处理
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.filterCourses();
    }, 300);
  },

  // 筛选课程
  filterCourses: function() {
    const { searchKeyword, courses: allCourses } = this.data;
    
    if (!searchKeyword.trim()) {
      this.loadCourses(); // 重新加载所有课程
      return;
    }
    
    const keyword = searchKeyword.toLowerCase();
    const filtered = allCourses.filter(course =>
      course.name.toLowerCase().includes(keyword) ||
      (course.teacher && course.teacher.toLowerCase().includes(keyword))
    );
    
    this.setData({ 
      courses: filtered,
      showEmptyState: filtered.length === 0
    });
  },

  // 添加课程
  goToAddCourse: function() {
    wx.navigateTo({
      url: '/pages/add-course/add-course'
    });
  },

  // 编辑课程
  goToEditCourse: function(e) {
    
    const courseId = e.currentTarget.dataset.id;
    console.log('编辑课程，ID:', courseId);
    
    if (!courseId) {
      wx.showToast({
        title: '无法编辑',
        icon: 'error'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/add-course/add-course?id=${courseId}&edit=true`
    });
  },

  // 查看课程详情
  viewCourseDetail: function(e) {
    const courseId = e.currentTarget.dataset.id;
    console.log('查看课程详情，ID:', courseId);
    
    if (!courseId) {
      wx.showToast({
        title: '无法查看详情',
        icon: 'error'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/course-detail/course-detail?id=${courseId}`
    });
  },

  // 长按显示操作菜单
  onLongPressCourse: function(e) {
    const courseId = e.currentTarget.dataset.id;
    this.setData({
      selectedCourseId: courseId,
      showActionSheet: true
    });
  },

  // 操作菜单选择
  onActionSheetSelect: function(e) {
    const { index } = e.detail;
    const { selectedCourseId } = this.data;
    
    switch(index) {
      case 0: // 编辑
        this.goToEditCourse({ 
          currentTarget: { 
            dataset: { 
              id: selectedCourseId 
            } 
          } 
        });
        break;
      case 1: // 删除
        this.confirmDeleteCourse(selectedCourseId);
        break;
    }
    
    this.setData({ showActionSheet: false });
  },

  // 确认删除课程
  confirmDeleteCourse: function(courseId) {
    const course = this.data.courses.find(c => c.id === courseId);
    if (!course) return;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除课程"${course.name}"吗？\n删除后相关作业也会被删除。`,
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.deleteCourse(courseId);
        }
      }
    });
  },

  // 删除课程
  deleteCourse: function(courseId) {
    try {
      // 1. 删除课程
      const courses = wx.getStorageSync('courses') || [];
      const filteredCourses = courses.filter(course => course.id !== courseId);
      
      // 2. 删除相关作业
      const assignments = wx.getStorageSync('assignments') || [];
      const filteredAssignments = assignments.filter(
        assignment => String(assignment.courseId) !== String(courseId)
      );
      
      // 3. 保存数据
      wx.setStorageSync('courses', filteredCourses);
      wx.setStorageSync('assignments', filteredAssignments);
      
      // 4. 重新加载
      this.loadCourses();
      
      wx.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 1500
      });
    } catch (error) {
      console.error('删除课程失败:', error);
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
    }
  },

  // 跳转到OCR页面
  goToOCRImport: function() {
    wx.navigateTo({
      url: '/pages/ocr-course/ocr-course'
    });
  },

  
// 跳转到文本导入页面
goToTextImport: function() {
  wx.navigateTo({
    url: '/pages/import-course/import-course'
  });
},

  // 关闭操作菜单
  closeActionSheet: function() {
    this.setData({ showActionSheet: false });
  }
});