<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import UnofficialBanner from "./UnofficialBanner.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <!-- 本文の直前。h1 より上に出るので本文に埋もれない -->
    <template #doc-before>
      <UnofficialBanner />
    </template>
  </Layout>
</template>
