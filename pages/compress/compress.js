// compress.js
const app = getApp()

Page({
  data: {
    imageSrc: '',
    originalSize: '',
    originalDimensions: '',
    compressedSrc: '',
    compressedSize: '',
    compressionRatio: 0,
    quality: 80,
    targetSize: 'auto',
    customSize: '',
    compressing: false
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '图片压缩'
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
          compressedSrc: '',
          compressedSize: '',
          compressionRatio: 0
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
        // 计算文件大小（这里使用模拟数据，实际需要通过其他方式获取）
        const fileSize = this.estimateFileSize(res.width, res.height);
        this.setData({
          originalSize: this.formatFileSize(fileSize),
          originalDimensions: `${res.width} × ${res.height}`
        });
      }
    });
  },

  // 估算文件大小
  estimateFileSize(width, height) {
    // 简单估算：宽 × 高 × 3字节(RGB) × 压缩系数
    return width * height * 3 * 0.5;
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

  // 质量滑块变化
  onQualityChange(e) {
    this.setData({
      quality: e.detail.value
    });
  },

  // 设置目标大小
  setTargetSize(e) {
    const size = e.currentTarget.dataset.size;
    this.setData({
      targetSize: size
    });
  },

  // 自定义大小输入
  onCustomSizeChange(e) {
    this.setData({
      customSize: e.detail.value
    });
  },

  // 压缩图片（优化版）
  compressImage() {
    if (!this.data.imageSrc) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({
      compressing: true
    });

    wx.showLoading({
      title: '分析图片中...'
    });

    // 先获取图片信息，决定压缩策略
    wx.getImageInfo({
      src: this.data.imageSrc,
      success: (res) => {
        const { width, height } = res;
        const imageSize = width * height;
        
        // 根据图片大小选择不同的压缩策略
        if (imageSize > 4000000) { // 大于4M像素
          this.compressLargeImage();
        } else {
          this.compressWithCanvas();
        }
      },
      fail: () => {
        this.compressWithCanvas(); // 失败时使用默认方法
      }
    });
  },

  // 大图片压缩（保持内容优先）
  compressLargeImage() {
    wx.showLoading({
      title: '大图分析中...'
    });
    
    const ctx = wx.createCanvasContext('compressCanvas');
    const imgPath = this.data.imageSrc;
    
    wx.getImageInfo({
      src: imgPath,
      success: (res) => {
        const { width, height } = res;
        const quality = this.data.quality / 100;
        
        // 首先尝试保持原始尺寸进行压缩
        wx.showLoading({
          title: '压缩处理中...'
        });
        
        // 绘制原始尺寸
        ctx.drawImage(imgPath, 0, 0, width, height);
        
        ctx.draw(true, () => {
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvasId: 'compressCanvas',
              quality: quality,
              fileType: 'jpg',
              success: (res) => {
                // 检查压缩结果
                this.checkCompressedSize(res.tempFilePath, quality);
              },
              fail: () => {
                this.handleCompressError();
              }
            });
          }, 50);
        });
      },
      fail: () => {
        this.handleCompressError();
      }
    });
  },

  // 使用canvas压缩（保持原始尺寸）
  compressWithCanvas() {
    const ctx = wx.createCanvasContext('compressCanvas');
    const imgPath = this.data.imageSrc;
    
    // 先更新进度提示
    wx.showLoading({
      title: '分析图片中...'
    });
    
    wx.getImageInfo({
      src: imgPath,
      success: (res) => {
        const { width, height } = res;
        const quality = this.data.quality / 100;
        
        // 保持原始尺寸，不改变图片内容
        const newWidth = width;
        const newHeight = height;
        
        // 更新进度提示
        wx.showLoading({
          title: '压缩处理中...'
        });
        
        // 设置canvas尺寸为原始尺寸
        ctx.canvas.width = newWidth;
        ctx.canvas.height = newHeight;
        
        // 绘制原始尺寸的图片
        ctx.drawImage(imgPath, 0, 0, newWidth, newHeight);
        
        // 立即执行绘制
        ctx.draw(true, () => {
          // 使用setTimeout确保绘制完成
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvasId: 'compressCanvas',
              quality: quality,
              fileType: 'jpg', // 强制使用jpg格式以获得更好的压缩效果
              success: (res) => {
                // 检查压缩结果，如果仍然太大则进行质量调整
                this.checkCompressedSize(res.tempFilePath, quality);
              },
              fail: (err) => {
                this.handleCompressError(err);
              }
            });
          }, 100);
        });
      },
      fail: (err) => {
        this.handleCompressError(err);
      }
    });
  },

  // 检查压缩后的大小，如果需要则进一步压缩
  checkCompressedSize(tempFilePath, currentQuality) {
    wx.getFileInfo({
      filePath: tempFilePath,
      success: (res) => {
        const fileSizeKB = res.size / 1024;
        const targetKB = this.getTargetSizeKB();
        
        // 如果当前大小符合要求或已经是自动模式，直接返回结果
        if (this.data.targetSize === 'auto' || fileSizeKB <= targetKB) {
          this.handleCompressSuccess(tempFilePath);
          return;
        }
        
        // 如果文件仍然太大，使用更低的压缩质量重新压缩
        if (currentQuality > 0.1) {
          const newQuality = Math.max(currentQuality - 0.1, 0.1);
          this.recompressWithQuality(newQuality);
        } else {
          // 如果质量已经很低但文件仍然太大，才考虑缩小尺寸
          this.compressWithSizeReduction();
        }
      },
      fail: () => {
        // 获取文件信息失败，直接返回结果
        this.handleCompressSuccess(tempFilePath);
      }
    });
  },

  // 使用新的质量重新压缩
  recompressWithQuality(quality) {
    wx.showLoading({
      title: '调整压缩质量...'
    });
    
    const ctx = wx.createCanvasContext('compressCanvas');
    const imgPath = this.data.imageSrc;
    
    wx.getImageInfo({
      src: imgPath,
      success: (res) => {
        const { width, height } = res;
        
        ctx.drawImage(imgPath, 0, 0, width, height);
        ctx.draw(true, () => {
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvasId: 'compressCanvas',
              quality: quality,
              fileType: 'jpg',
              success: (res) => {
                this.checkCompressedSize(res.tempFilePath, quality);
              },
              fail: () => {
                this.handleCompressError();
              }
            });
          }, 50);
        });
      },
      fail: () => {
        this.handleCompressError();
      }
    });
  },

  // 只有在质量压缩无效时才缩小尺寸
  compressWithSizeReduction() {
    wx.showLoading({
      title: '优化图片尺寸...'
    });
    
    const ctx = wx.createCanvasContext('compressCanvas');
    const imgPath = this.data.imageSrc;
    
    wx.getImageInfo({
      src: imgPath,
      success: (res) => {
        const { width, height } = res;
        const targetKB = this.getTargetSizeKB();
        
        // 计算需要缩小的比例（保守计算）
        const currentSize = (width * height * 3) / 1024;
        const scale = Math.sqrt(targetKB / currentSize) * 0.9; // 保守缩小
        
        const newWidth = Math.max(Math.floor(width * scale), 400);
        const newHeight = Math.max(Math.floor(height * scale), 400);
        
        ctx.drawImage(imgPath, 0, 0, newWidth, newHeight);
        ctx.draw(true, () => {
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvasId: 'compressCanvas',
              quality: 0.8, // 使用较高的质量
              fileType: 'jpg',
              success: (res) => {
                this.handleCompressSuccess(res.tempFilePath);
              },
              fail: () => {
                this.handleCompressError();
              }
            });
          }, 50);
        });
      },
      fail: () => {
        this.handleCompressError();
      }
    });
  },

  // 获取目标大小KB
  getTargetSizeKB() {
    switch (this.data.targetSize) {
      case '500kb':
        return 500;
      case '1mb':
        return 1024;
      case 'custom':
        return parseFloat(this.data.customSize) || 500;
      default:
        return 500;
    }
  },

  // 处理压缩成功（优化版）
  handleCompressSuccess(tempFilePath) {
    wx.hideLoading();
    
    // 快速获取压缩后的文件信息
    wx.getFileInfo({
      filePath: tempFilePath,
      success: (res) => {
        const compressedSize = this.formatFileSize(res.size);
        
        // 计算压缩率（使用原始图片的实际大小）
        wx.getFileInfo({
          filePath: this.data.imageSrc,
          success: (originalRes) => {
            const ratio = ((originalRes.size - res.size) / originalRes.size * 100).toFixed(1);
            
            this.setData({
              compressedSrc: tempFilePath,
              compressedSize,
              compressionRatio: ratio,
              compressing: false
            });
          },
          fail: () => {
            // 失败时使用估算值
            const ratio = (this.data.quality / 100 * 30).toFixed(1); // 简化估算
            this.setData({
              compressedSrc: tempFilePath,
              compressedSize,
              compressionRatio: ratio,
              compressing: false
            });
          }
        });
      },
      fail: () => {
        // 获取文件信息失败时的处理
        this.setData({
          compressedSrc: tempFilePath,
          compressedSize: '未知',
          compressionRatio: '0',
          compressing: false
        });
      }
    });

    // 更新使用次数
    this.updateUsageCount('compress');
    
    wx.showToast({
      title: '压缩成功',
      icon: 'success'
    });
  },

  // 处理压缩错误
  handleCompressError() {
    wx.hideLoading();
    this.setData({
      compressing: false
    });
    
    wx.showToast({
      title: '压缩失败，请重试',
      icon: 'none'
    });
  },

  // 保存图片
  saveImage() {
    if (!this.data.compressedSrc) {
      wx.showToast({
        title: '没有可保存的图片',
        icon: 'none'
      });
      return;
    }

    wx.saveImageToPhotosAlbum({
      filePath: this.data.compressedSrc,
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
    if (!this.data.compressedSrc) {
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
    const compressionRatio = this.data.compressionRatio || 0;
    return {
      title: `图片压缩 - 压缩率${compressionRatio}%，体积更小`,
      imageUrl: this.data.compressedSrc || this.data.imageSrc || '/images/compress-share.jpg',
      query: 'from=timeline&feature=compress'
    };
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '推荐一个专业的图片压缩工具',
      path: '/pages/compress/compress',
      imageUrl: this.data.compressedSrc || this.data.imageSrc || '/images/compress-share.jpg'
    };
  }
});