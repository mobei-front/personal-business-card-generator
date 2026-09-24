<script setup>
import { ref, watch, onUnmounted } from 'vue'
import html2canvas from 'html2canvas'

// 名片预览组件：纯展示 + 事件上报，状态由父组件管理
const props = defineProps({
  form: {
    type: Object,
    required: true
  },
  themes: {
    type: Array,
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

defineEmits(['select-theme', 'next-theme', 'reset', 'toggle-bio', 'avatar-error'])

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

// 导出名片为图片
const cardRef = ref(null)
const exporting = ref(false)

async function exportImage() {
  if (!cardRef.value || exporting.value) return
  exporting.value = true
  try {
    const canvas = await html2canvas(cardRef.value, {
      useCORS: true,
      scale: 2,
      backgroundColor: null,
      logging: false,
      onclone: (clonedDoc) => {
        // 在克隆 DOM 中渲染完整简介文本、隐藏光标，不影响原页面打字机动画
        const clonedCard = clonedDoc.querySelector('.card-preview')
        if (!clonedCard) return
        const bioEl = clonedCard.querySelector('.bio')
        if (bioEl) {
          bioEl.textContent = props.form.bio
          bioEl.style.display = props.form.bio ? 'block' : 'none'
        }
        const cursorEl = clonedCard.querySelector('.cursor')
        if (cursorEl) cursorEl.style.display = 'none'
        const toggleEl = clonedCard.querySelector('.toggle-bio')
        if (toggleEl) toggleEl.style.display = 'none'
      }
    })
    const link = document.createElement('a')
    link.download = `${props.form.name || '名片'}-名片.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } finally {
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

    <!-- 主题切换圆点 -->
    <div class="theme-dots" role="tablist" aria-label="名片主题">
      <button
        v-for="t in themes"
        :key="t.id"
        class="theme-dot"
        :class="{ active: theme.id === t.id }"
        :style="{ background: t.dot }"
        :title="t.name"
        role="tab"
        :aria-selected="theme.id === t.id"
        @click="$emit('select-theme', t)"
      ></button>
    </div>

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

    <!-- 操作按钮 -->
    <div class="actions">
      <button class="btn btn-blue" @click="$emit('next-theme')">切换名片</button>
      <button class="btn btn-green" @click="$emit('reset')">重置名片</button>
      <button class="btn btn-orange" :disabled="exporting" @click="exportImage">
        {{ exporting ? '导出中...' : '导出图片' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.card-preview {
  position: relative;
  padding: 40px 28px 28px;
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
    0 18px 50px rgba(31, 38, 135, 0.22),
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
.card-preview > *:not(.lg-svg):not(.lg-refract) {
  position: relative;
  z-index: 3;
}

/* 主题切换圆点 */
.theme-dots {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.theme-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.18s ease;
  padding: 0;
}

.theme-dot:hover {
  transform: scale(1.15);
}

.theme-dot.active {
  transform: scale(1.3);
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

/* 头像 */
.avatar-wrap {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  padding: 4px;
  margin-bottom: 18px;
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
  font-size: 40px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #a78bfa, #818cf8);
}

/* 文字信息 */
.name {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: 0.5px;
}

.empty-name {
  color: var(--text-weak);
  font-style: italic;
}

.title {
  margin-top: 6px;
  font-size: 14px;
  color: var(--text-sub);
}

.company {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-weak);
}

.divider {
  width: 40px;
  height: 3px;
  border-radius: 2px;
  margin: 14px 0;
  transition: background 0.4s ease;
}

/* 简介 */
.bio {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-sub);
  text-align: center;
  max-width: 86%;
}

.toggle-bio {
  margin-top: 10px;
  font-size: 13px;
  color: var(--link);
  background: none;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.toggle-bio:hover {
  opacity: 0.7;
  text-decoration: underline;
}

/* 按钮区 */
.actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}

/* 主题配色 */
.theme-violet .avatar-wrap {
  background: linear-gradient(135deg, #c4b5fd, #a78bfa);
}

.theme-violet .divider {
  background: linear-gradient(90deg, #a78bfa, #c4b5fd);
}

.theme-twilight .avatar-wrap {
  background: linear-gradient(135deg, #60a5fa, #6366f1);
}

.theme-twilight .divider {
  background: linear-gradient(90deg, #60a5fa, #6366f1);
}

.theme-mint .avatar-wrap {
  background: linear-gradient(135deg, #6ee7b7, #34d399);
}

.theme-mint .divider {
  background: linear-gradient(90deg, #6ee7b7, #34d399);
}

.theme-sunset .avatar-wrap {
  background: linear-gradient(135deg, #fbbf24, #fb7185);
}

.theme-sunset .divider {
  background: linear-gradient(90deg, #fbbf24, #fb7185);
}

/* 光标 */
.cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--text-sub);
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
