/**
 * 原文と訳文の構造が 1:1 で対応しているかを機械的に検証する。
 *
 *   mise run verify              # 翻訳済みの全ページ
 *   mise run verify -- faq.md    # 個別のページ（upstream/docs/ 相対）
 *   tsx scripts/verify.ts --original <path> --translation <path>
 *
 * 目視レビューが必ず取りこぼす種類の誤りを落とすのが目的:
 * コードブロック内の1文字の改変、見出しの取り違え、アンカーの欠落、
 * 未翻訳ページへのリンクが原文 URL になっていないこと、訳し残し、禁止訳語。
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { anchorFor, parse, type Parsed } from "./lib/markdown.ts";
import { TRANSLATED, isTranslated, upstreamUrl, UPSTREAM_SITE } from "./scope.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const ESC = String.fromCharCode(27);
const color = (n: number) => (s: string) =>
  process.stdout.isTTY ? `${ESC}[${n}m${s}${ESC}[0m` : s;
const red = color(31);
const green = color(32);
const yellow = color(33);
const dim = color(90);

/** CLAUDE.md と glossary.md が明示的に禁じている訳語 */
const BANNED: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /することができます/, reason: "「〜できます」にする（glossary 定型フレーズ）" },
  { pattern: /フラグ/, reason: "flag / option は「オプション」に統一（glossary）" },
  { pattern: /試験的/, reason: "experimental は「実験的」に統一（glossary）" },
  { pattern: /フォルダ/, reason: "directory は「ディレクトリ」（glossary）" },
  { pattern: /トラスト/, reason: "trust は「信頼」（CLAUDE.md よくある誤訳）" },
  { pattern: /あなたは/, reason: "二人称は原則省略（CLAUDE.md 文体）" },
];

type Issue = { level: "error" | "warn"; message: string };

function checkFences(orig: Parsed, tran: Parsed): Issue[] {
  const issues: Issue[] = [];
  if (orig.fences.length !== tran.fences.length) {
    issues.push({
      level: "error",
      message: `コードブロック数が不一致: 原文 ${orig.fences.length} / 訳文 ${tran.fences.length}`,
    });
    return issues;
  }
  orig.fences.forEach((o, i) => {
    const t = tran.fences[i];
    if (o.info !== t.info) {
      issues.push({
        level: "error",
        message: `コードブロック #${i + 1} の情報文字列が改変されている (訳文 L${t.line})\n      原文: \`\`\`${o.info}\n      訳文: \`\`\`${t.info}`,
      });
    }
    if (o.body !== t.body) {
      const ol = o.body.split("\n");
      const tl = t.body.split("\n");
      const n = ol.findIndex((l, k) => l !== tl[k]);
      issues.push({
        level: "error",
        message:
          `コードブロック #${i + 1} の中身が原文と違う (訳文 L${t.line})\n` +
          `      原文 L${n + 1}: ${JSON.stringify(ol[n] ?? "(行なし)")}\n` +
          `      訳文 L${n + 1}: ${JSON.stringify(tl[n] ?? "(行なし)")}`,
      });
    }
  });
  return issues;
}

function checkHeadings(orig: Parsed, tran: Parsed): Issue[] {
  const issues: Issue[] = [];
  if (orig.headings.length !== tran.headings.length) {
    issues.push({
      level: "error",
      message: `見出し数が不一致: 原文 ${orig.headings.length} / 訳文 ${tran.headings.length}`,
    });
  }
  const n = Math.min(orig.headings.length, tran.headings.length);
  for (let i = 0; i < n; i++) {
    const o = orig.headings[i];
    const t = tran.headings[i];
    if (o.level !== t.level) {
      issues.push({
        level: "error",
        message: `見出し #${i + 1} のレベルが違う (訳文 L${t.line}): 原文 h${o.level} / 訳文 h${t.level}`,
      });
    }
    // 原文が `{#foo}` で明示しているならそれが正解。
    // 明示が無い見出しだけ、VitePress の slugify で導出した値と比べる。
    const want = o.anchor ?? anchorFor(o.text);
    if (!t.anchor) {
      issues.push({
        level: "error",
        message: `見出し #${i + 1} にアンカーが無い (訳文 L${t.line}): \`{#${want}}\` を付ける`,
      });
    } else if (t.anchor !== want) {
      issues.push({
        level: "error",
        message: `見出し #${i + 1} のアンカーが原文と違う (訳文 L${t.line}): 訳文 \`{#${t.anchor}}\` / 正しくは \`{#${want}}\`（原文見出し: ${o.text}）`,
      });
    }
  }
  return issues;
}

