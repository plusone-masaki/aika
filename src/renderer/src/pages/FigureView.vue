<template lang="pug">
main.figure-view.fullscreen
  Live2DModel
  text-bubble(
    v-model="response"
  )
  speech-form(
    v-model="query"
    @submit="submit"
  )
  audio(
    ref="audio"
    autoplay
  )
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import Live2DModel from '../components/Live2DModel.vue'
import SpeechForm from '../components/SpeechForm.vue'
import TextBubble from '../components/TextBubble.vue'
import clickThrough from '../composables/clickThrough'
import movableDom from '../composables/movableDom'
import RepositoryFactory from '../repositories/repositoryFactory'

const voiceRepository = RepositoryFactory.get('voice')

const audio = ref<HTMLAudioElement>()
const query = ref<string>('')
const response = ref<string>('')
const submit = async () => {
  if (!query.value) return
  const message = query.value
  query.value = ''
  response.value = await window.api.sendMessage(message)
  const voice = await voiceRepository.getSpeechVoice(response.value, 0)

  audio.value!.src = URL.createObjectURL(voice)
}

onMounted(() => {
  clickThrough(audio.value!)
  movableDom(audio.value!)
})
</script>

<style lang="sass" scoped>
</style>
