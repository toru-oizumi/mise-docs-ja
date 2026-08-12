/**
 * サイドバー。本家の docs/.vitepress/sidebar.ts の構造をデータとして移植したもの。
 *
 * 未翻訳ページは削除せず、原文サイトの絶対 URL に向けて「（原文）」を付ける。
 * その書き換えは resolve() が scripts/scope.ts の TRANSLATED を見て機械的に行うので、
 * ここでは本家と同じ内部リンクを書いておけばよい。翻訳スコープを増やしたときに
 * サイドバーを直し忘れる、という事故が起きない。
 *
 * 本家との違いは2点だけ。
 * - CLI リファレンス（182ページ）は本家では Rust 側の生成物から展開しているが、
 *   ここでは原文サイトへの1リンクに集約する
 * - 翻訳済みページのラベルは日本語（scripts/scope.ts の title と一致させる）
 */

import { isTranslated, upstreamUrl } from "../../scripts/scope";

export type SidebarItem = {
  text: string;
  link?: string;
  collapsed?: boolean;
  items?: SidebarItem[];
};

/** 未翻訳ページへのリンクを原文サイトに向け、ラベルに「（原文）」を付ける */
function resolve(items: SidebarItem[]): SidebarItem[] {
  return items.map((item) => {
    const next: SidebarItem = { ...item };
    if (next.link?.startsWith("/") && !isTranslated(next.link)) {
      next.link = upstreamUrl(next.link);
      next.text = `${next.text}（原文）`;
    }
    if (next.items) next.items = resolve(next.items);
    return next;
  });
}

