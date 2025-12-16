// watermark.js
const app = getApp()

Page({
  data: {
    isVip: false,
    userData: {},
    imageSrc: '',
    imageDimensions: '',
    removeMode: 'auto',
    precision: 5,
    removing: false,
    processedSrc: ''
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '去除水印'
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
        
        // 获取图片信息
        this.getImageInfo(tempFilePath);
      },
      fail: (err) => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 获取图片信息
  getImageInfo(src) {
    wx.getImageInfo({
      src: src,
      success: (res) => {
        this.setData({
          imageDimensions: `${res.width} × ${res.height}`
        });
      }
    });
  },

  // 设置去除模式
  setRemoveMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      removeMode: mode
    });
  },

  // 精度滑块变化
  onPrecisionChange(e) {
    this.setData({
      precision: e.detail.value
    });
  },

  // 选择水印区域
  selectWatermarkArea() {
    wx.showToast({
      title: '手动选择功能开发中',
      icon: 'none'
    });
  },

  // 去除水印
  removeWatermark() {
    if (!this.data.imageSrc) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    // 检查权限
    const permission = app.checkFeaturePermission('watermark');
    if (!permission.allowed) {
      wx.showModal({
        title: '积分不足',
        content: `去除水印需要0.5积分，当前积分：${permission.currentCredits}`,
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
        content: '去除水印将消费0.5积分，是否继续？',
        confirmText: '确认',
        success: (res) => {
          if (res.confirm) {
            this.performWatermarkRemoval();
          }
        }
      });
    } else {
      this.performWatermarkRemoval();
    }
  },

  // 执行水印去除
  performWatermarkRemoval() {
    this.setData({
      removing: true
    });

    wx.showLoading({
      title: '处理中...'
    });

    // 扣除积分
    if (!this.data.isVip) {
      const success = app.deductCredits(0.5);
      if (!success) {
        wx.hideLoading();
        this.setData({
          removing: false
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
      this.simulateWatermarkRemoval();
    }, 2000);
  },

  // 模拟水印去除
  simulateWatermarkRemoval() {
    const ctx = wx.createCanvasContext('watermarkCanvas');
    const imgPath = this.data.imageSrc;
    
    wx.getImageInfo({
      src: imgPath,
      success: (res) => {
        const { width, height } = res;
        
        // 绘制原图
        ctx.drawImage(imgPath, 0, 0, width, height);
        
        // 模拟水印去除效果（这里只是示例，实际需要AI算法）
        // 在实际应用中，这里会调用AI接口进行水印检测和去除
        this.applyWatermarkRemovalEffect(ctx, width, height);
        
        ctx.draw(false, () => {
          // 导出处理后的图片
          wx.canvasToTempFilePath({
            canvasId: 'watermarkCanvas',
            success: (res) => {
              this.handleRemovalSuccess(res.tempFilePath);
            },
            fail: (err) => {
              this.handleRemovalError(err);
            }
          });
        });
      },
      fail: (err) => {
        this.handleRemovalError(err);
      }
    });
  },

  // 应用水印去除效果（模拟）
  applyWatermarkRemovalEffect(ctx, width, height) {
    // 这里只是模拟效果，实际需要复杂的AI算法
    // 可以添加一些模糊、修复等效果来模拟水印去除
    
    // 在右下角区域应用一些处理效果（模拟水印去除）
    const gradient = ctx.createLinearGradient(width * 0.7, height * 0.7, width, height);
    gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0.3)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(width * 0.7, height * 0.7, width * 0.3, height * 0.3);
  },

  // 处理去除成功
  handleRemovalSuccess(tempFilePath) {
    wx.hideLoading();
    
    this.setData({
      processedSrc: tempFilePath,
      removing: false
    });

    // 更新用户数据
    this.initUserData();
    
    // 更新使用次数
    this.updateUsageCount('watermark');
    
    wx.showToast({
      title: '去除成功',
      icon: 'success'
    });
  },

  // 处理去除错误
  handleRemovalError(err) {
    wx.hideLoading();
    this.setData({
      removing: false
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
    return {
      title: '智能去水印 - AI技术去除图片水印',
      imageUrl: this.data.processedSrc || this.data.imageSrc || '/images/watermark-share.jpg',
      query: 'from=timeline&feature=watermark'
    };
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '推荐一个AI智能去水印工具',
      path: '/pages/watermark/watermark',
      imageUrl: this.data.processedSrc || this.data.imageSrc || '/images/watermark-share.jpg'
    };
  }
});