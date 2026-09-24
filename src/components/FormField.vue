<script setup>
// 通用表单字段：支持普通输入框、多行文本、url 等类型
defineProps({
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  },
  modelValue: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue', 'blur', 'change'])
</script>

<template>
  <div class="field">
    <label class="label">{{ label }}</label>

    <textarea
      v-if="type === 'textarea'"
      class="textarea"
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur')"
      @change="$emit('change')"
    ></textarea>

    <input
      v-else
      class="input"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur')"
      @change="$emit('change')"
    />

    <div v-if="hint" class="hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.field {
  margin-bottom: 18px;
}

.field:last-child {
  margin-bottom: 0;
}

.label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 5px;
}

.input,
.textarea {
  width: 100%;
  padding: 9px 13px;
  font-size: 13px;
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input:focus,
.textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
}

.textarea {
  resize: vertical;
  min-height: 72px;
  line-height: 1.5;
}

.hint {
  font-size: 11px;
  color: var(--text-weak);
  margin-top: 4px;
}
</style>
