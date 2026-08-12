/**
 * 追従できていないページを一覧表示する。
 *
 *   mise run stale
 *
 * 各訳ページの frontmatter に書かれた upstreamRef と、.upstream-ref に書かれた
 * 取り込み済み hash を比べる。ずれているページは「原文が進んだのに訳が追いついて
 * いない」候補。ネットワークには一切アクセスしないので、いつでも即座に走る。
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TRANSLATED } from "./scope.ts";
import { parse } from "./lib/markdown.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const currentRef = readFileSync(resolve(ROOT, ".upstream-ref"), "utf8").trim();
const short = currentRef.slice(0, 7);

type Row = {
  path: string;
  state: "未翻訳" | "追従済み" | "要確認";
  ref: string;
  date: string;
};

function fmValue(fm: string | undefined, key: string): string {
  if (!fm) return "";
  const m = fm.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
  return m ? m[1].trim() : "";
}

const rows: Row[] = TRANSLATED.map((entry) => {
  const file = resolve(ROOT, "src", entry.path);
  if (!existsSync(file)) {
    return { path: entry.path, state: "未翻訳", ref: "-", date: "-" };
  }
  const fm = parse(readFileSync(file, "utf8")).frontmatter;
  const ref = fmValue(fm, "upstreamRef");
  const date = fmValue(fm, "upstreamDate");
  const matches = ref !== "" && (currentRef.startsWith(ref) || ref === short);
  return { path: entry.path, state: matches ? "追従済み" : "要確認", ref: ref || "(なし)", date: date || "-" };
});

/** 全角文字を2桁として数える。padEnd だけでは日本語の列がずれる */
const displayWidth = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(c) ? 2 : 1), 0);
const pad = (s: string, width: number): string => s + " ".repeat(Math.max(0, width - displayWidth(s)));

const width = Math.max(...rows.map((r) => r.path.length));

console.log(`取り込み済みの原文: ${short}\n`);
console.log(`${pad("ページ", width)}  ${pad("状態", 10)}  upstreamRef  翻訳日`);
console.log("─".repeat(width + 36));
for (const r of rows) {
  console.log(`${pad(r.path, width)}  ${pad(r.state, 10)}  ${pad(r.ref, 11)}  ${r.date}`);
}

const counts = rows.reduce<Record<string, number>>((acc, r) => {
  acc[r.state] = (acc[r.state] ?? 0) + 1;
  return acc;
}, {});
console.log(
  `\n合計 ${rows.length} ページ: ` +
    `追従済み ${counts["追従済み"] ?? 0} / 要確認 ${counts["要確認"] ?? 0} / 未翻訳 ${counts["未翻訳"] ?? 0}`,
);
