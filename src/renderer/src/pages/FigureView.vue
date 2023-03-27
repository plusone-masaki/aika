<template lang="pug">
canvas.figure-view__figure(
  ref="canvas"
  :width="canvasSize.width"
  :height="canvasSize.height"
  :style="[canvasSize, canvasPosition]"
  @mouseenter="clickThrough(false)"
  @mouseleave="clickThrough(true)"
)
div.figure-view__bubble(
  v-show="response.length"
  ref="bubble"
  :style="bubblePosition"
  @dblclick="response = ''"
  @mouseenter="clickThrough(false)"
  @mouseleave="clickThrough(true)"
) {{ response }}
form.chat-form(
  ref="chatForm"
  :style="chatFormPosition"
  @mouseenter="clickThrough(false)"
  @mouseleave="clickThrough(true)"
  @submit.stop.prevent="submit"
)
  input.chat-form__input(
    v-model="keyword"
  )
  button.chat-form__submit(
    type="submit"
  ) 送信
  button.chat-form__mic(
    :class="{ 'chat-form__mic--on': mic }"
    type="button"
    @click="toggleMic"
  ) マイク
</template>

<script lang="ts" setup>
/**
 * TODO: マジックナンバーを無くしたい
 */
import { onMounted, onUpdated, reactive, ref } from 'vue'
import live2d from '../demo/main'
import movableDom from '../composables/movableDom'
import SpeechRecognition from '../composables/speechRecognition'

const canvas = ref<HTMLCanvasElement>()
const canvasSize = reactive({
  height: '640px',
  width: '480px',
})
const canvasPosition = {
  top: window.innerHeight - parseInt(canvasSize.height) - 128 + 'px',
  left: window.innerWidth - parseInt(canvasSize.width) + 'px',
}

const bubble = ref<HTMLDivElement>()
const bubblePosition = {
  top: window.innerHeight - parseInt(canvasSize.height) + 120 + 'px',
  left: window.innerWidth - parseInt(canvasSize.width) - 210 + 'px',
}

const chatForm = ref<HTMLFormElement>()
const chatFormPosition = {
  top: window.innerHeight - 120 + 'px',
  left: window.innerWidth - 600 + 'px',
}

const keyword = ref<string>('')
const mic = ref<boolean>(false)
const response = ref<string>('')
const speechRecognition = ref<SpeechRecognition>()
const submit = async () => {
  if (!keyword.value) return
  response.value = await window.api.sendQuestion(keyword.value)
  keyword.value = ''
}

// クリックの透過処理
const clickThrough = (enable: boolean) => window.api.clickThrough(enable)
const toggleMic = () => {
  mic.value = !mic.value
  if (mic.value && speechRecognition.value.enabled) {
    speechRecognition.value.start(keyword, submit)
  } else {
    speechRecognition.value.stop()
  }
}

onUpdated(async () => {
  live2d(canvas.value!)
})
onMounted(async () => {
  movableDom(canvas.value!)
  movableDom(bubble.value!)
  movableDom(chatForm.value!)
  live2d(canvas.value!)

  // マイクでの音声認識
  speechRecognition.value = new SpeechRecognition()
})
</script>

<style lang="sass" scoped>
.figure-view__figure
  resize: both
  position: fixed

.figure-view__bubble
  background: skyblue
  border-radius: 8px
  box-sizing: border-box
  letter-spacing: 0.125em
  min-height: 60px
  overflow-x: hidden
  padding: 0.75em
  pointer-events: all
  position: fixed
  user-select: none
  width: 280px

.chat-form
  display: flex
  justify-content: space-between
  position: fixed
  width: 400px

.chat-form__input
  border: none
  box-sizing: border-box
  font-size: 16px
  height: 32px
  padding: 2px 4px
  outline: none
  width: 320px

.chat-form__submit
  border: none
  border-radius: 4px
  box-sizing: border-box
  font-size: 16px
  height: 32px
  width: 64px

.chat-form__mic--on
  background: blue
</style>
