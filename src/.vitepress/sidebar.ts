/**
 * サイドバー。本家の docs/.vitepress/sidebar.ts の構造をデータとして移植したもの。
 *
 * 未翻訳ページは削除せず、原文サイトの絶対 URL に向けて「（原文）」を付ける。
 * その書き換えは resolve() が scripts/scope.ts の TRANSLATED を見て機械的に行うので、
 * ここでは本家と同じ内部リンクを書いておけばよい。翻訳スコープを増やしたときに
 * サイドバーを直し忘れる、という事故が起きない。
 *
 * 本家との違いは2点だけ。
 * - CLI リファレンスは本家では Rust 側の生成物から展開しているが、
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
    text: "まずはここから",
    items: [
      { text: "はじめに", link: "/getting-started" },
      { text: "mise のインストール", link: "/installing-mise" },
      { text: "Shell setup", link: "/shell-setup" },
      { text: "既存のプロジェクトで mise を使う", link: "/walkthrough" },
      { text: "エディターと IDE", link: "/ide-integration" },
      { text: "継続的インテグレーション", link: "/continuous-integration" },
      { text: "Docker", link: "/mise-cookbook/docker" },
      { text: "AI assistants (MCP)", link: "/mcp" },
    ],
  },
  {
    text: "開発ツール",
    collapsed: true,
    items: [
      { text: "開発ツールの概要", link: "/dev-tools/" },
      {
        text: "Version requests and version files",
        link: "/dev-tools/versions",
      },
      { text: "Registry", link: "/registry" },
      {
        text: "Backends",
        link: "/dev-tools/backends/",
        collapsed: true,
        items: [
          { text: "aqua", link: "/dev-tools/backends/aqua" },
          { text: "asdf (legacy)", link: "/dev-tools/backends/asdf" },
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
          {
            text: "packslip",
            link: "/dev-tools/backends/packslip",
            collapsed: true,
            items: [
              {
                text: "Verification and policy",
                link: "/dev-tools/packslip-verification",
              },
              {
                text: "Man pages, completions, and skills",
                link: "/dev-tools/packslip-resources",
              },
            ],
          },
          { text: "pypi", link: "/dev-tools/backends/pypi" },
          { text: "s3", link: "/dev-tools/backends/s3" },
          { text: "spinel (experimental)", link: "/dev-tools/backends/spinel" },
          { text: "spm", link: "/dev-tools/backends/spm" },
          { text: "ubi (deprecated)", link: "/dev-tools/backends/ubi" },
          { text: "vfox", link: "/dev-tools/backends/vfox" },
        ],
      },
      { text: "shim", link: "/dev-tools/shims" },
      { text: "ツールのエイリアス", link: "/dev-tools/aliases" },
      { text: "Tool stubs", link: "/dev-tools/tool-stubs" },
      { text: "Self-updating tools", link: "/dev-tools/self-updating-tools" },
      {
        text: "Lockfile (mise.lock)",
        link: "/dev-tools/mise-lock",
        collapsed: true,
        items: [
          {
            text: "mise.lock reference",
            link: "/dev-tools/mise-lock-reference",
          },
        ],
      },
      { text: "Git provider tokens", link: "/dev-tools/github-tokens" },
      { text: "System installs", link: "/dev-tools/system-installs" },
      { text: "OCI images (experimental)", link: "/dev-tools/mise-oci" },
      {
        text: "Identity install layout (experimental)",
        link: "/dev-tools/install-layout",
      },
      { text: "asdf からの移行", link: "/dev-tools/comparison-to-asdf" },
    ],
  },
  {
    text: "言語",
    collapsed: true,
    items: [
      { text: "Core tools overview", link: "/core-tools" },
      { text: "Bun", link: "/lang/bun" },
      { text: "Deno", link: "/lang/deno" },
      { text: ".NET", link: "/lang/dotnet" },
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
    text: "環境",
    collapsed: true,
    items: [
      { text: "環境変数", link: "/environments/" },
      {
        text: "Secrets",
        link: "/environments/secrets/",
        collapsed: true,
        items: [
          { text: "fnox (experimental)", link: "/environments/secrets/fnox" },
          { text: "SOPS files", link: "/environments/secrets/sops" },
          {
            text: "age values (experimental)",
            link: "/environments/secrets/age",
          },
        ],
      },
      { text: "Shell aliases", link: "/shell-aliases" },
      { text: "Hooks", link: "/hooks" },
      { text: "Migrating from direnv", link: "/direnv" },
    ],
  },
  {
    text: "タスク",
    collapsed: true,
    items: [
      { text: "タスクの概要", link: "/tasks/" },
      { text: "TOML タスク", link: "/tasks/toml-tasks" },
      { text: "ファイルタスク", link: "/tasks/file-tasks" },
      { text: "Task arguments", link: "/tasks/task-arguments" },
      { text: "タスクの実行", link: "/tasks/running-tasks" },
      { text: "Task discovery and precedence", link: "/tasks/task-discovery" },
      { text: "Dependencies and execution order", link: "/tasks/architecture" },
      { text: "Task templates", link: "/tasks/templates" },
      {
        text: "Task caching",
        link: "/tasks/caching",
        collapsed: true,
        items: [
          { text: "Remote task cache", link: "/tasks/remote-cache" },
          {
            text: "Remote cache protocol",
            link: "/tasks/remote-cache-protocol",
          },
        ],
      },
      {
        text: "Monorepo tasks",
        link: "/tasks/monorepo",
        collapsed: true,
        items: [
          {
            text: "Workspace project graph (experimental)",
            link: "/tasks/workspace-graph",
          },
        ],
      },
      { text: "Project dependencies (experimental)", link: "/dev-tools/deps" },
      { text: "OpenTelemetry (experimental)", link: "/tasks/opentelemetry" },
      {
        text: "Task configuration reference",
        link: "/tasks/task-configuration",
      },
    ],
  },
  {
    text: "デーモン（実験的）",
    collapsed: true,
    items: [
      { text: "Overview", link: "/daemons" },
      {
        text: "Set up a development stack",
        link: "/daemons/development-stack",
      },
      { text: "Service presets", link: "/daemons/presets" },
      { text: "Ports, URLs, and worktrees", link: "/daemons/worktrees" },
      { text: "Share daemons across projects", link: "/daemons/sharing" },
      { text: "Data and cleanup", link: "/daemons/data" },
    ],
  },
  {
    text: "Bootstrap",
    collapsed: true,
    items: [
      { text: "Overview", link: "/bootstrap" },
      { text: "Set up a machine", link: "/bootstrap/setup" },
      {
        text: "Bootstrap from a repository",
        link: "/bootstrap/from-repository",
      },
      { text: "Machine modules", link: "/bootstrap/modules" },
      {
        text: "Remote hosts",
        link: "/bootstrap/remote",
        collapsed: true,
        items: [{ text: "GitHub relay (mise ssh)", link: "/bootstrap/github-relay" }],
      },
      {
        text: "Packages",
        link: "/bootstrap/packages/",
        collapsed: true,
        items: [
          { text: "apk", link: "/bootstrap/packages/apk" },
          { text: "apt", link: "/bootstrap/packages/apt" },
          { text: "aur", link: "/bootstrap/packages/aur" },
          { text: "brew", link: "/bootstrap/packages/brew" },
          { text: "brew-cask", link: "/bootstrap/packages/brew-cask" },
          { text: "dnf", link: "/bootstrap/packages/dnf" },
          { text: "flatpak", link: "/bootstrap/packages/flatpak" },
          { text: "macos-app", link: "/bootstrap/packages/macos-app" },
          { text: "mas", link: "/bootstrap/packages/mas" },
          { text: "nix", link: "/bootstrap/packages/nix" },
          { text: "pacman", link: "/bootstrap/packages/pacman" },
          { text: "scoop", link: "/bootstrap/packages/scoop" },
          { text: "snap", link: "/bootstrap/packages/snap" },
          { text: "winget", link: "/bootstrap/packages/winget" },
          { text: "zypper", link: "/bootstrap/packages/zypper" },
          {
            text: "Package manager plugins",
            link: "/bootstrap/packages/plugins",
          },
        ],
      },
      {
        text: "Host setup",
        items: [
          { text: "Linux users and groups", link: "/bootstrap/accounts" },
          { text: "System files and directories", link: "/bootstrap/files" },
          { text: "Secret inputs", link: "/bootstrap/secrets" },
          { text: "Services", link: "/bootstrap/services" },
          { text: "Linux firewall", link: "/bootstrap/firewall" },
          { text: "Docker Compose projects", link: "/bootstrap/compose" },
        ],
      },
      {
        text: "Your environment",
        items: [
          { text: "Git repositories", link: "/bootstrap/repos" },
          {
            text: "Shell activation and login shell",
            link: "/bootstrap/shell",
          },
        ],
      },
      {
        text: "Platform-specific",
        items: [
          { text: "macOS defaults", link: "/bootstrap/macos-defaults" },
          { text: "macOS LaunchAgents", link: "/bootstrap/launchd" },
          { text: "systemd user units", link: "/bootstrap/systemd" },
        ],
      },
    ],
  },
  {
    text: "Dotfiles",
    collapsed: true,
    items: [
      { text: "Overview", link: "/dotfiles" },
      { text: "Managed files", link: "/dotfiles/managed" },
      { text: "Groups", link: "/dotfiles/groups" },
      { text: "Edit part of a file", link: "/dotfiles/edits" },
      {
        text: "History",
        link: "/dotfiles/history",
        collapsed: true,
        items: [
          { text: "Sync across machines", link: "/dotfiles/sync" },
          { text: "Encrypted files", link: "/dotfiles/encryption" },
        ],
      },
      { text: "Dotfiles reference", link: "/dotfiles/reference" },
    ],
  },
  {
    text: "設定",
    collapsed: true,
    items: [
      { text: "mise.toml", link: "/configuration" },
      { text: "設定環境", link: "/configuration/environments" },
      { text: "Settings", link: "/configuration/settings" },
      { text: "Config variables", link: "/configuration/vars" },
      { text: "Tera templates", link: "/templates" },
      {
        text: "MISE_* variables",
        link: "/configuration/environment-variables",
      },
      { text: "Directories", link: "/directories" },
      { text: "Caches", link: "/cache-behavior" },
      { text: "URL replacements", link: "/url-replacements" },
      {
        text: "Project diagnostics",
        link: "/configuration/project-diagnostics",
      },
    ],
  },
  {
    text: "セキュリティ",
    collapsed: true,
    items: [
      { text: "Security overview", link: "/security" },
      { text: "Paranoid mode", link: "/paranoid" },
      { text: "Sandboxing", link: "/sandboxing" },
    ],
  },
  {
    text: "プラグイン",
    collapsed: true,
    items: [
      { text: "Plugins", link: "/plugins" },
      {
        text: "Writing plugins",
        items: [
          { text: "Tool plugins", link: "/tool-plugin-development" },
          { text: "Backend plugins", link: "/backend-plugin-development" },
          { text: "Environment plugins", link: "/env-plugin-development" },
          {
            text: "Package manager plugins",
            link: "/package-plugin-development",
          },
          { text: "Plugin Lua reference", link: "/plugin-lua-modules" },
          { text: "Publishing plugins", link: "/plugin-publishing" },
        ],
      },
      { text: "asdf plugins (legacy)", link: "/asdf-legacy-plugins" },
    ],
  },
  {
    text: "ヘルプ",
    collapsed: true,
    items: [
      { text: "トラブルシューティング", link: "/troubleshooting" },
      { text: "Error messages", link: "/errors" },
      { text: "よくある質問", link: "/faq" },
      { text: "Glossary", link: "/glossary" },
    ],
  },
  {
    text: "クックブック",
    collapsed: true,
    items: [
      { text: "Cookbook overview", link: "/mise-cookbook/" },
      { text: "Tips and tricks", link: "/tips-and-tricks" },
      { text: "Bazel", link: "/mise-cookbook/bazel" },
      { text: "C++ and CMake", link: "/mise-cookbook/cpp" },
      { text: "Neovim", link: "/mise-cookbook/neovim" },
      { text: "Node.js", link: "/mise-cookbook/nodejs" },
      { text: "Python", link: "/mise-cookbook/python" },
      { text: "Ruby on Rails", link: "/mise-cookbook/ruby" },
      { text: "Scaffolding tasks", link: "/mise-cookbook/presets" },
      { text: "Terraform and OpenTofu", link: "/mise-cookbook/terraform" },
    ],
  },
  {
    text: "mise について",
    collapsed: true,
    items: [
      { text: "About mise", link: "/about" },
      { text: "Releases", link: "/releases" },
      { text: "Contact", link: "/contact" },
      { text: "Demo", link: "/demo" },
      { text: "mise run: the song", link: "/mise-en-place" },
      { text: "External resources", link: "/external-resources" },
    ],
  },
  {
    text: "コントリビュート",
    collapsed: true,
    items: [
      { text: "Contributing", link: "/contributing" },
      { text: "Adding tools to the registry", link: "/contributing/registry" },
      { text: "Codebase architecture", link: "/architecture" },
      { text: "Packaging mise", link: "/packaging" },
    ],
  },
  {
    text: "CLI リファレンス",
    collapsed: true,
    items: [
      // 本家では Rust の usage spec から CLI の全ページを生成している。
      // 追従コストが高く、原文の方が常に正確なので原文サイトへ 1 本だけ通す。
      { text: "CLI overview", link: "/cli/" },
    ],
  },
];

export const sidebar: SidebarItem[] = resolve(tree);