function checkLinks(orig: Parsed, tran: Parsed): Issue[] {
  const issues: Issue[] = [];
  if (orig.links.length !== tran.links.length) {
    issues.push({
      level: "error",
      message: `リンク数が不一致: 原文 ${orig.links.length} / 訳文 ${tran.links.length}`,
    });
  }
  for (const l of tran.links) {
    // 画像・アンカーのみ・外部リンクは対象外
    if (/^(https?:)?\/\//.test(l.href)) {
      if (l.href.startsWith(UPSTREAM_SITE)) {
        const path = l.href.slice(UPSTREAM_SITE.length);
        // 翻訳済みのページを原文サイトに飛ばしてはいけない。
        // 読者が日本語版から英語版に落ちるので、リンク切れより気づきにくい。
        if (isTranslated(path)) {
          issues.push({
            level: "error",
            message: `翻訳済みページを原文サイトに飛ばしている (L${l.line}): [${l.text}](${l.href}) → 相対パスにする`,
          });
        } else if (!l.text.includes("（原文）")) {
          issues.push({
            level: "error",
            message: `原文サイトへのリンクに「（原文）」が無い (L${l.line}): [${l.text}](${l.href})　※「（原文）」はリンクテキストの内側に入れる`,
          });
        }
      }
      continue;
    }
    if (l.href.startsWith("#")) continue;
    if (/\.(png|jpe?g|gif|svg|webp|mp4)$/i.test(l.href)) continue;

    if (!isTranslated(l.href)) {
      issues.push({
        level: "error",
        message: `未翻訳ページへの内部リンクが残っている (L${l.line}): [${l.text}](${l.href}) → ${upstreamUrl(l.href)} にして「（原文）」を付ける`,
      });
    } else if (l.text.includes("（原文）")) {
      issues.push({
        level: "warn",
        message: `翻訳済みページへのリンクに「（原文）」が付いている (L${l.line}): [${l.text}](${l.href})`,
      });
    }
  }
  return issues;
}

function checkStructure(orig: Parsed, tran: Parsed): Issue[] {
  const issues: Issue[] = [];
  if (orig.tableRows !== tran.tableRows) {
    issues.push({
      level: "error",
      message: `テーブル行数が不一致: 原文 ${orig.tableRows} / 訳文 ${tran.tableRows}`,
    });
  }
  if (orig.listItems !== tran.listItems) {
    issues.push({
      level: "error",
      message: `リスト項目数が不一致: 原文 ${orig.listItems} / 訳文 ${tran.listItems}`,
    });
  }
  const oc = orig.containers.join(",");
  const tc = tran.containers.join(",");
  if (oc !== tc) {
    issues.push({
      level: "error",
      message: `::: コンテナのラベルが不一致\n      原文: ${oc}\n      訳文: ${tc}`,
    });
  }
  if (orig.tabLabels.length !== tran.tabLabels.length) {
    issues.push({
      level: "error",
      message:
        `タブ見出し（== 行）の数が不一致: 原文 ${orig.tabLabels.length} / 訳文 ${tran.tabLabels.length}\n` +
        `      原文: ${orig.tabLabels.join(" | ")}\n` +
        `      訳文: ${tran.tabLabels.join(" | ")}`,
    });
  } else {
    // 同じ key: を共有するタブグループは、同名ラベルで選択状態を同期する。
    // 原文で同名だったラベルが訳文で別名になると同期が壊れる。
    const groups = new Map<string, Set<string>>();
    orig.tabLabels.forEach((o, i) => {
      if (!groups.has(o)) groups.set(o, new Set());
      groups.get(o)!.add(tran.tabLabels[i]);
    });
    for (const [o, translations] of groups) {
      if (translations.size > 1) {
        issues.push({
          level: "error",
          message:
            `原文で同名のタブ見出し「${o}」が、訳文で別の訳語になっている` +
            `（${[...translations].join(" / ")}）。同じ key: のタブ同期が壊れるので訳を揃える`,
        });
      }
    }
  }
  return issues;
}

