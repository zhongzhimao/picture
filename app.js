// app.js
App({
  onLaunch() {
    // 初始化用户数据
    this.initUserData();
    
    // 检查登录状态
    this.checkLoginStatus();
  },

  // 初始化用户数据
  initUserData() {
    const userData = wx.getStorageSync('userData') || {
      credits: 5, // 新用户赠送5积分
      usageCount: {}
    };
    this.globalData.userData = userData;
  },

  // 检查登录状态
  checkLoginStatus() {
    wx.login({
      success: res => {
        if (res.code) {
          // 这里可以调用后端接口获取用户信息
          console.log('登录成功，code:', res.code);
        }
      }
    });
  },

  globalData: {
    userData: null,
    userInfo: null
  }
})