<script setup>
import CardPreview from './components/CardPreview.vue'
import CardForm from './components/CardForm.vue'
import { useCard } from './composables/useCard'

// 根组件只负责布局与状态分发
const {
  form,
  themes,
  theme,
  avatarOk,
  bioExpanded,
  initials,
  selectTheme,
  nextTheme,
  reset,
  toggleBio,
  onAvatarError
} = useCard()
</script>

<template>
  <div class="app">
    <div class="layout">
      <!-- 左侧：名片预览 -->
      <CardPreview
        :form="form"
        :themes="themes"
        :theme="theme"
        :avatar-ok="avatarOk"
        :bio-expanded="bioExpanded"
        :initials="initials"
        @select-theme="selectTheme"
        @next-theme="nextTheme"
        @reset="reset"
        @toggle-bio="toggleBio"
        @avatar-error="onAvatarError"
      />

      <!-- 右侧：编辑表单 -->
      <CardForm v-model:form="form" />
    </div>
  </div>
</template>
