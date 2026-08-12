/**
 * .github/workflows/*.yml が YAML として妥当かを検査する。
 *
 *   mise run check:workflows
 *
 * これを作った理由。`if: contains(steps.sync.outputs.report, '変更あり: 0')` と
 * 書いたところ、YAML のプレーンスカラーに `: `（コロン+空白）を含めたせいで
 * ワークフロー全体が構文エラーになり、push ごとに黙って失敗し続けた。
 * GitHub 上では name が表示されずファイルパスになるだけで、原因が分かりにくい。
 *
 * 壊れたワークフローはローカルで一度も実行されないので、CI に入れる以外に
 * 気づく手立てがない。
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, ".github/workflows");

type Problem = { file: string; message: string };
const problems: Problem[] = [];

const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
  .sort();

for (const file of files) {
  const source = readFileSync(join(DIR, file), "utf8");

  let doc: unknown;
  try {
    doc = Bun.YAML.parse(source);
  } catch (e) {
    problems.push({ file, message: `YAML として読めない: ${String(e).split("\n")[0]}` });
    continue;
  }

  if (typeof doc !== "object" || doc === null) {
    problems.push({ file, message: "トップレベルがマッピングになっていない" });
    continue;
  }
  const wf = doc as Record<string, unknown>;

  // YAML 1.1 のパーサは裸の on を真偽値 true として解釈することがある。
  // GitHub は文字列の on を期待しているので、どちらの形でも受けて存在だけを見る。
  const hasTrigger = Object.keys(wf).some((k) => k === "on" || k === "true");
  if (!hasTrigger) {
    problems.push({ file, message: "on: が無い（トリガーが定義されていない）" });
  }
  if (!("jobs" in wf)) {
    problems.push({ file, message: "jobs: が無い" });
  } else {
    const jobs = wf.jobs as Record<string, Record<string, unknown>>;
    for (const [name, job] of Object.entries(jobs)) {
      if (!job || typeof job !== "object") {
        problems.push({ file, message: `job ${name} の定義が空` });
        continue;
      }
      if (!("runs-on" in job) && !("uses" in job)) {
        problems.push({ file, message: `job ${name} に runs-on が無い` });
      }
      const steps = job.steps;
      if (steps !== undefined && !Array.isArray(steps)) {
        problems.push({ file, message: `job ${name} の steps が配列になっていない` });
      }
    }
  }

  if (source.includes("\t")) {
    const line = source.split("\n").findIndex((l) => l.includes("\t")) + 1;
    problems.push({ file, message: `タブ文字が混じっている (L${line})。YAML はタブを許さない` });
  }
}

console.log(`検査したワークフロー: ${files.length} 件`);
for (const f of files) {
  if (!problems.some((p) => p.file === f)) console.log(`  ✔ ${f}`);
}

if (problems.length === 0) {
  console.log("\n✔ ワークフローに問題はありません");
  process.exit(0);
}
for (const p of problems) console.log(`\n✘ ${p.file}\n    ${p.message}`);
console.log(`\n合計 ${problems.length} 件`);
process.exit(1);
