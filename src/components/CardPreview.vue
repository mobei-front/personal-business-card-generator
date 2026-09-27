<script setup>
import { ref, watch, onUnmounted } from 'vue'
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
  </section>
</template>

<style scoped>
.card-preview {
  position: relative;
  padding: 44px 31px 31px;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  width: 132px;
  height: 132px;
  border-radius: 50%;
  padding: 4px;
  margin-bottom: 20px;
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
  font-size: 44px;
  font-weight: 700;
  color: #fff;
  background: var(--theme-fallback-grad);
}

/* 文字信息 */
.name {
  font-size: 26px;
  font-weight: 700;
  color: var(--theme-text-main);
  letter-spacing: 0.5px;
}

.empty-name {
  color: var(--theme-text-weak);
  font-style: italic;
}

.title {
  margin-top: 7px;
  font-size: 15px;
  color: var(--theme-text-sub);
}

.company {
  margin-top: 4px;
  font-size: 14px;
  color: var(--theme-text-weak);
}

.divider {
  width: 44px;
  height: 3px;
  border-radius: 2px;
  margin: 15px 0;
  background: var(--theme-divider-grad);
  transition: background 0.4s ease;
}

/* 简介 */
.bio {
  font-size: 15px;
  line-height: 1.7;
  color: var(--theme-text-sub);
  text-align: center;
  max-width: 86%;
}

