<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Footer from './components/layout/Footer.vue'
import Header from './components/layout/Header.vue'

const route = useRoute()

// /savings 경로에서는 기존 Header/Footer를 숨김
// (SavingsView 내부의 전용 Nav가 대신함)
const hiddenLayout = computed(() =>
    route.path.startsWith('/savings')
)
</script>

<template>
    <Header v-if="!hiddenLayout" />
    <main>
        <router-view />
    </main>
    <Footer v-if="!hiddenLayout" />
</template>

<style scoped>
</style>