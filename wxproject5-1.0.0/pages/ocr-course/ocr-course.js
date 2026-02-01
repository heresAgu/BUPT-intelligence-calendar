// pages/ocr-course/ocr-course.js
Page({
  data: {
    // 页面状态
    status: 'idle', // idle:等待, selecting:选择中, uploading:上传中, recognizing:识别中, preview:预览结果, success:成功, error:错误
    errorMessage: '',
    
    // 图片信息
    imagePath: '',
    tempFileID: '',
    
    // OCR结果
    ocrResult: null,
    parsedCourses: [],
    
    // 颜色预设
    colorPresets: [
      '#ff4d4f', '#1890ff', '#52c41a', '#faad14',
      '#722ed1', '#13c2c2', '#f759ab', '#73d13d'
    ],
    
    isAllSelected: false,


    // 当前选中的行
    selectedRows: [],
    
    // 统计信息
    stats: {
      total: 0,
      selected: 0,
      imported: 0,
      duplicate: 0
    }
  },

  onLoad: function() {
    this.initCloud();
  },

  // 初始化云开发
  initCloud: function() {
    if (!wx.cloud) {
      this.showError('请使用微信6.6.6以上版本');
      return;
    }
    
    // 初始化云开发 - 替换为你的环境ID
    wx.cloud.init({
      env: 'cloud1-8gp2izmn9146f1c9', // 从你的截图看是这个环境ID
      traceUser: true
    });
    
    console.log('云开发初始化完成');
  },

  // 显示错误
  showError: function(message) {
    wx.showModal({
      title: '错误',
      content: message,
      showCancel: false
    });
  },

  // 选择图片
  chooseImage: function() {
    console.log('开始选择图片');
    this.setData({ status: 'selecting' });
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log('选择图片成功:', res.tempFilePaths[0]);
        this.uploadImage(res.tempFilePaths[0]);
      },
      fail: (error) => {
        console.error('选择图片失败:', error);
        this.setData({
          status: 'error',
          errorMessage: '选择图片失败'
        });
      }
    });
  },

  // 上传图片到云存储
  uploadImage: function(tempFilePath) {
    console.log('开始上传图片:', tempFilePath);
    this.setData({ status: 'uploading' });
    
    wx.showLoading({
      title: '上传图片中...',
      mask: true
    });
    
    // 生成唯一的文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 8);
    const cloudPath = `ocr-images/${timestamp}_${randomStr}.jpg`;
    
    console.log('云存储路径:', cloudPath);
    
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: tempFilePath,
      success: (res) => {
        console.log('上传成功，文件ID:', res.fileID);
        wx.hideLoading();
        
        this.setData({
          imagePath: tempFilePath,
          tempFileID: res.fileID
        });
        
        // 开始OCR识别
        this.performOCR(res.fileID);
      },
      fail: (error) => {
        console.error('上传失败:', error);
        wx.hideLoading();
        this.setData({
          status: 'error',
          errorMessage: '上传图片失败'
        });
      }
    });
  },

  // 执行OCR识别
  performOCR: function(fileID) {
    console.log('开始OCR识别，文件ID:', fileID);
    this.setData({ status: 'recognizing' });
    
    wx.showLoading({
      title: '正在识别课程表...',
      mask: true
    });
    
    // 调用云函数
    wx.cloud.callFunction({
      name: 'ocr-course-schedule', // 云函数名称
      data: {
        fileID: fileID,
        mode: 'table'
      },
      success: (res) => {
        console.log('OCR云函数调用成功，完整结果:', JSON.stringify(res, null, 2));
        console.log('result数据:', JSON.stringify(res.result, null, 2));
        
        wx.hideLoading();
        
        if (res.result && res.result.success) {
          this.processOCRResult(res.result);
        } else {
          // 更详细的错误处理
          console.error('云函数返回失败:', res.result);
          this.setData({
            status: 'error',
            errorMessage: res.result?.error?.message || 
                         res.result?.error?.code || 
                         'OCR识别失败'
          });
        }
      },
      fail: (error) => {
        console.error('调用云函数失败:', error);
        wx.hideLoading();
        this.setData({
          status: 'error',
          errorMessage: '网络请求失败'
        });
      }
    });
  },

  // 处理OCR结果
  processOCRResult: function(ocrResult) {
    console.log('处理OCR结果:', ocrResult);
    
    try {
      let courses = [];
      let rawData = ocrResult.data;
      
      // 模拟数据（如果云函数返回的是模拟数据）
      if (ocrResult.data && ocrResult.data.courses) {
        courses = ocrResult.data.courses;
      } 
      // 如果是真实OCR数据，这里需要添加解析逻辑
      else if (rawData && typeof rawData === 'object') {
        // 这里可以添加真实OCR数据的解析逻辑
        courses = [
          { name: '高等数学', teacher: '张老师', time: '周一1-2节', classroom: 'A101' },
          { name: '大学英语', teacher: '李老师', time: '周二3-4节', classroom: 'B201' }
        ];
      }
      
      console.log('解析出的课程数量:', courses.length);
      
      if (courses.length === 0) {
        throw new Error('未识别到课程信息');
      }
      
      // 自动分配颜色
      const coloredCourses = courses.map((course, index) => ({
        ...course,
        id: 'ocr_' + Date.now() + '_' + index,
        color: this.data.colorPresets[index % this.data.colorPresets.length],
        isNew: true
      }));
      
      this.setData({
        ocrResult: ocrResult,
        parsedCourses: coloredCourses,
        status: 'preview',
        selectedRows: coloredCourses.map(() => true),
        'stats.total': coloredCourses.length,
        'stats.selected': coloredCourses.length
      });
      
      wx.showToast({
        title: `识别到 ${coloredCourses.length} 个课程`,
        icon: 'success',
        duration: 2000
      });
      
    } catch (error) {
      console.error('解析OCR结果失败:', error);
      this.setData({
        status: 'error',
        errorMessage: error.message || '解析失败'
      });
    }
  },

  // 选择/取消选择课程
  toggleSelect: function(e) {
    const index = e.currentTarget.dataset.index;
    const selectedRows = [...this.data.selectedRows];
    selectedRows[index] = !selectedRows[index];
    
    const selectedCount = selectedRows.filter(Boolean).length;
    const isAllSelected = selectedRows.every(selected => selected);
  
    this.setData({
      selectedRows,
      'stats.selected': selectedCount,
      isAllSelected
    });
  },

  // 全选/全不选
  toggleSelectAll: function() {
  const allSelected = this.data.selectedRows.every(selected => selected);
  const selectedRows = this.data.selectedRows.map(() => !allSelected);
  const selectedCount = selectedRows.filter(Boolean).length;
  const isAllSelected = !allSelected;  // 取反

  this.setData({
    selectedRows,
    'stats.selected': selectedCount,
    isAllSelected
  });
},

  // 确认导入
  confirmImport: function() {
    const { parsedCourses, selectedRows } = this.data;
    
    const selectedCourses = parsedCourses.filter((_, index) => selectedRows[index]);
    
    if (selectedCourses.length === 0) {
      wx.showToast({
        title: '请选择要导入的课程',
        icon: 'error'
      });
      return;
    }
    
    wx.showModal({
      title: '确认导入',
      content: `确定要导入 ${selectedCourses.length} 个课程吗？`,
      success: (res) => {
        if (res.confirm) {
          this.doImport(selectedCourses);
        }
      }
    });
  },

  // 执行导入
  doImport: function(coursesToImport) {
    this.setData({ status: 'uploading' });
    
    wx.showLoading({
      title: '正在导入...',
      mask: true
    });
    
    try {
      // 获取现有课程
      const existingCourses = wx.getStorageSync('courses') || [];
      const existingCourseNames = new Set(existingCourses.map(course => course.name));
      
      // 过滤掉已存在的课程
      const newCourses = coursesToImport.filter(course => 
        !existingCourseNames.has(course.name)
      );
      
      if (newCourses.length === 0) {
        wx.hideLoading();
        wx.showToast({
          title: '没有新的课程可导入',
          icon: 'info'
        });
        this.setData({ status: 'preview' });
        return;
      }
      
      // 为每个课程生成唯一ID
      const coursesToSave = newCourses.map(course => ({
        id: 'course_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: course.name,
        teacher: course.teacher || '',
        time: course.time || '',
        classroom: course.classroom || '',
        color: course.color || '#1890ff'
      }));
      
      // 合并课程
      const allCourses = [...existingCourses, ...coursesToSave];
      
      // 保存到存储
      wx.setStorageSync('courses', allCourses);
      
      // 更新状态
      this.setData({
        status: 'success',
        'stats.imported': coursesToSave.length,
        'stats.duplicate': coursesToImport.length - coursesToSave.length
      });
      
      // 更新课程状态
      const updatedParsedCourses = this.data.parsedCourses.map(course => ({
        ...course,
        isImported: existingCourseNames.has(course.name) ? 'duplicate' : 'success'
      }));
      
      this.setData({ parsedCourses: updatedParsedCourses });
      
      wx.hideLoading();
      
      wx.showToast({
        title: `导入成功 ${coursesToSave.length} 个课程`,
        icon: 'success',
        duration: 3000
      });
      
      // 3秒后返回
      setTimeout(() => {
        wx.navigateBack();
      }, 3000);
      
    } catch (error) {
      console.error('导入失败:', error);
      wx.hideLoading();
      
      this.setData({
        status: 'error',
        errorMessage: '导入失败'
      });
    }
  },

  // 重新开始
  retry: function() {
    this.setData({
      status: 'idle',
      imagePath: '',
      tempFileID: '',
      ocrResult: null,
      parsedCourses: [],
      errorMessage: '',
      selectedRows: [],
      stats: {
        total: 0,
        selected: 0,
        imported: 0,
        duplicate: 0
      }
    });
  },

  // 返回
  goBack: function() {
    wx.navigateBack();
  },

  // 获取状态文本
  getStatusText: function(status) {
    const statusMap = {
      idle: '等待上传',
      selecting: '选择图片',
      uploading: '上传中...',
      recognizing: '识别中...',
      preview: '预览结果',
      success: '导入成功',
      error: '识别失败'
    };
    return statusMap[status] || '处理中';
  }
});