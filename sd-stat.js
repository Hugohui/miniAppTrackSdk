import UUID from './UUID'
import wepy from 'wepy';
import { getStore } from 'wepy-redux'
import { setGame } from '../store/actions/game.redux'
import versionConfig from '@/common/version_config'
(function(){
    var config = require('./sd-stat-conf.js');
    /* 公共 */
    const DEBUG_MODE = 1; // 1 debug模式；0 正常统计模式
    const store = getStore(); // 状态
    let user_id = store.getState().user.userInfo1._id;
    let events = {}; // 上报事件
    let from_page = ""; //页面来源
    let last_page = ''; // 上个页面
    let last_page_event_id = ''; //上一个页面的b_entry_page的event_id
    let cur_page = ''; // 当前页面

    /* 小程序生命周期相关 */
    let launch_id = ''; // 小程序启动id，记录小程序启动次数
    let session_id = ''; // 小程序显示id,记录从后台进入前台的次数
    let app_start_time = ''; // 小程序开始加载时间
    let app_show_time = ''; // 小程序从后台切换到前台的时间
    let app_leave_time = ''; // 小程序从前台切换到后台的时间

    /* 页面生命周期相关 */
    let page_load_id = ''; // 页面加载id，记录页面加载次数
    let page_show_id = ''; // 页面显示id，记录页面显示次数和页面停留时间
    let page_load_time = ''; // 页面开始加载时间
    let page_show_time = ''; // 页面开始显示时间
    let page_ready_time = ''; //页面初次渲染完成时间
    let page_leave_time = ''; // 页面隐藏时间
    let page_unload_time = ''; // 页面写在时间

    let interval = {}
    // 获取页面生命周期事件
    function getPageSingleEvent(o) {
      let defaultOptions = {
        event_name: '',
        event_time: Date.now(),
        from_page: '',
        act_path: getCurrentPage(),
        act_path_query: getCurrentPageArgs(),
        to_page: '',
        extra: null
      }
      const option = Object.assign({}, defaultOptions, o);
      try {
        from_page = wx.getStorageSync('last_page')
      } catch (e) {
        from_page = '';
      }
      cur_page = config.pathNameMap[option.act_path] || '';
      let event = {
        event_time:  option.event_time,
        event_name: option.event_name,
        event_id: UUID.generate(),
        launch_id: launch_id,
        session_id: session_id,
        page_load_id: page_load_id,
        page_show_id: page_show_id,
        info_session_id: option.info_session_id || '',
        cur_page: config.pathNameMap[option.act_path] || '',
        from_page: from_page || '',
        to_page: option.to_page || '',
        act_path: option.act_path || '',
        act_path_query: option.act_path_query || '',
        enter_mode: 0,
        play_status: ''
      }
      if (option.event_name == 'b_entry_page') {
        last_page = option.act_path;
        last_page_event_id = event.event_id;
      }
      if (option.event_name == 'b_leave_page' || option.event_name == 'b_unload_page') {
        last_page = config.pathNameMap[last_page] || last_page;
        wx.setStorageSync('last_page', last_page);
        wx.setStorageSync('last_page_event_id', last_page_event_id);
      }
      if (option.extra != undefined) {
        return Object.assign({},event,option.extra);
      }
      return event;
    }
    function uploadData(){
      let event = events;
      if (event&&event.events.length>0) {
          event.report_time = Date.now();
          event.report_id = store.getState().system.deviceId + events.report_time +sixRandomNumber();
          event.open_id = store.getState().user.open_id || '';
          event.user_id = store.getState().user.userInfo1._id || '';
          event.source =  store.getState().user.userInfo1.source || '';
          events.device_id =  store.getState().system.deviceId || '';
          let params = JSON.stringify(event);
          wepy.request({
              url: 'xxxx',
              method: 'POST',
              data: params,
              header: { 'Content-Type': 'application/json' },
          });
      }
      events.events = [];
    }
    //事件上报
    function startReportData(){
      uploadData();
      interval = setInterval(uploadData,3000)
    }

    //获取当前页面的额query
    function getCurrentPageArgs(){
      var pages = getCurrentPages()    //获取加载的页面
      if (pages.length > 0) {
        var currentPage = pages[pages.length-1]    //获取当前页面的对象
        var options = currentPage.options    //如果要获取url中所带的参数可以查看options
        //拼接url的参数
        var urlWithArgs=''
        for(var key in options){
            var value = options[key]
            urlWithArgs += key + '=' + value + '&'
        }
        urlWithArgs = urlWithArgs.substring(0, urlWithArgs.length-1)
        return urlWithArgs
      }
    }

    //获取当前页面path
    function getCurrentPage(){
        var pages = getCurrentPages()    //获取加载的页面
        if (pages.length > 0) {
          var currentPage = pages[pages.length-1]    //获取当前页面的对象
          var url = currentPage.route    //当前页面url
          return url
        }
    }

    // 6位随机数
    function sixRandomNumber(){
      var i=Math.random()*(999999-100000)+100000;
      var j=parseInt(i,10);
      return j;
    }

    const proxy = (obj, methodName, custom) => {
      if (obj[methodName]) {
        let method = obj[methodName]
        obj[methodName] = function (event) {
          custom.call(this, event, methodName)
          method.call(this, event)
        }
      } else {
        obj[methodName] = function (event) {
          custom.call(this, event, methodName)
        }
      }
    }

    /* page 生命周期 */
    const onLoad = function (event, methodName) {
      const event_time = Date.now();
      page_load_id = UUID.generate();
      page_show_id = '';
      page_load_time = Date.now();
      let duration = page_load_time - app_show_time;
      let defaultOptions = {
        event_name: 'b_load_page',
        event_time: event_time,
        extra: {
          duration:duration
        }
      }
      events.events.push(getPageSingleEvent(defaultOptions));
    }

    const onShow = function (event, methodName) {
      const event_time = Date.now();
      page_show_id = UUID.generate();
      page_show_time = Date.now();
      // 页面显示到小程序显示的延迟
      let duration = page_show_time - app_show_time;
      let defaultOptions = {
        event_name: 'b_entry_page',
        event_time: event_time,
        extra: {
          duration:duration
        }
      }
      events.events.push(getPageSingleEvent(defaultOptions));
    }

    const onReady = function (event, methodName) {
      const event_time = Date.now();
      page_ready_time = Date.now();
      // 页面显示到初次渲染的时间
      let duration = page_ready_time - page_show_time;
      let defaultOptions = {
        event_name: 'b_ready_page',
        event_time: event_time,
        extra: {
          duration:duration
        }
      }
      events.events.push(getPageSingleEvent(defaultOptions));


    }

    const onHide = function (event, methodName) {
      const event_time = Date.now();
      page_leave_time = Date.now();
      // 页面显示到页面隐藏的时间
      let duration = page_leave_time - page_show_time;
      let defaultOptions = {
        event_name: 'b_leave_page',
        event_time: event_time,
        extra: {
          duration:duration
        }
      }
      events.events.push(getPageSingleEvent(defaultOptions));
    }

    const onUnload = function (event, methodName) {
      const event_time = Date.now();
      page_unload_time = Date.now();
      let duration = page_unload_time - page_show_time;
      let defaultOptions = {
        event_name: 'b_unload_page',
        event_time: event_time,
        extra: {
          duration:duration
        }
      }
      events.events.push(getPageSingleEvent(defaultOptions));
    }

    function sdstat(app){
      console.log("init");
    }

    /* app 生命周期*/
    const onLaunch = function (event, methodName) {
      const event_time = Date.now();
      app_start_time  = Date.now();
      this["sdstat"] = new sdstat(event);
      const systemInfo = store.getState().system.systemInfo;
      launch_id = UUID.generate();
      store.dispatch(setGame({
        launch_id: launch_id
      }));
      user_id = store.getState().user.userInfo1._id;
      events.user_id = user_id;
      events.app_name = config.app_name;
      events.app_id = config.app_id;
      events.device_id =  store.getState().system.deviceId;
      events.box_device_id = store.getState().system.box_device_id || '';
      events.version_name = config.version_name;
      events.platform_name = 'wx'; // 小程序 ios android
      events.platform_version = config.version_name;
      events.phone_model = systemInfo.model;
      events.system_name = systemInfo.system.split(" ")[0];
      events.system_version = systemInfo.system.split(" ")[1];
      events.window_height = systemInfo.windowHeight;
      events.window_width = systemInfo.windowWidth;
      events.pixel_ratio = systemInfo.pixelRatio;
      events.sdk_version = systemInfo.SDKVersion;
      events.mini_kernel_version = systemInfo.innerVersion || '';
      events.network_type = '';
      wx.getNetworkType({
        success: function(res) {
          // wifi/2g/3g/4g/unknown(Android下不常见的网络类型)/none(无网络)
          events.network_type = res.networkType
        }
      });
      events.debug_mode = DEBUG_MODE;
      wx.setStorage({
        key:'from_page',
        data:''
      })
      events.report_time = Date.now();
      events.report_id = store.getState().system.deviceId + events.report_time +sixRandomNumber();
      events.events = [];
      let defaultOptions = {
        event_name: 'b_launch_mini_app',
        event_time: event_time
      }
      events.events.push(getPageSingleEvent(defaultOptions));
      // 本地存储恢复
      if (event.path == 'pages/index') {
        last_page = '';
      } else {
        last_page = 'share';
      }
      wx.setStorageSync('last_page', last_page);
      wx.setStorageSync('last_page_event_id', last_page_event_id);
    }

    const onAppShow = function (event, methodName) {
      startReportData();
      const event_time = Date.now();
      app_show_time  = Date.now();
      let duration = app_show_time - app_start_time;
      session_id = UUID.generate();
      let defaultOptions = {
        event_name: 'b_entry_mini_app',
        event_time: event_time,
        extra: {
          duration: duration
        }
      }
      events.events.push(getPageSingleEvent(defaultOptions));
    }

    const onAppHide = function (event, methodName) {
      const event_time = Date.now();
      app_leave_time = Date.now()
      // 小程序正常使用时长（切换到后台或者退出进程）
      let duration =app_leave_time  - app_show_time;
      let defaultOptions = {
        event_name: 'b_leave_mini_app',
        event_time: event_time,
        extra: {
          duration: duration
        }
      }
      events.events.push(getPageSingleEvent(defaultOptions));
      clearInterval(interval);
    }

    /* evnets */
    sdstat.prototype["sendEvent"] = function(o){
      const event_time = Date.now();
      let defaultOptions = {
        event_name: o.event_name,
        event_time: o.event_time || event_time,
        to_page: o.to_page || '',
        extra: Object.assign({},o.extra)
      }
      events.events.push(getPageSingleEvent(defaultOptions));
    };

    var _App = App;
    App = function(obj) {
        proxy(obj, "onLaunch", onLaunch);
        proxy(obj, "onShow", onAppShow);
        proxy(obj, "onHide",onAppHide);
        _App(obj)
    };

    var _Page = Page
    Page = function(obj) {
      proxy(obj, 'onLoad', onLoad)
      proxy(obj, 'onShow', onShow)
      proxy(obj, 'onReady', onReady)
      proxy(obj, 'onHide', onHide)
      proxy(obj, 'onUnload', onUnload)
      _Page(obj)
    }
})();
