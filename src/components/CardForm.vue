<script setup>
import FormField from './FormField.vue'

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
</script>

<template>
  <section class="glass card-form">
    <h3 class="form-title">编辑名片 <span>✨</span></h3>

    <form @submit.prevent>
      <FormField v-model="form.name" label="姓名" placeholder="请输入姓名" />
      <FormField v-model="form.title" label="职位" placeholder="请输入职位" />
      <FormField v-model="form.company" label="公司" placeholder="请输入公司" />
      <FormField
        v-model="form.bio"
        label="个人简介"
        type="textarea"
        placeholder="一句话介绍自己"
        @change="$emit('bio-blur')"
      />
      <FormField
        v-model="form.avatar"
        label="头像链接"
        type="url"
        placeholder="https://..."
        hint="支持任意在线图片地址，加载失败时显示首字母占位"
      />

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
        <button class="btn btn-green" @click="$emit('reset')">重置名片</button>
      </div>
    </form>
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