function checkFrontmatter(tran: Parsed, docPath: string): Issue[] {
  const issues: Issue[] = [];
  const fm = tran.frontmatter;
  if (!fm) {
    return [{ level: "error", message: "frontmatter が無い" }];
  }
  for (const key of ["title", "upstreamPath", "upstreamUrl", "upstreamRef", "upstreamDate"]) {
    if (!new RegExp(`^${key}:`, "m").test(fm)) {
      issues.push({ level: "error", message: `frontmatter に ${key} が無い` });
    }
  }
  const wantPath = `docs/${docPath}`;
  if (fm.includes("upstreamPath:") && !fm.includes(wantPath)) {
    issues.push({
      level: "error",
      message: `frontmatter の upstreamPath が違う: ${wantPath} にする`,
    });
  }
  const wantUrl = upstreamUrl(docPath);
  if (fm.includes("upstreamUrl:") && !fm.includes(wantUrl)) {
    issues.push({
      level: "error",
      message: `frontmatter の upstreamUrl が違う: ${wantUrl} にする`,
    });
  }
  return issues;
}

const hasJa = /[ぁ-んァ-ヶ一-龠]/;

/**
 * 行を「訳す対象の文章」に落とす。
 * URL は訳さないので落とし、リンクテキストと画像の alt は訳す対象なので残す。
 * これをしないと `- Emacs: [mise.el](https://github.com/liuyinz/mise.el)` のような
 * 固有名詞と URL だけの行が、URL の長さのせいで未訳として誤検出される。
 */
