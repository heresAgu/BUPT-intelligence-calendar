// pages/course-detail/course-detail.js
Page({
  data: {
    courseId: '',
    courseData: {},
    relatedHomework: [],
    homeworkStats: {
      total: 0,
      completed: 0,
      pending: 0
    }
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({ courseId: options.id });
      this.loadCourseData(options.id);
    } else {
      wx.showToast({
        title: '课程不存在',
        icon: 'error'
      });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  // 加载课程数据
  loadCourseData: function(courseId) {
    const courses = wx.getStorageSync('courses') || [];
    const course = courses.find(c => String(c.id) === String(courseId));
    
    if (course) {
      this.setData({ courseData: course });
      this.loadRelatedHomework(courseId);
      wx.setNavigationBarTitle({ title: course.name });
    } else {
      wx.showToast({
        title: '课程不存在',
        icon: 'error'
      });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  // 加载相关作业
  loadRelatedHomework: function(courseId) {
    const allHomework = wx.getStorageSync('assignments') || [];
    const relatedHomework = allHomework.filter(hw => 
      String(hw.courseId) === String(courseId)
    );
    
    // 按截止日期排序
    const sortedHomework = relatedHomework.sort((a, b) => {
      return new Date(a.deadline) - new Date(b.deadline);
    });
    
    // 统计信息
    const homeworkStats = {
      total: relatedHomework.length,
      completed: relatedHomework.filter(hw => hw.completed).length,
      pending: relatedHomework.filter(hw => !hw.completed).length
    };
    
    this.setData({
      relatedHomework: sortedHomework,
      homeworkStats
    });
  },

  // 查看作业详情
  viewHomework: function(e) {
    const homeworkId = e.currentTarget.dataset.id;
    console.log('查看作业详情:', homeworkId);
    // 这里可以跳转到作业详情页
    wx.showToast({
      title: '查看作业详情',
      icon: 'none'
    });
  },

  // 编辑课程
  goToEdit: function() {
    const { courseId } = this.data;
    wx.navigateTo({
      url: `/pages/add-course/add-course?id=${courseId}&edit=true`
    });
  },

  // 确认删除
  confirmDelete: function() {
    const { courseData } = this.data;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除课程"${courseData.name}"吗？\n删除后相关作业也会被删除。`,
      confirmColor: '#ff4d4f',
      confirmText: '删除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.deleteCourse();
        }
      }
    });
  },

  // 删除课程
  deleteCourse: function() {
    const { courseId } = this.data;
    
    try {
      // 删除课程
      const courses = wx.getStorageSync('courses') || [];
      const filteredCourses = courses.filter(course => course.id !== courseId);
      
      // 删除相关作业
      const assignments = wx.getStorageSync('assignments') || [];
      const filteredAssignments = assignments.filter(
        assignment => String(assignment.courseId) !== String(courseId)
      );
      
      // 保存数据
      wx.setStorageSync('courses', filteredCourses);
      wx.setStorageSync('assignments', filteredAssignments);
      
      wx.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 1500
      });
      
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

  // 返回
  goBack: function() {
    wx.navigateBack();
  }
});