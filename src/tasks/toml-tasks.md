---
title: TOML タスク
upstreamPath: docs/tasks/toml-tasks.md
upstreamUrl: https://mise.jdx.dev/tasks/toml-tasks.html
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

<!-- verify-allow: フラグ -->
<!-- このページでは usage spec の {{option()}} と {{flag()}} が別概念として並ぶため、
     flag を「フラグ」と訳している。理由は glossary.md を参照 -->

# TOML タスク {#toml-based-tasks}

タスクは `mise.toml` ファイルの中でさまざまな方法で定義できます。単純なタスクは `[tasks]` セクションに書き込め、より詳細なタスクはそれぞれ専用のセクションを持ちます。

## 単純なタスクの例 {#trivial-task-examples}

```mise-toml [mise.toml]
build = "cargo build"
test = "cargo test"
lint = "cargo clippy"
```

## 詳細なタスクの例 {#detailed-task-examples}

```mise-toml [mise.toml]
[tasks.cleancache]
run = "rm -rf .cache"
hide = true # hide this task from the list

[tasks.clean]
depends = ['cleancache']
run = "cargo clean" # runs as a shell command

[tasks.build]
description = 'Build the CLI'
run = "cargo build"
alias = 'b' # `mise run b`

[tasks.test]
description = 'Run automated tests'
# multiple commands are run in series
run = [
    'cargo test',
    './scripts/test-e2e.sh',
]
dir = "{{cwd}}" # run in user's cwd, default is the project's base directory

[tasks.lint]
description = 'Lint with clippy'
env = { RUST_BACKTRACE = '1' } # env vars for the script
# you can specify a multiline script instead of individual commands
run = '''
#!/usr/bin/env bash
cargo clippy
'''

[tasks.ci] # only dependencies to be run
description = 'Run CI tasks'
depends = ['build', 'lint', 'test']

[tasks.release]
confirm = 'Are you sure you want to cut a new release?'
description = 'Cut a new release'
file = 'scripts/release.sh' # execute an external script
```

