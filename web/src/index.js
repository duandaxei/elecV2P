import { createApp } from 'vue'
import App from './App.vue';

import axios from 'axios'
import wsrecv from './utils/webws'
import * as string from './utils/string.js'
import * as api from './utils/api.js'
import { t, ta } from './i18n/lang'

import './assets/css/global.css'
import 'vue-draggable-resizable/style.css'

const app = createApp(App)
app.config.globalProperties.$axios = axios
app.config.globalProperties.$wsrecv = wsrecv
app.config.globalProperties.$sType = string.sType
app.config.globalProperties.$sString = string.sString
app.config.globalProperties.$sJson = string.sJson
app.config.globalProperties.$sTime = string.sTime
app.config.globalProperties.$logHead = string.logHead
app.config.globalProperties.$uStr = string
app.config.globalProperties.$uApi = api
app.config.globalProperties.$evui = e=>api.vue2Proto.evui(e)
app.config.globalProperties.$message = api.vue2Proto.message
app.config.globalProperties.$t = t
app.config.globalProperties.$ta = ta

app.mount('#app')