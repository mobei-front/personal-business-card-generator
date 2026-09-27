<script setup>
import { ref, watch, onUnmounted, computed } from 'vue'
import { toPng } from 'html-to-image'

// 名片预览组件：纯展示 + 事件上报，状态由父组件管理
const props = defineProps({
  form: {
    type: Object,
    required: true
  },
  theme: {
    type: Object,
    required: true
  },
  avatarOk: {
    type: Boolean,
    default: true
  },
  bioExpanded: {
    type: Boolean,
    default: true
  },
  bioTypeKey: {
    type: Number,
    default: 0
  },
  initials: {
    type: String,
    default: '?'
  }
})

defineEmits(['toggle-bio', 'avatar-error'])

// 是否有联系方式（任一非空即显示联系方式区）
const hasContact = computed(() =>
  !!(props.form.email || props.form.phone || props.form.wechat || props.form.github || props.form.blog)
)

// 简介打字机效果
const typedBio = ref('')
const typing = ref(false)
const cursorVisible = ref(false)
let typeTimer = null
let cursorTimer = null

function stopTypewriter() {
  if (typeTimer !== null) {
    clearInterval(typeTimer)
    typeTimer = null
  }
  typing.value = false
  // 打字完成后光标再闪烁 500ms 再关闭
  cursorVisible.value = true
  if (cursorTimer !== null) clearTimeout(cursorTimer)
  cursorTimer = setTimeout(() => {
    cursorVisible.value = false
  }, 500)
}

function startTypewriter() {
  if (typeTimer !== null || typedBio.value === props.form.bio) return
  cursorVisible.value = true
  typing.value = true
  typeTimer = setInterval(() => {
    typedBio.value = props.form.bio.slice(0, typedBio.value.length + 1)
    if (typedBio.value === props.form.bio) stopTypewriter()
  }, 90)
}

// 简介输入框失去焦点时（bioTypeKey 变化），从头播放打字机效果
watch(
  () => props.bioTypeKey,
  () => {
    if (!props.bioExpanded) return
    stopTypewriter()
    typedBio.value = ''
    startTypewriter()
  },
  { immediate: true }
)

// 展开时重新播放打字效果，收起时暂停
watch(
  () => props.bioExpanded,
  (expanded) => {
    if (expanded) {
      stopTypewriter()
      typedBio.value = ''
      startTypewriter()
    } else {
      stopTypewriter()
    }
  }
)

onUnmounted(() => {
  if (typeTimer !== null) clearInterval(typeTimer)
  if (cursorTimer !== null) clearTimeout(cursorTimer)
})

// 导出名片为图片（使用 html-to-image，基于浏览器 foreignObject 渲染）
const cardRef = ref(null)
const exporting = ref(false)

async function exportImage() {
  if (!cardRef.value || exporting.value) return
  exporting.value = true
  // 离屏克隆节点，避免影响页面上正在展示的名片
  const original = cardRef.value
  const clone = original.cloneNode(true)
  clone.classList.add('export-clone')
  // 显式设置宽高，脱离 grid 布局后保持与原卡片一致
  const rect = original.getBoundingClientRect()
  clone.style.width = `${rect.width}px`
  clone.style.minWidth = `${rect.width}px`

  // 1. 移除液态玻璃中渲染引擎不支持的层（SVG 位移滤镜 + mask 折射层）以及导出图标
  clone.querySelector('.lg-refract')?.remove()
  clone.querySelector('.lg-svg')?.remove()
  clone.querySelector('.export-icon')?.remove()

  // 2. 用主题纯色背景模拟磨砂玻璃（去掉 backdrop-filter，foreignObject 不支持）
  const solidBg = getComputedStyle(original).getPropertyValue('--theme-card-bg-solid').trim() || '#f5f3ff'
  clone.style.background = solidBg
  clone.style.backdropFilter = 'none'
  clone.style.webkitBackdropFilter = 'none'
  clone.style.border = '1px solid rgba(255,255,255,0.8)'
  clone.style.position = 'absolute'
  clone.style.left = '0'
  clone.style.top = '0'

  // 3. 注入样式：隐藏伪元素的 mask 描边与动画高光，保证内容层级
  const styleEl = document.createElement('style')
  styleEl.textContent = `
    .export-clone::before, .export-clone::after {
      display: none !important;
      background: none !important;
    }
    .export-clone > *:not(.lg-svg):not(.lg-refract) {
      position: relative !important;
      z-index: 3 !important;
    }
  `
  clone.appendChild(styleEl)

  // 4. 注入高光层（真实 div，比伪元素稳定）
  const highlight = document.createElement('div')
  highlight.style.cssText = `
    position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 1;
    background: linear-gradient(125deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.15) 25%, rgba(255,255,255,0) 45%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.12) 100%);
  `
  clone.insertBefore(highlight, clone.firstChild)

  // 5. 简介渲染完整文本、隐藏光标和收起按钮
  const bioEl = clone.querySelector('.bio')
  if (bioEl) {
    bioEl.textContent = props.form.bio
    bioEl.style.display = props.form.bio ? 'block' : 'none'
  }
  clone.querySelector('.cursor')?.remove()
  const toggleEl = clone.querySelector('.toggle-bio')
  if (toggleEl) toggleEl.style.display = 'none'

  // 6. 用零尺寸 overflow:hidden 的 wrapper 包裹，保证克隆节点 bounding rect 坐标正常（0,0），
  //    同时对用户不可见，避免 html-to-image 因负坐标导致内容偏移
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;overflow:hidden;'
  wrapper.appendChild(clone)
  document.body.appendChild(wrapper)

  try {
    const dataUrl = await toPng(clone, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: solidBg
    })
    const link = document.createElement('a')
    link.download = `${props.form.name || '名片'}-名片.png`
    link.href = dataUrl
    link.click()
  } finally {
    document.body.removeChild(wrapper)
    exporting.value = false
  }
}
</script>

