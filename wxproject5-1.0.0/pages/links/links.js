// pages/links/links.js
Page({
  data: {
    // 搜索和分类
    searchKeyword: '',
    activeCategory: 'all',
    categoryOptions: ['作业平台', '课程相关', '学校网站', '工具资源', '自定义'],
    
    // 链接数据
    allLinks: [],
    filteredLinks: [],
    recentLinks: [],
    
    // 预设平台
    presetPlatforms: [
      { id: 1, name: '教务系统', icon: '📘', color: '#1890ff', url: 'https://jwgl.bupt.edu.cn/jsxsd/' },
      { id: 2, name: '信息门户', icon: '📗', color: '#52c41a', url: 'http://my.bupt.edu.cn/' },
      { id: 3, name: '北邮资料库', icon: '🎓', color: '#722ed1', url: 'https://byrdocs.org/' },
      { id: 4, name: 'pta平台', icon: '🖥️', color: '#722ed1', url: 'https://pintia.cn/' },
      { id: 5, name: '北邮vpn', icon: '📚', color: '#f5222d', url: 'https://webvpn.bupt.edu.cn/login' },
      { id: 6, name: '学习通', icon: '📱', color: '#13c2c2', url: 'https://mooc.chaoxing.com/' },
      { id: 7, name: 'GitHub', icon: '🐙', color: '#333', url: 'https://github.com/' },
      { id: 8, name: 'u校园', icon: '📕', color: '#1890ff', url: 'https://ucloud.unipus.cn/' }
    ],
    
    // 图标选项
    iconOptions: ['🔗', '📘', '📗', '📕', '📒', '📓', '📂', '📁', '📄', '📊', '📈', '📉', '🎓', '📚', '✏️', '🖥️', '📱', '💻'],
    
    // 新增链接
    showAddModal: false,
    newLink: {
      name: '',
      url: '',
      categoryIndex: 0,
      icon: '🔗',
      courseName: '',
      color: '#1890ff'
    },
    
    // 一键添加状态
    isAddingAll: false
  },

  onLoad: function() {
    this.loadLinks();
  },

  onShow: function() {
    this.loadLinks();
  },

  // 加载链接数据
  loadLinks: function() {
    try {
      const links = wx.getStorageSync('links') || [];
      const recent = wx.getStorageSync('recentLinks') || [];
      
      // 按使用频率排序
      const sortedLinks = links.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
      
      // 更新预设平台的添加状态
      const platforms = this.data.presetPlatforms.map(platform => {
        const isAdded = links.some(link => link.url === platform.url);
        return { ...platform, added: isAdded };
      });
      
      this.setData({
        allLinks: links,
        filteredLinks: this.filterLinks(sortedLinks, this.data.searchKeyword, this.data.activeCategory),
        recentLinks: recent.slice(0, 5), // 只显示最近5个
        presetPlatforms: platforms
      });
    } catch (error) {
      console.error('加载链接失败:', error);
    }
  },

  // 过滤链接
  filterLinks: function(links, keyword, category) {
    return links.filter(link => {
      // 关键词过滤
      const matchKeyword = !keyword || 
        link.name.toLowerCase().includes(keyword.toLowerCase()) ||
        link.url.toLowerCase().includes(keyword.toLowerCase());
      
      // 分类过滤
      const matchCategory = category === 'all' || link.category === category;
      
      return matchKeyword && matchCategory;
    });
  },

  // 搜索输入
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    }, () => {
      this.loadLinks();
    });
  },

  onSearch: function() {
    this.loadLinks();
  },

  // 切换分类
  changeCategory: function(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      activeCategory: category
    }, () => {
      this.loadLinks();
    });
  },

  // 打开链接
  openLink: function(e) {
    const index = e.currentTarget.dataset.index;
    const link = this.data.filteredLinks[index];
    
    if (!link || !link.url) {
      wx.showToast({
        title: '链接无效',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    // 记录使用次数和时间
    this.recordLinkUsage(link);

    // 打开链接
    this.openExternalLink(link.url, link.name);
  },

  // 记录链接使用
  recordLinkUsage: function(link) {
    try {
      const links = wx.getStorageSync('links') || [];
      const index = links.findIndex(l => l.id === link.id);
      
      if (index !== -1) {
        // 更新使用次数和时间
        links[index].usageCount = (links[index].usageCount || 0) + 1;
        links[index].lastUsed = new Date().toISOString();
        
        // 保存更新
        wx.setStorageSync('links', links);
        
        // 更新最近使用列表
        let recentLinks = wx.getStorageSync('recentLinks') || [];
        recentLinks = recentLinks.filter(l => l.id !== link.id);
        recentLinks.unshift(links[index]);
        recentLinks = recentLinks.slice(0, 10); // 最多保存10个
        wx.setStorageSync('recentLinks', recentLinks);
        
        // 刷新数据
        this.loadLinks();
      }
    } catch (error) {
      console.error('记录链接使用失败:', error);
    }
  },

  // 打开外部链接
  openExternalLink: function(url, name) {
    wx.showActionSheet({
      itemList: ['复制链接', '在浏览器打开'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 复制链接
          wx.setClipboardData({
            data: url,
            success: () => {
              wx.showToast({
                title: '链接已复制',
                icon: 'success',
                duration: 1500
              });
            }
          });
        } else if (res.tapIndex === 1) {
          // 在浏览器打开
          wx.showModal({
            title: '打开外部链接',
            content: `将在浏览器中打开 ${name || '链接'}`,
            confirmText: '继续',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                wx.setClipboardData({
                  data: url,
                  success: () => {
                    wx.showModal({
                      title: '链接已复制',
                      content: '链接已复制到剪贴板，请在浏览器中粘贴打开',
                      showCancel: false,
                      confirmText: '好的'
                    });
                  }
                });
              }
            }
          });
        }
      }
    });
  },

  // 长按显示菜单
  showLinkMenu: function(e) {
    const index = e.currentTarget.dataset.index;
    const link = this.data.filteredLinks[index];
    
    wx.showActionSheet({
      itemList: ['编辑', '删除', '取消'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.editLink(link);
        } else if (res.tapIndex === 1) {
          this.deleteLink(link.id, link.name);
        }
      }
    });
  },

  // 编辑链接
  editLink: function(link) {
    this.setData({
      newLink: {
        id: link.id,
        name: link.name,
        url: link.url,
        categoryIndex: this.data.categoryOptions.indexOf(link.category) || 0,
        icon: link.icon || '🔗',
        courseName: link.courseName || '',
        color: link.color || '#1890ff'
      },
      showAddModal: true
    });
  },

  // 删除链接
  deleteLink: function(id, name) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除链接 "${name}" 吗？`,
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          try {
            const links = wx.getStorageSync('links') || [];
            const newLinks = links.filter(link => link.id !== id);
            wx.setStorageSync('links', newLinks);
            
            // 从最近使用中删除
            let recentLinks = wx.getStorageSync('recentLinks') || [];
            recentLinks = recentLinks.filter(link => link.id !== id);
            wx.setStorageSync('recentLinks', recentLinks);
            
            wx.showToast({
              title: '删除成功',
              icon: 'success',
              duration: 1500
            });
            
            this.loadLinks();
          } catch (error) {
            wx.showToast({
              title: '删除失败',
              icon: 'error',
              duration: 1500
            });
          }
        }
      }
    });
  },

  // 收藏/取消收藏 - 修复版
  toggleStar: function(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    
    // 查找链接
    const allLinks = wx.getStorageSync('links') || [];
    const linkIndex = allLinks.findIndex(link => link.id === id);
    
    if (linkIndex === -1) {
      wx.showToast({
        title: '链接不存在',
        icon: 'error',
        duration: 1500
      });
      return;
    }
    
    // 切换收藏状态
    allLinks[linkIndex].starred = !allLinks[linkIndex].starred;
    
    // 保存到存储
    try {
      wx.setStorageSync('links', allLinks);
      
      // 更新显示数据
      this.loadLinks();
      
      wx.showToast({
        title: allLinks[linkIndex].starred ? '已收藏' : '已取消收藏',
        icon: 'success',
        duration: 1500
      });
    } catch (error) {
      console.error('更新收藏状态失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 1500
      });
    }
  },

  // 添加链接
  addLink: function() {
    this.setData({
      newLink: {
        name: '',
        url: '',
        categoryIndex: 0,
        icon: '🔗',
        courseName: '',
        color: this.getRandomColor()
      },
      showAddModal: true
    });
  },

  // 扫码添加
  scanQRCode: function() {
    wx.scanCode({
      success: (res) => {
        if (res.result) {
          this.setData({
            newLink: {
              name: '扫描的链接',
              url: res.result,
              categoryIndex: 0,
              icon: '🔗',
              courseName: '',
              color: this.getRandomColor()
            },
            showAddModal: true
          });
        }
      },
      fail: (err) => {
        console.error('扫码失败:', err);
        wx.showToast({
          title: '扫码失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 导入课程链接
  importFromCourses: function() {
    try {
      const courses = wx.getStorageSync('courses') || [];
      const courseLinks = courses.filter(course => course.homeworkLink);
      
      if (courseLinks.length === 0) {
        wx.showToast({
          title: '暂无课程链接',
          icon: 'none',
          duration: 1500
        });
        return;
      }
      
      const newLinks = courseLinks.map(course => ({
        id: 'course_' + course.id + '_' + Date.now(),
        name: course.name + '作业',
        url: course.homeworkLink,
        category: '课程相关',
        icon: '📘',
        courseName: course.name,
        color: course.color || '#1890ff',
        usageCount: 0,
        lastUsed: null
      }));
      
      const existingLinks = wx.getStorageSync('links') || [];
      const mergedLinks = [...existingLinks];
      
      let addedCount = 0;
      newLinks.forEach(newLink => {
        if (!mergedLinks.some(link => link.url === newLink.url)) {
          mergedLinks.push(newLink);
          addedCount++;
        }
      });
      
      wx.setStorageSync('links', mergedLinks);
      
      wx.showToast({
        title: `已导入 ${addedCount} 个课程链接`,
        icon: 'success',
        duration: 1500
      });
      
      this.loadLinks();
    } catch (error) {
      console.error('导入课程链接失败:', error);
      wx.showToast({
        title: '导入失败',
        icon: 'error',
        duration: 1500
      });
    }
  },

  // 一键添加推荐平台
  quickAddPlatform: function(e) {
    const index = e.currentTarget.dataset.index;
    const platform = this.data.presetPlatforms[index];
    
    // 检查是否已添加
    if (platform.added) {
      wx.showToast({
        title: '已添加过此平台',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    // 创建链接数据
    const linkData = {
      id: 'platform_' + platform.id + '_' + Date.now(),
      name: platform.name,
      url: platform.url,
      category: '作业平台',
      icon: platform.icon,
      color: platform.color,
      usageCount: 0,
      starred: false,
      createdAt: new Date().toISOString(),
      isPreset: true
    };
    
    // 保存到链接列表
    try {
      const links = wx.getStorageSync('links') || [];
      
      // 检查是否已存在相同URL的链接
      const exists = links.some(link => link.url === platform.url);
      if (exists) {
        wx.showToast({
          title: '链接已存在',
          icon: 'none',
          duration: 1500
        });
        return;
      }
      
      links.unshift(linkData);
      wx.setStorageSync('links', links);
      
      // 更新平台状态
      const platforms = [...this.data.presetPlatforms];
      platforms[index].added = true;
      
      this.setData({
        presetPlatforms: platforms
      });
      
      wx.showToast({
        title: '添加成功',
        icon: 'success',
        duration: 1500
      });
      
      // 刷新链接列表
      this.loadLinks();
      
    } catch (error) {
      console.error('添加平台失败:', error);
      wx.showToast({
        title: '添加失败',
        icon: 'error',
        duration: 1500
      });
    }
  },

  // 一键添加所有平台
  addAllPlatforms: function() {
    if (this.data.isAddingAll) return;
    
    // 获取所有未添加的推荐平台
    const unaddedPlatforms = this.data.presetPlatforms.filter(platform => !platform.added);
    
    if (unaddedPlatforms.length === 0) {
      wx.showToast({
        title: '所有平台已添加',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    this.setData({
      isAddingAll: true
    });
    
    // 批量添加
    setTimeout(() => {
      try {
        const links = wx.getStorageSync('links') || [];
        let addedCount = 0;
        
        unaddedPlatforms.forEach(platform => {
          // 检查是否已存在相同URL的链接
          const exists = links.some(link => link.url === platform.url);
          if (!exists) {
            const linkData = {
              id: 'platform_' + platform.id + '_' + Date.now(),
              name: platform.name,
              url: platform.url,
              category: '作业平台',
              icon: platform.icon,
              color: platform.color,
              usageCount: 0,
              starred: false,
              createdAt: new Date().toISOString(),
              isPreset: true
            };
            links.unshift(linkData);
            addedCount++;
          }
        });
        
        wx.setStorageSync('links', links);
        
        // 更新所有平台状态
        const platforms = this.data.presetPlatforms.map(platform => ({
          ...platform,
          added: true
        }));
        
        this.setData({
          presetPlatforms: platforms,
          isAddingAll: false
        });
        
        wx.showToast({
          title: `成功添加 ${addedCount} 个平台`,
          icon: 'success',
          duration: 2000
        });
        
        // 刷新链接列表
        this.loadLinks();
        
      } catch (error) {
        console.error('批量添加平台失败:', error);
        this.setData({
          isAddingAll: false
        });
        wx.showToast({
          title: '添加失败',
          icon: 'error',
          duration: 1500
        });
      }
    }, 500);
  },

  // 获取未添加的平台数量
  getUnaddedCount: function() {
    return this.data.presetPlatforms.filter(platform => !platform.added).length;
  },

  // 新增链接输入
  onNewLinkInput: function(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`newLink.${field}`]: value
    });
  },

  // 选择分类
  onCategoryChange: function(e) {
    this.setData({
      'newLink.categoryIndex': e.currentTarget.dataset.value
    });
  },

  // 选择图标
  selectIcon: function(e) {
    const icon = e.currentTarget.dataset.icon;
    this.setData({
      'newLink.icon': icon
    });
  },

  // 保存链接
  saveLink: function() {
    const { name, url, categoryIndex, icon, courseName, color } = this.data.newLink;
    
    if (!name.trim()) {
      wx.showToast({
        title: '请输入链接名称',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    if (!url.trim()) {
      wx.showToast({
        title: '请输入链接地址',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    // 验证URL格式
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      wx.showToast({
        title: '链接格式不正确',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    try {
      const links = wx.getStorageSync('links') || [];
      const category = this.data.categoryOptions[categoryIndex] || '自定义';
      
      const linkData = {
        id: this.data.newLink.id || 'link_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        url: url.trim(),
        category: category,
        icon: icon,
        courseName: courseName.trim(),
        color: color,
        usageCount: 0,
        starred: false,
        createdAt: new Date().toISOString()
      };
      
      // 如果是编辑模式，更新现有链接
      if (this.data.newLink.id) {
        const index = links.findIndex(link => link.id === this.data.newLink.id);
        if (index !== -1) {
          links[index] = linkData;
        }
      } else {
        // 新增模式
        links.unshift(linkData);
      }
      
      wx.setStorageSync('links', links);
      
      this.setData({
        showAddModal: false
      });
      
      wx.showToast({
        title: this.data.newLink.id ? '更新成功' : '添加成功',
        icon: 'success',
        duration: 1500
      });
      
      this.loadLinks();
    } catch (error) {
      console.error('保存链接失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'error',
        duration: 1500
      });
    }
  },

  // 关闭模态框
  closeModal: function() {
    this.setData({
      showAddModal: false
    });
  },

  // 阻止事件冒泡
  stopPropagation: function() {
    // 空函数，用于阻止模态框内部点击事件冒泡
  },

  // 工具函数
  formatUrl: function(url) {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '').substring(0, 25) + (url.length > 25 ? '...' : '');
  },

  formatTime: function(time) {
    if (!time) return '未使用';
    
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return '今天';
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return `${date.getMonth() + 1}-${date.getDate()}`;
    }
  },

  getRandomColor: function() {
    const colors = ['#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1', '#13c2c2', '#f759ab', '#73d13d'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
});