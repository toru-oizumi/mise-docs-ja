/**
 * 翻訳スコープの単一の情報源。
 *
 * サイドバー生成（src/.vitepress/sidebar.ts）、同期スクリプト、リンク検査、
 * コードブロック検証がすべてここを参照する。スコープを増やすときはこのファイルの
 * TRANSLATED に1行足すだけでよい。
 */

/** 原文サイトのオリジン。未翻訳ページへのフォールバック先 */
export const UPSTREAM_SITE = "https://mise.jdx.dev";

/** 本家リポジトリ */
export const UPSTREAM_REPO = "https://github.com/jdx/mise";

/** 本家リポジトリ内でドキュメントが置かれているディレクトリ */
export const UPSTREAM_DOCS_DIR = "docs";

/** 本家の追従対象ブランチ */
export const UPSTREAM_BRANCH = "main";

export type ScopeEntry = {
  /** upstream/docs/ からの相対パス */
  path: string;
  /** 訳文の title。frontmatter とサイドバーの表示に使う */
  title: string;
};

/**
 * 翻訳対象のページ。
 * ここに載っているものだけが src/ に日本語版を持ち、サイドバーで内部リンクになる。
 * title は frontmatter とサイドバーで共有するので、訳文の h1 もこれに合わせる。
 */
export const TRANSLATED: readonly ScopeEntry[] = [
  // 導線
  { path: "getting-started.md", title: "はじめに" },
  { path: "walkthrough.md", title: "ウォークスルー" },
  { path: "installing-mise.md", title: "mise のインストール" },
  { path: "ide-integration.md", title: "IDE との連携" },
  { path: "continuous-integration.md", title: "継続的インテグレーション" },
  // 設定
  { path: "configuration.md", title: "mise.toml" },
  { path: "configuration/environments.md", title: "設定環境" },
  // 主要機能
  { path: "dev-tools/index.md", title: "開発ツールの概要" },
  { path: "dev-tools/shims.md", title: "shim" },
  { path: "dev-tools/aliases.md", title: "ツールのエイリアス" },
  { path: "dev-tools/comparison-to-asdf.md", title: "asdf との比較" },
  { path: "environments/index.md", title: "環境変数" },
  { path: "tasks/index.md", title: "タスクの概要" },
  { path: "tasks/running-tasks.md", title: "タスクの実行" },
  { path: "tasks/toml-tasks.md", title: "TOML タスク" },
  { path: "tasks/file-tasks.md", title: "ファイルタスク" },
  // FAQ / トラブルシューティング
  { path: "faq.md", title: "よくある質問" },
  { path: "troubleshooting.md", title: "トラブルシューティング" },
];

/**
 * 翻訳対象ページが参照している画像。upstream/docs/ からそのままコピーする。
 * 翻訳の対象ではないが、原文と同期させる必要があるので upstream/ に含める。
 */
export const ASSETS: readonly string[] = [
  "dev-tools/asdf-mise-exec-perf.jpg",
  "shims-vscode.png",
  "shims-intellij.png",
  "intellij-sdk-selection.png",
];

/**
 * src/ にあるが原文と対応しないページ。同期の対象外。
 * トップページは本家のランディングページの翻訳ではなく、非公式訳サイト独自のもの。
 */
export const OWN_PAGES: readonly string[] = ["index.md"];

const BY_PATH = new Map(TRANSLATED.map((e) => [e.path, e]));

/**
 * VitePress のリンク表記を upstream/docs/ 相対のパスに直す。
 * `/dev-tools/shims` → `dev-tools/shims.md`
 * `/dev-tools/`      → `dev-tools/index.md`
 * `/`                → `index.md`
 */
export function linkToDocPath(link: string): string {
  const path = link
    .split("#")[0]
    .replace(/\.html$/, "")
    .replace(/\.md$/, "")
    .replace(/^\//, "");
  if (path === "" || path.endsWith("/")) return `${path}index.md`;
  return `${path}.md`;
}

/**
 * upstream/docs/ 相対のパスを VitePress のリンク表記に直す。linkToDocPath の逆。
 * `dev-tools/index.md` → `/dev-tools/`
 */
export function docPathToLink(docPath: string): string {
  if (docPath === "index.md") return "/";
  const base = docPath.replace(/\.md$/, "");
  return base.endsWith("/index") ? `/${base.slice(0, -"index".length)}` : `/${base}`;
}

/** `a/b/../c` → `a/c`。posix の正規化を自前で行う（path モジュールに依存しない） */
function normalizeSegments(path: string): string {
  const out: string[] = [];
  for (const seg of path.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }
  return out.join("/");
}

/**
 * ページ内に書かれたリンクを upstream/docs/ 相対のパスに解決する。
 *
 * `fromDocPath` を要求するのは、原文が `./comparison-to-asdf` や `../templates`
 * のような相対リンクを多用しているため。これを解決せずに判定すると、
 * 同じディレクトリにある翻訳済みページを未翻訳と誤判定し、
 * 「原文サイトに飛ばせ」という誤った指示を出してしまう。
 */
export function resolveHref(fromDocPath: string, href: string): string {
  const bare = href.split("#")[0];
  if (bare === "") return fromDocPath;
  if (bare.startsWith("/")) return linkToDocPath(bare);
  const dir = fromDocPath.includes("/") ? fromDocPath.slice(0, fromDocPath.lastIndexOf("/")) : "";
  const joined = normalizeSegments(`${dir}/${bare}`);
  // ディレクトリ指定（末尾スラッシュ）は normalizeSegments が落とすので復元する
  const trailing = bare.endsWith("/") ? "/" : "";
  return linkToDocPath(`/${joined}${trailing}`);
}

/**
 * そのページを翻訳したか。
 * 相対リンクを正しく判定するには fromDocPath が必要。
 */
export function isTranslated(link: string, fromDocPath?: string): boolean {
  const docPath = fromDocPath ? resolveHref(fromDocPath, link) : linkToDocPath(link);
  return BY_PATH.has(docPath);
}

/** 訳文の title を引く */
export function titleOf(docPath: string): string | undefined {
  return BY_PATH.get(docPath)?.title;
}

/**
 * 原文サイトの URL。canonical と未翻訳ページへのフォールバックに使う。
 * 本家の config.ts が組む canonical と同じ形にする（index.md はディレクトリ URL）。
 */
export function upstreamUrl(docPathOrLink: string): string {
  const [base, ...rest] = docPathOrLink.split("#");
  const anchor = rest.length > 0 ? `#${rest.join("#")}` : "";
  const docPath = base.endsWith(".md") ? base : linkToDocPath(base);
  const page = docPath.endsWith("/index.md")
    ? docPath.slice(0, -"index.md".length)
    : docPath === "index.md"
      ? ""
      : docPath.replace(/\.md$/, ".html");
  return `${UPSTREAM_SITE}/${page}${anchor}`;
}

/** 本家リポジトリ上での原文の URL。訳文ページから原文の Markdown へ飛ばすのに使う */
export function upstreamBlobUrl(docPath: string, ref: string): string {
  return `${UPSTREAM_REPO}/blob/${ref}/${UPSTREAM_DOCS_DIR}/${docPath}`;
}
