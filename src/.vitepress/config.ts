import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";
import { sidebar } from "./sidebar";
import kdlGrammar from "./grammars/kdl.tmLanguage.json";
import miseTomlGrammar from "./grammars/mise-toml.tmLanguage.json";
import { UPSTREAM_REPO, UPSTREAM_SITE } from "../../scripts/scope";

const configDir = dirname(fileURLToPath(import.meta.url));

/** 取り込み済み upstream の commit hash。バナーに短縮形で出す */
const upstreamRef = readFileSync(resolve(configDir, "../../.upstream-ref"), "utf8").trim();

/**
 * この訳サイト自身のリポジトリ。
 * TODO: 公開先を決めたら書き換える。GitHub Pages の base もこれに合わせる。
 */
const SITE_REPO = "https://github.com/example/mise-docs-ja";

/** GitHub Pages のプロジェクトサイトはサブパスに載るので base が必要 */
const base = process.env.DOCS_BASE ?? "/mise-docs-ja/";

export default withMermaid(
  defineConfig({
    // 本家の設定は流用していない。理由は SETUP.md と scripts/scope.ts を参照。
    // 本家 config.ts は Cargo.toml と schema/ を読み、Algolia / Carbon Ads / GA に
    // 依存しているため、docs だけを vendor するこの構成では動かないし、
    // 広告と本家の解析タグを非公式訳に持ち込むべきでもない。
    title: "mise ドキュメント日本語訳（非公式）",
    titleTemplate: ":title | mise ドキュメント日本語訳（非公式）",
    description:
      "mise（mise-en-place）公式ドキュメントの非公式日本語訳。正確な情報は原文を参照してください。",
    lang: "ja",
    base,
    lastUpdated: true,
    appearance: true,
    mermaid: {},

    // sitemap は出さない。canonical を本家に向けているのに sitemap で
    // インデックスを促すのは矛盾する（SETUP.md の「検索順位を奪わない」方針）。

    themeConfig: {
      // mise のロゴは使わない（SETUP.md 公開設定）。テキストのみ。
      siteTitle: "mise ドキュメント日本語訳（非公式）",
      outline: "deep",

      nav: [
        { text: "はじめに", link: "/getting-started" },
        { text: "mise.toml", link: "/configuration" },
        { text: "タスク", link: "/tasks/" },
        { text: "公式ドキュメント（原文）", link: UPSTREAM_SITE },
      ],

      sidebar,

      socialLinks: [{ icon: "github", link: SITE_REPO }],

      editLink: {
        pattern: `${SITE_REPO}/edit/main/src/:path`,
        text: "この訳の誤りを報告・修正する",
      },

      // Algolia ではなく VitePress 組み込みのローカル検索。外部サービスに依存しない。
      search: {
        provider: "local",
        options: {
          translations: {
            button: { buttonText: "検索", buttonAriaLabel: "検索" },
            modal: {
              displayDetails: "詳細を表示",
              resetButtonTitle: "検索条件をリセット",
              backButtonTitle: "閉じる",
              noResultsText: "見つかりませんでした",
              footer: {
                selectText: "選択",
                navigateText: "移動",
                closeText: "閉じる",
              },
            },
          },
        },
      },

      docFooter: { prev: "前のページ", next: "次のページ" },
      outlineTitle: "このページの内容",
      lastUpdatedText: "この訳の最終更新",
      returnToTopLabel: "トップへ戻る",
      sidebarMenuLabel: "メニュー",
      darkModeSwitchLabel: "外観",
      lightModeSwitchTitle: "ライトモードに切り替え",
      darkModeSwitchTitle: "ダークモードに切り替え",
      externalLinkIcon: true,

      footer: {
        message: `mise の非公式日本語訳です。原文は <a href="${UPSTREAM_REPO}">jdx/mise</a>（MIT）。`,
        copyright: "訳文の権利の扱いと免責は NOTICE.md を参照してください。",
      },
    },

    markdown: {
      languages: [
        // 埋め込み用のベース言語
        "toml",
        "shell",
        "bash",
        // mise-toml 文法は source.kdl を埋め込み参照するので、
        // ```kdl フェンスが1つも無くても kdl 文法の登録が必要
        { ...kdlGrammar, name: "kdl", scopeName: "source.kdl" } as any,
        {
          ...miseTomlGrammar,
          name: "mise-toml",
          aliases: ["mise.toml"],
          scopeName: "source.mise-toml",
        } as any,
      ],
      config(md) {
        md.use(tabsMarkdownPlugin);
      },
    },

    vite: {
      build: { target: "es2022" },
    },

    head: [
      // mise の favicon は使わない（公式と誤認させない）。自前の SVG。
      ["link", { rel: "icon", href: `${base}favicon.svg`, type: "image/svg+xml" }],
      ["meta", { name: "og:site_name", content: "mise ドキュメント日本語訳（非公式）" }],
      ["meta", { name: "og:type", content: "website" }],
    ],

    /**
     * canonical を原文に向ける。
     * 非公式訳が検索結果で本家を食うのが上流にとって最悪の迷惑なので、
     * 全ページで原文を正典として宣言する（SETUP.md 必須の実装項目）。
     */
    transformHead({ pageData }) {
      const upstream = pageData.frontmatter.upstreamUrl;
      return upstream ? [["link", { rel: "canonical", href: upstream }]] : [];
    },

    /** バナーが upstreamRef を読めるようにテーマへ渡す */
    transformPageData(pageData) {
      pageData.frontmatter.upstreamRefFallback = upstreamRef.slice(0, 7);
    },
  }),
);
