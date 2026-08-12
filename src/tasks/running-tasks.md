---
title: タスクの実行
upstreamPath: docs/tasks/running-tasks.md
upstreamUrl: https://mise.jdx.dev/tasks/running-tasks.html
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

# タスクの実行 {#running-tasks}

利用可能なタスクは `mise tasks` で確認できます。`hide=true` プロパティで隠されたタスクを表示するには、`--hidden` オプションを使います。

タスクの依存関係は `mise tasks deps [tasks]...` で一覧表示できます。

タスクは `mise tasks run <task>`、`mise run <task>`、`mise r <task>`、または単に `mise <task>` で実行できます — ただし最後の形式は、スクリプトやドキュメントに書くべきではありません。将来の mise のバージョンでその名前のコマンドが追加された場合、タスクはそのコマンドに隠されてしまい、他の形式のいずれかで実行する必要が生じるためです。

多くの mise ユーザーは、`alias mr='mise run'` のような `mise run` のエイリアスを持っています。

デフォルトでは、タスクは最大4つの並列ジョブで実行されます。これは `--jobs` オプション、`jobs` 設定項目、または `MISE_JOBS` 環境変数でカスタマイズできます。出力は通常、タスクのラベルを前置した行単位になります。行単位で出力することで、並列実行の出力が混ざり合うのを避けています。ただし `--jobs == 1` の場合、出力は `interleave` に設定されます。

stdout/stderr をそのまま出力したい場合は、`--output interleave`、`task.output` 設定項目、または `MISE_TASK_OUTPUT=interleave` を使ってください。

出力の _スタイル_（`prefix`、`interleave`、`keep-order` など）は、_詳細度_（`--quiet`/`--silent`、`quiet`/`silent` 設定項目、またはタスクごとの `quiet`/`silent` フィールド）とは独立しています。両者は組み合わせて使えます。例えば `MISE_TASK_OUTPUT=prefix` と `--quiet` を組み合わせると、タスク名のプレフィックスを保ったまま mise 自身のメッセージを抑制できます。`--quiet` はもはやプレフィックスなしの出力を強制しません — 以前のプレフィックスなしの動作が欲しい場合は `--output quiet`（または `-o interleave`）を使ってください。

標準入力（stdin）はデフォルトでは読み込まれません。これを有効にするには、必要なタスクに `raw = true` を設定します。これにより、そのタスクは他のどのタスクとも並列実行されなくなります — この場合、RWMutex が書き込みロックを取得します。また、これにより出力への redaction（値の削除）の適用も無効になります。

タスクには追加の引数を渡せます。例えば、リリースモードで実行したい場合は次のようになります。

```bash
mise run build --release
```

