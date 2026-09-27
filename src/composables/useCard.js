import { reactive, ref, computed, watch } from 'vue'
import { themes } from '../data/themes'

// 名片默认数据
const createDefaultForm = () => ({
  name: '陌北',
  title: 'AI全栈开发工程师',
  company: '陌北科技有限公司',
  bio: '热爱技术，喜欢把复杂工程逐步拆解成各个小模块，形成一个完整的系统',
  avatar: 'https://mobei-kb.pages.dev/image/logo.png'
})

// 模块级单例状态：多个组件共享同一份名片数据
const form = reactive(createDefaultForm())
const theme = ref(themes[0])
const avatarOk = ref(true)
const bioExpanded = ref(true)
// 简介打字机触发信号：简介输入框失去焦点时 +1，驱动预览重新播放打字机
const bioTypeKey = ref(0)                                                        

// 头像加载失败时展示姓名首字母
const initials = computed(() => {
  const n = (form.name || '?').trim()
  return n ? n.charAt(0).toUpperCase() : '?'
})

function selectTheme(t) {
  theme.value = t
}

function nextTheme() {
  const idx = themes.findIndex((t) => t.id === theme.value.id)
  theme.value = themes[(idx + 1) % themes.length]
}

function reset() {
  Object.assign(form, createDefaultForm())
  avatarOk.value = true
  bioExpanded.value = true
  theme.value = themes[0]
  // 重置后驱动预览重新播放简介打字机
  bioTypeKey.value++
}

function toggleBio() {
  bioExpanded.value = !bioExpanded.value
}

function triggerBioType() {
  bioTypeKey.value++
}

function onAvatarError() {
  avatarOk.value = false
}

// 头像链接一旦修改，重新尝试加载
watch(
  () => form.avatar,
  () => {
    avatarOk.value = true
  }
)

export function useCard() {
  return {
    form,
    themes,
    theme,
    avatarOk,
    bioExpanded,
    bioTypeKey,
    initials,
    selectTheme,
    nextTheme,
    reset,
    toggleBio,
    triggerBioType,
    onAvatarError
  }
}
