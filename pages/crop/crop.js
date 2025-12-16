// crop.js
const app = getApp()

Page({
  data: {
    imageSrc: '',
    imageDimensions: '',
    rotation: 0,
    scale: 1,
    scaleValue: 100,
    flipH: 1,
    flipV: 1,
    cropRatio: 'free',
    editedSrc: ''
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '裁剪旋转'
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
          editedSrc: '',
          rotation: 0,
          scale: 1,
          scaleValue: 100,
          flipH: 1,
          flipV: 1
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

  // 旋转图片
  rotateImage(e) {
    const angle = parseInt(e.currentTarget.dataset.angle);
    const newRotation = (this.data.rotation + angle) % 360;
    this.setData({
      rotation: newRotation
    });
  },

  // 翻转图片
  flipImage(e) {
    const direction = e.currentTarget.dataset.direction;
    
    if (direction === 'horizontal') {
      this.setData({
        flipH: this.data.flipH * -1
      });
    } else if (direction === 'vertical') {
      this.setData({
        flipV: this.data.flipV * -1
      });
    }
  },

  // 缩放变化
  onScaleChange(e) {
    const scaleValue = e.detail.value;
    this.setData({
      scaleValue,
      scale: scaleValue / 100
    });
  },

  // 设置裁剪比例
  setCropRatio(e) {
    const ratio = e.currentTarget.dataset.ratio;
    this.setData({
      cropRatio: ratio
    });
  },

  // 重置图片
  resetImage() {
    this.setData({
      rotation: 0,
      scale: 1,
      scaleValue: 100,
      flipH: 1,
      flipV: 1,
      cropRatio: 'free'
    });
  },

  // 应用编辑
  applyEdit() {
    if (!this.data.imageSrc) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '处理中...'
    });

    // 使用canvas应用编辑
    this.applyEditWithCanvas();
  },

  // 使用canvas应用编辑
  applyEditWithCanvas() {
    const ctx = wx.createCanvasContext('cropCanvas');
    const imgPath = this.data.imageSrc;
    
    wx.getImageInfo({
      src: imgPath,
      success: (res) => {
        const { width, height } = res;
        const { rotation, scale, flipH, flipV, cropRatio } = this.data;
        
        // 计算canvas尺寸
        const canvasSize = this.calculateCanvasSize(width, height, rotation, cropRatio);
        
        // 设置canvas尺寸
        const canvasWidth = canvasSize.width;
        const canvasHeight = canvasSize.height;
        
        // 清空canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // 保存当前状态
        ctx.save();
        
        // 移动到canvas中心
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        
        // 应用旋转
        ctx.rotate(rotation * Math.PI / 180);
        
        // 应用缩放
        ctx.scale(scale * flipH, scale * flipV);
        
        // 绘制图片
        ctx.drawImage(imgPath, -width / 2, -height / 2, width, height);
        
        // 恢复状态
        ctx.restore();
        
        ctx.draw(false, () => {
          // 导出编辑后的图片
          wx.canvasToTempFilePath({
            canvasId: 'cropCanvas',
            success: (res) => {
              this.handleEditSuccess(res.tempFilePath);
            },
            fail: (err) => {
              this.handleEditError(err);
            }
          });
        });
      },
      fail: (err) => {
        this.handleEditError(err);
      }
    });
  },

  // 计算canvas尺寸
  calculateCanvasSize(width, height, rotation, cropRatio) {
    // 根据旋转角度计算新的宽高
    let newWidth = width;
    let newHeight = height;
    
    if (rotation === 90 || rotation === 270) {
      newWidth = height;
      newHeight = width;
    }
    
    // 根据裁剪比例调整
    if (cropRatio !== 'free') {
      const [ratioW, ratioH] = cropRatio.split(':').map(Number);
      const currentRatio = newWidth / newHeight;
      const targetRatio = ratioW / ratioH;
      
      if (currentRatio > targetRatio) {
        newWidth = newHeight * targetRatio;
      } else {
        newHeight = newWidth / targetRatio;
      }
    }
    
    return {
      width: newWidth,
      height: newHeight
    };
  },

  // 处理编辑成功
  handleEditSuccess(tempFilePath) {
    wx.hideLoading();
    
    this.setData({
      editedSrc: tempFilePath
    });

    // 更新使用次数
    this.updateUsageCount('crop');
    
    wx.showToast({
      title: '编辑成功',
      icon: 'success'
    });
  },

  // 处理编辑错误
  handleEditError(err) {
    wx.hideLoading();
    
    wx.showToast({
      title: '编辑失败',
      icon: 'none'
    });
  },

  // 保存图片
  saveImage() {
    if (!this.data.editedSrc) {
      wx.showToast({
        title: '没有可保存的图片',
        icon: 'none'
      });
      return;
    }

    wx.saveImageToPhotosAlbum({
      filePath: this.data.editedSrc,
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
    if (!this.data.editedSrc) {
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
      title: '图片裁剪旋转 - 专业的图片编辑工具',
      imageUrl: this.data.editedSrc || this.data.imageSrc || '/images/crop-share.jpg',
      query: 'from=timeline&feature=crop'
    };
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '推荐一个好用的图片裁剪旋转工具',
      path: '/pages/crop/crop',
      imageUrl: this.data.editedSrc || this.data.imageSrc || '/images/crop-share.jpg'
    };
  }
});