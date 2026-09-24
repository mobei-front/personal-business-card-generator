<script setup>
// 名片预览组件：纯展示 + 事件上报，状态由父组件管理
defineProps({
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
  initials: {
    type: String,
    default: '?'
  }
})

defineEmits(['select-theme', 'next-theme', 'reset', 'toggle-bio', 'avatar-error'])
</script>

<template>
  <section class="card-preview glass" :class="'theme-' + theme.id">
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
      <p v-show="bioExpanded && form.bio" class="bio">{{ form.bio }}</p>
    </transition>
    <button v-if="form.bio" class="toggle-bio" @click="$emit('toggle-bio')">
      {{ bioExpanded ? '收起简介' : '展开简介' }}
    </button>

    <!-- 操作按钮 -->
    <div class="actions">
      <button class="btn btn-blue" @click="$emit('next-theme')">切换名片</button>
      <button class="btn btn-green" @click="$emit('reset')">重置名片</button>
    </div>
  </section>
</template>

<style scoped>
.card-preview {
  padding: 40px 28px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
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
