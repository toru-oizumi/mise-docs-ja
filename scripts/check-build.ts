/**
 * ビルド成果物（src/.vitepress/dist）を検査する。公開前の最終確認。
 *
 *   mise run build && mise run check:build
 *
 * Markdown を見るだけでは分からないことを、実際に出力された HTML で確かめる。
 * バナーはテーマから差し込んでいるので、スロット名を間違えると全ページから
 * 静かに消える。canonical も同じで、frontmatter の書き漏れは HTML でしか出ない。
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TRANSLATED, OWN_PAGES, upstreamUrl, UPSTREAM_SITE } from "./scope.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = resolve(ROOT, "src/.vitepress/dist");

if (!existsSync(DIST)) {
  console.error("dist が無い。先に mise run build を実行してください。");
  process.exit(1);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

type Problem = { page: string; message: string };
const problems: Problem[] = [];

/** 訳文ページ（原文に対応するもの）の dist 上の HTML パス */
const translatedHtml = TRANSLATED.map((e) => ({
  docPath: e.path,
  html: resolve(
    DIST,
    e.path.replace(/\/index\.md$/, "/index.html").replace(/(?<!index)\.md$/, ".html"),
  ),
}));

console.log(`── 訳文ページ ${translatedHtml.length} 件 ──`);

for (const { docPath, html } of translatedHtml) {
  const page = relative(DIST, html);
  if (!existsSync(html)) {
    problems.push({ page, message: "HTML が生成されていない（未翻訳か、パスの対応が崩れている）" });
    continue;
  }
  const content = readFileSync(html, "utf8");

  // 1. 非公式バナーが本文冒頭に出ているか
  if (!content.includes("unofficial-banner")) {
    problems.push({ page, message: "非公式バナーが無い" });
  } else if (!content.includes("非公式の日本語訳")) {
    problems.push({ page, message: "非公式バナーの本文が出ていない" });
  } else {
    // バナーが本文（<main>）より前にあること。後ろにあると読者が読み飛ばす
    const bannerAt = content.indexOf("unofficial-banner");
    const mainAt = content.indexOf("<main");
    if (mainAt >= 0 && bannerAt > mainAt) {
      problems.push({ page, message: "非公式バナーが本文より後ろにある（埋もれている）" });
    }
  }

  // 2. canonical が原文を指しているか
  const canonical = content.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonical) {
    problems.push({ page, message: "canonical が無い（frontmatter の upstreamUrl 漏れ）" });
  } else if (canonical[1] !== upstreamUrl(docPath)) {
    problems.push({
      page,
      message: `canonical が原文を指していない: ${canonical[1]}（正: ${upstreamUrl(docPath)}）`,
    });
  }

  // 3. バナー内に原文への直リンクがあるか
  if (!content.includes(`href="${upstreamUrl(docPath)}"`)) {
    problems.push({ page, message: "バナーに原文への直リンクが無い" });
  }
}

// 4. mise のロゴ・favicon を使っていないか（全ページ）
console.log("\n── ブランドの混入 ──");
const allHtml = walk(DIST);
const brandPatterns = [
  { re: /logo-(light|dark|full-light|full-dark)\.svg/, what: "mise のロゴ画像" },
  { re: /android-chrome-\d+x\d+\.png/, what: "mise の PWA アイコン" },
  { re: /apple-touch-icon\.png/, what: "mise の apple-touch-icon" },
  { re: /favicon\.ico/, what: "mise の favicon.ico" },
  {
    re: /mise\.jdx\.dev\/(favicon|logo|android-chrome|apple-touch)/,
    what: "本家のブランド資産への参照",
  },
  { re: /googletagmanager\.com|G-B69G389C8T/, what: "本家の Google Analytics" },
  { re: /carbonads|CWYIPKQN/, what: "本家の広告タグ" },
  { re: /algolia|1452G4RPSJ/i, what: "本家の Algolia 検索キー" },
];
for (const html of allHtml) {
  const content = readFileSync(html, "utf8");
  for (const p of brandPatterns) {
    if (p.re.test(content)) {
      problems.push({ page: relative(DIST, html), message: `${p.what} が混入している` });
    }
  }
}
console.log(`  ${allHtml.length} ページを走査`);

// 5. 自前のトップページには canonical を付けない（原文が存在しないので）
console.log("\n── 自前ページ ──");
for (const own of OWN_PAGES) {
  const html = resolve(DIST, own.replace(/\.md$/, ".html"));
  if (!existsSync(html)) continue;
  const content = readFileSync(html, "utf8");
  if (content.includes('rel="canonical"')) {
    problems.push({
      page: own,
      message: "自前ページに canonical が付いている（対応する原文が無いので不要）",
    });
  }
  if (!content.includes("非公式")) {
    problems.push({ page: own, message: "非公式である旨の記載が無い" });
  }
  console.log(`  ${own} を確認`);
}

// 6. favicon が自前のものであること
console.log("\n── favicon ──");
if (!existsSync(resolve(DIST, "favicon.svg"))) {
  problems.push({ page: "favicon.svg", message: "自前の favicon が出力されていない" });
} else {
  const svg = readFileSync(resolve(DIST, "favicon.svg"), "utf8");
  if (!svg.includes("JA")) {
    problems.push({ page: "favicon.svg", message: "favicon が想定と違う" });
  }
  console.log("  自前の favicon.svg を確認");
}

// 7. サイトタイトルに「非公式」が入っていること
console.log("\n── サイトタイトル ──");
const sample = readFileSync(resolve(DIST, "index.html"), "utf8");
const title = sample.match(/<title>([^<]*)<\/title>/);
if (!title || !title[1].includes("非公式")) {
  problems.push({
    page: "index.html",
    message: `サイトタイトルに「非公式」が入っていない: ${title?.[1] ?? "(title 無し)"}`,
  });
} else {
  console.log(`  ${title[1]}`);
}

// 8. 原文サイトへのリンクが「（原文）」を伴っていること（サイドバー含む）
console.log("\n── 未翻訳ページへのフォールバック ──");
const fallbacks = sample.match(new RegExp(`href="${UPSTREAM_SITE}[^"]*"`, "g")) ?? [];
console.log(`  トップページから原文サイトへのリンク ${fallbacks.length} 本`);

console.log("");
if (problems.length === 0) {
  console.log("✔ 公開前チェックをすべて通過");
  process.exit(0);
}
const byPage = new Map<string, string[]>();
for (const p of problems) {
  if (!byPage.has(p.page)) byPage.set(p.page, []);
  byPage.get(p.page)!.push(p.message);
}
for (const [page, messages] of byPage) {
  console.log(`✘ ${page}`);
  for (const m of new Set(messages)) console.log(`    ${m}`);
}
console.log(`\n合計 ${problems.length} 件`);
process.exit(1);