.toggle-bio {
  margin-top: 11px;
  font-size: 14px;
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

/* ========== 主题配色系统 ========== */
/* 每个主题定义完整的色彩变量，覆盖卡片所有彩色元素 */

/* 经典白（默认）：磨砂玻璃透明背景 + 蓝灰点缀，极简高级风 */
.theme-classic {
  --theme-accent: #64748b;
  --theme-avatar-grad: #ffffff;
  --theme-divider-grad: linear-gradient(90deg, #e2e8f0, #94a3b8);
  --theme-fallback-grad: linear-gradient(135deg, #f1f5f9, #cbd5e1);
  --theme-text-main: #1e293b;
  --theme-text-sub: #475569;
  --theme-text-weak: #94a3b8;
  --theme-link: #64748b;
  --theme-card-bg: rgba(255, 255, 255, 0.22);
  --theme-card-bg-solid: #f5f3ff;
  --theme-btn-bg: linear-gradient(135deg, #94a3b8, #475569);
  --theme-btn-text: #ffffff;
  --theme-export-color: #475569;
  --theme-export-hover: #1e293b;
  --theme-shadow: rgba(15, 23, 42, 0.12);
}

/* 经典白头像框：纯白底 + 细微阴影描边，在磨砂玻璃上有立体感 */
.theme-classic .avatar-wrap {
  box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.3), 0 4px 12px rgba(15, 23, 42, 0.08);
}

/* 紫罗兰 */
.theme-violet {
  --theme-accent: #8b5cf6;
  --theme-avatar-grad: linear-gradient(135deg, #c4b5fd, #a78bfa);
  --theme-divider-grad: linear-gradient(90deg, #a78bfa, #c4b5fd);
  --theme-fallback-grad: linear-gradient(135deg, #a78bfa, #818cf8);
  --theme-text-main: #1e1b4b;
  --theme-text-sub: #4c1d95;
  --theme-text-weak: #7c3aed;
  --theme-link: #7c3aed;
  --theme-card-bg: rgba(237, 233, 254, 0.55);
  --theme-card-bg-solid: #ede9fe;
  --theme-btn-bg: linear-gradient(135deg, #8b5cf6, #6366f1);
  --theme-btn-text: #ffffff;
  --theme-export-color: #6d28d9;
  --theme-export-hover: #7c3aed;
  --theme-shadow: rgba(76, 29, 149, 0.22);
}

/* 暮光蓝 */
.theme-twilight {
  --theme-accent: #3b82f6;
  --theme-avatar-grad: linear-gradient(135deg, #60a5fa, #6366f1);
  --theme-divider-grad: linear-gradient(90deg, #60a5fa, #6366f1);
  --theme-fallback-grad: linear-gradient(135deg, #60a5fa, #3b82f6);
  --theme-text-main: #0c1a3a;
  --theme-text-sub: #1e3a8a;
  --theme-text-weak: #3b82f6;
  --theme-link: #2563eb;
  --theme-card-bg: rgba(219, 234, 254, 0.55);
  --theme-card-bg-solid: #dbeafe;
  --theme-btn-bg: linear-gradient(135deg, #3b82f6, #6366f1);
  --theme-btn-text: #ffffff;
  --theme-export-color: #1d4ed8;
  --theme-export-hover: #2563eb;
  --theme-shadow: rgba(30, 58, 138, 0.22);
}

/* 晨曦绿 */
.theme-mint {
  --theme-accent: #10b981;
  --theme-avatar-grad: linear-gradient(135deg, #6ee7b7, #34d399);
  --theme-divider-grad: linear-gradient(90deg, #6ee7b7, #34d399);
  --theme-fallback-grad: linear-gradient(135deg, #6ee7b7, #10b981);
  --theme-text-main: #064e3b;
  --theme-text-sub: #047857;
  --theme-text-weak: #059669;
  --theme-link: #059669;
  --theme-card-bg: rgba(204, 251, 241, 0.55);
  --theme-card-bg-solid: #ccfbf1;
  --theme-btn-bg: linear-gradient(135deg, #10b981, #059669);
  --theme-btn-text: #ffffff;
  --theme-export-color: #047857;
  --theme-export-hover: #059669;
  --theme-shadow: rgba(4, 120, 87, 0.22);
}

/* 夕阳橙 */
.theme-sunset {
  --theme-accent: #f97316;
  --theme-avatar-grad: linear-gradient(135deg, #fbbf24, #fb7185);
  --theme-divider-grad: linear-gradient(90deg, #fbbf24, #fb7185);
  --theme-fallback-grad: linear-gradient(135deg, #fbbf24, #f97316);
  --theme-text-main: #431407;
  --theme-text-sub: #9a3412;
  --theme-text-weak: #c2410c;
  --theme-link: #ea580c;
  --theme-card-bg: rgba(254, 243, 199, 0.55);
  --theme-card-bg-solid: #fef3c7;
  --theme-btn-bg: linear-gradient(135deg, #f97316, #fb7185);
  --theme-btn-text: #ffffff;
  --theme-export-color: #c2410c;
  --theme-export-hover: #ea580c;
  --theme-shadow: rgba(154, 52, 18, 0.22);
}

/* 玫瑰粉 */
.theme-rose {
  --theme-accent: #ec4899;
  --theme-avatar-grad: linear-gradient(135deg, #f9a8d4, #ec4899);
  --theme-divider-grad: linear-gradient(90deg, #f9a8d4, #ec4899);
  --theme-fallback-grad: linear-gradient(135deg, #f9a8d4, #ec4899);
  --theme-text-main: #4a044e;
  --theme-text-sub: #9d174d;
  --theme-text-weak: #be185d;
  --theme-link: #db2777;
  --theme-card-bg: rgba(252, 231, 243, 0.55);
  --theme-card-bg-solid: #fce7f3;
  --theme-btn-bg: linear-gradient(135deg, #ec4899, #db2777);
  --theme-btn-text: #ffffff;
  --theme-export-color: #be185d;
  --theme-export-hover: #db2777;
  --theme-shadow: rgba(157, 23, 77, 0.22);
}

/* 深海蓝 */
.theme-ocean {
  --theme-accent: #0ea5e9;
  --theme-avatar-grad: linear-gradient(135deg, #38bdf8, #0ea5e9);
  --theme-divider-grad: linear-gradient(90deg, #38bdf8, #0ea5e9);
  --theme-fallback-grad: linear-gradient(135deg, #38bdf8, #0ea5e9);
  --theme-text-main: #082f49;
  --theme-text-sub: #075985;
  --theme-text-weak: #0369a1;
  --theme-link: #0284c7;
  --theme-card-bg: rgba(224, 242, 254, 0.55);
  --theme-card-bg-solid: #e0f2fe;
  --theme-btn-bg: linear-gradient(135deg, #0ea5e9, #0284c7);
  --theme-btn-text: #ffffff;
  --theme-export-color: #0369a1;
  --theme-export-hover: #0284c7;
  --theme-shadow: rgba(7, 89, 133, 0.22);
}

/* 卡片背景色调：用主题色半透明叠加在磨砂白之上 */
.card-preview.theme-classic,
.card-preview.theme-violet,
.card-preview.theme-twilight,
.card-preview.theme-mint,
.card-preview.theme-sunset,
.card-preview.theme-rose,
.card-preview.theme-ocean {
  background-color: var(--theme-card-bg);
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
