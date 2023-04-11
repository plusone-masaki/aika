<template lang="pug">
canvas.live2d-model(
  ref="canvas"
  :width="canvasSize.width"
  :height="canvasSize.height"
  :style="[canvasSize, canvasPosition]"
)
</template>

<script lang="ts" setup>
import { onMounted, onUpdated, reactive, ref } from 'vue'
import clickThrough from '../composables/clickThrough'
import movableDom from '../composables/movableDom'
import live2d from '../demo/main'

const canvas = ref<HTMLCanvasElement>()
const canvasSize = reactive({
  height: '640px',
  width: '360px',
})
const canvasPosition = {
  top: window.innerHeight - parseInt(canvasSize.height) - 144 + 'px',
  left: window.innerWidth - parseInt(canvasSize.width) * 1.5 + 'px',
}

onUpdated(async () => {
  live2d(canvas.value!)
})
onMounted(() => {
  clickThrough(canvas.value!)
  movableDom(canvas.value!)
  live2d(canvas.value!)
})
</script>

<style lang="sass" scoped>
.live2d-model
  resize: both
  position: fixed
</style>
