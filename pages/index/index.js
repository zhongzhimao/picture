// index.js
const app = getApp()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    userData: {},
    totalUsage: 0,
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
  },

  onLoad() {
    this.initUserData();
    this.getUserProfile();
  },

  onShow() {
    this.refreshUserData();
  },

  // 初始化用户数据
  initUserData() {
    const userData = app.globalData.userData || wx.getStorageSync('userData') || {
      credits: 5, // 新用户赠送5积分
      usageCount: {}
    };
    
    const totalUsage = Object.values(userData.usageCount).reduce((sum, count) => sum + count, 0);
    
    this.setData({
      userData,
      totalUsage
    });
  },

  // 刷新用户数据
  refreshUserData() {
    this.initUserData();
  },

  // 获取用户信息
  getUserProfile() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        userInfo,
        hasUserInfo: true
      });
    }
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    const { nickName } = this.data.userInfo;
    
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    });
    
    wx.setStorageSync('userInfo', this.data.userInfo);
  },

  // 输入昵称
  onInputChange(e) {
    const nickName = e.detail.value;
    const { avatarUrl } = this.data.userInfo;
    
    this.setData({
      "userInfo.nickName": nickName,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    });
    
    wx.setStorageSync('userInfo', this.data.userInfo);
  },

  // 处理头像点击事件
  handleAvatarClick() {
    if (!this.data.hasUserInfo) {
      // 未登录，执行登录
      console.log('用户未登录，开始登录流程');
      this.performWechatLogin();
    } else {
      // 已登录，提供更换头像选项
      wx.showActionSheet({
        itemList: ['更换头像', '重新登录'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 更换头像
            this.chooseNewAvatar();
          } else if (res.tapIndex === 1) {
            // 重新登录
            this.performWechatLogin();
          }
        }
      });
    }
  },

  // 选择新头像
  chooseNewAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          'userInfo.avatarUrl': tempFilePath
        });
        wx.setStorageSync('userInfo', this.data.userInfo);
        wx.showToast({
          title: '头像更新成功',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '选择头像失败',
          icon: 'none'
        });
      }
    });
  },

  // 处理昵称点击事件
  handleNicknameClick() {
    if (!this.data.hasUserInfo) {
      // 未登录，先登录
      this.performWechatLogin();
    } else {
      // 已登录，获取微信昵称
      this.getWechatNickname();
    }
  },

  // 获取微信昵称
  getWechatNickname() {
    wx.showLoading({
      title: '获取昵称中...',
    });

    // 尝试获取微信昵称
    if (wx.canIUse('getUserProfile')) {
      wx.getUserProfile({
        desc: '用于获取微信昵称',
        success: (res) => {
          console.log('获取微信昵称成功:', res.userInfo.nickName);
          this.updateNickname(res.userInfo.nickName);
        },
        fail: (error) => {
          console.log('getUserProfile 失败:', error);
          wx.hideLoading();
          // 如果getUserProfile失败，尝试其他方式
          this.tryAlternativeNickname();
        }
      });
    } else {
      // 兼容旧版本
      wx.getUserInfo({
        success: (res) => {
          console.log('获取微信昵称成功:', res.userInfo.nickName);
          this.updateNickname(res.userInfo.nickName);
        },
        fail: (error) => {
          console.log('getUserInfo 失败:', error);
          wx.hideLoading();
          this.tryAlternativeNickname();
        }
      });
    }
  },

  // 尝试其他方式获取昵称
  tryAlternativeNickname() {
    // 显示输入框让用户手动输入昵称
    wx.hideLoading();
    wx.showModal({
      title: '设置昵称',
      content: '请输入您的昵称',
      editable: true,
      placeholderText: '请输入昵称',
      success: (res) => {
        if (res.confirm && res.content) {
          this.updateNickname(res.content);
        }
      }
    });
  },

  // 更新昵称
  updateNickname(nickname) {
    wx.hideLoading();
    
    this.setData({
      'userInfo.nickName': nickname
    });
    
    wx.setStorageSync('userInfo', this.data.userInfo);
    
    wx.showToast({
      title: '昵称更新成功',
      icon: 'success'
    });
  },

  // 执行微信登录
  performWechatLogin() {
    wx.showLoading({
      title: '登录中...',
    });

    // 先调用 wx.login 获取 code
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          console.log('登录成功，code:', loginRes.code);
          
          // 获取用户信息
          this.getUserInfoFromWechat();
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('wx.login 失败:', error);
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 从微信获取用户信息
  getUserInfoFromWechat() {
    // 由于wx.getUserProfile已废弃，直接使用默认登录方式
    // 用户可以在后续通过头像选择和昵称输入来设置个人信息
    console.log('使用简化登录流程');
    
    // 设置默认的登录成功状态
    const defaultUserInfo = {
      avatarUrl: defaultAvatarUrl,
      nickName: '微信用户'
    };
    
    this.handleLoginSuccess(defaultUserInfo);
  },

  // 处理登录成功
  handleLoginSuccess(userInfo) {
    wx.hideLoading();
    
    console.log('登录成功，用户信息:', userInfo);
    
    // 更新页面数据，确保使用微信的真实头像和昵称
    this.setData({
      userInfo: {
        avatarUrl: userInfo.avatarUrl,
        nickName: userInfo.nickName
      },
      hasUserInfo: true
    });
    
    // 保存到本地存储
    wx.setStorageSync('userInfo', {
      avatarUrl: userInfo.avatarUrl,
      nickName: userInfo.nickName
    });
    
    // 更新全局数据
    app.globalData.userInfo = {
      avatarUrl: userInfo.avatarUrl,
      nickName: userInfo.nickName
    };
    
    wx.showToast({
      title: '登录成功',
      icon: 'success'
    });
  },

  // 获取用户授权
  getUserProfile() {
    this.performWechatLogin();
  },

  // 导航到功能页面
  navigateToFeature(e) {
    const feature = e.currentTarget.dataset.feature;
    
    // 检查功能积分消耗
    const creditCost = this.getCreditCost(feature);
    const currentCredits = this.data.userData.credits || 0;
    
    // 免费功能直接进入
    if (creditCost === 0) {
      this.navigateToFeaturePage(feature);
      return;
    }
    
    // 检查积分是否足够
    if (currentCredits < creditCost) {
      wx.showModal({
        title: '积分不足',
        content: `此功能需要${creditCost}积分，当前积分：${currentCredits}`,
        confirmText: '看广告',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.watchAdForCredits();
          }
        }
      });
      return;
    }
    
    // 积分足够，确认使用
    wx.showModal({
      title: '确认使用',
      content: `此功能将消耗${creditCost}积分，当前积分：${currentCredits}`,
      confirmText: '确认使用',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.useCredits(feature, creditCost);
        }
      }
    });
  },

  // 获取功能积分消耗
  getCreditCost(feature) {
    const costs = {
      'compress': 0,
      'convert': 0,
      'crop': 0,
      'grid': 0,
      'batch': 5,
      'watermark': 3,
      'idphoto': 4,
      'repair': 6
    };
    return costs[feature] || 0;
  },

  // 使用积分
  useCredits(feature, cost) {
    const userData = this.data.userData;
    userData.credits = (userData.credits || 0) - cost;
    userData.usageCount = userData.usageCount || {};
    userData.usageCount[feature] = (userData.usageCount[feature] || 0) + 1;
    
    // 保存数据
    wx.setStorageSync('userData', userData);
    app.globalData.userData = userData;
    
    // 更新显示
    this.setData({
      userData,
      totalUsage: Object.values(userData.usageCount).reduce((sum, count) => sum + count, 0)
    });
    
    wx.showToast({
      title: `消耗${cost}积分`,
      icon: 'success'
    });
    
    // 进入功能页面
    this.navigateToFeaturePage(feature);
  },

  // 导航到功能页面
  navigateToFeaturePage(feature) {
    const urlMap = {
      'compress': '/pages/compress/compress',
      'convert': '/pages/convert/convert',
      'crop': '/pages/crop/crop',
      'grid': '/pages/grid/grid',
      'batch': '/pages/batch/batch',
      'watermark': '/pages/watermark/watermark',
      'idphoto': '/pages/idphoto/idphoto',
      'repair': '/pages/repair/repair'
    };
    
    if (urlMap[feature]) {
      wx.navigateTo({
        url: urlMap[feature]
      });
    }
  },



  // 看广告获取积分
  watchAdForCredits() {
    // 检查是否支持广告
    if (wx.createRewardedVideoAd) {
      // 创建激励视频广告实例
      const rewardedVideoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-xxxxxxxx' // 需要替换为实际的广告位ID
      });

      // 监听广告加载事件
      rewardedVideoAd.onLoad(() => {
        console.log('激励视频广告加载成功');
      });

      // 监听广告错误事件
      rewardedVideoAd.onError((err) => {
        console.error('激励视频广告加载失败:', err);
        wx.showModal({
          title: '提示',
          content: '广告加载失败，请稍后重试',
          showCancel: false
        });
      });

      // 监听广告关闭事件
      rewardedVideoAd.onClose((status) => {
        if (status && status.isEnded || status === undefined) {
          // 用户看完广告，给予积分奖励
          this.giveCreditsForAd();
        } else {
          // 用户没看完广告，不给予奖励
          wx.showToast({
            title: '请看完广告才能获得积分',
            icon: 'none'
          });
        }
      });

      // 显示广告
      rewardedVideoAd.show()
        .catch(err => {
          console.error('激励视频广告显示失败:', err);
          // 如果广告显示失败，提供备用方案
          this.showAdFallback();
        });
    } else {
      // 不支持广告，显示备用方案
      this.showAdFallback();
    }
  },

  // 给予广告积分奖励
  giveCreditsForAd() {
    const creditsEarned = 5; // 每次看广告获得5积分
    
    // 更新用户数据
    const userData = this.data.userData;
    userData.credits = (userData.credits || 0) + creditsEarned;
    
    // 保存到本地存储
    wx.setStorageSync('userData', userData);
    app.globalData.userData = userData;
    
    // 更新页面显示
    this.setData({
      userData
    });
    
    wx.showToast({
      title: `获得${creditsEarned}积分！`,
      icon: 'success'
    });
  },

  // 广告备用方案
  showAdFallback() {
    wx.showModal({
      title: '获取积分',
      content: '暂时无法加载广告，您可以通过以下方式获取积分：\n\n1. 分享给好友\n2. 每日签到\n3. 邀请好友',
      confirmText: '分享给好友',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm) {
          this.onShareAppMessage();
        }
      }
    });
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '微信图片工具箱 - 一站式图片处理',
      imageUrl: '/images/share-cover.jpg',
      query: 'from=timeline'
    };
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '超好用的图片处理工具',
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.jpg'
    };
  },

  // 分享到朋友圈按钮点击
  shareToTimeline() {
    wx.showModal({
      title: '分享到朋友圈',
      content: '请点击右上角"..."按钮，选择"分享到朋友圈"',
      confirmText: '知道了',
      showCancel: false
    });
  }
});
