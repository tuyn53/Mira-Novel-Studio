import { addCollection } from '@iconify/vue'
import lucide from '@iconify-json/lucide/icons.json'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import router from './router'
import { mountApp } from './platform/wujie'
import './styles/tokens.scss'
import './styles/base.scss'

// 图标数据本地化：lucide 全集随包分发，运行时不请求 iconify API（本地优先）
addCollection(lucide)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })
mountApp(app)
