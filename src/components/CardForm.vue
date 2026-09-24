<script setup>
import FormField from './FormField.vue'

// 双向绑定父组件传入的 form 对象
const form = defineModel('form', {
  type: Object,
  required: true
})

defineEmits(['bio-blur', 'reset'])
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

.form-actions {
  margin-top: 22px;
  display: flex;
  justify-content: flex-end;
}
</style>
