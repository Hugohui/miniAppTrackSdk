### 微信小程序埋点上报SDK

#### 安装
```javascript
// app.wpy
require('./tracker/sd-stat.js')
```

#### 自定义上报
```javascript
app.sdstat.sendEvent({
  event_name: 'btnClick'
})
```