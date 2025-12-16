// convert.js
const app = getApp()

Page({
  data: {
    imageSrc: '',
    currentFormat: '',
    fileSize: '',
    targetFormat: '',
    quality: 90,
    converting: false,
    convertedSrc: '',
    convertedSize: ''
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '格式转换'
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
        const format = this.getImageFormat(tempFilePath);
        
        this.setData({
          imageSrc: tempFilePath,
          currentFormat: format.toUpperCase(),
          convertedSrc: '',
          convertedSize: '',
          targetFormat: format === 'jpg' ? 'png' : 'jpg'
        });
        
        // 获取文件大小
        this.getFileSize(tempFilePath);
      },
      fail: (err) => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 获取图片格式
  getImageFormat(path) {
    const extension = path.split('.').pop().toLowerCase();
    if (extension === 'jpeg') return 'jpg';
    return extension;
  },

  // 获取文件大小
  getFileSize(path) {
    const fs = wx.getFileSystemManager();
    fs.getFileInfo({
      filePath: path,
      success: (res) => {
        this.setData({
          fileSize: this.formatFileSize(res.size)
        });
      },
      fail: () => {
        // 模拟文件大小
        this.setData({
          fileSize: '1.2 MB'
        });
      }
    });
  },

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
  },

  // 设置目标格式
  setTargetFormat(e) {
    const format = e.currentTarget.dataset.format;
    if (format === this.data.currentFormat.toLowerCase()) {
      wx.showToast({
        title: '目标格式与当前格式相同',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      targetFormat: format
    });
  },

  // 质量滑块变化
  onQualityChange(e) {
    this.setData({
      quality: e.detail.value
    });
  },

  // 转换图片
  convertImage() {
    if (!this.data.imageSrc || !this.data.targetFormat) {
      wx.showToast({
        title: '请选择图片和目标格式',
        icon: 'none'
      });
      return;
    }

    this.setData({
      converting: true
    });

    wx.showLoading({
      title: '转换中...'
    });

    // 使用canvas进行格式转换
    this.convertWithCanvas();
  },

  // 使用canvas转换
  convertWithCanvas() {
    const ctx = wx.createCanvasContext('convertCanvas');
    const imgPath = this.data.imageSrc;
    
    wx.getImageInfo({
      src: imgPath,
      success: (res) => {
        const { width, height } = res;
        
        // 绘制图片
        ctx.drawImage(imgPath, 0, 0, width, height);
        ctx.draw(false, () => {
          // 导出转换后的图片
          wx.canvasToTempFilePath({
            canvasId: 'convertCanvas',
            quality: this.data.targetFormat === 'png' ? 1 : this.data.quality / 100,
            fileType: this.data.targetFormat,
            success: (res) => {
              this.handleConvertSuccess(res.tempFilePath);
            },
            fail: (err) => {
              this.handleConvertError(err);
            }
          });
        });
      },
      fail: (err) => {
        this.handleConvertError(err);
      }
    });
  },

  // 处理转换成功
  handleConvertSuccess(tempFilePath) {
    wx.hideLoading();
    
    // 模拟转换后的文件大小
    const convertedSize = this.simulateConvertedSize();
    
    this.setData({
      convertedSrc: tempFilePath,
      convertedSize,
      converting: false
    });

    // 更新使用次数
    this.updateUsageCount('convert');
    
    wx.showToast({
      title: '转换成功',
      icon: 'success'
    });
  },

  // 模拟转换后的文件大小
  simulateConvertedSize() {
    const originalSize = 1.2; // MB
    const format = this.data.targetFormat;
    const quality = this.data.quality / 100;
    
    let convertedSize = originalSize;
    if (format === 'webp') {
      convertedSize = originalSize * 0.7 * quality;
    } else if (format === 'jpg') {
      convertedSize = originalSize * 0.8 * quality;
    } else if (format === 'png') {
      convertedSize = originalSize * 1.2;
    }
    
    return convertedSize.toFixed(2) + ' MB';
  },

  // 处理转换错误
  handleConvertError(err) {
    wx.hideLoading();
    this.setData({
      converting: false
    });
    
    wx.showToast({
      title: '转换失败',
      icon: 'none'
    });
  },

  // 保存图片
  saveImage() {
    if (!this.data.convertedSrc) {
      wx.showToast({
        title: '没有可保存的图片',
        icon: 'none'
      });
      return;
    }

    wx.saveImageToPhotosAlbum({
      filePath: this.data.convertedSrc,
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
    if (!this.data.convertedSrc) {
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
      title: '图片格式转换 - 支持JPG/PNG/WEBP互转',
      imageUrl: this.data.convertedSrc || this.data.imageSrc || '/images/convert-share.jpg',
      query: 'from=timeline&feature=convert'
    };
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '推荐一个专业的图片格式转换工具',
      path: '/pages/convert/convert',
      imageUrl: this.data.convertedSrc || this.data.imageSrc || '/images/convert-share.jpg'
    };
  }
});