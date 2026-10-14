---
title: TOML タスク
description: "Define short commands and task groups in the [tasks] table of mise.toml."
upstreamPath: docs/tasks/toml-tasks.md
upstreamUrl: https://mise.jdx.dev/tasks/toml-tasks.html
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# TOML タスク {#toml-tasks}

コマンドが1〜2行に収まるタスクや、主に他のタスクを実行するタスクは `mise.toml` に定義します。より長いスクリプトは [ファイルタスク](/tasks/file-tasks.html) に移すと、エディターでハイライトや lint ができます。

## タスクの定義 {#define-a-task}

最も短い形式では、タスク名をコマンドに対応付けます。

```toml [mise.toml]
[tasks]
build = "cargo build"
test = "cargo test"
lint = "cargo clippy"
```

プロパティを追加するには、タスクに専用のテーブルを与えます。

```mise-toml [mise.toml]
[tasks.build]
description = "Build the CLI"
run = "cargo build"
```

以下の各プロパティには例を1つずつ示します。すべてのプロパティは [タスク設定のリファレンス（原文）](https://mise.jdx.dev/tasks/task-configuration.html) に一覧があります。

### コマンドラインからのタスクの追加 {#add-a-task-from-the-command-line}

[`mise tasks add`（原文）](https://mise.jdx.dev/cli/tasks/add.html) は `mise.toml` にタスクを書き込みます。

```sh
mise tasks add pre-commit --depends "test" --depends "render" -- echo pre-commit
```

これにより、以下が追加されます。

```mise-toml [mise.toml]
[tasks.pre-commit]
depends = ["test", "render"]
run = "echo pre-commit"
```

## 共通のプロパティ {#common-properties}

### コマンドの実行 {#run-commands}

`run` は単一のコマンド、またはコマンドの配列です。

```mise-toml
[tasks.test]
run = "cargo test"
```

```mise-toml
[tasks.test]
run = [
  "cargo test",
  "./scripts/test-e2e.sh",
]
```

配列の要素は順番に実行されます。いずれかが失敗するとタスクは停止し、残りの要素は実行されません。コマンドラインの追加の引数は最後の要素に渡されます。要素から別のタスクを実行することもできます。[ステップを順番に実行する（原文）](https://mise.jdx.dev/tasks/architecture.html#run-steps-in-order) を参照してください。

Windows では `run_windows` が `run` の代わりに使われます。

```mise-toml
[tasks.test]
run = "cargo test"
run_windows = "cargo test --features windows"
```

### 作業ディレクトリ {#working-directory}

デフォルトでは、タスクは [設定ルート](/configuration.html#config-root) から実行されます。mise を呼び出したディレクトリから実行するには、<span v-pre>`dir = "{{cwd}}"`</span> を設定します。

```mise-toml
[tasks.test]
run = "cargo test"
dir = "{{cwd}}"
```

`MISE_ORIGINAL_CWD` にもそのディレクトリが入っています。他の値については [`dir`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#dir) を参照してください。

### 説明とエイリアス {#description-and-alias}

```mise-toml
[tasks.build]
description = "Build the CLI"
run = "cargo build"
alias = "b"
```

これで `mise run b` が `build` を実行します。説明は [`mise tasks ls`（原文）](https://mise.jdx.dev/cli/tasks/ls.html) と、タスク名を指定せずに [`mise run`（原文）](https://mise.jdx.dev/cli/run.html) を実行したときに開く選択画面に表示されます。

補助的なタスクに `hide = true` を設定すると、`mise tasks ls` の一覧から除外されます。名前を指定すれば引き続き実行でき、`mise tasks ls --hidden` では一覧に表示されます。

### 依存関係 {#dependencies}

依存関係はタスクより先に実行されます。いずれかが失敗した場合、タスクは実行されません。

```mise-toml
[tasks.build]
run = "cargo build"

[tasks.test]
depends = ["build"]
run = "cargo test"
```

[依存関係と実行順序（原文）](https://mise.jdx.dev/tasks/architecture.html) では、`depends` を `wait_for`、`depends_post`、実行ステップと比較しています。

### 環境変数 {#environment-variables}

`env` は、そのタスクだけに変数を設定します。依存関係には設定されません。

```mise-toml
[tasks.test]
env = { RUST_BACKTRACE = "1" }
run = "cargo test"
```

`[env]` で設定したプロジェクト全体の [環境変数](/environments/) は、すべてのタスクに渡されます。コマンドに必要だが環境にエクスポートすべきでない値には、[`[vars]`（原文）](https://mise.jdx.dev/configuration/vars.html) を使います。

```mise-toml [mise.toml]
[env]
VERBOSE_ARGS = "--verbose"

[vars]
e2e_args = "--headless"

[tasks.test]
run = "./scripts/test-e2e.sh {{vars.e2e_args}} $VERBOSE_ARGS"
```

### sources と outputs {#sources-and-outputs}

[`sources`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#sources) と [`outputs`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#outputs) を指定すると、出力が最新の状態である間、mise はタスクをスキップします。例については [最新の状態のタスクをスキップする](/tasks/running-tasks.html#skip-tasks-that-are-up-to-date) を、チェックの仕組みについては [タスクのキャッシュ（原文）](https://mise.jdx.dev/tasks/caching.html) を参照してください。`sources` だけを指定した場合も、[`mise watch`（原文）](https://mise.jdx.dev/cli/watch.html) が監視するファイルを指定することになります。run スクリプトの中では、[`task_source_files()`（原文）](https://mise.jdx.dev/templates.html#task-source-files) テンプレート関数が `sources` に一致するファイルを返します。

### 確認 {#confirmation}

`confirm` は、タスク自身のコマンドを実行する前に確認を求めます。

```toml
[tasks.release]
confirm = "Are you sure you want to cut a new release?"
description = "Cut a new release"
file = "scripts/release.sh"
```

確認が表示される時点で、タスクの `depends` はすでに実行されています。それらの処理より前に確認を求めるには、それらのタスクに確認を設定するか、[実行ステップ（原文）](https://mise.jdx.dev/tasks/architecture.html#run-steps-in-order) として呼び出します。[`confirm`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#confirm) を参照してください。

### デーモン <Badge type="warning" text="experimental" /> {#daemons}

::: warning 実験的
デーモンを使うには、`[settings]` の下に `experimental = true` が必要です。
:::

`daemons = "postgres"` を設定すると、[プロジェクトのデーモン（原文）](https://mise.jdx.dev/daemons.html#tasks-that-require-daemons) を起動し、準備ができるまで待ってからタスクを実行します。デーモンはその後も動き続けます。指定できる値については [`daemons`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#daemons) を参照してください。

## シェルやインタプリタの指定 {#shell-shebang}

Unix では、インラインのコマンドはデフォルトの [`sh -o errexit -c`（原文）](https://mise.jdx.dev/configuration/settings.html#unix_default_inline_shell_args) で実行されるため、スクリプトは最初に失敗したコマンドで停止します。続行させるには `set +e` を追加します。

```mise-toml
[tasks.cleanup]
run = '''
set +e
cd /nonexistent
echo "This does not fail the task"
'''
```

Windows でのデフォルトは [`cmd /c`（原文）](https://mise.jdx.dev/configuration/settings.html#windows_default_inline_shell_args) です。タスクのコマンドを別のシェルで実行するには、`shell` を設定します。

```mise-toml
[tasks.lint]
shell = "bash -c"
run = "cargo clippy"
```

あるいは、スクリプトをシバンで始めます。

```mise-toml
[tasks.lint]
run = '''
#!/usr/bin/env bash
cargo clippy
'''
```

カスタムの `shell`（`sh -c` や `bash -c` であっても）、シバンスクリプト、Windows のデフォルトの `cmd /c` は、最初の失敗で停止しません。スクリプトに自分で `set -e`（または `set -euo pipefail`）を追加してください。

```mise-toml
[tasks.lint]
run = '''
#!/usr/bin/env bash
set -euo pipefail
cargo clippy
'''
```

mise はシバンタスクをスクリプトファイルとして実行します。[usage spec（原文）](https://mise.jdx.dev/tasks/task-arguments.html) で定義されていない追加の引数は、Bash における `$1` や `$@` のような通常の引数としてスクリプトに渡されます。

```mise-toml
[tasks.greet]
run = '''
#!/usr/bin/env bash
echo "hello $1"
'''
```

```sh
mise run greet world
# hello world
```

シバンがない場合、mise は代わりに引数を最後のコマンドの末尾に追加するため、`$1` は空になります。

### その他の言語 {#other-languages}

シバンや `shell` を使うと、Python、Node.js、Ruby など任意のインタプリタでタスクを実行できます。

::: code-group

```mise-toml [python]
[tools]
python = "latest"

[tasks.python_task]
run = '''
#!/usr/bin/env python
for i in range(10):
    print(i)
'''
```

```mise-toml [python + uv]
[tools]
uv = "latest"

[tasks.python_uv_task]
run = '''
#!/usr/bin/env -S uv run --script
# /// script
# dependencies = ["requests<3", "rich"]
# ///

import requests
from rich.pretty import pprint

resp = requests.get("https://peps.python.org/api/peps.json")
data = resp.json()
pprint([(k, v["title"]) for k, v in data.items()][:10])
'''
```

```mise-toml [node]
[tools]
node = "24"

[tasks.node_task]
shell = "node -e"
run = [
  "console.log('First line')",
  "console.log('Second line')",
]
```

```mise-toml [bun]
[tools]
bun = "latest"

[tasks.bun_shell]
description = "https://bun.sh/docs/runtime/shell"
run = '''
#!/usr/bin/env bun

import { $ } from "bun";
const response = await fetch("https://example.com");
await $`cat < ${response} | wc -c`; // 1256
'''
```

```mise-toml [deno]
[tools]
deno = "latest"

[tasks.deno_task]
run = '''
#!/usr/bin/env -S deno run
console.log(`Hello from Deno ${Deno.version.deno}`)
'''
```

```mise-toml [ruby]
[tools]
ruby = "latest"

[tasks.ruby_task]
run = '''
#!/usr/bin/env ruby
puts 'Hello, ruby!'
'''
```

:::

::: details シバンとは？ `-S` は何をするのか？

シバンとは、スクリプトの先頭にある `#!` という文字列で、そのスクリプトを解釈するプログラムを指定するものです。`#!/usr/bin/env python` は、`PATH` にある `python` でスクリプトを実行します。Linux と macOS ではシステムがシバン行を実行するため、[`env`](https://manpages.ubuntu.com/manpages/jammy/man1/env.1.html) が `PATH` から `python` を見つけます。Windows にはシバンがありません。mise がその行を読み取り、先頭の `/usr/bin/env` または `/usr/bin/env -S` を取り除いて、指定されたインタプリタを自分で起動します。

`-S` は行の残りを個別の引数に分割するため、インタプリタにオプションを渡せます。例えば、`#!/usr/bin/env -S python -u` は、バッファなしの出力で Python を実行します。

:::

### シェルを介さずに実行される単純なコマンド {#simple-commands-run-without-a-shell}

Unix では、タスクがデフォルトのシェルを使う場合、mise は `node build.js` のような単純なインラインのコマンドを `sh` を介さずに直接起動することがあります。シェルの構文（クォート、展開、演算子、ビルトイン）を使うコマンドや、`ENV` または `BASH_ENV` が設定された状態で実行されるコマンドは、引き続きシェルを経由します。サンドボックス化されたタスクや、`cache.audit = true` のタスクも同様です。タスクの `shell`、`mise run --shell`、`unix_default_inline_shell_args` 設定項目は、デフォルトと同じ値を指定していても常にシェルを使います。そのため、`PATH` 上の `sh` という名前のラッパーを必ず実行させる必要がある場合は、これらのいずれかを設定してください。

## ファイルやリモートスクリプトの使用 {#using-a-file-or-remote-script}

`file` は、インラインのコマンドの代わりにスクリプトを実行します。

```toml
[tasks.release]
description = "Cut a new release"
file = "scripts/release.sh"
```

### リモートタスク {#remote-tasks}

`file` では URL からスクリプトを取得することもできます。mise はスクリプトをダウンロードして実行するため、信頼できる取得元だけを使ってください。

#### HTTP {#http}

```toml
[tasks.build]
file = "https://example.com/build.sh"
```

#### Git {#git}

::: code-group

```toml [ssh]
[tasks.build]
file = "git::ssh://git@github.com/myorg/example.git//myfile?ref=v1.0.0"
```

```toml [https]
[tasks.build]
file = "git::https://github.com/myorg/example.git//myfile?ref=v1.0.0"
```

:::

URL の形式は `git::<protocol>://<repository>.git//<path>?ref=<ref>` で、`ref` は省略可能なブランチ、タグ、コミットです。すべてのフィールドについては [Git URL の構文（原文）](https://mise.jdx.dev/tasks/task-discovery.html#git-url-syntax) を参照してください。

#### キャッシュ {#cache}

mise は各リモートタスクファイルを `MISE_CACHE_DIR` の下にキャッシュし、`mise cache clear` を実行するまで再ダウンロードしません。最新のものを取得するには、`mise run --no-cache` を渡すか、[`task.remote_no_cache`（原文）](https://mise.jdx.dev/configuration/settings.html#task.remote_no_cache)（`MISE_TASK_REMOTE_NO_CACHE=1`）を設定します。

## 引数 {#arguments}

引数は `usage` spec で定義します。mise は引数を解析し、それぞれの値を `usage_*` 環境変数としてコマンドに渡します。

```mise-toml
[tasks.test]
usage = '''
arg "<file>" help="Test file to run" default="all"
flag "--format <format>" help="Output format" default="text"
'''
run = 'echo "Testing ${usage_file?} with format ${usage_format?}"'
```

spec の構文については [タスクの引数（原文）](https://mise.jdx.dev/tasks/task-arguments.html) を参照してください。spec がない場合、追加の引数はコマンドに [転送](/tasks/running-tasks.html#pass-arguments) されます。`run` でまだ `arg()`、`option()`、`flag()` を使っているタスクは、[移行ガイド（原文）](https://mise.jdx.dev/tasks/task-arguments.html#tera-templates) に従ってください。
