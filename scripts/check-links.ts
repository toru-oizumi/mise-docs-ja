/**
 * src/ のリンク切れを検査する。
 *
 *   mise run check:links
 *
 * 見るもの:
 * - 内部リンクの先が src/ に存在するか（存在しなければ 404 になる）
 * - アンカー付きリンクのアンカーが、リンク先ページに実在するか
 * - 画像の参照先が存在するか
 *
 * 未翻訳ページへの内部リンクは verify.ts が「原文 URL にしろ」と怒る担当なので、
 * ここでは「存在しないページを指している」という事実として報告する。
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { anchorFor, parse } from "./lib/markdown.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(ROOT, "src");

/**
 * 原文の側で既に壊れているリンク。
 *
 * CLAUDE.md は「原文の誤りを訳で勝手に直さない」と定めているので、訳文は原文の
 * まま維持している。ここに記録して検査から除外し、事実を repo に残す。
 * 本家が直したら差分同期で自然に解消するので、そのときこの表から削る。
 */
const UPSTREAM_BROKEN: Array<{ page: string; href: string; note: string }> = [
  {
    page: "src/walkthrough.md",
    href: "#misetoml-configuration",
    note:
      "原文 docs/walkthrough.md L119 のリンク先が #misetoml-configuration だが、" +
      "見出し `## \\`mise.toml\\` Configuration` の実際のアンカーは " +
      "#mise-toml-configuration。原文サイト（mise.jdx.dev）でも同じく壊れている。",
  },
];

const isKnownUpstreamBreakage = (page: string, href: string): boolean =>
  UPSTREAM_BROKEN.some((b) => b.page === page && b.href === href);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".md")) out.push(p);
  }
  return out;
}

const files = walk(SRC);

/** ページごとの、実際に存在するアンカーの集合 */
const anchors = new Map<string, Set<string>>();
for (const file of files) {
  const parsed = parse(readFileSync(file, "utf8"));
  const set = new Set<string>();
  for (const h of parsed.headings) set.add(h.anchor ?? anchorFor(h.text));
  anchors.set(file, set);
}

/** リンク表記を src/ 内の実ファイルに解決する */
function resolveTarget(fromFile: string, href: string): string | undefined {
  const bare = href.split("#")[0].replace(/\.html$/, "").replace(/\.md$/, "");
  const base = href.startsWith("/") ? SRC : dirname(fromFile);
  const path = href.startsWith("/") ? bare.slice(1) : bare;
  const candidates =
    path === "" || path.endsWith("/")
      ? [join(base, path, "index.md")]
      : [join(base, `${path}.md`), join(base, path, "index.md")];
  return candidates.find((c) => existsSync(c));
}

let errors = 0;

for (const file of files) {
  const rel = relative(ROOT, file);
  const parsed = parse(readFileSync(file, "utf8"));
  const problems: string[] = [];

  for (const link of parsed.links) {
    const href = link.href;
    if (/^(https?:)?\/\//.test(href) || href.startsWith("mailto:")) continue;

    // 同一ページ内のアンカー
    if (href.startsWith("#")) {
      const a = href.slice(1);
      if (!anchors.get(file)!.has(a) && !isKnownUpstreamBreakage(rel, href)) {
        problems.push(`L${link.line} ページ内アンカーが存在しない: ${href}`);
      }
      continue;
    }

    // 画像などのアセット
    if (/\.(png|jpe?g|gif|svg|webp|mp4|mp3)$/i.test(href)) {
      const base = href.startsWith("/") ? SRC : dirname(file);
      const p = join(base, href.startsWith("/") ? href.slice(1) : href);
      const inPublic = join(SRC, "public", href.startsWith("/") ? href.slice(1) : href);
      if (!existsSync(p) && !existsSync(inPublic)) {
        problems.push(`L${link.line} 画像が存在しない: ${href}`);
      }
      continue;
    }

    const target = resolveTarget(file, href);
    if (!target) {
      problems.push(
        `L${link.line} リンク先のページが存在しない: ${href}` +
          `（未翻訳ページなら原文サイトの絶対 URL にする）`,
      );
      continue;
    }
    const anchor = href.includes("#") ? href.split("#").slice(1).join("#") : "";
    if (anchor && !anchors.get(target)?.has(anchor)) {
      problems.push(
        `L${link.line} リンク先にアンカーが存在しない: ${href}` +
          `（${relative(ROOT, target)} 内に #${anchor} が無い）`,
      );
    }
  }

  if (problems.length > 0) {
    errors += problems.length;
    console.log(`✘ ${rel}`);
    for (const p of problems) console.log(`    ${p}`);
  }
}

if (UPSTREAM_BROKEN.length > 0) {
  console.log(`\n原文の側で壊れているため検査から除外したリンク（${UPSTREAM_BROKEN.length} 件）:`);
  for (const b of UPSTREAM_BROKEN) {
    console.log(`  ${b.page}  ${b.href}\n    ${b.note}`);
  }
}

console.log(
  errors === 0
    ? `\n✔ リンク切れなし（${files.length} ページ）`
    : `\n合計 ${errors} 件のリンク問題（${files.length} ページ）`,
);
process.exit(errors > 0 ? 1 : 0);
