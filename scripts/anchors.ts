/**
 * 原文の見出しに対して、訳文で付けるべきアンカーを機械的に出す。
 *
 *   mise run anchors -- faq.md
 *
 * 翻訳するときはこの出力をそのまま写す。アンカーを人（や LLM）が考えると、
 * `Trusting config files` を `{#trust}` のように意味で縮めてしまい、
 * 原文サイトからの deep link が黙って切れる。
 *
 * 規則は2つだけ。
 * - 原文が `{#foo}` で明示している見出し → その値をそのまま使う
 * - 明示していない見出し → VitePress の slugify で導出した値を使う
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { anchorFor, parse } from "./lib/markdown.ts";
import { TRANSLATED } from "./scope.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const targets = process.argv.slice(2);
const paths = targets.length > 0 ? targets : TRANSLATED.map((e) => e.path);

for (const p of paths) {
  const src = readFileSync(resolve(ROOT, "upstream/docs", p), "utf8");
  const { headings } = parse(src);
  console.log(`\n── ${p}（見出し ${headings.length} 個）──`);
  for (const [i, h] of headings.entries()) {
    const anchor = h.anchor ?? anchorFor(h.text);
    const origin = h.anchor ? "原文が明示" : "slugify 導出";
    console.log(
      `${String(i + 1).padStart(3)}. h${h.level}  {#${anchor}}` +
        `\n     原文: ${"#".repeat(h.level)} ${h.text}` +
        `\n     根拠: ${origin}`,
    );
  }
}
