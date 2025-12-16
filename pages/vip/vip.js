// vip.js
const app = getApp()

Page({
  data: {
    isVip: false,
    expireTime: '',
    remainingDays: 0,
    userData: {},
    selectedPackage: 'monthly',
    selectedCredits: 0,
    paymentText: '立即开通月度会员',
    usageList: []
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: 'VIP会员'
    });
    this.initVipData();
    this.loadUsageList();
  },

  onShow() {
    this.initVipData();
  },

  // 初始化VIP数据
  initVipData() {
    const userData = app.globalData.userData || wx.getStorageSync('userData') || {
      isVip: false,
      vipExpireTime: null,
      credits: 0,
      usageCount: {}
    };

    const isVip = app.checkVipStatus();
    let expireTime = '';
    let remainingDays = 0;

    if (isVip && userData.vipExpireTime) {
      const expireDate = new Date(userData.vipExpireTime);
      expireTime = this.formatDate(expireDate);
      remainingDays = Math.ceil((userData.vipExpireTime - Date.now()) / (1000 * 60 * 60 * 24));
    }

    this.setData({
      isVip,
      expireTime,
      remainingDays,
      userData
    });

    this.updatePaymentText();
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 选择套餐
  selectPackage(e) {
    const packageType = e.currentTarget.dataset.package;
    this.setData({
      selectedPackage: packageType,
      selectedCredits: 0
    });
    this.updatePaymentText();
  },

  // 选择积分
  selectCredits(e) {
    const credits = parseInt(e.currentTarget.dataset.credits);
    this.setData({
      selectedCredits: credits,
      selectedPackage: ''
    });
    this.updatePaymentText();
  },

  // 更新支付按钮文字
  updatePaymentText() {
    const { isVip, selectedPackage, selectedCredits } = this.data;
    
    if (selectedCredits > 0) {
      this.setData({
        paymentText: `充值${selectedCredits}积分`
      });
    } else if (selectedPackage) {
      const packageNames = {
        'monthly': '月度会员',
        'quarterly': '季度会员',
        'yearly': '年度会员'
      };
      const action = isVip ? '续费' : '开通';
      this.setData({
        paymentText: `${action}${packageNames[selectedPackage]}`
      });
    } else {
      this.setData({
        paymentText: isVip ? '续费VIP' : '开通VIP'
      });
    }
  },

  // 处理支付
  handlePayment() {
    const { selectedPackage, selectedCredits, isVip } = this.data;

    if (selectedCredits > 0) {
      this.rechargeCredits(selectedCredits);
    } else if (selectedPackage) {
      this.purchaseVip(selectedPackage);
    } else {
      wx.showToast({
        title: '请选择套餐或积分',
        icon: 'none'
      });
    }
  },

  // 购买VIP
  purchaseVip(packageType) {
    const prices = {
      'monthly': 9.9,
      'quarterly': 26.9,
      'yearly': 89.9
    };

    const durations = {
      'monthly': 30,
      'quarterly': 90,
      'yearly': 365
    };

    const price = prices[packageType];
    const duration = durations[packageType];

    wx.showModal({
      title: '确认购买',
      content: `购买${packageType === 'monthly' ? '月度' : packageType === 'quarterly' ? '季度' : '年度'}会员，费用¥${price}`,
      confirmText: '确认支付',
      success: (res) => {
        if (res.confirm) {
          this.processVipPayment(packageType, duration, price);
        }
      }
    });
  },

  // 处理VIP支付
  processVipPayment(packageType, duration, price) {
    wx.showLoading({
      title: '支付中...'
    });

    // 模拟支付过程
    setTimeout(() => {
      wx.hideLoading();
      
      // 更新VIP状态
      const userData = this.data.userData;
      const now = Date.now();
      
      if (userData.isVip && userData.vipExpireTime > now) {
        // 续费：在现有时间基础上增加
        userData.vipExpireTime += duration * 24 * 60 * 60 * 1000;
      } else {
        // 新开通：从现在开始计算
        userData.vipExpireTime = now + duration * 24 * 60 * 60 * 1000;
      }
      
      userData.isVip = true;
      
      wx.setStorageSync('userData', userData);
      app.globalData.userData = userData;

      this.setData({
        isVip: true,
        userData
      });

      wx.showToast({
        title: '购买成功',
        icon: 'success'
      });

      // 重新计算到期时间
      this.initVipData();
    }, 1500);
  },

  // 充值积分
  rechargeCredits(amount) {
    const prices = {
      5: 5,
      10: 9.5,
      20: 18,
      50: 45
    };

    const bonusCredits = {
      5: 0,
      10: 0.5,
      20: 2,
      50: 5
    };

    const price = prices[amount];
    const bonus = bonusCredits[amount];
    const totalCredits = amount + bonus;

    wx.showModal({
      title: '确认充值',
      content: `充值${amount}积分，赠送${bonus}积分，共${totalCredits}积分，费用¥${price}`,
      confirmText: '确认支付',
      success: (res) => {
        if (res.confirm) {
          this.processCreditsPayment(totalCredits, price);
        }
      }
    });
  },

  // 处理积分支付
  processCreditsPayment(credits, price) {
    wx.showLoading({
      title: '支付中...'
    });

    // 模拟支付过程
    setTimeout(() => {
      wx.hideLoading();
      
      // 更新积分
      const userData = this.data.userData;
      userData.credits += credits;
      
      wx.setStorageSync('userData', userData);
      app.globalData.userData = userData;

      this.setData({
        userData
      });

      wx.showToast({
        title: '充值成功',
        icon: 'success'
      });
    }, 1500);
  },

  // 加载使用记录
  loadUsageList() {
    // 模拟使用记录数据
    const mockUsageList = [
      {
        feature: '图片压缩',
        time: '2024-01-10 14:30',
        cost: 0
      },
      {
        feature: '格式转换',
        time: '2024-01-09 10:15',
        cost: 0
      },
      {
        feature: '去除水印',
        time: '2024-01-08 16:45',
        cost: 0.5
      }
    ];

    this.setData({
      usageList: mockUsageList
    });
  }
});