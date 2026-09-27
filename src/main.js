import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'
import {
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NSpace,
  NMessageProvider
} from 'naive-ui'

const app = createApp(App)
app.component('NDrawer', NDrawer)
app.component('NDrawerContent', NDrawerContent)
app.component('NForm', NForm)
app.component('NFormItem', NFormItem)
app.component('NInput', NInput)
app.component('NButton', NButton)
app.component('NSpace', NSpace)
app.component('NMessageProvider', NMessageProvider)
app.mount('#app')
