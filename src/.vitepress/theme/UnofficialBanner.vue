<script setup lang="ts">
/**
 * 全ページの本文冒頭に出す非公式訳の告知。
 *
 * 各 Markdown に手で書くと必ず漏れるので、Layout の doc-before スロットから
 * 差し込む（SETUP.md 必須の実装項目）。frontmatter の upstream* を読むので、
 * 原文リンクとバージョンはページごとに正しいものが出る。
 */
import { computed } from "vue";
import { useData } from "vitepress";

const { frontmatter } = useData();

const upstreamUrl = computed(() => frontmatter.value.upstreamUrl as string | undefined);
const ref = computed(
  () =>
    (frontmatter.value.upstreamRef ?? frontmatter.value.upstreamRefFallback) as string | undefined,
);
/**
 * YAML は `upstreamDate: 2026-08-12` をクォートしないと Date として解釈するので、
 * そのまま出すと `2026-08-12T00:00:00.000Z` になる。どちらで書かれても
 * `2026-08-12` に揃える。
 */
const date = computed(() => {
  const raw = frontmatter.value.upstreamDate;
  if (!raw) return undefined;
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  return String(raw).slice(0, 10);
});
</script>

<template>
  <aside v-if="upstreamUrl" class="unofficial-banner" aria-label="この翻訳について">
    <p class="unofficial-banner__lead">
      これは有志による<strong>非公式の日本語訳</strong>です。mise の開発元とは関係ありません。 LLM
      による機械翻訳をベースに作成しているため、誤訳や古い記述が含まれることがあります。
      <strong>正確な情報は原文を参照してください。</strong>
    </p>
    <p class="unofficial-banner__meta">
      <a :href="upstreamUrl" class="unofficial-banner__link" target="_blank" rel="noopener">
        原文（英語）を読む
      </a>
      <span v-if="ref || date" class="unofficial-banner__ref">
        翻訳時点の原文:
        <code v-if="ref">{{ ref }}</code>
        <template v-if="date"> ({{ date }})</template>
      </span>
    </p>
  </aside>
</template>

<style scoped>
.unofficial-banner {
  margin: 0 0 2rem;
  padding: 0.9rem 1.1rem;
  border: 1px solid var(--vp-c-warning-2, var(--vp-c-yellow-2));
  border-left-width: 4px;
  border-radius: 8px;
  background-color: var(--vp-c-warning-soft, var(--vp-c-yellow-soft));
  font-size: 0.875rem;
  line-height: 1.7;
}

.unofficial-banner__lead {
  margin: 0;
}

.unofficial-banner__meta {
  margin: 0.5rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  align-items: baseline;
}

.unofficial-banner__link {
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.unofficial-banner__ref {
  color: var(--vp-c-text-2);
  font-size: 0.8125rem;
}

.unofficial-banner__ref code {
  font-size: inherit;
}
</style>
