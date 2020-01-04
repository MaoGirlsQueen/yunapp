// pages/blog-edit/blog-edit.js
const MAX_WORDS_NUM = 140;
const MAX_IMG_NUM = 9;
const db = wx.cloud.database();
let content = '';
let userInfo = {};
let len =0;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    wordsNum: 0,
    footerBottom: 0,
    images: [],
    selectPhoto: true,

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)
    userInfo = options;
   
  },
  _getRecord(){
    wx.cloud.callFunction({
      name: 'record',
     data:{
       $url:"recordlist"
     }
    }).then((res) => {
       console.log(res)
      if (res.result.data.length>0){
          len = res.result.data.length
      }
    })
  },
  onInput(event) {

    let wordsNum = event.detail.value.length;
    if (wordsNum >= MAX_WORDS_NUM) {
      wordsNum = `最大字数为${MAX_WORDS_NUM}`
    }
    this.setData({
      wordsNum
    })
    content = event.detail.value;
  },
  onFocus(event) {
    console.log(event);
    this.setData({
      footerBottom: event.detail.height
    })
  },
  onBlur(event) {
    this.setData({
      footerBottom: 0
    })
  },
  onChooseImage() {
    let max = MAX_IMG_NUM - this.data.images.length
    wx.chooseImage({
      count: max,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log(res)
        this.setData({
          images: this.data.images.concat(res.tempFilePaths)
        })
        // 还能再选几张图片
        max = MAX_IMG_NUM - this.data.images.length
        this.setData({
          selectPhoto: max <= 0 ? false : true
        })
      },
    })
  },
  onDelImage(event) {
    let id = event.target.dataset.index;
    this.data.images.splice(id, 1);
    this.setData({
      images: this.data.images
    })
    if (this.data.images.length == MAX_IMG_NUM - 1) {
      this.setData({
        selectPhoto: true
      })
    }
  },
  onPreviewImage(event) {
    let imgsrc = event.target.dataset.imgsrc;
    wx.previewImage({
      urls: this.data.images,
      current: imgsrc
    })
  },
  send() {
    //上传图片
    if (content.trim() == '') {
      wx.showModal({
        title: '请输入内容',
        content: '',
      })
      return;
    }
    let promiseArr = [];
    let fileIds = [];
    wx.showLoading({
      title: '发布中',
      mask: true
    })
    this._getRecord();
    for (let i = 0, len = this.data.images.length; i < len; i++) {
      let p = new Promise((resolve, reject) => {
        let item = this.data.images[i];
        let suffix = /\.\w+$/.exec(item)[0];
        wx.cloud.uploadFile({
          cloudPath: 'record/' + Date.now() + '-' + Math.random() * 1000000 + suffix,
          filePath: item,
          success: (res) => {

            fileIds = fileIds.concat(res.fileID)
            resolve();
          },
          fail: (err) => {
            console.log("err", err)
            reject();
          }
        })
      })
      promiseArr.push(p)
    }

    Promise.all(promiseArr).then((res) => {
      db.collection("record").add({
        data: {
          content,
          img: fileIds,
          count:len+1,
          createTime: db.serverDate()
        }
      }).then((res) => {
        console.log(" Promiseres", res)
        wx.hideLoading();
        wx.showToast({
          title: '发布成功',
          content: '',
        })
        wx.switchTab({
          url: '../record/record',
        })
        // wx.navigateBack();
        // const pages = getCurrentPages();
        // const prevPage = pages[pages.length - 2]
        // prevPage.onPullDownRefresh()
      }).catch((err) => {
        console.log(" Promiseres", err)
        wx.hideLoading();
        wx.showToast({
          title: '发布失败',
          content: '',
        })
      })
    })



  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})