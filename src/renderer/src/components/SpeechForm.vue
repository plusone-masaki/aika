<template lang="pug">
form.speech-form(
  ref="speechForm"
  :style="speechFormPosition"
  @submit.stop.prevent="emit('submit')"
)
  textarea.speech-form__input(
    v-model="value"
  )
  button.speech-form__submit(
    type="submit"
  ) 送信
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
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
  top: window.innerHeight - 120 + 'px',
  left: window.innerWidth - 600 + 'px',
}

const value = computed({
  get () {
    return props.modelValue
  },
  set (value) {
    emit('update:modelValue', value)
  },
})

onMounted(() => {
  clickThrough(speechForm.value!)
  movableDom(speechForm.value!)
})
</script>

<style lang="sass" scoped>
.speech-form
  display: flex
  justify-content: space-between
  position: fixed
  width: 400px

.speech-form__input
  border: 1px solid rgba(244, 244, 244, 0.87)
  box-sizing: border-box
  font-size: 16px
  height: 32px
  padding: 2px 4px
  outline: none
  width: 320px

.speech-form__submit
  border: none
  border-radius: 4px
  box-sizing: border-box
  font-size: 16px
  height: 32px
  width: 64px
</style>
