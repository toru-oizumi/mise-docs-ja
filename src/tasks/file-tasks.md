---
title: ファイルタスク
upstreamPath: docs/tasks/file-tasks.md
upstreamUrl: https://mise.jdx.dev/tasks/file-tasks.html
upstreamRef: d24e41b
upstreamDate: "2026-08-12"
---

# ファイルタスク {#file-tasks}

タスクは設定を通じて定義するだけでなく、以下のいずれかのディレクトリ内のスタンドアロンなスクリプトファイルとして定義することもできます。

- `mise-tasks/:task_name`
- `.mise-tasks/:task_name`
- `mise/tasks/:task_name`
- `.mise/tasks/:task_name`
- `.config/mise/tasks/:task_name`

これらがデフォルトのファイルタスクディレクトリです。現在の設定スコープに対して [`task_config.includes`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#task-config-includes) が設定されている場合、mise は代わりにそこに列挙されたパスのみを検索します。

Rust の CLI をビルドするファイルタスクの例を次に示します。

```bash [mise-tasks/build]
#!/usr/bin/env bash
#MISE description="Build the CLI"
cargo build
```

::: tip 重要
ファイルが実行可能になっていることを確認してください。実行可能でない場合、mise はそれを検出できません。

```shell
chmod +x mise-tasks/build
```

:::

コードを TOML ではなく bash ファイルに置くことで、エディタでのシンタックスハイライトやリンティングがしやすくなり、うまく機能します。

mise を使っていないユーザーにとっても問題なく機能します — もちろん、タスクが使う開発ツールをインストールする別の方法を見つける必要はありますが。

## タスク設定 {#task-configuration}

すべての設定オプションは [タスク設定（原文）](https://mise.jdx.dev/tasks/task-configuration.html) で確認できます。ファイルタスクに追加の設定を与えるには、ファイルの先頭に `#MISE` コメントを追加します。

```bash
#MISE description="Build the CLI"
#MISE alias="b"
#MISE sources=["Cargo.toml", "src/**/*.rs"]
#MISE outputs=["target/debug/mycli"]
#MISE env={RUST_BACKTRACE = "1"}
#MISE depends=["lint", "test"]
#MISE tools={rust="1.50.0"}
```

そのファイルが `mise-tasks/build` に置かれていると仮定すると、`mise run build`（またはエイリアスの `mise run b`）で実行できます。

### 複数行の値 {#multi-line-values}

各 `#MISE` 行は TOML です。配列やインラインテーブルは、すべての行が `#MISE` プレフィックスを保っている限り複数行に分割できます。これにより長い `depends`/`sources` のリストを読みやすく保てます。

```bash [mise-tasks/build]
#!/usr/bin/env bash
#MISE description="Build the CLI"
#MISE depends=[
#MISE   "lint",
#MISE   "test",
#MISE ]
#MISE sources=[
#MISE   "Cargo.toml",
#MISE   "src/**/*.rs",
#MISE ]
cargo build
```

テーブルは、ドット区切りのキーでプレフィックスを繰り返すことでも構築できます。これにより、周囲の波かっこを完全に避けられます。

```bash
#MISE tools.node="20"
#MISE tools.python="3.11"
```

Mise はファイルタスクに、タスクを起動したディレクトリに関わらずプロジェクトのルートを特定する `MISE_PROJECT_ROOT` のような、プロジェクトのコンテキスト変数を提供します。変数の完全なリストは [タスク](/tasks/#environment-variables-passed-to-tasks) を参照してください。

:::tip
フォーマッタが `#MISE` を `# MISE` に変えてしまう点に注意してください。
これは意図しない設定を避けるため、mise によって意図的に無視されます。
これを回避するには、代わりに `# [MISE]` を使ってください。
:::

## シバン {#shebang}

シバン行は省略可能ですが、存在する場合はスクリプトを実行するシェルを判断するために使われます。
さまざまなプログラミング言語でスクリプトを実行するために使うこともできます。

::: code-group

```js [node]
#!/usr/bin/env node
//MISE description="Hello, World in Node.js"

console.log("Hello, World!");
```

```python
#!/usr/bin/env python
#MISE description="Hello, World in Python"

print('Hello, World!')
```

```ts [deno]
#!/usr/bin/env -S deno run --allow-env
//MISE description="Hello, World in Deno"

console.log(`PATH, ${Deno.env.get("PATH")}`);
```

```powershell [powershell]
#!/usr/bin/env pwsh
#MISE description="Hello, World in PowerShell"

$current_directory = Get-Location
Write-Host "Hello from PowerShell, current directory is $current_directory"
```

:::

## タスクの編集 {#editing-tasks}

このスクリプトは `mise tasks edit build` を実行することで（`$EDITOR` を使って）編集できます。存在しない場合は作成されます。
これは、スクリプトを素早く編集したり新規作成したりするのに便利です。

## タスクのグループ化 {#task-grouping}

`mise-tasks`、`.mise/tasks`、`mise/tasks`、`.config/mise/tasks` にあるファイルタスクは、サブディレクトリにグループ化でき、
読み込み時にその名前へ自動的にプレフィックスが付けられます。

**例**: 以下のようなディレクトリ構造の場合、

```text
mise-tasks
├── build
└── test
    ├── _default
    ├── integration
    └── units
```

`mise tasks` を実行すると、以下の出力が得られます。

```shellsession
$ mise tasks
Name              Description Source
build                         ./mise-tasks/build
test                          ./mise-tasks/test/_default
test:integration              ./mise-tasks/test/integration
test:units                    ./mise-tasks/test/units
```

## 引数 {#arguments}

::: tip
タスクの引数に関する包括的な情報については、専用の [タスクの引数（原文）](https://mise.jdx.dev/tasks/task-arguments.html) ページを参照してください。
:::

これらのファイル内では [usage](https://usage.jdx.dev) の spec を使って、引数解析、自動補完、mise 実行時のドキュメント生成を提供でき、markdown にエクスポートすることもできます。これにより、タスクは実質的に本格的な CLI になります。

:::tip
`usage` CLI は、usage の spec を使った mise のタスクの実行には必要ありません。
ただし、補完を機能させるには、`usage` CLI をインストールして PATH で利用できるようにする必要があります。
:::

### 引数を使ったファイルタスクの例 {#example-file-task-with-arguments}

usage の機能の一部を使って Rust の CLI をビルドするファイルタスクの例を次に示します。

```bash [mise-tasks/build]
#!/usr/bin/env bash
set -e

#USAGE flag "-c --clean" help="Clean the build directory before building"
#USAGE flag "-p --profile <profile>" help="Build with the specified profile" default="debug" {
#USAGE   choices "debug" "release"
#USAGE }
#USAGE flag "-u --user <user>" help="The user to build for"
#USAGE complete "user" run="mycli users"
#USAGE arg "<target>" help="The target to build"

if [ "${usage_clean:-false}" = "true" ]; then
  cargo clean
fi

cargo build --profile "${usage_profile?}" --target "${usage_target?}"
```

::: tip
`${var?}`、`${var:-default}`、`${var:+value}` のような bash パラメータ展開のパターンの詳細については、[usage 変数のための bash 変数展開（原文）](https://mise.jdx.dev/tasks/task-arguments.html#bash-variable-expansion) を参照してください。
:::

`usage` をインストールしている場合、タスクに補完が有効になります。この例では、

- `mise run -- build --profile <tab><tab>`
  を実行すると、オプションとして `debug` と `release` が表示されます。
- `--user` オプションも、`mycli users` の出力から生成された補完を表示します。
- 注意: mise のオプションとタスクの引数を区切るには `--` を使います: `mise run -- build --profile release <target>`

（これを書いている時点では、タスクの CLI と markdown のヘルプは mise にはまだ実装されていませんが、実装は計画されています。）

:::tip
自動補完の候補が全く表示されない場合は、`-v`（verbose）オプションを使って何が起きているかを確認してください。
例えば、`mise run build -v` を使い、`usage` の spec が不正な場合、`DEBUG failed to parse task file with usage` のようなエラーメッセージが表示されます。
:::

### 環境変数によるバッキング {#environment-variable-backing}

引数とオプションは、`env="..."` を使うことで環境変数によってバッキングできます。
優先順位は、CLI の引数、環境変数、デフォルト値の順です。

```bash [.mise/tasks/deploy]
#!/usr/bin/env bash
#MISE description="Deploy application"
#USAGE arg "[environment]" env="DEPLOY_ENV" default="development"
#USAGE flag "--region <region>" env="AWS_REGION" default="us-east-1"

echo "Deploying to ${usage_environment} in ${usage_region}"
```

これにより、同じファイルタスクを、明示的な引数か呼び出し元シェルの環境のどちらでも動作させられます。

```shell
DEPLOY_ENV=staging AWS_REGION=us-west-2 mise run deploy
```

詳細は [環境変数によるバッキング（原文）](https://mise.jdx.dev/tasks/task-arguments.html#environment-variable-backing) を参照してください。

### 引数を使った NodeJS のファイルタスクの例 {#example-of-a-nodejs-file-task-with-arguments}

Node.js のスクリプトで引数を解析するために [usage](https://usage.jdx.dev/cli/scripts#usage-scripts) を使う方法を次に示します。

```js [mise-tasks/greet]
#!/usr/bin/env -S node
//MISE description="Write a greeting to a file"
//USAGE flag "-f --force" help="Overwrite existing <file>"
//USAGE flag "-u --user <user>" help="User to run as"
//USAGE arg "<output_file>" help="The file to write" default="file.txt" {
//USAGE   choices "greeting.txt" "file.txt"
//USAGE }

const fs = require("fs");

const { usage_user, usage_force, usage_output_file } = process.env;

if (usage_force === "true") {
  fs.rmSync(usage_output_file, { force: true });
}

const user = usage_user ?? "world";
fs.appendFileSync(usage_output_file, `Hello, ${user}\n`);
console.log(`Greeting written to ${usage_output_file}`);
```

以下で実行します。

```shell
mise run greet greeting.txt --user Alice
# Greeting written to greeting.txt
```

無効な引数を渡すと、エラーメッセージが表示されます。

```shell
mise run greet invalid.txt --user Alice
# [greet] ERROR
#   0: Invalid choice for arg output_file: invalid.txt, expected one of greeting.txt, file.txt
```

`usage` がインストールされていれば、自動補完で `output_file` 引数に使える選択肢が表示されます。

```shell
mise run greet <TAB>
# > greeting.txt
#   file.txt
```

## CWD {#cwd}

mise はタスクを実行する前に、現在の作業ディレクトリを `mise.toml` のディレクトリに設定します。
これはタスクヘッダーで <span v-pre>`dir="{{cwd}}"`</span> を設定することで上書きできます。

```bash
#!/usr/bin/env bash
#MISE dir="{{cwd}}"
```

また、元の作業ディレクトリは `MISE_ORIGINAL_CWD` 環境変数で利用できます。

```bash
#!/usr/bin/env bash
cd "$MISE_ORIGINAL_CWD"
```

## タスクを直接実行する {#running-tasks-directly}

タスクは設定の一部として構成する必要はなく、スクリプトへのパスを渡すことで直接実行できます。

```bash
mise run ./path/to/script.sh
```

パスがファイルパスとして認識されるには、`/` または `./` で始まる必要がある点に注意してください（Windows の場合は `C:\` または `.\` でも構いません）。