共通の引数を定義するには、[環境変数](/environments/) や [`vars`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#vars) を使えます。

```mise-toml [mise.toml]
[env]
VERBOSE_ARGS = '--verbose'

# Vars can be shared between tasks like environment variables,
# but they are not passed as environment variables to the scripts
[vars]
e2e_args = '--headless'

[tasks.test]
run = './scripts/test-e2e.sh {{vars.e2e_args}} $VERBOSE_ARGS'
```

## タスクの追加 {#adding-tasks}

`mise.toml` ファイルを直接編集することもできますし、[`mise tasks add`（原文）](https://mise.jdx.dev/cli/tasks/add.html) を使うこともできます。

```shell
mise tasks add pre-commit --depends "test" --depends "render" -- echo pre-commit
```

これは `mise.toml` に以下を追加します。

```shell
[tasks.pre-commit]
depends = ["test", "render"]
run = "echo pre-commit"
```

## 共通のオプション {#common-options}

網羅的なリストは [タスクの設定（原文）](https://mise.jdx.dev/tasks/task-configuration.html) を参照してください。

### run コマンド {#run-command}

実行するスクリプトを指定します。単一のコマンドでも、コマンドの配列でも構いません。

```mise-toml
[tasks.test]
run = 'cargo test'
```

コマンドは直列に実行されます。コマンドが失敗すると、タスクは停止し、残りのコマンドは実行されません。

```mise-toml
[tasks.test]
run = [
    'cargo test',
    './scripts/test-e2e.sh',
]
```

`run_windows` キーを使うと、Windows で実行する別のコマンドを指定できます。

```mise-toml
[tasks.test]
run = 'cargo test'
run_windows = 'cargo test --features windows'
```

### 使用するディレクトリの指定 {#specifying-which-directory-to-use}

[`dir`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#dir) プロパティは、タスクが実行される `cwd` を決定します。<span v-pre>`dir = "{{cwd}}"`</span> を使うことで、タスクを実行した場所のディレクトリを使えます。

```mise-toml
[tasks.test]
run = 'cargo test'
dir = "{{cwd}}"
```

また、`MISE_ORIGINAL_CWD` には元の作業ディレクトリが設定され、タスクに渡されます。

### 説明とエイリアスの追加 {#adding-a-description-and-alias}

タスクに説明とエイリアスを追加できます。

```mise-toml
[tasks.build]
description = 'Build the CLI'
run = "cargo build"
alias = 'b' # `mise run b`
```

- このエイリアスはタスクを実行するために使えます
- この説明は、引数なしで [`mise tasks ls`（原文）](https://mise.jdx.dev/cli/tasks/ls.html) や [`mise run`（原文）](https://mise.jdx.dev/cli/run.html) を実行したときに表示されます

```shell
❯ mise run
Tasks
# Select a task to run
# > build  Build the CLI
#   test   Run the tests
```

### 依存関係 {#dependencies}

タスクの依存関係を指定できます。依存関係はタスク自身より先に実行されます。依存関係が失敗した場合、タスクは実行されません。

```mise-toml
[tasks.build]
run = 'cargo build'

[tasks.test]
depends = ['build']
```

依存関係を指定する他の方法もあります。[wait_for（原文）](https://mise.jdx.dev/tasks/task-configuration.html#wait-for) と [depends_post（原文）](https://mise.jdx.dev/tasks/task-configuration.html#depends-post) を参照してください。

### 環境変数 {#environment-variables}

タスクに環境変数を指定できます。

```mise-toml
[tasks.lint]
description = 'Lint with clippy'
env = { RUST_BACKTRACE = '1' } # env vars for the script
# you can specify a multiline script instead of individual commands
run = '''
#!/usr/bin/env bash
cargo clippy
'''
```

### Sources / Outputs {#sources-outputs}

特定のファイルが変更されていない場合（最新の状態）にタスクの実行をスキップしたい場合は、`sources` と `outputs` を指定します。

```mise-toml
[tasks.build]
description = 'Build the CLI'
run = "cargo build"
sources = ['Cargo.toml', 'src/**/*.rs'] # skip running if these files haven't changed
outputs = ['target/debug/mycli']
```

[`mise watch`（原文）](https://mise.jdx.dev/cli/watch.html) と併用する場合は `sources` だけを使い、ソースが変更されたときにタスクを実行できます。
[`task_source_files()`（原文）](https://mise.jdx.dev/templates.html#task-source-files) 関数を使うと、[テンプレート（原文）](https://mise.jdx.dev/templates.html) の中からタスクの `sources` の解決済みパスを取得できます。

### 確認 {#confirmation}

タスクを実行する前に表示するメッセージです。ユーザーはタスクが実行される前に確認を求められます。

```mise-toml
[tasks.release]
confirm = 'Are you sure you want to cut a new release?'
description = 'Cut a new release'
file = 'scripts/release.sh'
```

## シェルやインタプリタの指定 {#shell-shebang}

シェルが `sh`、`bash`、`zsh` の場合、タスクは `set -e`（`set -o erropt`）で実行されます。つまり、いずれかのコマンドが失敗するとスクリプトは終了します。スクリプト内で `set +e` を実行することで、これを無効にできます。

```mise-toml
[tasks.echo]
run = '''
set +e
cd /nonexistent
echo "This will not fail the task"
'''
```

スクリプトの実行に使う `shell` コマンドを指定できます（デフォルトは [`sh -c`（原文）](https://mise.jdx.dev/configuration/settings.html#unix_default_inline_shell_args) または [`cmd /c`（原文）](https://mise.jdx.dev/configuration/settings.html#windows_default_inline_shell_args)）。

```mise-toml
[tasks.lint]
shell = 'bash -c'
run = "cargo clippy"
```

あるいはシバンを使います。

```mise-toml
[tasks.lint]
run = '''
#!/usr/bin/env bash
cargo clippy
'''
```

シバンタスクはスクリプトファイルとして実行されます。[`usage` 仕様（原文）](https://mise.jdx.dev/tasks/task-arguments.html#usage-field) で定義されていない追加の引数は、Bash における `$1` や `$@` のような通常のスクリプト引数として渡されます。

```mise-toml
[tasks.greet]
run = '''
#!/usr/bin/env bash
echo "hello $1"
'''
```

```shell
$ mise run greet world
hello world
```

`shebang`（または `shell`）を使うことで、異なる言語（Python、Node.js、Ruby など）でタスクを実行できます。

::: code-group

```mise-toml [python]
[tools]
python = 'latest'

[tasks.python_task]
run = '''
#!/usr/bin/env python
for i in range(10):
    print(i)
'''
```

```mise-toml [python + uv]
[tools]
uv = 'latest'

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
node = 'lts'

[tasks.node_task]
shell = 'node -e'
run = [
  "console.log('First line')",
  "console.log('Second line')",
]
```

```mise-toml [bun]
[tools]
bun = 'latest'

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
deno = 'latest'

[tasks.deno_task]
description = "A more complex task using Deno imports"
run = '''
#!/usr/bin/env -S deno run
import ProgressBar from "jsr:@deno-library/progress";
import { delay } from "jsr:@std/async";

if (!confirm('Start download?')) {
    Deno.exit(1);
}

const progress = new ProgressBar({ title:  "downloading:", total: 100 });
let completed = 0;
async function download() {
  while (completed <= 100) {
    await progress.render(completed++);
    await delay(10);
  }
}
await download();
'''
# ❯ mise run deno_task
# [download_task] $ import ProgressBar from "jsr:@deno-library/progress";
# Start download? [y/N] y
# downloading: ...
```

```mise-toml [ruby]
[tools]
ruby = 'latest'

[tasks.ruby_task]
run = '''
#!/usr/bin/env ruby
puts 'Hello, ruby!'
'''
```

:::

::: details シバンとは？ `#!/usr/bin/env` と `#!/usr/bin/env -S` の違いとは？

シバンとは、スクリプトファイルの先頭にある `#!` という文字列で、そのスクリプトを解釈・実行するために使うプログラムをシステムに伝えるものです。
[env コマンド](https://manpages.ubuntu.com/manpages/jammy/man1/env.1.html) は GNU Coreutils に由来します。`mise` は `env` を使いませんが、同様に振る舞います。

例えば、`#!/usr/bin/env python` は `PATH` にある Python インタプリタでスクリプトを実行します。

`-S` フラグは、インタプリタに複数の引数を渡せるようにします。行の残りを1つの引数文字列として扱い、それを分割します。

これは、インタプリタのフラグやオプションを指定する必要がある場合に便利です。
例: `#!/usr/bin/env -S python -u` は、バッファなしの出力で Python を実行します。

:::

## ファイルやリモートスクリプトの使用 {#using-a-file-or-remote-script}

タスクとして実行するファイルを指定できます。

```mise-toml
[tasks.release]
description = 'Cut a new release'
file = 'scripts/release.sh' # execute an external script
```

### リモートタスク {#remote-tasks}

タスクファイルは複数のプロトコルでリモートから取得できます。

#### HTTP {#http}

```mise-toml
[tasks.build]
file = "https://example.com/build.sh"
```

ファイルはダウンロードされて実行される点に注意してください。取得元を信頼できることを必ず確認してください。

#### Git <Badge type="warning" text="experimental" /> {#git}

::: code-group

```mise-toml [ssh]
[tasks.build]
file = "git::ssh://git@github.com/myorg/example.git//myfile?ref=v1.0.0"
```

```mise-toml [https]
[tasks.build]
file = "git::https://github.com/myorg/example.git//myfile?ref=v1.0.0"
```

:::

URL の形式は `git::<protocol>://<url>//<path>?<ref>` というパターンに従う必要があります。

必須フィールド:

- `protocol`: git リポジトリの URL です。
- `url`: git リポジトリの URL です。
- `path`: リポジトリ内のファイルへのパスです。

オプションフィールド:

- `ref`: git のリファレンス（ブランチ、タグ、コミット）です。

#### キャッシュ {#cache}

各タスクファイルは `MISE_CACHE_DIR` ディレクトリにキャッシュされます。ファイルが更新されても、キャッシュがクリアされない限り再ダウンロードされません。

:::tip
`mise cache clear` を実行することでキャッシュをリセットできます。
:::

`MISE_TASK_REMOTE_NO_CACHE` 環境変数を使うと、リモートタスクのキャッシュを無効にできます。

## 引数 {#arguments}

::: tip
タスクの引数についての包括的な情報は、専用の [タスクの引数（原文）](https://mise.jdx.dev/tasks/task-arguments.html) ページを参照してください。
:::

デフォルトでは、引数は `run` 配列の最後のスクリプトに渡されます。そのため、タスクが以下のように定義されている場合、

```mise-toml
[tasks.test]
run = ['cargo test', './scripts/test-e2e.sh']
```

`mise run test foo bar` を実行すると、`foo bar` は `./scripts/test-e2e.sh` には渡されますが、`cargo test` には渡されません。

### 推奨: usage フィールドの使用 {#recommended-using-the-usage-field}

引数を定義する推奨の方法は `usage` フィールドを使うことです。

```mise-toml
[tasks.test]
usage = '''
arg "<file>" help="Test file to run" default="all"
flag "--format <format>" help="Output format" default="text"
flag "-v --verbose" help="Enable verbose output"
'''
run = 'cargo test ${usage_file?} --format ${usage_format?}'
```

usage フィールドで定義された引数は、`usage_` を前置した環境変数として利用できます。

完全なドキュメントは [タスクの引数（原文）](https://mise.jdx.dev/tasks/task-arguments.html#usage-field) ページを参照してください。

### Tera テンプレート関数 <Badge type="danger" text="deprecated" /> {#tera-template-functions}

::: danger Deprecated - Removal in 2027.5.0
run スクリプトで Tera テンプレート関数（`arg()`、`option()`、`flag()`）を使うことは**非推奨**であり、**mise 2027.5.0 で削除されます**。2026.5.0 以上のバージョンでは非推奨の警告が表示されます。

**削除される理由:**

- テンプレート関数はスペック収集時に空文字列を返します（2パス解析の問題）
- 複雑で予測できないシェルのエスケープ規則
- TOML タスクとファイルタスクの間で動作が一貫していません

**代わりに `usage` フィールドを使うように移行してください。** [移行ガイド（原文）](https://mise.jdx.dev/tasks/task-arguments.html#tera-templates) を参照してください。
:::

<details>
<summary>非推奨の Tera テンプレート構文を見る（非推奨）</summary>

Tera テンプレート関数（非推奨）を使って引数を定義できます。

```mise-toml
[tasks.test]
run = [
    'cargo test {{arg(name="cargo_test_args", var=true)}}',
    './scripts/test-e2e.sh {{option(name="e2e_args")}}',
]
```

`mise run test foo bar` を実行すると、`foo bar` は `cargo test` に渡されます。
`mise run test --e2e-args baz` は `baz` を `./scripts/test-e2e.sh` に渡します。

#### 位置引数 {#positional-arguments}

これらはスクリプト内で <span v-pre>`{{arg()}}`</span> によって定義されます。順序が重要な位置引数のために使われます。

例:

```mise-toml
[tasks.test]
run = 'cargo test {{arg(name="file")}}'
# execute: mise run test my-test-file
# runs: cargo test my-test-file
```

- `i`: 引数のインデックスです。引数の順序を指定するために使えます。デフォルトでは
  スクリプト内で定義された順序になります。
- `name`: 引数の名前です。ヘルプ/エラーメッセージに使われます。
- `var`: `true` の場合、複数の引数を渡せます。
- `default`: 引数が指定されない場合のデフォルト値です。

#### オプション {#options}

これらはスクリプト内で <span v-pre>`{{option()}}`</span> によって定義されます。順序が関係ない名前付き引数のために使われます。

例:

```mise-toml
[tasks.test]
run = 'cargo test {{option(name="file")}}'
# execute: mise run test --file my-test-file
# runs: cargo test my-test-file
```

- `name`: 引数の名前です。ヘルプ/エラーメッセージに使われます。
- `var`: `true` の場合、複数の値を渡せます。
- `default`: オプションが指定されない場合のデフォルト値です。

#### フラグ {#flags}

フラグはオプションと似ていますが、値を取りません。スクリプト内で <span v-pre>
`{{flag()}}`</span> によって定義されます。

例:

```mise-toml
[tasks.echo]
run = 'echo {{flag(name="myflag")}}'
# execute: mise run echo --myflag
# runs: echo true
```

```mise-toml
[tasks.maybeClean]
run = '''
if [ '{{flag(name='clean')}}' = 'true' ]; then
  echo 'cleaning'
fi
'''
# execute: mise run maybeClean --clean
# runs: echo cleaning
```

- `name`: フラグの名前です。ヘルプ/エラーメッセージに使われます。

値はフラグが渡された場合は `true`、そうでない場合は `false` になります。

</details>