const tree: SidebarItem[] = [
  {
    text: "ガイド",
    items: [
      { text: "Demo", link: "/demo" },
      { text: "はじめに", link: "/getting-started" },
      { text: "ウォークスルー", link: "/walkthrough" },
      { text: "mise のインストール", link: "/installing-mise" },
      { text: "IDE との連携", link: "/ide-integration" },
      { text: "継続的インテグレーション", link: "/continuous-integration" },
    ],
  },
  {
    text: "設定",
    items: [
      { text: "mise.toml", link: "/configuration" },
      { text: "Settings", link: "/configuration/settings" },
      { text: "設定環境", link: "/configuration/environments" },
    ],
  },
  {
    text: "開発ツール",
    items: [
      { text: "開発ツールの概要", link: "/dev-tools/" },
      { text: "asdf との比較", link: "/dev-tools/comparison-to-asdf" },
      { text: "shim", link: "/dev-tools/shims" },
      { text: "ツールのエイリアス", link: "/dev-tools/aliases" },
      { text: "Tool Stubs", link: "/dev-tools/tool-stubs" },
      { text: "Registry", link: "/registry" },
      { text: "GitHub Tokens", link: "/dev-tools/github-tokens" },
      { text: "mise.lock Lockfile", link: "/dev-tools/mise-lock" },
      { text: "Security", link: "/security" },
      { text: "OCI Images (experimental)", link: "/dev-tools/mise-oci" },
      { text: "Deps", link: "/dev-tools/deps" },
      { text: "Backend Architecture", link: "/dev-tools/backend_architecture" },
      {
        text: "Core tools",
        link: "/core-tools",
        collapsed: true,
        items: [
          { text: "Bun", link: "/lang/bun" },
          { text: "Deno", link: "/lang/deno" },
          { text: "Elixir", link: "/lang/elixir" },
          { text: "Erlang", link: "/lang/erlang" },
          { text: "Go", link: "/lang/go" },
          { text: "Java", link: "/lang/java" },
          { text: "Node.js", link: "/lang/node" },
          { text: "Python", link: "/lang/python" },
          { text: "Ruby", link: "/lang/ruby" },
          { text: "Rust", link: "/lang/rust" },
          { text: "Swift", link: "/lang/swift" },
          { text: "Zig", link: "/lang/zig" },
        ],
      },
      {
        text: "Backends",
        link: "/dev-tools/backends/",
        collapsed: true,
        items: [
          { text: "aqua", link: "/dev-tools/backends/aqua" },
          { text: "asdf", link: "/dev-tools/backends/asdf" },
          { text: "cargo", link: "/dev-tools/backends/cargo" },
          { text: "conda", link: "/dev-tools/backends/conda" },
          { text: "dotnet", link: "/dev-tools/backends/dotnet" },
          { text: "forgejo", link: "/dev-tools/backends/forgejo" },
          { text: "gem", link: "/dev-tools/backends/gem" },
          { text: "github", link: "/dev-tools/backends/github" },
          { text: "gitlab", link: "/dev-tools/backends/gitlab" },
          { text: "go", link: "/dev-tools/backends/go" },
          { text: "http", link: "/dev-tools/backends/http" },
          { text: "npm", link: "/dev-tools/backends/npm" },
          { text: "pipx", link: "/dev-tools/backends/pipx" },
          { text: "pkgx", link: "/dev-tools/backends/pkgx" },
          { text: "spm", link: "/dev-tools/backends/spm" },
          { text: "ubi", link: "/dev-tools/backends/ubi" },
          { text: "vfox", link: "/dev-tools/backends/vfox" },
        ],
      },
    ],
  },
  {
    text: "Bootstrap",
    items: [
      { text: "Overview", link: "/bootstrap" },
      { text: "Remote Hosts", link: "/bootstrap/remote" },
      {
        text: "Bootstrap Packages",
        link: "/bootstrap/packages/",
        collapsed: true,
        items: [
          { text: "apk", link: "/bootstrap/packages/apk" },
          { text: "apt", link: "/bootstrap/packages/apt" },
          { text: "dnf", link: "/bootstrap/packages/dnf" },
          { text: "pacman", link: "/bootstrap/packages/pacman" },
          { text: "brew", link: "/bootstrap/packages/brew" },
          { text: "mas", link: "/bootstrap/packages/mas" },
          { text: "Package Plugins", link: "/bootstrap/packages/plugins" },
        ],
      },
      { text: "Linux Users and Groups", link: "/bootstrap/accounts" },
      { text: "System Files", link: "/bootstrap/files" },
      { text: "System Services", link: "/bootstrap/services" },
      { text: "Docker Compose Projects", link: "/bootstrap/compose" },
      { text: "Secret Inputs", link: "/bootstrap/secrets" },
      { text: "Repos", link: "/bootstrap/repos" },
      { text: "Dotfiles", link: "/dotfiles" },
      { text: "Shell Activation", link: "/bootstrap/shell" },
      { text: "macOS Defaults", link: "/bootstrap/macos-defaults" },
      { text: "launchd", link: "/bootstrap/launchd" },
      { text: "systemd", link: "/bootstrap/systemd" },
      { text: "User Login Shell", link: "/bootstrap/user" },
    ],
  },
  {
    text: "環境",
    items: [
      { text: "環境変数", link: "/environments/" },
      { text: "Shell Aliases", link: "/shell-aliases" },
      {
        text: "Secrets",
        link: "/environments/secrets/",
        collapsed: true,
        items: [
          { text: "sops", link: "/environments/secrets/sops" },
          { text: "age", link: "/environments/secrets/age" },
        ],
      },
      { text: "Hooks", link: "/hooks" },
      { text: "direnv", link: "/direnv" },
    ],
  },
  {
    text: "タスク",
    items: [
      { text: "タスクの概要", link: "/tasks/" },
      { text: "Task Architecture", link: "/tasks/architecture" },
      { text: "タスクの実行", link: "/tasks/running-tasks" },
      { text: "TOML タスク", link: "/tasks/toml-tasks" },
      { text: "ファイルタスク", link: "/tasks/file-tasks" },
      { text: "Task Arguments", link: "/tasks/task-arguments" },
      { text: "Task Configuration", link: "/tasks/task-configuration" },
      { text: "Remote Cache Protocol", link: "/tasks/remote-cache-protocol" },
      { text: "Task Templates", link: "/tasks/templates" },
      { text: "Monorepo Tasks", link: "/tasks/monorepo" },
      { text: "Sandboxing", link: "/sandboxing" },
    ],
  },
  {
    text: "プラグイン",
    items: [
      { text: "Plugin Overview", link: "/plugins" },
      { text: "Using Plugins", link: "/plugin-usage" },
      {
        text: "Backend Plugin Development",
        link: "/backend-plugin-development",
      },
      { text: "Tool Plugin Development", link: "/tool-plugin-development" },
      {
        text: "Environment Plugin Development",
        link: "/env-plugin-development",
      },
      {
        text: "Package Plugin Development",
        link: "/package-plugin-development",
      },
      { text: "Plugin Lua Modules", link: "/plugin-lua-modules" },
      { text: "Plugin Publishing", link: "/plugin-publishing" },
      { text: "asdf (Legacy) Plugins", link: "/asdf-legacy-plugins" },
    ],
  },
  {
    text: "mise について",
    items: [
      { text: "About mise", link: "/about" },
      { text: "mise-en-place: The Song", link: "/mise-en-place" },
      { text: "Glossary", link: "/glossary" },
      { text: "よくある質問", link: "/faq" },
      { text: "トラブルシューティング", link: "/troubleshooting" },
      { text: "Errors", link: "/errors" },
      { text: "Tips & Tricks", link: "/tips-and-tricks" },
      {
        text: "Cookbook",
        link: "/mise-cookbook/",
        collapsed: true,
        items: [
          { text: "C++", link: "/mise-cookbook/cpp" },
          { text: "Docker", link: "/mise-cookbook/docker" },
          { text: "Node", link: "/mise-cookbook/nodejs" },
          { text: "Ruby", link: "/mise-cookbook/ruby" },
          { text: "Terraform", link: "/mise-cookbook/terraform" },
          { text: "Python", link: "/mise-cookbook/python" },
          { text: "Presets", link: "/mise-cookbook/presets" },
          { text: "Shell tricks", link: "/mise-cookbook/shell-tricks" },
        ],
      },
      { text: "Team", link: "/team" },
      { text: "Contributing", link: "/contributing" },
      { text: "External Resources", link: "/external-resources" },
    ],
  },
  {
    text: "高度な使い方",
    items: [
      { text: "Architecture", link: "/architecture" },
      { text: "Paranoid", link: "/paranoid" },
      { text: "Templates", link: "/templates" },
      { text: "URL Replacements", link: "/url-replacements" },
      { text: "Model Context Protocol", link: "/mcp" },
      { text: "Directory Structure", link: "/directories" },
      { text: "Cache Behavior", link: "/cache-behavior" },
    ],
  },
  {
    text: "CLI リファレンス",
    items: [
      // 本家では Rust の usage spec から 182 ページを生成している。
      // 追従コストが高く、原文の方が常に正確なので原文サイトへ 1 本だけ通す。
      { text: "CLI Reference", link: "/cli/" },
    ],
  },
];

export const sidebar: SidebarItem[] = resolve(tree);
