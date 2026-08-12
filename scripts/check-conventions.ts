/**
 * PR のタイトル・本文・コミットメッセージが、このリポジトリの言語ルールに
 * 従っているかを検査する。
 *
 *   bun scripts/check-conventions.ts
 *
 * ルール（README「このリポジトリのルール」と対応）:
 * - コミットメッセージ: 英語 + Conventional Commits
 * - PR のタイトル      : 英語 + Conventional Commits
 * - PR の本文          : 日本語
 *
 * コミット履歴と PR タイトルは GitHub やツールが横断的に読む機械可読な面なので
 * 英語に寄せ、人間が読む面（PR 本文・訳文・コメント）は日本語にする、という
 * 切り分け。
 *
 * 入力は環境変数で受ける（GitHub Actions から渡しやすくするため）。
 *   PR_TITLE    PR のタイトル
 *   PR_BODY     PR の本文
 *   COMMITS_FILE  コミットメッセージを NUL 区切りで並べたファイルのパス
 * 何も渡されない場合は、いまの HEAD のコミットメッセージだけを検査する。
 *
 * COMMITS を文字列で受けないのは、bash の `$(cat file)` が NUL バイトを捨てるため。
 * 環境変数で渡すと区切りが失われ、複数のコミットが1件に化ける。
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** Conventional Commits で許可する type */
const TYPES = [
  "feat",
  "fix",
  "docs",
  "refactor",
  "test",
  "chore",
  "ci",
  "build",
  "perf",
  "style",
  "revert",
] as const;

const SUBJECT_RE = new RegExp(`^(${TYPES.join("|")})(\\([a-z0-9._/:-]+\\))?!?: .+`);

/** 日本語（ひらがな・カタカナ・漢字）を含むか */
const HAS_JA = /[぀-ゟ゠-ヿ㐀-䶿一-鿿ｦ-ﾟ]/;

/** 全角の約物。英語のはずの文字列に混じっていたら日本語混入とみなす */
const HAS_FULLWIDTH_PUNCT = /[　-〿！-･]/;

const MAX_SUBJECT = 72;

type Problem = { where: string; message: string };
const problems: Problem[] = [];

function checkEnglishSubject(where: string, subject: string) {
  if (!SUBJECT_RE.test(subject)) {
    problems.push({
      where,
      message:
        `Conventional Commits の形式になっていません: ${JSON.stringify(subject)}\n` +
        `    形式: <type>(<scope>): <subject>\n` +
        `    type: ${TYPES.join(" / ")}\n` +
        `    例  : docs(tasks): translate toml-tasks.md`,
    });
  }
  if (HAS_JA.test(subject) || HAS_FULLWIDTH_PUNCT.test(subject)) {
    problems.push({
      where,
      message: `英語で書いてください（日本語・全角文字が含まれています）: ${JSON.stringify(subject)}`,
    });
  }
  if (subject.length > MAX_SUBJECT) {
    problems.push({
      where,
      message: `1行目が長すぎます（${subject.length} 文字 / 上限 ${MAX_SUBJECT}）: ${JSON.stringify(subject)}`,
    });
  }
}

/** マージコミットは生成物なので検査しない */
const isMergeCommit = (subject: string) =>
  /^Merge (branch|pull request|remote-tracking) /.test(subject);

function checkCommit(message: string, index: number) {
  const lines = message.split("\n");
  const subject = lines[0].trim();
  if (subject === "" || isMergeCommit(subject)) return;

  const where = `コミット #${index + 1}`;
  checkEnglishSubject(where, subject);

  // 本文も英語。Co-Authored-By などのトレーラーは対象外
  const body = lines
    .slice(1)
    .filter((l) => !/^[A-Za-z-]+:\s/.test(l.trim()))
    .join("\n");
  if (HAS_JA.test(body)) {
    const line = lines.findIndex((l, i) => i > 0 && HAS_JA.test(l));
    problems.push({
      where,
      message:
        `本文も英語で書いてください（L${line + 1} に日本語があります）: ` +
        JSON.stringify(lines[line]?.slice(0, 60) ?? ""),
    });
  }
}

function main() {
  const title = process.env.PR_TITLE;
  const body = process.env.PR_BODY;
  const commitsFile = process.env.COMMITS_FILE;

  if (title !== undefined && title !== "") {
    checkEnglishSubject("PR のタイトル", title.trim());
  }

  if (body !== undefined) {
    const stripped = body
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .trim();
    if (stripped === "") {
      problems.push({
        where: "PR の本文",
        message: "本文が空です。テンプレートに従って日本語で書いてください",
      });
    } else if (!HAS_JA.test(stripped)) {
      problems.push({
        where: "PR の本文",
        message: "日本語で書いてください（日本語が1文字も含まれていません）",
      });
    }
  }

  const messages =
    commitsFile !== undefined && commitsFile !== ""
      ? readFileSync(commitsFile, "utf8")
          .split("\0")
          .filter((m) => m.trim() !== "")
      : [execFileSync("git", ["log", "-1", "--format=%B"], { encoding: "utf8" })];

  messages.forEach((m, i) => checkCommit(m, i));

  console.log(`検査対象: PR タイトル ${title ? 1 : 0} 件 / コミット ${messages.length} 件`);

  if (problems.length === 0) {
    console.log("✔ 言語ルールに違反はありません");
    return;
  }

  const byWhere = new Map<string, string[]>();
  for (const p of problems) {
    if (!byWhere.has(p.where)) byWhere.set(p.where, []);
    byWhere.get(p.where)!.push(p.message);
  }
  for (const [where, messages] of byWhere) {
    console.log(`\n✘ ${where}`);
    for (const m of messages) console.log(`    ${m}`);
  }
  console.log(
    `\n合計 ${problems.length} 件。README の「このリポジトリのルール」を参照してください。`,
  );
  process.exit(1);
}

main();
