<template lang="pug">
form.speech-form(
  ref="speechForm"
  :style="speechFormPosition"
  @submit.stop.prevent="emit('submit')"
)
  div.speech-form__input
    textarea.speech-form__textarea(
      v-model="value"
      ref="textarea"
      :style="{ height: textareaHeight }"
      @keydown.ctrl.enter="emit('submit')"
      @keydown.meta.enter="emit('submit')"
    )
  button.speech-form__submit(
    type="submit"
  ) 送信
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import clickThrough from '../composables/clickThrough'
import movableDom from '../composables/movableDom'

const props = defineProps<{
  modelValue: string,
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void,
  (e: 'submit'): void,
}>()

const speechForm = ref<HTMLFormElement>()
const speechFormPosition = {
  bottom: 96 + 'px',
  left: window.innerWidth - 600 + 'px',
}
const textarea = ref<HTMLTextAreaElement>()

const value = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  },
})

const textareaHeight = ref<string>('auto')
watch(() => props.modelValue, async () => {
  textareaHeight.value = 'auto'
  console.log(textarea.value.scrollHeight)
  if (textarea.value) {
    await nextTick()
    console.log(textarea.value.scrollHeight)
    textareaHeight.value = textarea.value.scrollHeight + 'px'
  }
})

onMounted(() => {
  clickThrough(speechForm.value!)
  movableDom(speechForm.value!)
})
</script>

<style lang="sass" scoped>
.speech-form
  align-items: end
  display: flex
  justify-content: space-between
  position: fixed
  width: 400px

.speech-form__input
  background: rgba(255, 255, 255, 1)
  border: 1px solid rgba(244, 244, 244, 0.87)
  border-radius: 2px
  box-sizing: border-box
  display: inline-block
  height: min-content
  line-height: 0
  padding: 6px 4px

.speech-form__textarea
  border: none
  box-sizing: border-box
  font-size: 16px
  line-height: 1.2em
  outline: none
  padding: 0
  resize: none
  width: 320px

.speech-form__submit
  border: none
  border-radius: 4px
  box-sizing: border-box
  font-size: 16px
  height: 32px
  width: 64px
</style>