厳密でバリデーションされたタスクインターフェースが必要な場合は、
[`usage` フィールド（原文）](https://mise.jdx.dev/tasks/task-arguments.html#usage-field) を使って引数やオプションを定義してください。`usage` の指定が無い場合、追加の引数は
タスクの実行方式に応じて次のように転送されます。

- `run` が配列の場合、引数はその最後の要素にのみ渡されます。
- 通常のインラインシェルコマンドの場合、引数はコマンドの文字列に追加されます。
- [shebang タスク](/tasks/toml-tasks#shell-shebang) はスクリプトファイルとして実行されるため、そのインタプリタが
  通常の方法で引数を渡します — 例えば Bash では `$1` や `$@` として渡されます。

タスク名の後ろにあるものはすべてそのタスクに属するため、mise 自身のオプションはタスク名の
_前_に置く必要があります — `mise run build --silent` ではなく `mise run --silent build` です。前者は
`--silent` をタスクに渡してしまい、タスクがそれを定義していない限り `unexpected word: --silent` で失敗します。
これは、タスクが mise のオプションと同じ名前のオプションを自由に定義できることも意味します。例えば、
タスク独自の `--env` などです。

:::tip
タスクには引数やオプションを定義でき、これによりバリデーション、パース、自動補完、ドキュメント生成が提供されます。

- [ファイルタスクにおける引数](/tasks/file-tasks#arguments)
- [TOML タスクにおける引数](/tasks/toml-tasks#arguments)

`usage` CLI がインストールされていて mise の補完が動作していれば、タスクの自動補完は自動的に機能します。

Markdown ドキュメントは [`mise generate task-docs`（原文）](https://mise.jdx.dev/cli/generate/task-docs.html) で生成できます。
:::

複数のタスクや引数は、この `:::` 区切り文字で分けられます。

```bash
mise run build arg1 arg2 ::: test arg3 arg4
```

タスクを指定しない場合、mise は "default" という名前のタスクを実行します — ただしそれは "default" という名前のタスクを作成している場合に限ります。別のタスクを "default" のエイリアスにすることもできます。

```bash
mise run
```

## タスクのグルーピング {#task-grouping}

タスクは、`:` で区切った名前のプレフィックスを使うことで、意味的にグループ化できます。
例えば、テスト関連のタスクはすべて `test:` で始められます。ネストしたグループ化を
使えば、グループをさらに細分化し、パターンマッチングを単純化することもできます。
例えば `mise run test:**:local` を実行すると、`test:units:local`、
`test:integration:local`、`test:e2e:happy:local` にマッチします
（詳細は [ワイルドカード](#wildcards) を参照してください）。

::: tip
TOML のキーはクォートしないと `:` を含められないため、`mise.toml` ではクォートしたキーを使ってください。

```toml
[tasks."test:unit"]
run = 'cargo test --lib'
```

:::

## ワイルドカード {#wildcards}

タスクを実行するとき、またはタスクの依存関係を指定するときには、glob 形式のワイルドカードが
サポートされます。

使用できるワイルドカードパターン:

- `?` は任意の1文字にマッチします
- `*` は、単一の `:` 区切りグループ内で0文字以上の文字にマッチします
- `**` は、0個以上の完全な `:` 区切りグループにマッチします
- `{glob1,glob2,...}` は、カンマ区切りの glob パターンのいずれかにマッチします
- `[ab,...]` は、文字または `[a-z]` のような範囲のいずれかにマッチします
- `[!ab,...]` は、その文字セットに含まれない任意の文字にマッチします

### 例 {#examples}

`mise run generate:{completions,docs:*}`

グループ化されたタスクでは、正確に1つのグループだけが変化しうる場合は `*` を使い、
複数のグループにわたってマッチしうる場合は `**` を使います。

```bash
# Matches test:units:local, but not test:e2e:happy:local
mise run 'test:*:local'

# Matches both test:units:local and test:e2e:happy:local
mise run 'test:**:local'
```

古い mise のバージョンで、ネストしたタスクグループへのマッチに `*` を使っていたパターンが
ある場合は、再帰的な動作を維持するために `**` に置き換えてください。

依存関係と組み合わせる場合:

```toml
[tasks."lint:eslint"] # using a ":" means we need to add quotes
run = "eslint ."
[tasks."lint:prettier"]
run = "prettier --check ."
[tasks.lint]
depends = ["lint:*"]
wait_for = ["render"] # does not add as a dependency, but if it is already running, wait for it to finish
```

## ファイル変更時の実行 {#running-on-file-changes}

タスクが使用するファイルが変更されたときにだけそのタスクを実行できると便利な場合がよくあります。例えば、
".rs" ファイルが変更されたときにだけ `cargo build` を実行したい、というような場合です。これは次のような設定で実現できます。

```toml
[tasks.build]
description = 'Build the CLI'
run = "cargo build"
sources = ['Cargo.toml', 'src/**/*.rs'] # skip running if these files haven't changed
outputs = ['target/debug/mycli']
```

これで、`target/debug/mycli` が `Cargo.toml` やどの ".rs" ファイルよりも新しい場合、そのタスクはスキップされます。これは最終更新タイムスタンプを使用しています。
チェックサムのサポートを追加するのも難しくはないでしょう。

## ファイルの監視 {#watching-files}

ソースが変更されたときにタスクを実行するには、[`mise watch`（原文）](https://mise.jdx.dev/cli/watch.html) を使います。

```bash
mise watch build
```

現在、これは単に `watchexec` を呼び出しているだけです（`watchexec` は好きな方法でインストールできます。mise を使う場合は `mise use -g watchexec@latest` です。
これは将来変更される可能性があります）。

## `mise run` の省略形 {#mise-run-shorthand}

タスクは `mise run <TASK>` または `mise <TASK>` で実行できます — ただし後者は、その名前が mise のコマンドと衝突しない場合に限ります。
mise が後で衝突する名前のコマンドを追加する可能性があるため、スクリプトやドキュメントでは
`mise run <TASK>` を使うことが推奨されます。

## 実行順序 {#execution-order}

[depends（原文）](https://mise.jdx.dev/tasks/task-configuration.html#depends)、[wait_for（原文）](https://mise.jdx.dev/tasks/task-configuration.html#wait-for)、[depends_post（原文）](https://mise.jdx.dev/tasks/task-configuration.html#depends-post) を使って、実行順序を制御できます。

```toml
[tasks.build]
run = "echo 'build'"

[tasks.test]
run = "echo 'test'"
depends = ["build"]
```

これにより、`build` タスクが `test` タスクより前に実行されることが保証されます。

他のタスクを並列または順番に実行する mise タスクを定義することもできます。

```toml
[tasks.example1]
run = "echo 'example1'"

[tasks.example2]
run = "mise example2"

[tasks.example3]
run = "echo 'example3'"

[tasks.one_by_one]
run = [
    { task = "example1" }, # will wait for example1 to finish before running the next step
    { tasks = ["example2", "example3"] }, # these 2 are run in parallel
]
```
