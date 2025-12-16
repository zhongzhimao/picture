// idphoto.js
const app = getApp()

Page({
  data: {
    isVip: false,
    userData: {},
    imageSrc: '',
    bgColor: 'white',
    processing: false,
    processedSrc: ''
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '证件照换底'
    });
    this.initUserData();
  },

  onShow() {
    this.initUserData();
  },

  // 初始化用户数据
  initUserData() {
    const userData = app.globalData.userData || wx.getStorageSync('userData') || {
      isVip: false,
      vipExpireTime: null,
      credits: 0,
      usageCount: {}
    };

    this.setData({
      isVip: app.checkVipStatus(),
      userData
    });
  },

  // 跳转到VIP页面
  goToVip() {
    wx.navigateTo({
      url: '/pages/vip/vip'
    });
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          imageSrc: tempFilePath,
          processedSrc: ''
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 设置背景色
  setBgColor(e) {
    const color = e.currentTarget.dataset.color;
    this.setData({
      bgColor: color
    });
  },

  // 处理证件照
  processIdPhoto() {
    if (!this.data.imageSrc) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    // 检查权限
    const permission = app.checkFeaturePermission('idphoto');
    if (!permission.allowed) {
      wx.showModal({
        title: '积分不足',
        content: `证件照换底需要2积分，当前积分：${permission.currentCredits}`,
        confirmText: '去充值',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/vip/vip'
            });
          }
        }
      });
      return;
    }

    // 确认支付
    if (!this.data.isVip) {
      wx.showModal({
        title: '确认消费',
        content: '证件照换底将消费2积分，是否继续？',
        confirmText: '确认',
        success: (res) => {
          if (res.confirm) {
            this.performIdPhotoProcessing();
          }
        }
      });
    } else {
      this.performIdPhotoProcessing();
    }
  },

  // 执行证件照处理
  performIdPhotoProcessing() {
    this.setData({
      processing: true
    });

    wx.showLoading({
      title: '处理中...'
    });

    // 扣除积分
    if (!this.data.isVip) {
      const success = app.deductCredits(2);
      if (!success) {
        wx.hideLoading();
        this.setData({
          processing: false
        });
        wx.showToast({
          title: '积分扣除失败',
          icon: 'none'
        });
        return;
      }
    }

    // 模拟处理过程
    setTimeout(() => {
      this.simulateIdPhotoProcessing();
    }, 2000);
  },

  // 模拟证件照处理
  simulateIdPhotoProcessing() {
    const ctx = wx.createCanvasContext('idphotoCanvas');
    const imgPath = this.data.imageSrc;
    
    wx.getImageInfo({
      src: imgPath,
      success: (res) => {
        const { width, height } = res;
        
        // 设置背景色
        const colors = {
          'white': '#ffffff',
          'blue': '#438EDB',
          'red': '#FF0000',
          'gray': '#808080'
        };
        
        ctx.fillStyle = colors[this.data.bgColor];
        ctx.fillRect(0, 0, width, height);
        
        // 绘制原图（这里只是简单叠加，实际需要AI抠图）
        ctx.globalAlpha = 0.9;
        ctx.drawImage(imgPath, 0, 0, width, height);
        
        ctx.draw(false, () => {
          // 导出处理后的图片
          wx.canvasToTempFilePath({
            canvasId: 'idphotoCanvas',
            success: (res) => {
              this.handleProcessSuccess(res.tempFilePath);
            },
            fail: (err) => {
              this.handleProcessError(err);
            }
          });
        });
      },
      fail: (err) => {
        this.handleProcessError(err);
      }
    });
  },

  // 处理成功
  handleProcessSuccess(tempFilePath) {
    wx.hideLoading();
    
    this.setData({
      processedSrc: tempFilePath,
      processing: false
    });

    // 更新用户数据
    this.initUserData();
    
    // 更新使用次数
    this.updateUsageCount('idphoto');
    
    wx.showToast({
      title: '换底成功',
      icon: 'success'
    });
  },

  // 处理错误
  handleProcessError(err) {
    wx.hideLoading();
    this.setData({
      processing: false
    });
    
    wx.showToast({
      title: '处理失败',
      icon: 'none'
    });
  },

  // 保存图片
  saveImage() {
    if (!this.data.processedSrc) {
      wx.showToast({
        title: '没有可保存的图片',
        icon: 'none'
      });
      return;
    }

    wx.saveImageToPhotosAlbum({
      filePath: this.data.processedSrc,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '授权提示',
            content: '需要授权保存图片到相册',
            confirmText: '去授权',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 分享图片
  shareImage() {
    if (!this.data.processedSrc) {
      wx.showToast({
        title: '没有可分享的图片',
        icon: 'none'
      });
      return;
    }

    wx.showShareMenu({
      withShareTicket: true,
      success: () => {
        wx.showToast({
          title: '请点击右上角分享',
          icon: 'none'
        });
      }
    });
  },

  // 更新使用次数
  updateUsageCount(feature) {
    const userData = app.globalData.userData || wx.getStorageSync('userData') || {
      usageCount: {}
    };
    
    userData.usageCount[feature] = (userData.usageCount[feature] || 0) + 1;
    
    wx.setStorageSync('userData', userData);
    app.globalData.userData = userData;
  },

  // 分享到朋友圈
  onShareTimeline() {
    const bgColorMap = {
      'white': '白色',
      'blue': '蓝色',
      'red': '红色'
    };
    const bgColorName = bgColorMap[this.data.bgColor] || '白色';
    return {
      title: `证件照换底 - 专业${bgColorName}背景证件照`,
      imageUrl: this.data.processedSrc || this.data.imageSrc || '/images/idphoto-share.jpg',
      query: 'from=timeline&feature=idphoto'
    };
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '推荐一个专业的证件照换底工具',
      path: '/pages/idphoto/idphoto',
      imageUrl: this.data.processedSrc || this.data.imageSrc || '/images/idphoto-share.jpg'
    };
  }
});