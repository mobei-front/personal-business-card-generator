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
  bioTypeKey,
  initials,
  selectTheme,
  nextTheme,
  reset,
  toggleBio,
  triggerBioType,
  onAvatarError
} = useCard()
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">个人名片生成器</h1>
    </header>
    <div class="layout">
      <!-- 左侧：名片预览 -->
      <CardPreview
        :form="form"
        :themes="themes"
        :theme="theme"
        :avatar-ok="avatarOk"
        :bio-expanded="bioExpanded"
        :bio-type-key="bioTypeKey"
        :initials="initials"
        @select-theme="selectTheme"
        @next-theme="nextTheme"
        @toggle-bio="toggleBio"
        @avatar-error="onAvatarError"
      />

      <!-- 右侧：编辑表单 -->
      <CardForm v-model:form="form" @bio-blur="triggerBioType" @reset="reset" />
    </div>
  </div>
</template>
