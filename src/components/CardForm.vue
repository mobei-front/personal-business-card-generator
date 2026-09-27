<script setup>
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'

// 双向绑定父组件传入的 form 对象
const form = defineModel('form', {
  type: Object,
  required: true
})

defineProps({
  themes: {
    type: Array,
    required: true
  },
  theme: {
    type: Object,
    required: true
  }
})

defineEmits(['bio-blur', 'reset', 'select-theme'])

// 联系方式抽屉
const drawerOpen = ref(false)

// 已填写的联系方式数量
const contactCount = computed(() => {
  const fields = ['email', 'phone', 'wechat', 'github', 'blog']
  return fields.filter((k) => form.value[k]).length
})

function openDrawer() {
  drawerOpen.value = true
}
function closeDrawer() {
  drawerOpen.value = false
}

const message = useMessage()

// 完成：校验必填项（手机号、微信号），为空则弹窗提示
function handleComplete() {
  const missing = []
  if (!form.value.phone?.trim()) missing.push('手机号')
  if (!form.value.wechat?.trim()) missing.push('微信号')
  if (missing.length) {
    message.warning(`请填写必要的联系方式：${missing.join('、')}`)
    return
  }
  closeDrawer()
}
</script>

<template>
  <section class="glass card-form">
    <h3 class="form-title">编辑名片 ✨</h3>

    <n-form size="large" @submit.prevent>
      <n-form-item label="姓名">
        <n-input v-model:value="form.name" placeholder="请输入姓名" />
      </n-form-item>
      <n-form-item label="职位">
        <n-input v-model:value="form.title" placeholder="请输入职位" />
      </n-form-item>
      <n-form-item label="公司">
        <n-input v-model:value="form.company" placeholder="请输入公司" />
      </n-form-item>
      <n-form-item label="个人简介">
        <n-input
          v-model:value="form.bio"
          type="textarea"
          placeholder="一句话介绍自己"
          :autosize="{ minRows: 2, maxRows: 4 }"
          @change="$emit('bio-blur')"
        />
      </n-form-item>
      <n-form-item label="头像链接">
        <n-input v-model:value="form.avatar" type="url" placeholder="https://..." />
        <template #feedback>
          <span class="field-hint">支持任意在线图片地址，加载失败时显示首字母占位</span>
        </template>
      </n-form-item>
    </n-form>

    <!-- 联系方式入口按钮 -->
    <button type="button" class="contact-entry" @click="openDrawer">
      <svg class="entry-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
      <span class="entry-text">联系方式</span>
      <span v-if="contactCount" class="entry-count">{{ contactCount }} 项已填</span>
      <span v-else class="entry-hint required">请填写必要的联系方式</span>
      <svg class="entry-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>

    <!-- 名片主题选择 -->
    <div class="theme-field">
      <label class="theme-label">名片主题</label>
      <div class="theme-dots" role="tablist" aria-label="名片主题">
        <button
          v-for="t in themes"
          :key="t.id"
          class="theme-dot"
          :class="{ active: theme.id === t.id, 'is-white': t.id === 'classic' }"
          :style="{ background: t.dot }"
          :title="t.name"
          :aria-label="t.name"
          role="tab"
          :aria-selected="theme.id === t.id"
          @click="$emit('select-theme', t)"
        ></button>
      </div>
    </div>

    <div class="form-actions">
      <n-button type="success" @click="$emit('reset')">重置名片</n-button>
    </div>

    <!-- 联系方式抽屉（Naive UI） -->
    <n-drawer :show="drawerOpen" :width="380" @update:show="(v) => (drawerOpen = v)">
      <n-drawer-content title="联系方式" closable>
        <template #header-extra>
          <span style="font-size: 12px; color: #94a3b8">留空不显示</span>
        </template>
        <n-form label-placement="top" size="large">
          <n-form-item label="手机号（必填）" required>
            <n-input v-model:value="form.phone" placeholder="请输入手机号" type="tel" />
          </n-form-item>
          <n-form-item label="微信号（必填）" required>
            <n-input v-model:value="form.wechat" placeholder="请输入微信号" />
          </n-form-item>
          <n-form-item label="邮箱">
            <n-input v-model:value="form.email" placeholder="name@example.com" type="email" />
          </n-form-item>
          <n-form-item label="GitHub">
            <n-input v-model:value="form.github" placeholder="github_username" />
          </n-form-item>
          <n-form-item label="个人博客">
            <n-input v-model:value="form.blog" placeholder="https://your-blog.com" type="url" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="closeDrawer">取消</n-button>
            <n-button type="primary" @click="handleComplete">完成</n-button>
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>
  </section>
</template>

<style scoped>
.card-form {
  padding: 32px 29px;
}

.form-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-hint {
  display: block;
  font-size: 12px;
  color: var(--text-weak);
  margin-top: 4px;
}

/* 联系方式入口按钮 */
.contact-entry {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  margin: 14px 0 18px;
  background: rgba(139, 92, 246, 0.08);
  border: 1px dashed rgba(139, 92, 246, 0.35);
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--primary);
  transition: background 0.2s, border-color 0.2s;
}

.contact-entry:hover {
  background: rgba(139, 92, 246, 0.14);
  border-color: rgba(139, 92, 246, 0.55);
}

.entry-icon {
  flex-shrink: 0;
  opacity: 0.85;
}

.entry-text {
  font-weight: 600;
}

.entry-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--primary);
  background: rgba(139, 92, 246, 0.15);
  padding: 2px 8px;
  border-radius: 10px;
}

.entry-hint {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-weak);
}

.entry-hint.required {
  color: #e11d48;
  font-weight: 600;
}

.entry-arrow {
  flex-shrink: 0;
  color: var(--text-weak);
}

/* 主题选择 */
.theme-field {
  margin-bottom: 18px;
}

.theme-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 8px;
}

.theme-dots {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.theme-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.18s ease;
  padding: 0;
}

.theme-dot:hover {
  transform: scale(1.15);
}

.theme-dot.is-white {
  border-color: #d1d5db;
}

.theme-dot.active {
  transform: scale(1.2);
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.form-actions {
  margin-top: 22px;
  display: flex;
  justify-content: flex-end;
}
</style>