function prose(line: string): string {
  return line
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<https?:\/\/[^>]*>/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/`[^`]*`/g, "")
    .trim();
}

/**
 * コードブロックを空行に置き換える。行を削除すると行番号がずれて、
 * 報告する L番号が実ファイルと合わなくなる。
 */
function blankFences(s: string): string[] {
  const lines = s.replace(/^---\n[\s\S]*?\n---\n/, (m) => m.replace(/[^\n]/g, "")).split("\n");
  let fence: string | undefined;
  return lines.map((l) => {
    const m = l.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = undefined;
      return "";
    }
    if (m) {
      fence = m[1];
      return "";
    }
    return l;
  });
}

/** コードブロック外の本文が原文のまま残っている行を検出する */
function checkUntranslated(origSrc: string, tranSrc: string): Issue[] {
  const issues: Issue[] = [];
  const origProse = new Set(
    blankFences(origSrc)
      .map((l) => prose(l))
      .filter((l) => l.length > 25 && /[a-zA-Z]/.test(l)),
  );
  for (const [i, line] of blankFences(tranSrc).entries()) {
    const t = line.trim();
    // 訳す対象でない行を外す。
    // - タブ見出しは固有名詞だけのことが多い（`== Debian/Ubuntu (apt)`）
    // - `:::` コンテナの開始行はラベルを訳さない決まり
    // - HTML コメントは markdownlint 指示や訳注
    if (/^={2,}/.test(t) || t.startsWith(":::") || t.startsWith("<!--")) continue;
    const p = prose(line);
    if (p.length > 25 && !hasJa.test(p) && origProse.has(p)) {
      issues.push({
        level: "warn",
        message: `原文のまま残っている可能性がある行 (L${i + 1}): ${p.slice(0, 70)}…`,
      });
    }
  }
  return issues;
}

/**
 * 画像の alt テキストの訳し漏れを検出する。
 * alt は本文と違って目に見えないので、レビューで最も見落とされる。
 */
function checkAltText(orig: Parsed, tran: Parsed): Issue[] {
  const issues: Issue[] = [];
  const oImgs = orig.links.filter((l) => l.image);
  const tImgs = tran.links.filter((l) => l.image);
  if (oImgs.length !== tImgs.length) return issues; // リンク数の不一致は別途報告される
  oImgs.forEach((o, i) => {
    const t = tImgs[i];
    // 空でなく、語句（空白を含む）で、原文と同一なら訳し漏れ。
    // 単語1つの alt はファイル名や固有名詞のことが多いので対象外。
    if (o.text.trim() !== "" && o.text.includes(" ") && o.text === t.text && !hasJa.test(t.text)) {
      issues.push({
        level: "warn",
        message: `画像の alt テキストが原文のまま (L${t.line}): ![${t.text}](…)`,
      });
    }
  });
  return issues;
}

function checkBanned(tranSrc: string): Issue[] {
  const issues: Issue[] = [];
  const body = tranSrc.replace(/^(\s*)(`{3,}|~{3,})[\s\S]*?\n\s*\2\s*$/gm, "");
  body.split("\n").forEach((line, i) => {
    if (/^\s*`|^\s{4,}\S/.test(line)) return;
    for (const b of BANNED) {
      if (b.pattern.test(line)) {
        issues.push({
          level: "warn",
          message: `禁止訳語「${b.pattern.source}」 (L${i + 1}): ${b.reason}`,
        });
      }
    }
  });
  return issues;
}

export function verifyPair(
  origSrc: string,
  tranSrc: string,
  docPath: string,
): Issue[] {
  const orig = parse(origSrc);
  const tran = parse(tranSrc);
  return [
    ...checkFrontmatter(tran, docPath),
    ...checkHeadings(orig, tran),
    ...checkFences(orig, tran),
    ...checkLinks(orig, tran),
    ...checkStructure(orig, tran),
    ...checkUntranslated(origSrc, tranSrc),
    ...checkBanned(tranSrc),
  ];
}

function main() {
  const argv = process.argv.slice(2);
  let pairs: Array<{ label: string; orig: string; tran: string; docPath: string }> = [];

  const oi = argv.indexOf("--original");
  const ti = argv.indexOf("--translation");
  if (oi >= 0 && ti >= 0) {
    const docPath = argv[argv.indexOf("--doc-path") + 1] ?? "getting-started.md";
    pairs = [
      { label: argv[ti + 1], orig: argv[oi + 1], tran: argv[ti + 1], docPath },
    ];
  } else {
    const targets = argv.length > 0 ? argv : TRANSLATED.map((e) => e.path);
    pairs = targets.map((p) => ({
      label: p,
      orig: resolve(ROOT, "upstream/docs", p),
      tran: resolve(ROOT, "src", p),
      docPath: p,
    }));
  }

  let errors = 0;
  let warns = 0;
  let skipped = 0;

  for (const p of pairs) {
    if (!existsSync(p.tran)) {
      console.log(dim(`─ ${p.label}: 未翻訳（src にファイルが無い）`));
      skipped++;
      continue;
    }
    const issues = verifyPair(
      readFileSync(p.orig, "utf8"),
      readFileSync(p.tran, "utf8"),
      p.docPath,
    );
    const e = issues.filter((i) => i.level === "error");
    const w = issues.filter((i) => i.level === "warn");
    errors += e.length;
    warns += w.length;

    if (issues.length === 0) {
      console.log(green(`✔ ${p.label}`));
      continue;
    }
    const mark = e.length > 0 ? red("✘") : yellow("▲");
    console.log(`${mark} ${p.label}  (error ${e.length} / warn ${w.length})`);
    for (const i of e) console.log(`    ${red("error")} ${i.message}`);
    for (const i of w) console.log(`    ${yellow("warn ")} ${i.message}`);
  }

  console.log(
    `\n合計: error ${errors} / warn ${warns} / 未翻訳 ${skipped} / 対象 ${pairs.length}`,
  );
  process.exit(errors > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
