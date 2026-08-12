/**
 * 原文と訳文を機械的に照合するための Markdown 解析。
 *
 * 目視レビューは見出しの数やコードブロックの中身の1文字違いを取りこぼすので、
 * 構造の一致はすべてここで数える。verify / check-links / anchors が共有する。
 */

/**
 * VitePress（@mdit-vue/shared）の slugify と同一の実装。
 * node_modules/vitepress/dist/node/chunk-*.js から写した。
 *
 * 独自に「英数字以外を除去して空白をハイフンに」と実装すると
 * `What's next?` → `whats-next` になるが、VitePress の答えは `what-s-next`。
 * アンカーが1文字違えば原文サイトからの deep link が切れるので、
 * 推測せず本物と同じ規則を使う。
 */
const rControl = /[\u0000-\u001f]/g;
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'\u201c\u201d\u2018\u2019<>,.?/]+/g;
const rCombining = /[\u0300-\u036F]/g;

export const slugify = (str: string): string =>
  str
    .normalize("NFKD")
    .replace(rCombining, "")
    .replace(rControl, "")
    .replace(rSpecial, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/^(\d)/, "_$1")
    .toLowerCase();

export type Heading = {
  /** `#` の数 */
  level: number;
  /** 見出しの生テキスト（`{#anchor}` を除いたもの） */
  text: string;
  /** 明示された `{#anchor}`。無ければ undefined */
  anchor?: string;
  /** 1 始まりの行番号 */
  line: number;
};

export type Fence = {
  /** フェンス直後の情報文字列。例: `toml [mise.toml]` */
  info: string;
  /** コードブロックの中身（末尾の改行を含まない） */
  body: string;
  line: number;
};

export type Link = {
  text: string;
  href: string;
  line: number;
};

export type Parsed = {
  headings: Heading[];
  fences: Fence[];
  links: Link[];
  /** `:::` コンテナの開始行。例: `tip`, `code-group` */
  containers: string[];
  /**
   * `:::tabs` 内のタブ見出し（`== ラベル`）。
   * 同じ `key:` を共有するタブグループはラベルで選択状態を同期するので、
   * 数が変わるとタブが1つ消えるか、同期が壊れる。
   */
  tabLabels: string[];
  /** テーブル行の総数（区切り行を含む） */
  tableRows: number;
  /** 箇条書き・番号付きリストの項目数 */
  listItems: number;
  /** frontmatter（無ければ undefined） */
  frontmatter?: string;
};

const FENCE_RE = /^(\s*)(`{3,}|~{3,})(.*)$/;
const HEADING_RE = /^(#{1,6})\s+(.*?)\s*$/;
const ANCHOR_RE = /\s*\{#([^}]+)\}\s*$/;
const LINK_RE = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const CONTAINER_RE = /^:::+\s*([a-zA-Z-]*)/;
const LIST_ITEM_RE = /^\s*(?:[-*+]|\d+\.)\s+\S/;
/** vitepress-plugin-tabs のタブ見出し。`== Linux/macOS` の形 */
const TAB_LABEL_RE = /^==\s+(.+)$/;

/** 見出しテキストを markdown-it が slugify に渡す平文に落とす */
export function inlineToPlain(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/~~([^~]*)~~/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/** 原文の見出しから VitePress が生成するアンカーを求める */
export function anchorFor(headingText: string): string {
  return slugify(inlineToPlain(headingText));
}

export function parse(src: string): Parsed {
  const lines = src.split("\n");
  const out: Parsed = {
    headings: [],
    fences: [],
    links: [],
    containers: [],
    tabLabels: [],
    tableRows: 0,
    listItems: 0,
  };

  let i = 0;

  // frontmatter
  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((l, n) => n > 0 && l.trim() === "---");
    if (end > 0) {
      out.frontmatter = lines.slice(1, end).join("\n");
      i = end + 1;
    }
  }

  let inHtmlComment = false;

  for (; i < lines.length; i++) {
    const line = lines[i];

    // HTML コメントは訳注や TODO に使うので、構造のカウントから外す
    if (!inHtmlComment && /<!--/.test(line) && !/-->/.test(line)) {
      inHtmlComment = true;
      continue;
    }
    if (inHtmlComment) {
      if (/-->/.test(line)) inHtmlComment = false;
      continue;
    }

    const fence = line.match(FENCE_RE);
    if (fence) {
      const [, indent, marker, info] = fence;
      const closeRe = new RegExp(`^\\s{0,${indent.length + 3}}${marker[0]}{${marker.length},}\\s*$`);
      const body: string[] = [];
      let closed = false;
      for (i++; i < lines.length; i++) {
        if (closeRe.test(lines[i])) {
          closed = true;
          break;
        }
        body.push(lines[i]);
      }
      out.fences.push({
        info: info.trim(),
        body: body.join("\n"),
        line: i - body.length,
      });
      if (!closed) i = lines.length;
      continue;
    }

    const container = line.match(CONTAINER_RE);
    if (container) {
      if (container[1]) out.containers.push(container[1]);
      continue;
    }

    const tab = line.match(TAB_LABEL_RE);
    if (tab) {
      out.tabLabels.push(tab[1].trim());
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      const raw = heading[2];
      const anchorMatch = raw.match(ANCHOR_RE);
      out.headings.push({
        level: heading[1].length,
        text: anchorMatch ? raw.replace(ANCHOR_RE, "") : raw,
        anchor: anchorMatch?.[1],
        line: i + 1,
      });
      continue;
    }

    if (/^\s*\|.*\|\s*$/.test(line)) out.tableRows++;
    if (LIST_ITEM_RE.test(line)) out.listItems++;

    for (const m of line.matchAll(LINK_RE)) {
      out.links.push({ text: m[2], href: m[3], line: i + 1 });
    }
  }

  // 見出し行に含まれるリンクも拾う（見出し内リンクは稀だが数を合わせる）
  for (const h of out.headings) {
    for (const m of h.text.matchAll(LINK_RE)) {
      out.links.push({ text: m[2], href: m[3], line: h.line });
    }
  }

  return out;
}
