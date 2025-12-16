// repair.js
const app = getApp()

Page({
  data: {
    isVip: false,
    userData: {},
    imageSrc: '',
    repairType: 'auto',
    intensity: 5,
    repairing: false,
    repairedSrc: ''
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: 'AI修复老照片'
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
          repairedSrc: ''
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

  // 设置修复类型
  setRepairType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      repairType: type
    });
  },

  // 强度滑块变化
  onIntensityChange(e) {
    this.setData({
      intensity: e.detail.value
    });
  },

  // 修复照片
  repairPhoto() {
    if (!this.data.imageSrc) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    // 检查权限
    const permission = app.checkFeaturePermission('repair');
    if (!permission.allowed) {
      wx.showModal({
        title: '积分不足',
        content: `AI修复需要3积分，当前积分：${permission.currentCredits}`,
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
        content: 'AI修复将消费3积分，是否继续？',
        confirmText: '确认',
        success: (res) => {
          if (res.confirm) {
            this.performPhotoRepair();
          }
        }
      });
    } else {
      this.performPhotoRepair();
    }
  },

  // 执行照片修复
  performPhotoRepair() {
    this.setData({
      repairing: true
    });

    wx.showLoading({
      title: 'AI修复中...'
    });

    // 扣除积分
    if (!this.data.isVip) {
      const success = app.deductCredits(3);
      if (!success) {
        wx.hideLoading();
        this.setData({
          repairing: false
        });
        wx.showToast({
          title: '积分扣除失败',
          icon: 'none'
        });
        return;
      }
    }

    // 模拟AI修复过程
    setTimeout(() => {
      this.simulateAIRepair();
    }, 3000);
  },

  // 模拟AI修复
  simulateAIRepair() {
    const ctx = wx.createCanvasContext('repairCanvas');
    const imgPath = this.data.imageSrc;
    
    wx.getImageInfo({
      src: imgPath,
      success: (res) => {
        const { width, height } = res;
        const { repairType, intensity } = this.data;
        
        // 绘制原图
        ctx.drawImage(imgPath, 0, 0, width, height);
        
        // 应用修复效果（这里只是模拟，实际需要AI算法）
        this.applyRepairEffect(ctx, width, height, repairType, intensity);
        
        ctx.draw(false, () => {
          // 导出修复后的图片
          wx.canvasToTempFilePath({
            canvasId: 'repairCanvas',
            success: (res) => {
              this.handleRepairSuccess(res.tempFilePath);
            },
            fail: (err) => {
              this.handleRepairError(err);
            }
          });
        });
      },
      fail: (err) => {
        this.handleRepairError(err);
      }
    });
  },

  // 应用修复效果（模拟）
  applyRepairEffect(ctx, width, height, repairType, intensity) {
    // 这里只是模拟效果，实际需要复杂的AI算法
    
    switch (repairType) {
      case 'blur':
        // 模拟去模糊效果 - 增加对比度和锐度
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = intensity * 0.05;
        ctx.drawImage(ctx.canvas, 0, 0, width, height);
        break;
        
      case 'color':
        // 模拟上色修复 - 调整色彩饱和度
        ctx.globalCompositeOperation = 'saturation';
        ctx.globalAlpha = intensity * 0.08;
        ctx.drawImage(ctx.canvas, 0, 0, width, height);
        break;
        
      case 'auto':
      default:
        // 综合修复效果
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = intensity * 0.03;
        ctx.drawImage(ctx.canvas, 0, 0, width, height);
        break;
    }
    
    // 重置合成模式
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },

  // 处理修复成功
  handleRepairSuccess(tempFilePath) {
    wx.hideLoading();
    
    this.setData({
      repairedSrc: tempFilePath,
      repairing: false
    });

    // 更新用户数据
    this.initUserData();
    
    // 更新使用次数
    this.updateUsageCount('repair');
    
    wx.showToast({
      title: '修复成功',
      icon: 'success'
    });
  },

  // 处理修复错误
  handleRepairError(err) {
    wx.hideLoading();
    this.setData({
      repairing: false
    });
    
    wx.showToast({
      title: '修复失败',
      icon: 'none'
    });
  },

  // 保存图片
  saveImage() {
    if (!this.data.repairedSrc) {
      wx.showToast({
        title: '没有可保存的图片',
        icon: 'none'
      });
      return;
    }

    wx.saveImageToPhotosAlbum({
      filePath: this.data.repairedSrc,
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
    if (!this.data.repairedSrc) {
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
    const repairTypeMap = {
      'auto': '自动修复',
      'color': '上色修复',
      'scratch': '划痕修复',
      'blur': '清晰度修复'
    };
    const repairTypeName = repairTypeMap[this.data.repairType] || '自动修复';
    return {
      title: `AI修复老照片 - ${repairTypeName}让老照片重获新生`,
      imageUrl: this.data.repairedSrc || this.data.imageSrc || '/images/repair-share.jpg',
      query: 'from=timeline&feature=repair'
    };
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '推荐一个AI智能老照片修复工具',
      path: '/pages/repair/repair',
      imageUrl: this.data.repairedSrc || this.data.imageSrc || '/images/repair-share.jpg'
    };
  }
});