<template lang="pug">
router-view
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'

const router = useRouter()

router.push(window.page)
</script>