<template>
  <section ref="cardRef" class="card-preview glass" :class="'theme-' + theme.id">
    <!-- 液态玻璃：SVG 边缘折射滤镜 -->
    <svg class="lg-svg" aria-hidden="true">
      <defs>
        <filter id="liquid-glass" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="32" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
    <!-- 边缘折射层：仅在卡片边缘产生液态形变，中心不变形 -->
    <div class="lg-refract" aria-hidden="true"></div>

    <!-- 右上角导出图标 -->
    <button
      class="export-icon"
      :disabled="exporting"
      :title="exporting ? '导出中...' : '导出图片'"
      @click="exportImage"
    >
      <svg v-if="!exporting" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      <svg v-else class="spin" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </button>

    <!-- 头像 -->
    <div class="avatar-wrap">
      <img
        v-if="avatarOk"
        class="avatar"
        :src="form.avatar"
        alt="头像"
        @error="$emit('avatar-error')"
      />
      <div v-else class="avatar-fallback">{{ initials }}</div>
    </div>

    <!-- 基本信息 -->
    <h2 class="name">
      <span v-if="form.name">{{ form.name }}</span>
      <span v-else class="empty-name">未填写姓名</span>
    </h2>
    <p v-if="form.title" class="title">{{ form.title }}</p>
    <p v-if="form.company" class="company">{{ form.company }}</p>

    <div class="divider"></div>

    <!-- 简介（可收起） -->
    <transition name="fade">
      <p v-show="bioExpanded && form.bio" class="bio">
        {{ typedBio }}<span v-if="cursorVisible" class="cursor"></span>
      </p>
    </transition>
    <button v-if="form.bio" class="toggle-bio" @click="$emit('toggle-bio')">
      {{ bioExpanded ? '收起简介' : '展开简介' }}
    </button>

    <!-- 联系方式（仅非空时显示） -->
    <ul v-if="hasContact" class="contacts">
      <li v-if="form.email" class="contact-item">
        <svg class="contact-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <span class="contact-text">{{ form.email }}</span>
      </li>
      <li v-if="form.phone" class="contact-item">
        <svg class="contact-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <span class="contact-text">{{ form.phone }}</span>
      </li>
      <li v-if="form.wechat" class="contact-item">
        <svg class="contact-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M8.5 4C4.91 4 2 6.46 2 9.5c0 1.74.95 3.29 2.43 4.29L4 16l2.5-1.5c.5.13 1.02.2 1.55.2h.3a5.5 5.5 0 0 1-.15-1.2c0-3.04 2.91-5.5 6.5-5.5.23 0 .45.01.67.03C14.5 5.86 11.8 4 8.5 4zm-2 3.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM14.8 10c-3.03 0-5.5 2.02-5.5 4.5 0 1.4.78 2.65 2 3.47L11 20l1.9-1.05c.57.16 1.18.25 1.8.25 3.03 0 5.5-2.02 5.5-4.5S17.83 10 14.8 10zm-1.5 3.25a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm3 0a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5z" />
        </svg>
        <span class="contact-text">{{ form.wechat }}</span>
      </li>
      <li v-if="form.github" class="contact-item">
        <svg class="contact-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.16.58.67.48A10 10 0 0 0 22 12C22 6.48 17.52 2 12 2z" />
        </svg>
        <span class="contact-text">{{ form.github }}</span>
      </li>
      <li v-if="form.blog" class="contact-item">
        <svg class="contact-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span class="contact-text">{{ form.blog }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
