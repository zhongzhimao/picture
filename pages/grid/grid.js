// grid.js
const app = getApp()

Page({
  data: {
    imageSrc: '',
    imageDimensions: '',
    gridMode: '3x3',
    borderWidth: 2,
    borderColor: '#ffffff',
    cutting: false,
    gridImages: []
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '九宫格切图'
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
          gridImages: []
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



  // 切图
  cutImage() {
    if (!this.data.imageSrc) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({
      cutting: true
    });

    wx.showLoading({
      title: '切图中...'
    });

    // 使用canvas进行切图
    this.cutWithCanvas();
  },

  // 使用canvas切图
  cutWithCanvas() {
    const imgPath = this.data.imageSrc;
    
    wx.getImageInfo({
      src: imgPath,
      success: (res) => {
        const { width, height } = res;
        
        // 九宫格切图：长度分2刀（3等份），宽度分2刀（3等份）
        // 使用整数计算避免浮点数误差
        const cellWidth = Math.floor(width / 3);  // 长度方向分成3份
        const cellHeight = Math.floor(height / 3); // 宽度方向分成3份
        
        // 计算剩余的像素，分配给边缘的格子
        const remainingWidth = width - (cellWidth * 3);
        const remainingHeight = height - (cellHeight * 3);
        
        console.log(`原图尺寸: ${width}x${height}`);
        console.log(`基础格子尺寸: ${cellWidth}x${cellHeight}`);
        console.log(`剩余像素: 宽${remainingWidth}, 高${remainingHeight}`);
        
        // 使用精确的切图方法
        this.performPreciseCut(imgPath, width, height, cellWidth, cellHeight, remainingWidth, remainingHeight);
      },
      fail: (err) => {
        this.handleCutError(err);
      }
    });
  },

  // 精确切图方法
  performPreciseCut(imgPath, originalWidth, originalHeight, cellWidth, cellHeight, remainingWidth, remainingHeight) {
    const gridImages = [];
    let currentIndex = 0;
    
    const cutNext = () => {
      if (currentIndex >= 9) {
        this.handleCutSuccess(gridImages);
        return;
      }
      
      const row = Math.floor(currentIndex / 3);
      const col = currentIndex % 3;
      
      // 精确计算每个格子的实际尺寸和位置
      let actualX = col * cellWidth;
      let actualY = row * cellHeight;
      let actualWidth = cellWidth;
      let actualHeight = cellHeight;
      
      // 将剩余像素分配给边缘的格子
      if (col === 2) actualWidth += remainingWidth; // 最右边的格子
      if (row === 2) actualHeight += remainingHeight; // 最下边的格子
      
      console.log(`切图 [${currentIndex}] [${row},${col}]: 位置(${actualX},${actualY}), 尺寸${actualWidth}x${actualHeight}`);
      
      this.cutSingleImage(imgPath, actualX, actualY, actualWidth, actualHeight)
        .then((imagePath) => {
          gridImages[currentIndex] = imagePath;
          currentIndex++;
          setTimeout(cutNext, 150);
        })
        .catch((err) => {
          console.error(`切图失败 [${currentIndex}]:`, err);
          currentIndex++;
          setTimeout(cutNext, 150);
        });
    };
    
    cutNext();
  },

  // 序列化切图，避免Canvas并发问题
  performSequentialCut(imgPath, originalWidth, originalHeight, cellWidth, cellHeight) {
    const gridImages = [];
    let currentIndex = 0;
    
    console.log(`开始九宫格切图：原图${originalWidth}x${originalHeight}, 每格${cellWidth}x${cellHeight}`);
    
    const cutNext = () => {
      if (currentIndex >= 9) {
        // 所有切图完成
        console.log('九宫格切图完成');
        this.handleCutSuccess(gridImages);
        return;
      }
      
      const row = Math.floor(currentIndex / 3);
      const col = currentIndex % 3;
      
      // 精确计算每个格子的坐标
      const sourceX = Math.round(col * cellWidth);
      const sourceY = Math.round(row * cellHeight);
      
      console.log(`切图 [${currentIndex}] [${row},${col}]: 原图坐标(${sourceX},${sourceY}), 尺寸${cellWidth}x${cellHeight}`);
      
      this.cutSingleImage(imgPath, sourceX, sourceY, cellWidth, cellHeight)
        .then((imagePath) => {
          gridImages[currentIndex] = imagePath;
          currentIndex++;
          setTimeout(cutNext, 150); // 增加延迟确保Canvas完全重置
        })
        .catch((err) => {
          console.error(`切图失败 [${currentIndex}]:`, err);
          currentIndex++;
          setTimeout(cutNext, 150);
        });
    };
    
    cutNext();
  },

  // 切单个图片 - 使用裁剪方法
  cutSingleImage(imgPath, sourceX, sourceY, sourceWidth, sourceHeight) {
    return new Promise((resolve, reject) => {
      const ctx = wx.createCanvasContext('gridCanvas');
      
      // 清空canvas
      ctx.clearRect(0, 0, 2000, 2000);
      
      // 设置裁剪区域
      ctx.beginPath();
      ctx.rect(0, 0, sourceWidth, sourceHeight);
      ctx.clip();
      
      // 绘制整张图片，但只有裁剪区域内的部分会显示
      ctx.drawImage(imgPath, -sourceX, -sourceY);
      
      ctx.draw(true, () => {
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvasId: 'gridCanvas',
            x: 0,
            y: 0,
            width: sourceWidth,
            height: sourceHeight,
            destWidth: sourceWidth,
            destHeight: sourceHeight,
            success: (res) => {
              console.log(`切图成功 (${sourceX},${sourceY}): ${res.tempFilePath}`);
              resolve(res.tempFilePath);
            },
            fail: (err) => {
              console.error('切图失败:', err);
              reject(err);
            }
          });
        }, 500);
      });
    });
  },

  // 计算网格参数
  calculateGridParams(mode, width, height, borderWidth) {
    // 九宫格切图：始终是3x3，不改变原图尺寸
    const rows = 3;
    const cols = 3;
    
    return {
      rows,
      cols,
      originalWidth: width,
      originalHeight: height
    };
  },

  // 执行网格切图
  performGridCut(gridParams) {
    const { rows, cols, cellWidth, cellHeight } = gridParams;
    const gridImages = [];
    
    // 逐个切图
    const cutPromises = [];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const promise = this.cutSingleCell(row, col, cellWidth, cellHeight);
        cutPromises.push(promise);
      }
    }
    
    Promise.all(cutPromises)
      .then((images) => {
        this.handleCutSuccess(images);
      })
      .catch((err) => {
        this.handleCutError(err);
      });
  },

  // 切单个格子
  cutSingleCell(row, col, cellWidth, cellHeight) {
    return new Promise((resolve, reject) => {
      const x = col * cellWidth;
      const y = row * cellHeight;
      
      wx.canvasToTempFilePath({
        canvasId: 'gridCanvas',
        x: x,
        y: y,
        width: cellWidth,
        height: cellHeight,
        destWidth: cellWidth,
        destHeight: cellHeight,
        success: (res) => {
          resolve(res.tempFilePath);
        },
        fail: (err) => {
          console.error('切图失败:', err);
          reject(err);
        }
      });
    });
  },

  // 处理切图成功
  handleCutSuccess(images) {
    wx.hideLoading();
    
    this.setData({
      gridImages: images,
      cutting: false
    });

    // 更新使用次数
    this.updateUsageCount('grid');
    
    wx.showToast({
      title: '切图成功',
      icon: 'success'
    });
  },

  // 处理切图错误
  handleCutError(err) {
    wx.hideLoading();
    this.setData({
      cutting: false
    });
    
    wx.showToast({
      title: '切图失败',
      icon: 'none'
    });
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.gridImages[index],
      urls: this.data.gridImages
    });
  },

  // 保存全部图片
  saveAllImages() {
    if (this.data.gridImages.length === 0) {
      wx.showToast({
        title: '没有可保存的图片',
        icon: 'none'
      });
      return;
    }

    // 检查相册权限
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.performSaveAll();
            },
            fail: () => {
              wx.showModal({
                title: '提示',
                content: '需要授权保存图片到相册',
                confirmText: '去授权',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting();
                  }
                }
              });
            }
          });
        } else {
          this.performSaveAll();
        }
      }
    });
  },

  // 执行保存全部图片
  performSaveAll() {
    wx.showLoading({
      title: '保存中...'
    });

    let savedCount = 0;
    const totalCount = this.data.gridImages.length;

    this.data.gridImages.forEach((imagePath, index) => {
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
          console.error('保存图片失败:', err);
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

  // 分享图片
  shareImages() {
    if (this.data.gridImages.length === 0) {
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
      title: '九宫格切图 - 朋友圈必备神器',
      imageUrl: this.data.imageSrc || '/images/grid-share.jpg',
      query: 'from=timeline&feature=grid'
    };
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '推荐一个超好用的九宫格切图工具',
      path: '/pages/grid/grid',
      imageUrl: this.data.imageSrc || '/images/grid-share.jpg'
    };
  }
});