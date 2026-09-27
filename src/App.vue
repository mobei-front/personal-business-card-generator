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
  reset,
  toggleBio,
  triggerBioType,
  onAvatarError
} = useCard()
</script>

<template>
  <n-message-provider>
    <div class="app">
      <header class="app-header">
        <h1 class="app-title">个人名片生成器</h1>
      </header>
      <div class="layout">
        <!-- 左侧：名片预览 -->
        <CardPreview
          :form="form"
          :theme="theme"
          :avatar-ok="avatarOk"
          :bio-expanded="bioExpanded"
          :bio-type-key="bioTypeKey"
          :initials="initials"
          @toggle-bio="toggleBio"
          @avatar-error="onAvatarError"
        />

        <!-- 右侧：编辑表单 -->
        <CardForm
          v-model:form="form"
          :themes="themes"
          :theme="theme"
          @bio-blur="triggerBioType"
          @reset="reset"
          @select-theme="selectTheme"
        />
      </div>
    </div>
  </n-message-provider>
</template>
