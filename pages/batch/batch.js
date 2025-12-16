// batch.js
const app = getApp()

Page({
  data: {
    isVip: false,
    images: [],
    batchType: 'compress',
    processing: false,
    processedImages: []
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '批量处理'
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
      isVip: app.checkVipStatus()
    });
  },

  // 跳转到VIP页面
  goToVip() {
    wx.navigateTo({
      url: '/pages/vip/vip'
    });
  },

  // 选择多张图片
  chooseImages() {
    const remainingCount = 9 - this.data.images.length;
    
    wx.chooseImage({
      count: remainingCount,
      sizeType: ['original'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = [...this.data.images, ...res.tempFilePaths];
        this.setData({
          images: newImages,
          processedImages: []
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

  // 移除图片
  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    
    this.setData({
      images,
      processedImages: []
    });
  },

  // 设置批量处理类型
  setBatchType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      batchType: type
    });
  },

  // 批量处理
  processBatch() {
    if (!this.data.isVip) {
      wx.showModal({
        title: '需要VIP会员',
        content: '批量处理是VIP专属功能，是否开通VIP？',
        confirmText: '开通VIP',
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

    if (this.data.images.length === 0) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({
      processing: true
    });

    wx.showLoading({
      title: '批量处理中...'
    });

    // 模拟批量处理
    setTimeout(() => {
      this.simulateBatchProcessing();
    }, 2000);
  },

  // 模拟批量处理
  simulateBatchProcessing() {
    // 这里只是模拟，实际需要根据batchType进行不同的处理
    const processedImages = this.data.images.map((image, index) => {
      // 模拟处理后的图片路径
      return image; // 实际应该是处理后的新路径
    });

    this.setData({
      processedImages,
      processing: false
    });

    wx.hideLoading();
    
    // 更新使用次数
    this.updateUsageCount('batch');
    
    wx.showToast({
      title: '批量处理完成',
      icon: 'success'
    });
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.processedImages[index],
      urls: this.data.processedImages
    });
  },

  // 保存全部图片
  saveAllImages() {
    if (this.data.processedImages.length === 0) {
      wx.showToast({
        title: '没有可保存的图片',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '保存中...'
    });

    let savedCount = 0;
    const totalCount = this.data.processedImages.length;

    this.data.processedImages.forEach((imagePath, index) => {
      wx.saveImageToPhotosAlbum({
        filePath: imagePath,
        success: () => {
          savedCount++;
          if (savedCount === totalCount) {
            wx.hideLoading();
            wx.showToast({
              title: `保存成功${savedCount}张`,
              icon: 'success'
            });
          }
        },
        fail: (err) => {
          savedCount++;
          if (savedCount === totalCount) {
            wx.hideLoading();
            wx.showToast({
              title: '部分保存失败',
              icon: 'none'
            });
          }
        }
      });
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
      title: '批量图片处理 - 一次处理多张图片',
      imageUrl: '/images/batch-share.jpg',
      query: 'from=timeline&feature=batch'
    };
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '推荐一个高效的批量图片处理工具',
      path: '/pages/batch/batch',
      imageUrl: '/images/batch-share.jpg'
    };
  }
});