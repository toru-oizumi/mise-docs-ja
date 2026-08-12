/**
 * 本家の最新を取得して、upstream/ スナップショットとの差分を出す。
 *
 *   mise run sync
 *
 * ここでは翻訳しない。翻訳は Claude Code が .sync/ を読んで行う（SETUP.md 4節）。
 * 差分を出すだけでファイルは書き換えないので、何度でも安全に実行できる。
 * upstream/ の更新は差分を確認してから mise run sync:apply で行う。
 */

import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ASSETS,
  TRANSLATED,
  UPSTREAM_BRANCH,
  UPSTREAM_DOCS_DIR,
  UPSTREAM_REPO,
} from "./scope.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLONE = resolve(ROOT, ".upstream-clone");
const SYNC = resolve(ROOT, ".sync");
const REF_FILE = resolve(ROOT, ".upstream-ref");

const apply = process.argv.includes("--apply");

function git(args: string[], cwd: string): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 1 << 28 });
}

/** 本家を shallow clone する。既にあれば fetch して進める */
function fetchUpstream(): string {
  if (!existsSync(CLONE)) {
    console.log(`本家を clone しています: ${UPSTREAM_REPO}`);
    mkdirSync(CLONE, { recursive: true });
    git(["init", "-q"], CLONE);
    git(["remote", "add", "origin", UPSTREAM_REPO], CLONE);
    // docs/ だけを取れば十分。Rust ツリーは引きずらない
    git(["config", "core.sparseCheckout", "true"], CLONE);
    writeFileSync(resolve(CLONE, ".git/info/sparse-checkout"), `${UPSTREAM_DOCS_DIR}/\n`);
  }
  console.log(`本家の ${UPSTREAM_BRANCH} を取得しています…`);
  git(["fetch", "--depth", "1", "origin", UPSTREAM_BRANCH], CLONE);
  git(["checkout", "-q", "-f", "FETCH_HEAD"], CLONE);
  return git(["rev-parse", "FETCH_HEAD"], CLONE).trim();
}

type Change =
  | { kind: "modified"; path: string }
  | { kind: "deleted"; path: string }
  | { kind: "unchanged"; path: string };

function main() {
  const oldRef = existsSync(REF_FILE) ? readFileSync(REF_FILE, "utf8").trim() : "(なし)";
  const newRef = fetchUpstream();

  console.log(`\n取り込み済み: ${oldRef.slice(0, 12)}`);
  console.log(`本家の最新  : ${newRef.slice(0, 12)}`);

  if (oldRef === newRef) {
    console.log("\n差分なし。追従済みです。");
    return;
  }

  rmSync(SYNC, { recursive: true, force: true });
  mkdirSync(SYNC, { recursive: true });

  const changes: Change[] = [];

  for (const entry of TRANSLATED) {
    const ours = resolve(ROOT, "upstream", UPSTREAM_DOCS_DIR, entry.path);
    const theirs = resolve(CLONE, UPSTREAM_DOCS_DIR, entry.path);

    if (!existsSync(theirs)) {
      changes.push({ kind: "deleted", path: entry.path });
      continue;
    }
    const before = existsSync(ours) ? readFileSync(ours, "utf8") : "";
    const after = readFileSync(theirs, "utf8");
    if (before === after) {
      changes.push({ kind: "unchanged", path: entry.path });
      continue;
    }

    changes.push({ kind: "modified", path: entry.path });

    // unified diff を .sync/ に書き出す。git diff --no-index は差分があると
    // 終了コード 1 を返すので、例外の stdout から取り出す。
    let diff = "";
    try {
      diff = execFileSync(
        "git",
        [
          "diff",
          "--no-index",
          "--unified=3",
          `--src-prefix=upstream-old/`,
          `--dst-prefix=upstream-new/`,
          "--",
          ours,
          theirs,
        ],
        { encoding: "utf8", maxBuffer: 1 << 28 },
      );
    } catch (e: any) {
      diff = e.stdout ?? "";
    }
    const out = resolve(SYNC, `${entry.path.replace(/\//g, "__")}.diff`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, diff);
  }

  const modified = changes.filter((c) => c.kind === "modified");
  const deleted = changes.filter((c) => c.kind === "deleted");
  const unchanged = changes.filter((c) => c.kind === "unchanged");

  console.log(`\n── 翻訳済み ${TRANSLATED.length} ページの状況 ──`);
  console.log(`  変更あり: ${modified.length}`);
  console.log(`  削除    : ${deleted.length}`);
  console.log(`  変更なし: ${unchanged.length}`);

  if (modified.length > 0) {
    console.log("\n変更のあったページ（.sync/ に diff を書き出しました）:");
    for (const c of modified) console.log(`  M ${c.path}`);
  }
  if (deleted.length > 0) {
    console.log("\n本家から削除されたページ（訳も削除してサイドバーから外す）:");
    for (const c of deleted) console.log(`  D ${c.path}`);
  }

  // スコープ外だが、本家に新しく増えたページも知らせる（スコープ拡張の判断材料）
  const known = new Set<string>([...TRANSLATED.map((e) => e.path), ...ASSETS]);
  const upstreamDocs = git(
    ["ls-tree", "-r", "--name-only", "FETCH_HEAD", `${UPSTREAM_DOCS_DIR}/`],
    CLONE,
  )
    .split("\n")
    .filter((p) => p.endsWith(".md"))
    .map((p) => p.slice(`${UPSTREAM_DOCS_DIR}/`.length))
    .filter((p) => !p.startsWith("cli/"));
  const notInScope = upstreamDocs.filter((p) => !known.has(p));
  console.log(`\nスコープ外の原文ページ: ${notInScope.length} 件（cli/ を除く）`);

  if (!apply) {
    console.log(
      "\n次にやること:\n" +
        "  1. .sync/*.diff を読んで、訳の更新が必要なページを判断する\n" +
        "     （typo 修正・リンク差し替えだけなら更新不要と判断してよい）\n" +
        "  2. 変更されたブロックだけを訳し直す。無関係な段落には手を触れない\n" +
        "  3. frontmatter の upstreamRef / upstreamDate を更新する\n" +
        "  4. mise run sync:apply で upstream/ と .upstream-ref を進める\n" +
        "  5. upstream/ の更新と訳の更新を必ず同一コミットに含める",
    );
    return;
  }

  // --apply: スナップショットを進める。
  // 訳の更新と同じコミットに含めること（片方だけ進むと次回の diff が壊れる）。
  for (const entry of TRANSLATED) {
    const theirs = resolve(CLONE, UPSTREAM_DOCS_DIR, entry.path);
    if (!existsSync(theirs)) continue;
    const ours = resolve(ROOT, "upstream", UPSTREAM_DOCS_DIR, entry.path);
    mkdirSync(dirname(ours), { recursive: true });
    cpSync(theirs, ours);
  }
  for (const asset of ASSETS) {
    const theirs = resolve(CLONE, UPSTREAM_DOCS_DIR, asset);
    if (!existsSync(theirs)) continue;
    const ours = resolve(ROOT, "upstream", UPSTREAM_DOCS_DIR, asset);
    mkdirSync(dirname(ours), { recursive: true });
    cpSync(theirs, ours);
  }
  writeFileSync(REF_FILE, `${newRef}\n`);
  console.log(`\nupstream/ と .upstream-ref を ${newRef.slice(0, 12)} に更新しました。`);
  console.log("訳の更新と同じコミットに含めてください。");
}

main();
