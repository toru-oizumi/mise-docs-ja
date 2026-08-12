---
title: mise.toml
upstreamPath: docs/configuration.md
upstreamUrl: https://mise.jdx.dev/configuration.html
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

# 設定 {#configuration}

`mise.toml` ファイル、環境変数、さまざまな設定オプションを使って、開発環境を管理するために mise をプロジェクト向けに設定する方法を説明します。

## `mise.toml` {#mise-toml}

`mise.toml` は mise の設定ファイルです。以下のいずれかのファイルパスに置くことができます（優先順位の高い順に並んでおり、上にあるものが下にあるものの設定を上書きします）。

- `mise.local.toml` - ローカル設定用。バージョン管理にコミットすべきではありません
- `mise.toml`
- `mise/config.toml`
- `.mise/config.toml`
- `.config/mise.toml` - 設定ファイルを共通のディレクトリにまとめる場合に使用します
- `.config/mise/config.toml`
- `.config/mise/conf.d/*.toml` - このディレクトリ内のすべてのファイルがアルファベット順に読み込まれます

::: tip
[`mise cfg`（原文）](https://mise.jdx.dev/cli/config.html) を実行すると、お使いの環境で mise がどの順序でファイルを読み込んでいるかを確認できます。これは、mise のルールを自分で解読するよりもずっと簡単な場合が多いです。
:::

補足:

- `mise` で始まるパスはドットファイルにできます。例えば `.mise.toml` や `.mise/config.toml` です。
- このリストには [設定環境](/configuration/environments) は含まれていません。設定環境を使うと、`mise.development.toml` のような環境固有の設定ファイルを利用できます（`MISE_ENV=development` で設定します）。`mise.windows.toml` や `mise.macos-arm64.toml` のようなプラットフォーム固有の環境は、[`auto_env` 設定項目](/configuration/environments.html#platform-environments) で自動的に有効化できます。
- これらのパスとその優先順位に関する実際のコードは、[`src/config/mod.rs` 内の `LOCAL_CONFIG_FILENAMES`](https://github.com/jdx/mise/blob/main/src/config/mod.rs) を参照してください。簡潔にするため、一部の旧来のパスはここには記載していません。

## 設定の階層 {#configuration-hierarchy}

mise は、複数のソースから設定項目をマージする高度な階層的設定システムを採用しています。この階層を理解することで、開発環境を効果的に整理できます。

### 設定のマージがどのように機能するか {#how-configuration-merging-works}

これらのファイルは上位のディレクトリへ再帰的に探索されます。そのため `~/src/work/myproj/mise.toml` ファイルがある場合、そこで定義された内容が
`~/src/work/mise.toml` や `~/.config/mise.toml` で設定された内容を上書きします。設定内容はマージされます。

### 設定の解決プロセス {#configuration-resolution-process}

mise が設定を必要とするとき、以下のプロセスに従います。

1. 現在の場所からルート（または `MISE_CEILING_PATHS`）まで**ディレクトリツリーを上へたどります**
2. その途中で見つかったすべての設定ファイルを**収集します**
3. より具体的な（現在のディレクトリに近い）設定項目が、より広範な設定項目を上書きする形で、**順番にマージします**
4. `MISE_ENV` が設定されている場合、`mise.dev.toml` のような**環境固有の設定を適用します**

### 設定階層の可視化 {#visual-configuration-hierarchy}

```
/
├── etc/mise/                         # System-wide config (lowest precedence)
│   ├── conf.d/*.toml                 # System fragments, loaded alphabetically
│   ├── config.toml                   # System defaults
│   └── config.<env>.toml             # Env-specific system config (MISE_ENV or -E)
└── home/user/
    ├── .config/mise/
    │   ├── conf.d/*.toml             # User fragments, loaded alphabetically
    │   ├── config.toml               # Global user config
    │   ├── config.<env>.toml         # Env-specific user config
    │   ├── config.local.toml         # User-local overrides
    │   └── config.<env>.local.toml   # Env-specific user-local overrides
    └── work/
        ├── mise.toml                 # Work-wide settings
        └── myproject/
            ├── mise.local.toml       # Local overrides (git-ignored)
            ├── mise.toml             # Project config
            ├── mise.<env>.toml       # Env-specific project config
            ├── mise.<env>.local.toml # Env-specific project local overrides
            └── backend/
                └── mise.toml         # Service-specific config (highest precedence)
```

### セクションごとのマージの振る舞い {#merge-behavior-by-section}

設定のセクションによって、マージの方法は異なります。

**ツール**（`[tools]`）: 追加的で上書きされる

```toml
# Global: node@18, python@3.11
# Project: node@20, go@1.21
# Result: node@20, python@3.11, go@1.21
```

**環境変数**（`[env]`）: 追加的で上書きされる

```toml
# Global: NODE_ENV=development
# Project: NODE_ENV=production, API_URL=localhost
# Result: NODE_ENV=production, API_URL=localhost
```

**タスク**（`[tasks]`）: タスクごとに完全に置き換えられる

```toml
# Global: [tasks.test] = "npm test"
# Project: [tasks.test] = "yarn test"
# Result: "yarn test" (completely replaces global)
```

**設定項目**（`[settings]`）: 追加的で上書きされる

```toml
# Global: experimental = true
# Project: jobs = 4
# Result: experimental = true, jobs = 4
```

::: tip
`mise config` を実行すると、mise が優先順位の順に読み込んだファイルを確認できます。
:::

### 書き込み操作の対象ファイル {#target-file-for-write-operations}

[`mise use`（原文）](https://mise.jdx.dev/cli/use.html)、[`mise set`（原文）](https://mise.jdx.dev/cli/set.html)、[`mise unuse`（原文）](https://mise.jdx.dev/cli/unuse.html) のようなコマンドが設定ファイルに書き込む必要がある場合、**最も優先順位の高いディレクトリの中で、最も優先順位の低いファイル**を使用します。つまり:

- `mise.toml` と `mise.local.toml` の両方が存在する場合、書き込みは `mise.toml` に対して行われます
- `mise.toml` と `mise.production.toml` の両方が存在する場合、書き込みは `mise.toml` に対して行われます
- `mise.local.toml` のみが存在する場合、書き込みは `mise.local.toml` に対して行われます

この振る舞いにより、共有設定（`mise.toml`）はデフォルトで更新される一方、ローカルの上書き設定（`mise.local.toml`）や環境固有の設定は、明示的に指定しない限り変更されないことが保証されます。

::: info 例

```bash
# With both mise.toml and mise.local.toml present:
$ mise use node@22              # writes to mise.toml
$ mise use --env local node@20  # writes to mise.local.toml
$ mise set NODE_ENV=production  # writes to mise.toml
```

:::

典型的な `mise.toml` は次のようになります。

```toml
[tools]
node = '24'
python = '3.12'

[env]
NODE_ENV = 'development'

[tasks.dev]
run = 'npm run dev'

[tasks.test]
run = 'pytest'
```

`mise.toml` ファイルは階層的です。現在のディレクトリにあるファイルの設定は、親ディレクトリにある競合する設定を
上書きします。例えば、`~/src/myproj/mise.toml` が以下のように定義しているとします。

```toml
[tools]
node = '20'
python = '3.10'
```

そして `~/src/myproj/backend/mise.toml` が以下のように定義しているとします。

```toml
[tools]
node = '18'
ruby = '3.1'
```

この場合、`~/src/myproj/backend` の中では、`node` は `18`、`python` は `3.10`、`ruby`
は `3.1` になります。有効なバージョンは `mise ls --current` で確認できます。

`.mise.production.toml` のような環境固有の設定ファイルを持つこともできます。詳細は
[設定環境](/configuration/environments) を参照してください。

### `[tools]` - Dev tools {#tools-dev-tools}

[ツール](/dev-tools/) を参照してください。バージョンの指定に加えて、各ツールのエントリには以下のようなオプションを含められます。

- `os`: インストールを特定のオペレーティングシステムに限定します
- `depends`: この設定内の他のツールに対するインストール順序のみを指定します。vfox プラグインのフックの依存関係はプラグインの `metadata.lua` に記述します（[ツールの依存関係](/dev-tools/#tool-dependencies) を参照）
- `install_env`: インストール時、およびツールレベルの `postinstall` 実行時に使用される環境変数です
- `postinstall`: そのツールのインストールが完了した後に実行するコマンドです

例:

```toml
[tools]
node = { version = "22", postinstall = "corepack enable" }
```

### `[env]` - Arbitrary Environment Variables {#env-arbitrary-environment-variables}

[環境変数](/environments/) を参照してください。

### `[tasks.*]` - Run files or shell scripts {#tasks-run-files-or-shell-scripts}

[タスク](/tasks/) を参照してください。

### `[settings]` - Mise Settings {#settings-mise-settings}

設定項目の全リストは [設定（原文）](https://mise.jdx.dev/configuration/settings.html) を参照してください。

### `[plugins]` - Specify Custom Plugin Repository URLs {#plugins-specify-custom-plugin-repository-urls}

`[plugins]` を使うと、プラグインのショートネームを追加・変更できます。これは_新規_のプラグインインストールにのみ
影響する点に注意してください。既存のプラグインは任意の URL を使用できます。

```toml
[plugins]
elixir = "https://github.com/my-org/mise-elixir.git"
node = "https://github.com/my-org/mise-node.git#DEADBEEF" # supports specific gitref
"vfox-backend:myplugin" = "https://github.com/jdx/vfox-npm"
```

プラグインの種類を示すプレフィックス（例: `asdf:`、`vfox:`、`vfox-backend:`）は省略可能です。
省略した場合、mise はまずプラグインをクローンし、その後インストールされたプラグインのファイルから
プラグインの種類を検出します。

特定の URL からプラグインを一度だけインストールしたい場合は、`mise plugin install <NAME> <GIT_URL>`
を使う方がよいでしょう。プラグインの場所やリビジョンをプロジェクトの他の開発者と共有したい場合は、
このセクションを `mise.toml` に追加してください。

ローカルのプラグインディレクトリもサポートされています。絶対パスと `~/` で始まるパスはそのまま使用されます。
`./` や `../` で始まる明示的な相対パスは、それを宣言したファイルの設定ルートからの相対パスとして解決されます。

```toml
[plugins]
example = "./plugins/mise-example"
```

ローカルプラグインは `mise plugins link` と同様に mise のプラグインディレクトリへシンボリックリンクされるため、
ソースディレクトリへの変更は即座に反映されます。リモートのエントリと同様、`[plugins]` は新規インストールにのみ
影響します。既存のプラグインを設定済みのローカルソースに置き換えるには
`mise plugins install --force <NAME>` を実行してください。`file://` ソースは Git リポジトリのままで、
クローンされます。

これは非推奨の `settings.shorthands_file` / `MISE_SHORTHANDS_FILE` の仕組みを置き換えるものです。別の TOML
ファイルの代わりに、同じ `shortname = "backend-or-url"` の形式のエントリを `[plugins]` の下に記述してください。

### `[tool_alias]` - Tool version aliases {#tool-alias-tool-version-aliases}

::: tip
`[alias]` は `[shell_alias]` と区別するため `[tool_alias]` に名称が変更されました。
古い `[alias]` キーも引き続き動作しますが、非推奨です。
:::

以下の設定は、`mise install node@my_custom_node` を実行すると node-20.x がインストールされるようにします。
これは [プラグイン](/dev-tools/aliases.md) で指定することもできます。
エイリアスを追加すると、シンボリックリンクも追加される点に注意してください。この場合は次のようになります。

```sh
~/.local/share/mise/installs/node/20 -> ./20.x.x
```

```toml
[tool_alias.node.versions]
my_custom_node = '20'
```

### `[shell_alias]` - Shell aliases {#shell-alias-shell-aliases}

ディレクトリに入ったときに設定され、出るときに解除されるシェルエイリアスを定義します。

```toml
[shell_alias]
ll = "ls -la"
gs = "git status"
dev = "npm run dev"
```

これらは環境変数と同様に動作します。つまり、現在のディレクトリに基づいて動的に設定されます。
詳細は [シェルエイリアス（原文）](https://mise.jdx.dev/shell-aliases.html) を参照してください。

### Minimum mise version {#minimum-mise-version}

設定ファイルが必要とする、サポート対象の mise の最小バージョンを指定します。

ハード最小値（満たさない場合はエラーになる）またはソフト最小値（警告して続行する）を設定できます。

```toml
# (equivalent to hard)
min_version = '2024.11.1'

# new object form
min_version = { hard = '2024.11.1' }

# soft recommendation
min_version = { soft = '2024.11.1' }

# both
min_version = { hard = '2024.11.1', soft = '2024.9.0' }
```

ソフト最小値を満たさない場合、mise は警告を表示し（利用可能であれば）自己更新の手順を表示します。ハード最小値を満たさない場合、mise はエラーになり、自己更新の手順を表示します。

`min_version` を使って、プロジェクトがサポートする最も古い mise のバージョンを伝えましょう。一般に、mise は
時間とともに変化する外部のレジストリやバックエンドと連携するため、ユーザーは mise を最新の状態に保つべきです。
プロジェクトや組織は、ユーザーを特定の mise の実行ファイルに固定するよりも、最小バージョン要件を優先するべきです。
ユーザーを1つの mise のバージョンに固定することは、一般的には推奨されません。ユーザーを古いバージョンに留めることは、
`apt update` や `brew update` がパッケージメタデータを更新するのを妨げるのと同じです。非推奨の警告が隠れてしまい、
アップストリームとの連携が古くなったまま放置される可能性があります。

### Monorepo root {#monorepo-root}

設定ファイルをモノレポのルートとしてマークすると、タスクのターゲットパス記法が有効になります。

```toml
monorepo_root = true
```

有効にすると:

- サブディレクトリ内のタスクは、名前空間付きのパス（例: `//projects/frontend:build`）で利用できます
- サブディレクトリのタスクは、親の設定にあるツールを使用します
- タスクは必要なときにのみ読み込まれます（例: タスクを実行するとき、または `mise tasks ls --all` を使うとき）
- ルートが信頼されている場合、すべての子孫の設定ファイルは**暗黙的に信頼されます**
- 各サブディレクトリの設定を個別に信頼する必要がなくなります

詳細な使い方と例については [モノレポタスク（原文）](https://mise.jdx.dev/tasks/monorepo.html) を参照してください。

### `mise.toml` schema {#mise-toml-schema}

- `mise.toml` の JSON スキーマは [schema/mise.json](https://github.com/jdx/mise/blob/main/schema/mise.json) または <https://mise.jdx.dev/schema/mise.json> にあります。
- 一部のエディタはこれを自動的に読み込み、`mise.toml` ファイルを編集する際に自動補完とバリデーションを提供します（[VSCode](https://code.visualstudio.com/docs/languages/json#_json-schemas-and-settings)、[IntelliJ](https://www.jetbrains.com/help/idea/json.html#ws_json_using_schemas)、[neovim](https://github.com/b0o/SchemaStore.nvim) など）。[JSON schema store](https://www.schemastore.org/) でも利用できます。
- `included tasks`（[タスクの設定（原文）](https://mise.jdx.dev/tasks/task-configuration.html) を参照）については、別のスキーマ <https://mise.jdx.dev/schema/mise-task.json> がある点に注意してください。

## グローバル設定: `~/.config/mise/config.toml` {#global-config-config-mise-config-toml}

mise は `~/.config/mise/config.toml` で設定できます。これはローカルの `mise.toml` と同様に動作しますが、すべてのディレクトリに適用されます。

ここではよく使われる設定項目のみを示しています。全リストと説明については [設定（原文）](https://mise.jdx.dev/configuration/settings.html) を参照してください。

```toml [~/.config/mise/config.toml]
[tools]
# global tool versions go here
# you can set these with `mise use -g`
node = 'lts'
python = ['3.10', '3.11']

[settings]
# read version files used by other version managers, such as .nvmrc
idiomatic_version_file_enable_tools = ['node']

trusted_config_paths = [
    '~/work/my-trusted-projects',
]

env_file = '.env' # load env vars from a dotenv file, see `MISE_ENV_FILE`

[settings.status]
show_env = false
show_tools = false

# "_" is a special key for information you'd like to put into mise.toml that mise will never parse
[_]
foo = "bar"
```

## システム設定: `/etc/mise/config.toml` {#system-config-etc-mise-config-toml}

`~/.config/mise/config.toml` と似ていますが、システム上のすべてのユーザーに適用されます。すべてのユーザーに対して
デフォルト値を設定するのに便利です。

## `.tool-versions` {#tool-versions}

`.tool-versions` ファイルは asdf の設定ファイルで、`mise.toml` と同様に mise で使用できます。柔軟性は `mise.toml`
に劣るため、代わりに `mise.toml` を使うことを推奨します。すでに多くの `.tool-versions` ファイルがある場合や、asdf
を使っているチームで作業している場合には便利です。

サポートされているすべての構文の例を以下に示します。

```text
node        20.0.0       # comments are allowed
ruby        3            # can be fuzzy version
shellcheck  latest       # also supports "latest"
jq          1.6
erlang      ref:master   # compile from vcs ref
go          prefix:1.19  # uses the latest 1.19.x version—needed in case "1.19" is an exact match
shfmt       path:./shfmt # use a custom runtime
node        lts          # use lts version of node (not supported by all plugins)

node        sub-2:lts      # subtract 2 from the resolved major version (e.g.: 20 becomes 18)
python      sub-0.1:latest # subtract 1 from the resolved minor version (e.g.: 3.11 becomes 3.10)
```

このファイル形式の詳細については [asdf のドキュメント](https://asdf-vm.com/manage/configuration.html#tool-versions) を参照してください。

## スコープ {#scopes}

`mise.toml` と `.tool-versions` はいずれも、バージョンの振る舞いを変更する「スコープ」をサポートしています。

- `ref:<SHA>` - vcs（通常は git）の ref からコンパイルします
- `prefix:<PREFIX>` - プレフィックスに一致する最新バージョンを使用します。Go では `1.20` は `1.20`
  に厳密一致するものしかマッチしませんが、`prefix:1.20` なら `1.20.1` や `1.20.2` などにもマッチするため便利です。
- `path:<PATH>` - 指定したパスにあるカスタムのコンパイル済みバージョンを使用します。用途の一例として、Homebrew
  のツールを再利用する場合があります（例: `path:/opt/homebrew/opt/node@20`）。
- `sub-<PARTIAL_VERSION>:<ORIG_VERSION>` - `ORIG_VERSION` を解決し、`PARTIAL_VERSION` の数値部分を対応する
  解決済みバージョンの各部分から減算し、その結果をバージョンのプレフィックスとして解決します。例えば、
  `sub-2:lts` は `lts` を解決し、そのメジャー部分から2を減算します（`20` は `18` になります）。一方、
  `sub-0.1:latest` は解決済みのマイナー部分から1を減算します（`3.11` は `3.10` になります）。これは数値の
  バージョン演算であり、N個前のリリースを求めるものではありません。

## idiomatic バージョンファイル {#idiomatic-version-files}

mise は asdf と同様に「idiomatic バージョンファイル（idiomatic version file）」をサポートしています。これは
`.node-version` や `.python-version` のような言語固有のファイルです。他の開発者に mise や asdf といった特定の
ツールの使用を強制することなく、プロジェクトのランタイムバージョンを設定するのに最適です。

これらはエイリアスをサポートしています。つまり、`lts/hydrogen` と書かれた `.nvmrc` ファイルを用意すれば、mise
と nvm の両方で機能します。サポートされている idiomatic バージョンファイルの一部を以下に示します。

<!-- mise:idiomatic-version-files:start -->

| プラグイン    | idiomatic ファイル                                                                                                                                                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| atmos         | `.atmos-version`                                                                                                                                                                                                                                                                                           |
| bun           | `.bun-version`, `package.json`                                                                                                                                                                                                                                                                             |
| chezmoi       | `.chezmoiversion`                                                                                                                                                                                                                                                                                          |
| cmake         | `CMakeLists.txt`                                                                                                                                                                                                                                                                                           |
| crystal       | `.crystal-version`                                                                                                                                                                                                                                                                                         |
| dagger        | `dagger.json`                                                                                                                                                                                                                                                                                              |
| deno          | `.deno-version`, `package.json`                                                                                                                                                                                                                                                                            |
| dotnet        | `global.json`                                                                                                                                                                                                                                                                                              |
| earthly       | `Earthfile`                                                                                                                                                                                                                                                                                                |
| elixir        | `.exenv-version`                                                                                                                                                                                                                                                                                           |
| go            | `.go-version`, `go.mod`                                                                                                                                                                                                                                                                                    |
| golangci-lint | `.golangci.yml`, `.golangci.yaml`, `.golangci.toml`, `.golangci.json`                                                                                                                                                                                                                                      |
| goreleaser    | `.config/goreleaser.yml`, `.config/goreleaser.yaml`, `.goreleaser.yml`, `.goreleaser.yaml`, `goreleaser.yml`, `goreleaser.yaml`                                                                                                                                                                            |
| java          | `.java-version`, `.sdkmanrc`                                                                                                                                                                                                                                                                               |
| lefthook      | `lefthook.yml`, `lefthook.yaml`, `.lefthook.yml`, `.lefthook.yaml`, `lefthook.toml`, `.lefthook.toml`, `lefthook.json`, `.lefthook.json`, `lefthook.jsonc`, `.lefthook.jsonc`, `.config/lefthook.yml`, `.config/lefthook.yaml`, `.config/lefthook.toml`, `.config/lefthook.json`, `.config/lefthook.jsonc` |
| node          | `.nvmrc`, `.node-version`, `package.json`                                                                                                                                                                                                                                                                  |
| npm           | `package.json`                                                                                                                                                                                                                                                                                             |
| opentofu      | `.opentofu-version`                                                                                                                                                                                                                                                                                        |
| packer        | `.packer-version`                                                                                                                                                                                                                                                                                          |
| perl          | `.perl-version`                                                                                                                                                                                                                                                                                            |
| pixi          | `pixi.toml`, `pyproject.toml`                                                                                                                                                                                                                                                                              |
| pnpm          | `package.json`                                                                                                                                                                                                                                                                                             |
| pre-commit    | `.pre-commit-config.yaml`                                                                                                                                                                                                                                                                                  |
| python        | `.python-version`, `.python-versions`                                                                                                                                                                                                                                                                      |
| ruby          | `.ruby-version`, `Gemfile`                                                                                                                                                                                                                                                                                 |
| ruff          | `ruff.toml`, `.ruff.toml`                                                                                                                                                                                                                                                                                  |
| rust          | `rust-toolchain.toml`                                                                                                                                                                                                                                                                                      |
| swift         | `.swift-version`                                                                                                                                                                                                                                                                                           |
| task          | `Taskfile.yml`, `Taskfile.yaml`, `taskfile.yml`, `taskfile.yaml`                                                                                                                                                                                                                                           |
| terraform     | `.terraform-version`                                                                                                                                                                                                                                                                                       |
| terragrunt    | `.terragrunt-version`                                                                                                                                                                                                                                                                                      |
| terramate     | `.terramate-version`                                                                                                                                                                                                                                                                                       |
| yarn          | `.yvmrc`, `package.json`                                                                                                                                                                                                                                                                                   |
| zig           | `.zig-version`                                                                                                                                                                                                                                                                                             |

<!-- mise:idiomatic-version-files:end -->

レジストリに登録されたツールは、構造化された idiomatic ファイルからバージョンを抽出する方法を記述することもできます。
レジストリのエントリは、[HTTP バックエンド（原文）](https://mise.jdx.dev/dev-tools/backends/http.html#version-listing)
と同じ `version_regex`、`version_json_path`、`version_expr` パーサーを使用できます。これにより、`aqua:` や `github:`
といったバックエンド経由でインストールされたツールは、asdf や vfox のプラグインを必要とせずに JSON マニフェストや
他のツール固有のバージョンファイルをサポートできます。

一部のファイルは、正確なバイナリリリースではなく、互換性のある最小バージョンや設定フォーマットのメジャーバージョンを
宣言します。mise はその値を通常のバージョンリクエストとして扱うため、`3.25` のような値は CMake 3.25 の最新の
一致するリリースを選び、GoReleaser の設定 `version: 2` は GoReleaser 2.x の最新リリースを選びます。

`go.mod` の場合、`toolchain goX.Y.Z` ディレクティブ（正確なツールチェインの固定）が存在すればそれが使用されます。
存在しない場合は `go X.Y` ディレクティブが使用されます。これは必要な Go バージョンの_最小値_のみを宣言するため、
mise は一致する最新のパッチバージョンに解決します（例: `go 1.22` → 最新の `1.22.x`）。

mise では、これらはデフォルトで無効になっています。その理由については <https://github.com/jdx/mise/discussions/4345> を参照してください。

- Python のような特定のツールに対しては `mise settings add idiomatic_version_file_enable_tools python` を使用します（[ドキュメント（原文）](https://mise.jdx.dev/configuration/settings.html#idiomatic_version_file_enable_tools)）

個々のファイルは `tool:filename` のペアで、特定のツールに対して無効化できます。例えば、node に対して `.nvmrc`
を使いつつ、`package.json` はパッケージマネージャー向けに残しておく場合は次のようにします。

```sh
mise settings add idiomatic_version_file_disable_files node:package.json
```

これらのファイルを検出・解析するには、わずかなパフォーマンスコストがかかります。レジストリのパーサーはプロセス内で
実行されますが、プラグインが提供するファイルはプラグインのパーサーを呼び出すことがあります。結果は
[キャッシュされる（原文）](https://mise.jdx.dev/cache-behavior.html)ため、通常は気になりません。

::: info
asdf ではこれらを「レガシーバージョンファイル」と呼んでいます。これは使うべきではないことを暗示してしまうため、
良くない名前だと私は思います。実際にはそんなことは全くありません。私は「idiomatic」バージョンファイルという用語を
好んでいます。これらは asdf や mise 専用のバージョンファイルではなく、他のツールでも使用できるからです
（`.nvmrc` は特定のツールに紐づいているという注目すべき例外です）。
:::

## 設定 {#settings}

設定項目の全リストは [設定（原文）](https://mise.jdx.dev/configuration/settings.html) を参照してください。

## タスク {#tasks}

設定オプションの全リストは [タスク](/tasks/) を参照してください。

## 環境変数 {#environment-variables}

::: tip
通常、mise における環境変数は [設定項目（原文）](https://mise.jdx.dev/configuration/settings.html) を設定するために
使われるため、ほとんどの環境変数はそのドキュメントに記載されています。以下は、設定項目ではない環境変数です。

mise における設定項目とは、一般に、環境変数としても設定ファイルとしても設定できるものを指します。
:::

mise は環境変数を通じて設定することもできます。以下のオプションが利用可能です。

### `MISE_DATA_DIR` {#mise-data-dir}

デフォルト（Linux）: `~/.local/share/mise` または `$XDG_DATA_HOME/mise`
デフォルト（macOS）: `~/.local/share/mise` または `$XDG_DATA_HOME/mise`
デフォルト（Windows）: `%LOCALAPPDATA%\mise` または `$XDG_DATA_HOME/mise`

これは mise がプラグインとツールのインストール先を保存するディレクトリです。これらはマシン間で共有される
べきではありません。

### `MISE_CACHE_DIR` {#mise-cache-dir}

デフォルト（Linux）: `~/.cache/mise` または `$XDG_CACHE_HOME/mise`
デフォルト（macOS）: `~/Library/Caches/mise` または `$XDG_CACHE_HOME/mise`
デフォルト（Windows）: `%TEMP%\mise` または `$XDG_CACHE_HOME/mise`

これは mise が内部キャッシュを保存するディレクトリです。マシン間で共有されるべきではありません。mise が
実行されていない間は、いつでも削除される可能性があります。

### `MISE_TMP_DIR` {#mise-tmp-dir}

デフォルト: rust における [`std::env::temp_dir()`](https://doc.rust-lang.org/std/env/fn.temp_dir.html)
の実装

これは、ツールのインストール時などの一時的な保存に使用されます。

### `MISE_SYSTEM_CONFIG_DIR` {#mise-system-config-dir}

デフォルト: `/etc/mise`

これは mise がシステム全体の設定を保存するディレクトリです。`MISE_SYSTEM_DIR` も旧来のエイリアスとして
サポートされています。

### `MISE_GLOBAL_CONFIG_FILE` {#mise-global-config-file}

デフォルト: `$MISE_CONFIG_DIR/config.toml`（通常は `~/.config/mise/config.toml`）

これは設定ファイルへのパスです。

`$HOME` から実行する `mise use` や `mise set` のようなグローバルな書き込みを、別の設定ファイルに向けたい場合に
使用します。[`MISE_DEFAULT_CONFIG_FILENAME`](#mise-default-config-filename) はデフォルトのローカル設定ファイル名を
カスタマイズするものであり、グローバル設定のパスではありません。

### `MISE_DEFAULT_CONFIG_FILENAME` {#mise-default-config-filename}

デフォルト: `mise.toml`

これは、mise がプロジェクトの設定ファイルを作成または検索する際に使用する、デフォルトのローカル設定ファイル名を
カスタマイズします。

### `MISE_GLOBAL_CONFIG_ROOT` {#mise-global-config-root}

デフォルト: `$HOME`

::: v-pre
これは、グローバル設定ファイルにおいて `{{config_root}}` として使用されるパスです。
:::

### `MISE_ENV_FILE` {#mise-env-file}

dotenv ファイルから環境変数を読み込むために、ファイル名を設定します。例: `MISE_ENV_FILE=.env`。これは現在の
ディレクトリと親ディレクトリの中で、一致するすべてのファイルを検索して読み込みます。内部では
[dotenvy](https://crates.io/crates/dotenvy) を使用しています。

### `MISE_${TOOL}_VERSION` {#mise-tool-version}

ツールのバージョンを設定します。例えば、`MISE_NODE_VERSION=20` は、`mise.toml` や `.tool-versions` に
何が設定されていても関係なく <node@20.x> を使用します。

### `MISE_TRUSTED_CONFIG_PATHS` {#mise-trusted-config-paths}

これは、mise が自動的に信頼済みとしてマークするパスのリストです。これらは `PATH` 環境変数のプラットフォームの
慣例に従って区切られます。Unix では `:`、Windows では `;` です。

### `MISE_CEILING_PATHS` {#mise-ceiling-paths}

これは、mise が設定ファイルやファイルタスクの検索を停止するパスのリストです。これは、読み込みが遅い
ディレクトリでの mise の検索を停止させるのに便利です。これらは `PATH` 環境変数のプラットフォームの慣例に
従って区切られます。ほとんどの Unix プラットフォームでは区切り文字は `:` で、Windows では `;` です。

### `MISE_LOG_LEVEL=trace|debug|info|warn|error` {#mise-log-level-trace-debug-info-warn-error}

これらは mise の詳細度を変更します。

`MISE_DEBUG=1`、`MISE_TRACE=1`、`MISE_QUIET=1`、および `--log-level=trace|debug|info|warn|error` も
使用できます。

### `MISE_LOG_FILE=~/mise.log` {#mise-log-file-mise-log}

ログをファイルに出力します。

### `MISE_LOG_FILE_LEVEL=trace|debug|info|warn|error` {#mise-log-file-level-trace-debug-info-warn-error}

`MISE_LOG_LEVEL` と同様ですが、ログ_ファイル_の出力レベルに対するものです。ログを保存しつつ、画面表示を
煩雑にしたくない場合に便利です。

### `MISE_LOG_HTTP=1` {#mise-log-http-1}

ログに HTTP のリクエスト/レスポンスを表示します。

### `MISE_LOG_VERBOSE_DEPS=1` {#mise-log-verbose-deps-1}

ノイズの多いサードパーティ製 crate（`h2`、`hyper`、`reqwest`、`rustls` など。HTTP/2 のフレームやソケット
読み取りごとに1行のログを出力します）からのデバッグログとトレースログは、常に除外されます。除外しないと
debug/trace の出力を圧倒してしまうためです。これらのログを通過させるには、これを `1` に設定します。
`--log-level=trace`/`-vv` を使用している場合でも、これらのログを見る唯一の方法です。

### `MISE_QUIET=1` {#mise-quiet-1}

`MISE_LOG_LEVEL=warn` と同等です。

### `MISE_HTTP_TIMEOUT` {#mise-http-timeout}

HTTP リクエストのタイムアウトを秒単位で設定します。デフォルトは `30` です。

### `MISE_RAW=1` {#mise-raw-1}

プラグインのスクリプトを stdin/stdout/stderr に直接パイプするには、"1" に設定します。デフォルトでは stdin は
無効になっています。これは、複数のプラグインを並行してインストールする際にプロンプトが表示されなくなるためです。
プラグインが入力を受け付ける場合や、正しくインストールされていないように見える場合に使用してください。

一度に1つのプラグインスクリプトしか実行できないため、`MISE_JOBS=1` が設定されます。

### `MISE_TERM_WIDTH` {#mise-term-width}

mise がテーブルやリストを表示する際に使用する（例: `mise ls`）ターミナル幅を上書きします。デフォルトでは
mise はターミナルから幅を検出します。これは、CI や他の非対話的な環境で検出結果が不正な値になり（例えば
CircleCI では幅が `0` と報告されます）、出力が奇妙に折り返されてしまう場合に便利です。

`MISE_TERM_WIDTH` が設定されていない場合、mise は慣例的な `COLUMNS` 環境変数にフォールバックし、最終的には
自動検出にフォールバックします。上書きした値は厳密に反映されるため、より狭い幅を強制することもできます。

```sh
MISE_TERM_WIDTH=120 mise ls
```

### `MISE_FISH_AUTO_ACTIVATE=1` {#mise-fish-auto-activate-1}

fish シェル用の vendor_conf.d スクリプトが自動的に有効化されるように設定します。このファイルは homebrew や、
その他の可能性のあるインストール方法において、設定なしで mise を自動的に有効化するために自動的に使用されます。

デフォルトでは有効になっています。無効にするには "0" に設定してください。
