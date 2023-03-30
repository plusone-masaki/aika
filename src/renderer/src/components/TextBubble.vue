<template lang="pug">
div.text-bubble(
  v-show="props.modelValue.length"
  v-html="formatValue"
  ref="bubble"
  :style="bubblePosition"
  @dblclick="emit('update:modelValue', '')"
)
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import clickThrough from '../composables/clickThrough'
import movableDom from '../composables/movableDom'

const props = defineProps<{
  modelValue: string,
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string)
}>()

const bubble = ref<HTMLDivElement>()
const bubblePosition = {
  top: window.innerHeight - 600 + 'px',
  left: window.innerWidth - 800 + 'px',
}
console.log('DOMPurify', DOMPurify)
const formatValue = computed(() => DOMPurify.sanitize(marked.parse(props.modelValue)))

onMounted(() => {
  clickThrough(bubble.value!)
  movableDom(bubble.value!)
})
</script>

<style lang="sass" scoped>
.text-bubble
  background: rgba(255, 255, 255, 0.87)
  border: 2px solid rgba(244, 244, 244, 0.87)
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
</style>