@import '../styles/themes.css';

.card-preview {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 36px 24px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  /* 液态玻璃基础：低透明度 + 强磨砂饱和，让背景色彩充分透出 */
  background: rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(30px) saturate(220%);
  -webkit-backdrop-filter: blur(30px) saturate(220%);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  /* 多层阴影：顶部内高光 + 底部内反光 + 外投影，塑造玻璃厚度与悬浮感 */
  box-shadow:
    inset 0 2px 2px rgba(255, 255, 255, 0.95),
    inset 0 -2px 4px rgba(255, 255, 255, 0.35),
    inset 0 0 60px rgba(255, 255, 255, 0.08),
    0 18px 50px var(--theme-shadow),
    0 4px 14px rgba(31, 38, 135, 0.1);
  z-index: 0;
}

/* SVG 滤镜仅作定义，不占位 */
.lg-svg {
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
}

/* 边缘折射层：用 SVG 位移滤镜模拟液态玻璃边缘形变，
   径向遮罩让中心透明、仅边缘产生折射，保证内容不变形 */
.lg-refract {
  position: absolute;
  inset: -6px;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.18);
  filter: url(#liquid-glass);
  -webkit-mask: radial-gradient(
    ellipse at center,
    transparent 32%,
    rgba(0, 0, 0, 0.5) 65%,
    rgba(0, 0, 0, 1) 100%
  );
  mask: radial-gradient(
    ellipse at center,
    transparent 32%,
    rgba(0, 0, 0, 0.5) 65%,
    rgba(0, 0, 0, 1) 100%
  );
  pointer-events: none;
  z-index: 0;
}

/* 镜面高光层：斜向反光 + 缓慢流动动画，模拟液态表面的光泽变化 */
.card-preview::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    125deg,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.15) 25%,
    rgba(255, 255, 255, 0) 45%,
    rgba(255, 255, 255, 0) 70%,
    rgba(255, 255, 255, 0.12) 100%
  );
  background-size: 200% 200%;
  animation: lg-shimmer 8s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}

@keyframes lg-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* 液态描边：更亮的渐变光带勾勒玻璃边缘 */
.card-preview::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 0.2) 30%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.15) 70%,
    rgba(255, 255, 255, 0.85) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 2;
}

/* 内容层置于所有视觉层之上 */
.card-preview > *:not(.lg-svg):not(.lg-refract):not(.export-icon) {
  position: relative;
  z-index: 3;
}

/* 头像 */
.avatar-wrap {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  padding: 4px;
  margin-bottom: 24px;
  background: var(--theme-avatar-grad);
  transition: background 0.4s ease;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  background: #f3f4f6;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52px;
  font-weight: 700;
  color: #fff;
  background: var(--theme-fallback-grad);
}

/* 文字信息 */
.name {
  font-size: 30px;
  font-weight: 700;
  color: var(--theme-text-main);
  letter-spacing: 0.5px;
}

.empty-name {
  color: var(--theme-text-weak);
  font-style: italic;
}

.title {
  margin-top: 8px;
  font-size: 17px;
  color: var(--theme-text-sub);
}

.company {
  margin-top: 6px;
  font-size: 15px;
  color: var(--theme-text-weak);
}

.divider {
  width: 52px;
  height: 3px;
  border-radius: 2px;
  margin: 20px 0;
  background: var(--theme-divider-grad);
  transition: background 0.4s ease;
}

/* 简介 */
.bio {
  font-size: 17px;
  line-height: 1.7;
  color: var(--theme-text-sub);
  text-align: center;
  max-width: 90%;
}

.toggle-bio {
  margin-top: 14px;
  font-size: 15px;
  color: var(--theme-link);
  background: none;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.toggle-bio:hover {
  opacity: 0.7;
  text-decoration: underline;
}

/* 联系方式 */
.contacts {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 100%;
  max-width: 80%;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--theme-text-sub);
  word-break: break-all;
}

.contact-icon {
  flex-shrink: 0;
  color: var(--theme-link);
  opacity: 0.85;
}

.contact-text {
  line-height: 1.4;
}

/* 右上角导出图标 */
.card-preview .export-icon {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 5;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  color: var(--theme-export-color);
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(31, 38, 135, 0.18);
  transition: background 0.2s, transform 0.2s, color 0.2s;
}

.card-preview .export-icon:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.85);
  transform: scale(1.08);
  color: var(--theme-export-hover);
}

.card-preview .export-icon:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.export-icon .spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 光标 */
.cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--theme-text-sub);
  vertical-align: middle;
  margin-left: 2px;
  animation: blink 0.9s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 简介展开/收起过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
