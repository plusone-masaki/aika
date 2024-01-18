<template lang="pug">
canvas.live2d-model(
  ref="canvas"
  :width="canvasSize.width"
  :height="canvasSize.height"
  :style="[canvasSize, canvasPosition]"
)
</template>

<script lang="ts" setup>
import { onMounted, onUpdated, reactive, ref, watch } from 'vue'
import clickThrough from '../composables/clickThrough'
import movableDom from '../composables/movableDom'
import useLive2D from '../composables/useLive2D'
import { LAppWavFileHandler } from '../composables/live2d/lappwavfilehandler'

const props = defineProps<{
  voice: ArrayBuffer,
}>()

const canvas = ref<HTMLCanvasElement>()
const canvasSize = reactive({
  height: '640px',
  width: '360px',
})
const canvasPosition = {
  top: window.innerHeight - parseInt(canvasSize.height) - 144 + 'px',
  left: window.innerWidth - parseInt(canvasSize.width) * 1.5 + 'px',
}
const audioContext = new AudioContext()
const wavFileHandler = LAppWavFileHandler.getInstance()


watch(() => props.voice, async voice => {
  const source = audioContext.createBufferSource()
  source.connect(audioContext.destination)
  source.buffer = await audioContext.decodeAudioData(voice.slice(0))
  wavFileHandler.start(voice)
  source.start(0)
})

onUpdated(async () => {
  useLive2D(canvas.value!)
})
onMounted(() => {
  clickThrough(canvas.value!)
  movableDom(canvas.value!)
  useLive2D(canvas.value!)
})
</script>

<style lang="sass" scoped>
.live2d-model
  resize: both
  position: fixed
</style>
