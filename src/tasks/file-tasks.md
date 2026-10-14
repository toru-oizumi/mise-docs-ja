---
title: ファイルタスク
description: "Write tasks as executable scripts in a task directory and configure them with #MISE comments."
upstreamPath: docs/tasks/file-tasks.md
upstreamUrl: https://mise.jdx.dev/tasks/file-tasks.html
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# ファイルタスク {#file-tasks}

ファイルタスクは、タスクディレクトリに置いた実行可能なスクリプトです。そのパスがタスク名になり、先頭の `#MISE` コメントに設定を書きます。エディターのシンタックスハイライトやリンティングの恩恵を受けられるほどスクリプトが長い場合に使います。

これを `mise-tasks/build` として保存します。

```bash [mise-tasks/build]
#!/usr/bin/env bash
#MISE description="Build the CLI"
cargo build
```

Linux と macOS では、スクリプトを実行可能にします。

```sh
chmod +x mise-tasks/build
```

これで `mise run build` が、設定ファイルのツールと環境でスクリプトを実行します。mise がタスクとして一覧に表示するのは実行可能なスクリプトだけです。実行可能でないスクリプトを実行すると、mise は実行可能にするかどうかを尋ね、拒否すると失敗します。Windows には実行ビットがありません。[Windows](#windows) を参照してください。

mise を使わずにスクリプトを実行することもできますが、その場合 `#MISE` と `#USAGE` のコメントは効果を持たないため、呼び出し側がツール、環境、および `usage_*` 変数を用意する必要があります。

`mise-tasks/` は、いくつかある [デフォルトのタスクディレクトリ（原文）](https://mise.jdx.dev/tasks/task-discovery.html#default-task-directories) の1つです。[`task_config.includes`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#task_config.includes) を設定すると、それらが列挙したパスに置き換わります。

## ファイルタスクの命名とグループ化 {#task-grouping}

タスクディレクトリ以下のファイルのパスが、`/` を `:` に置き換えた形でタスク名になります。`mise-tasks/db/migrate.sh` は `db:migrate` で、`mise run db:migrate` または `mise run db:migrate.sh` として実行できます。mise は、`.sh`、`.py`、`.js`、`.ps1` などのスクリプトの拡張子を除いた名前を表示します。ただし、その名前を持つタスクがすでにある場合は除きます。それ以外の拡張子は名前に残るため、`mise-tasks/gen.proto` は `gen.proto` というタスクになります。`_default` という名前のファイルはそのディレクトリの名前を取るため、`mise-tasks/test/_default` は `test` になります。

次のような構成の場合、

```text
mise-tasks
├── build
├── db
│   └── migrate.sh
└── test
    ├── _default
    ├── integration
    └── units
```

`mise tasks --extended` は次のように表示します。

```text
Name              Aliases  Source                         Description
build                      ./mise-tasks/build
db:migrate                 ./mise-tasks/db/migrate.sh
test                       ./mise-tasks/test/_default
test:integration           ./mise-tasks/test/integration
test:units                 ./mise-tasks/test/units
```

`mise run 'test:*'` は `test:integration` と `test:units` を実行します。[ワイルドカード](/tasks/running-tasks.html#wildcards) を参照してください。

## `#MISE` コメントによる設定 {#configure-with-mise-comments}

スクリプトの先頭付近に `#MISE` コメントを追加して、[タスクのプロパティ（原文）](https://mise.jdx.dev/tasks/task-configuration.html) を設定します。

```bash [mise-tasks/build]
#!/usr/bin/env bash
#MISE description="Build the CLI"
#MISE alias="b"
#MISE sources=["Cargo.toml", "src/**/*.rs"]
#MISE outputs=["target/debug/mycli"]
#MISE env={RUST_BACKTRACE = "1"}
#MISE depends=["lint", "test"]
#MISE tools={rust="1.90"}
cargo build
```

`mise run build` またはそのエイリアスの `mise run b` で、このファイルを実行します。

コメントの記号には `#`、`//`（JavaScript、TypeScript、Go 向け）、`::`（バッチファイル向け）が使え、その後に空白を置いても構いません。キーワードを角かっこで囲むこともできます。`#MISE`、`# MISE`、`// MISE`、`# [MISE]` はいずれも機能するため、`#` の後にスペースを追加するフォーマッターがあってもヘッダーは壊れません。ヘッダー行を無効にするには、キーワードを例えば `# NOMISE` のように変更します。

各 `#MISE` 行には TOML を書きます。ヘッダーはほとんどのタスクのプロパティを受け付けますが、`timeout`、`vars`、サンドボックスのキー（`deny_*` と `allow_*`）は受け付けません。mise はこれらについて警告を出し、無視します。これらのいずれかを設定するには、または編集できないスクリプトを設定するには、そのスクリプト用の `[tasks.<name>]` ブロックを `mise.toml` に追加します。[TOML からのファイルタスクの設定（原文）](https://mise.jdx.dev/tasks/task-discovery.html#configuring-file-tasks-from-toml) を参照してください。

### 複数行の値 {#multi-line-values}

配列やインラインテーブルは、すべての行が `#MISE` プレフィックスを保っている限り複数行にまたがって書けます。これにより長い `depends` や `sources` のリストを読みやすく保てます。

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

ドット区切りのキーを使うと、波かっこを使わずにテーブルを1行ずつ構築できます。

```bash
#MISE tools.node="24"
#MISE tools.python="3.13"
```

### タスクテンプレートの継承 {#extend-a-task-template}

`extends` で [タスクテンプレート（原文）](https://mise.jdx.dev/tasks/templates.html) を指定すると、複数のファイルタスクで1組のツール、環境変数、引数を共有できます。

```toml [mise.toml]
[task_templates.rust]
tools = { rust = "1.90" }
env = { RUST_BACKTRACE = "1" }
```

```bash [mise-tasks/build]
#!/usr/bin/env bash
#MISE extends="rust"
#MISE description="Build the CLI"
cargo build
```

スクリプトそのものがタスクのコマンドになるため、ファイルタスクはテンプレートの `run` を無視します。それ以外のすべては、テンプレートの [マージ規則（原文）](https://mise.jdx.dev/tasks/templates.html#merge-semantics) に従って継承します。

## シバン {#shebang}

シバンはインタープリターを選択します。Linux と macOS では省略可能ですが、Windows では実行可能な拡張子を持たないファイルに必要です（[Windows](#windows) を参照）。シバンを使えば、任意の言語でタスクを書けます。

::: code-group

```js [node]
#!/usr/bin/env node
//MISE description="Hello, World in Node.js"

console.log("Hello, World!");
```

```python [python]
#!/usr/bin/env python
#MISE description="Hello, World in Python"

print('Hello, World!')
```

```ts [deno]
#!/usr/bin/env -S deno run
//MISE description="Hello, World in Deno"

console.log("Hello, World!");
```

```powershell [powershell]
#!/usr/bin/env pwsh
#MISE description="Hello, World in PowerShell"

$current_directory = Get-Location
Write-Host "Hello from PowerShell, current directory is $current_directory"
```

:::

## Windows {#windows}

Windows には実行ビットがありません。Windows では、拡張子が [`windows_executable_extensions`（原文）](https://mise.jdx.dev/configuration/settings.html#windows_executable_extensions) に列挙されているもの（`.cmd` や `.ps1` など）であるか、シバンで始まるファイルがタスクになります。Windows 自体はシバンを実装していないため、mise がその行を読んでインタープリターを起動します。どちらにも当てはまらないファイルは、Linux や macOS では動作しても、Windows ではタスクになりません。

```bash [mise-tasks/build]
# no shebang and no extension: not a task on Windows
cargo build
```

共有するスクリプトには `#!/usr/bin/env bash` を追加してください。他のプラットフォームでは何も変わりません。

### `.ps1` を持たない PowerShell スクリプト {#powershell-scripts-without-ps1}

Windows PowerShell は名前が `.ps1` で終わるファイルしか実行しないため、mise は `#!/usr/bin/env pwsh` のタスクを一時的な `.ps1` のコピーから実行し、タスクが終了するとそのコピーを削除します。`$PSScriptRoot` と `$PSCommandPath` はコピーを指します。作業ディレクトリ、`$args`、環境は変わりません。

タスクと同じ場所にあるファイルを見つけるには、`$env:MISE_TASK_DIR` を読みます。これはどのプラットフォームでもタスクファイルのディレクトリを指します（[タスクの環境](/tasks/running-tasks.html#task-environment) を参照）。または、タスクに `.ps1` 拡張子を付けると、その場で実行されます。

### 1つのタスクに2つのスクリプト {#one-task-two-scripts}

ファイルタスクには、TOML タスクの [`run_windows`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#run-windows) に相当するものがありません。代わりに、同じ語幹を持つ POSIX スクリプトと Windows スクリプトを同じディレクトリに置きます。

```text
mise-tasks/
  build.sh       # #!/usr/bin/env bash
  build.ps1      # the Windows version
```

Windows では、mise は `build.ps1` を `build` として実行し、POSIX スクリプトを除外します。Linux と macOS では `.ps1` に実行ビットがないため、`build.sh` だけがタスクになります。`mise run build` は各プラットフォームで適切なスクリプトを選びます。POSIX スクリプトとは `windows_executable_extensions` のいずれの拡張子も持たないファイルのことなので、`build` のように拡張子のないスクリプトも同じように対になります。

Linux と macOS では `.ps1` を実行可能にしないでください。実行可能な場合、そちらでもタスクになります。`build.sh` と並んでいると `build` という名前にも応答するため、`mise run build` が両方のスクリプトを実行します。`build.ps1` と `build.cmd` のように Windows 用の候補が複数ある場合、mise は Windows でそれらのどちらかを選ばず、3つのファイルすべてをタスクとして残します。`mise run build.cmd` のように完全な名前で1つを実行してください。

スクリプトに無関係な名前を付けたい場合や、明示的に選びたい場合は、それらを呼び出す [TOML タスク](/tasks/toml-tasks.html) を使います。

```mise-toml [mise.toml]
[tasks.build]
run = "./scripts/build.sh"
run_windows = "pwsh -File ./scripts/windows-build.ps1"
```

Windows のコマンドが明示的に `pwsh` を呼び出しているのは、[`windows_default_inline_shell_args`（原文）](https://mise.jdx.dev/configuration/settings.html#windows_default_inline_shell_args) がデフォルトで `cmd /c` であり、cmd は `.ps1` ファイルを単独では起動しないためです。

## ファイルタスクの作成と編集 {#create-or-edit-a-file-task}

`mise tasks edit build` は `build` を `$EDITOR` で開きます。タスクが存在しない場合、mise はまず、存在する最初のタスクディレクトリ（存在しない場合は `mise-tasks/`）に Bash のシバンを持つ実行可能なスクリプトを作成します。[`mise tasks add --file`（原文）](https://mise.jdx.dev/cli/tasks/add.html) は、コマンドからファイルタスクを作成します。

```sh
mise tasks add --file hello -- echo hello
```

## 引数 {#arguments}

引数は `#USAGE` コメントで宣言します。mise はそれを解析し、各値を `usage_*` 環境変数としてスクリプトに渡し、`--help` とシェルの自動補完を提供します。

```bash [mise-tasks/build]
#!/usr/bin/env bash
set -e

#USAGE flag "-c --clean" help="Clean the build directory before building"
#USAGE flag "-p --profile <profile>" help="Build with the specified profile" default="dev" {
#USAGE   choices "dev" "release"
#USAGE }
#USAGE flag "-u --user <user>" help="The user to build for"
#USAGE complete "user" run="mycli users"
#USAGE arg "<target>" help="The target to build"

if [ "${usage_clean:-false}" = "true" ]; then
  cargo clean
fi

cargo build --profile "${usage_profile?}" --target "${usage_target?}"
```

mise の [シェルの自動補完（原文）](https://mise.jdx.dev/shell-setup.html) を有効にしていれば、`mise run build --profile <Tab>` は `dev` と `release` を、`mise run build --user <Tab>` は `mycli users` の出力を候補に出します。別途 `usage` CLI は必要ありません。`mise run build --help` はタスクのヘルプを表示し、[`mise generate task-docs`（原文）](https://mise.jdx.dev/cli/generate/task-docs.html) は同じ spec から Markdown のドキュメントを生成します。

mise 自身のオプションは、`mise run --dry-run build --profile release x86_64-unknown-linux-gnu` のようにタスク名の前に置きます。タスク名より後ろはすべてタスクに渡されます。

[タスクの引数（原文）](https://mise.jdx.dev/tasks/task-arguments.html) では、spec の構文、[Bash での値の読み取り（原文）](https://mise.jdx.dev/tasks/task-arguments.html#bash-variable-expansion)、[環境変数によるバッキング（原文）](https://mise.jdx.dev/tasks/task-arguments.html#environment-variable-backing) を扱っています。

自動補完や `--help` に spec が反映されない場合は、`mise tasks validate` またはタスク自体を実行してください。spec が不正な場合、`invalid usage spec in task file mise-tasks/build` のような警告が、解析に失敗した行とともに出力されます。

### 引数を使う Node.js のタスク {#a-node-js-task-with-arguments}

JavaScript では `//USAGE` コメントで引数を宣言します。mise は `#USAGE` 行と同じ方法でそれを解析します。

```js [mise-tasks/greet]
#!/usr/bin/env node
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

```sh
mise run greet greeting.txt --user Alice
# Greeting written to greeting.txt
```

mise は、選択肢にない値をスクリプトの開始前に拒否します。

```sh
mise run greet invalid.txt --user Alice
```

```text
mise ERROR failed to validate task greet
mise ERROR Invalid choice for arg output_file: invalid.txt, expected one of greeting.txt, file.txt
```

自動補完を有効にしていれば、`mise run greet <Tab>` は `greeting.txt` と `file.txt` を候補に出します。

## 作業ディレクトリ {#working-directory}

ファイルタスクは [設定ルート](/configuration.html#config-root)、つまりプロジェクトのディレクトリから実行されます。例えば `~/proj/mise.toml` と `~/proj/.config/mise.toml` のどちらの場合も `~/proj` です。mise を呼び出したディレクトリから実行するには、<span v-pre>`#MISE dir="{{cwd}}"`</span> を追加します。

```bash
#!/usr/bin/env bash
#MISE dir="{{cwd}}"
```

mise を呼び出したディレクトリは `MISE_ORIGINAL_CWD` でも得られます。また、`MISE_PROJECT_ROOT` などの [タスク変数](/tasks/running-tasks.html#task-environment) を使えば、どのディレクトリからでもプロジェクトの場所を特定できます。

```bash
#!/usr/bin/env bash
cd "$MISE_ORIGINAL_CWD"
```

## パスを指定したスクリプトの実行 {#run-a-script-by-path}

`mise run ./scripts/build.sh` は、タスクディレクトリの外にあっても、任意の実行可能なスクリプトを `#MISE` と `#USAGE` のヘッダー付きでタスクとして実行します。

```sh
mise run ./path/to/script.sh
```

パスは `/`、`./`、`../` のいずれかで始まり（Windows では `.\`、`..\`、`C:\` のようなバックスラッシュの形式も使えます）、かつファイルが存在する必要があります。そうでない場合、mise は引数をタスク名として検索します。Linux と macOS では、ファイルが実行可能である必要もあります。ターミナルでは mise が実行可能にすることを提案し、そうでない場合は `` `./build.sh` is not executable. Run: chmod +x ./build.sh `` というメッセージで停止します。

相対パスはシェルと同様に現在のディレクトリから解決されるため、サブディレクトリで `mise run ./build.sh` を実行すると、そのサブディレクトリの `build.sh` が実行されます。それでもスクリプトは、他のタスクと同様に設定ルートで実行されます。
