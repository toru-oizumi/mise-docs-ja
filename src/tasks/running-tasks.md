---
title: タスクの実行
description: "Run tasks with mise run, select them by name or pattern, pass arguments, and control parallelism and output."
socialDescription: "Run tasks with mise run, select them by pattern, and control parallelism and output."
upstreamPath: docs/tasks/running-tasks.md
upstreamUrl: https://mise.jdx.dev/tasks/running-tasks.html
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# タスクの実行 {#running-tasks}

[`mise run`（原文）](https://mise.jdx.dev/cli/run.html) でタスクを実行します。mise はタスクのツールと環境を読み込み、先に依存関係を実行し、互いに独立したタスクを並列に実行します。1回の実行の中で mise がタスクをどのように順序付けるかは、[依存関係と実行順序（原文）](https://mise.jdx.dev/tasks/architecture.html) で説明しています。

## タスクの検索と実行 {#find-and-run-tasks}

`mise tasks` は、現在のディレクトリで利用可能なタスクを一覧表示します。`hide = true` のタスクも含めるには `--hidden` を、各タスクがどこで定義されているかを見るには `--extended` を付けます。タスクは名前を指定して実行します。

```sh
mise run build
```

### `mise run` の省略形 {#mise-run-shorthand}

`mise run build`、`mise r build`、`mise tasks run build`、`mise build` はいずれも `build` タスクを実行します。最後の形式はタスク名が mise のコマンドと一致しない間だけ機能し、後の mise のリリースでその名前のコマンドが追加される可能性があるため、スクリプトやドキュメントでは `mise run build` と書いてください。インタラクティブに使う場合は、`alias mr='mise run'` のようなシェルのエイリアスを使うと入力の手間を省けます。

### デフォルトタスクの実行 {#run-the-default-task}

タスク名を指定せずに `mise run` を実行すると、`default` という名前の、または `default` をエイリアスに持つタスクが実行されます。

```mise-toml [mise.toml]
[tasks.dev]
alias = "default"
run = "npm run dev"
```

この設定では、`mise run` は `dev` を実行します。`default` タスクが存在しない場合、インタラクティブなターミナルではタスクセレクターが開き、非インタラクティブな実行は `no task default found` で失敗します。

### 複数のタスクの実行 {#run-several-tasks}

それぞれ独自の引数を持つ複数のタスクを、`:::` で区切ります。

```sh
mise run build arg1 arg2 ::: test arg3 arg4
```

どれかが別のタスクに依存していない限り、タスクは並列に実行されます。

## 名前によるタスクの選択 {#select-tasks-by-name}

`test:unit` や `test:e2e` のように、関連するタスクに `:` 区切りのグループで名前を付けると、1つのパターンでそれらを選択できます。`:` を含む TOML のキーにはクォートが必要です。

```mise-toml [mise.toml]
[tasks."test:unit"]
run = "cargo test --lib"
```

ファイルタスクはサブディレクトリからグループを得ます。[ファイルタスク](/tasks/file-tasks.html#task-grouping) を参照してください。

### ワイルドカード {#wildcards}

`mise run` と、`depends` のようなタスクの依存関係では、glob パターンを使えます。

| パターン          | マッチするもの                                  |
| ---------------- | --------------------------------------------- |
| `?`              | 任意の1文字                                     |
| `*`              | 1つの `:` 区切りグループ内の任意の文字列            |
| `**`             | 任意の数の完全なグループ                          |
| `{a,b}`          | いずれかのパターン                               |
| `[abc]`, `[a-z]` | 集合または範囲に含まれる1文字                      |
| `[!abc]`         | 集合または範囲に含まれない1文字                    |

シェルに展開されないよう、パターンはクォートしてください。

```sh
mise run 'test:*:local'                   # test:units:local, not test:e2e:happy:local
mise run 'test:**:local'                  # test:units:local and test:e2e:happy:local
mise run 'generate:{completions,docs:*}'  # generate:completions and every generate:docs:* task
```

パターンは `depends` でも使えます。

```mise-toml [mise.toml]
[tasks."lint:eslint"]
run = "eslint ."

[tasks."lint:prettier"]
run = "prettier --check ."

[tasks.lint]
depends = ["lint:*"]
```

モノレポでは、`//...:test` のように、パターンでプロジェクトを選択することもできます。[モノレポタスク（原文）](https://mise.jdx.dev/tasks/monorepo.html) を参照してください。

## 引数の受け渡し {#pass-arguments}

タスク名の後ろの引数はタスクに渡されます。

```sh
mise run build --release
```

タスクにバリデーションされたインターフェースを持たせるには、[usage spec（原文）](https://mise.jdx.dev/tasks/task-arguments.html) で引数を定義します。spec によって、タスクには `--help`、[シェルの自動補完（原文）](https://mise.jdx.dev/shell-setup.html)、[生成されたドキュメント（原文）](https://mise.jdx.dev/cli/generate/task-docs.html) も備わります。spec がない場合、mise は追加の引数をタスクの形式に応じて次のように転送します。

- `run` が配列の場合、引数はその最後の要素にのみ渡されます。
- インラインコマンドの場合、mise は引数をシェル向けにクォートしたうえで、コマンドに追加します。
- [シバンスクリプト](/tasks/toml-tasks.html#shell-shebang) やファイルタスクは、Bash の `$1` や `$@` のように、引数をスクリプトの引数として受け取ります。

mise 自身のオプションはタスク名の前に置きます（`mise run --silent build`）。タスク名の後ろにあるものはすべてタスクに属します。usage spec のないタスクは `--silent` を引数として受け取り、spec のあるタスクは、その spec がそのオプションを定義していない限り `unexpected word: --silent` で失敗します。タスクは `--env` のように、mise のオプションと同じ名前のオプションを定義できます。

## 実行の制御 {#control-a-run}

次の [`mise run`（原文）](https://mise.jdx.dev/cli/run.html) のオプションは、実行の進み方を変更します。

| オプション                     | 効果                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-j`, `--jobs <N>`            | 最大 N 個のタスクを同時に実行します。デフォルトは [`jobs`（原文）](https://mise.jdx.dev/configuration/settings.html#jobs) 設定項目（`MISE_JOBS`）の値です。                                                                  |
| `-f`, `--force`               | タスクの [出力が最新](#skip-tasks-that-are-up-to-date) の場合でも、タスクを実行します。                                                                                                                                  |
| `-n`, `--dry-run`             | 何も実行せずに、各タスクのコマンドを実行順に表示します。                                                                                                                                                                  |
| `-c`, `--continue-on-error`   | タスクが失敗した後も実行を続けます。[タスクが失敗したとき](#when-a-task-fails) を参照してください。                                                                                                                         |
| `--skip-deps`                 | 依存関係を含めず、指定したタスクだけを実行します。                                                                                                                                                                       |
| `--timeout <DURATION>`        | `30s` や `5m` のような時間が経過した後に、実行全体を停止します。[`task.timeout`（原文）](https://mise.jdx.dev/configuration/settings.html#task.timeout) 設定項目より優先されます。                                         |
| `-C`, `--cd <DIR>`            | mise が別のディレクトリで起動したかのように実行します。                                                                                                                                                                  |
| `-t`, `--tool <TOOL@VERSION>` | `--tool node@24` のように、実行にツールを追加します。                                                                                                                                                                    |
| `--skip-tools`                | タスクの開始前に、不足しているツールをインストールしません。                                                                                                                                                               |
| `-r`, `--raw`                 | stdin、stdout、stderr を各タスクに直接接続し、一度に1つのタスクを実行します。redaction（値の削除）は適用されません。ただし、[シークレット（原文）](https://mise.jdx.dev/tasks/task-configuration.html#secrets) を受け取るタスクは `--raw` を無視するため、それらのタスクには適用されます。 |

`--timeout` を渡した場合でも、タスク自身の [`timeout`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#timeout) は引き続きそのコマンドを制限します。

### タスクが失敗したとき {#when-a-task-fails}

デフォルトでは、タスクが失敗すると実行が停止します。mise はまだ実行中のタスクを（Unix では SIGTERM で）停止し、新しいタスクを開始しません。ただし、すでに開始したタスクの [`depends_post`（原文）](https://mise.jdx.dev/tasks/architecture.html#depends-post) タスクは例外です。実行は、失敗したタスクの終了ステータスで終了します。

`--continue-on-error` を指定すると、実行中のタスクは最後まで実行され、残りのタスクも、失敗したタスクに依存するタスクを含めて開始されます。最後に mise は失敗したタスクを一覧表示し、ゼロ以外のステータスで終了します。

## 出力 {#output}

タスクが並列に実行されるとき、mise は各出力行にタスク名のラベルを付けます（`prefix`）。一度に1つのタスクしか実行できない場合（単一のタスク、依存関係の連鎖、または `--jobs 1`）は、出力を直接表示します（`interleave`）。スタイルは `--output`、`MISE_TASK_OUTPUT`、[`task.output`（原文）](https://mise.jdx.dev/configuration/settings.html#task.output) 設定項目、またはタスクの [`output`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#output) プロパティで選択します。

| スタイル      | 出力                                                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `prefix`     | タスク名のラベルを付けた各行。                                                                                                                 |
| `interleave` | 届いたとおりの出力。ラベルは付きません。                                                                                                         |
| `keep-order` | ラベル付きの行。1つのタスクはライブでストリーミングされ、他のタスクはバッファされて順番に表示されます。                                                     |
| `replacing`  | 新しい stdout の行が直前の行を置き換えます。stderr はそのまま表示されます。                                                                          |
| `timed`      | ラベル付きの stdout の行。各行は少なくとも1秒間はタスクの最新行として表示され続け、それより早く置き換えられた行は破棄されます。stderr はそのまま表示されます。 |
| `silent`     | エラーを除き、タスクからも mise からも何も表示しません。                                                                                            |

詳細度はスタイルとは独立しています。`--quiet` は `[build] $ cargo build` のような mise 自身のメッセージを非表示にし、`--silent` はさらにタスクの出力も非表示にします。例えば `mise run --output prefix --quiet test` は、ラベルを保ったまま mise のメッセージを非表示にします。他の mise コマンドを変えずにすべてのタスクを quiet にするには、`[settings]` の下で [`task.quiet`（原文）](https://mise.jdx.dev/configuration/settings.html#task.quiet) を設定します。タスクは自身の `quiet` や `silent` プロパティを設定することもできます。`quiet` 出力スタイルは非推奨です。代わりに `--output interleave --quiet` を使ってください。

## インタラクティブな入力 {#interactive-input}

タスクが `interactive` または `raw` でない限り、stdin は `interleave` 出力のときにだけ接続されます。これは単一のタスク、順次実行の連鎖、`--jobs 1` のときのデフォルトであり、`--output interleave` を渡したときも該当します。並列実行時のデフォルトである `prefix` を含む他の出力スタイルでは、stdin は接続されません。出力に redaction が必要な場合、つまりタスクが [シークレット（原文）](https://mise.jdx.dev/tasks/task-configuration.html#secrets) を受け取る場合や、設定で `redact = true` または `redactions` によって値を [redaction（原文）](https://mise.jdx.dev/environments/secrets/#redaction) の対象にしている場合も、stdin は接続されません。

プロンプトを表示するタスクなど、ターミナルを必要とするタスクには `interactive = true` を設定します。そのタスクは実行中、ターミナルへの排他的なアクセスを持ちます。`raw = true` は代わりに、コマンドごとに排他的なアクセスを取得します。どちらも出力の redaction とアーティファクトキャッシュを迂回します。[`interactive`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#interactive) と [`raw`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#raw) を参照してください。

## 最新のタスクのスキップ {#skip-tasks-that-are-up-to-date}

タスクに `sources` と `outputs` を指定すると、mise は出力が最新である間、そのタスクをスキップします。

```mise-toml [mise.toml]
[tasks.build]
description = "Build the CLI"
run = "cargo build"
sources = ["Cargo.toml", "src/**/*.rs"]
outputs = ["target/debug/mycli"]
```

出力がソースより新しく、最後に成功した実行以降に何も変更されていない間は、mise はタスクを実行する代わりに `[build] sources up-to-date, skipping` と表示します。正確な検査内容は [タスクが古くなる条件（原文）](https://mise.jdx.dev/tasks/caching.html#what-makes-a-task-stale) に一覧があります。それでも実行するには `mise run --force build` を使います。[タスクのキャッシュ（原文）](https://mise.jdx.dev/tasks/caching.html) では、削除された出力を復元できるアーティファクトキャッシュについても説明しています。

## ファイル変更時のタスクの再実行 {#rerun-tasks-when-files-change}

[`mise watch`（原文）](https://mise.jdx.dev/cli/watch.html) はタスクを実行し、そのソースが変更されると再実行します。

```sh
mise watch build
```

mise は、タスクとその依存関係の `sources` を監視します。`sources` のないタスクは、現在のディレクトリを監視します。開発サーバーのように実行し続けるプロセスの場合は、変更のたびに再起動します。

```sh
mise watch --restart dev
```

`mise run` と同様に、複数のタスクは `:::` で区切ります。タスク名を指定しない場合、`mise watch` は `default` タスクを実行します。`mise watch` は [watchexec](https://github.com/watchexec/watchexec) を使います。`mise use watchexec` でインストールするか、自分で `PATH` に置いてください。

`mise watch` は、`--debounce`、`--clear`、`--shell` などの watchexec のオプションを watchexec に引き渡します。`-E` と `-q` は mise 自身の `--env` と `--quiet` のままであるため、watchexec の `--env` と `--quiet` は、`mise watch` では `--watchexec-env` と `--watchexec-quiet` と書きます。

```sh
mise watch -E dev --watchexec-env LOG_LEVEL=debug build
```

## タスクの環境 {#task-environment}

タスクは、プロジェクトの [環境変数](/environments/) とツールに加えて、次の変数を持った状態で実行されます。

| 変数                         | 値                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MISE_ORIGINAL_CWD`         | mise を実行したディレクトリ。                                                                                                                                                                                 |
| `MISE_CONFIG_ROOT`          | タスクを定義しているファイルの [設定ルート](/configuration.html#config-root)。例えば `~/proj/mise.toml` と `~/proj/.config/mise.toml` のどちらでも `~/proj` です。                                                       |
| `MISE_PROJECT_ROOT`         | どのディレクトリから実行したかにかかわらず、タスクを定義しているプロジェクトのルート。モノレポではサブプロジェクトのディレクトリです。グローバルタスクやリモートタスクでは、それを実行したプロジェクトです。                                       |
| `MISE_MONOREPO_ROOT`        | 設定で `monorepo_root = true` を指定しているディレクトリ。[モノレポ（原文）](https://mise.jdx.dev/tasks/monorepo.html) でのみ設定されます。                                                                             |
| `MISE_TASK_NAME`            | `mise tasks ls` で表示されるタスク名。ファイルタスクの名前には、別のタスクがすでにより短い名前を持っている場合を除き、スクリプトの拡張子が付きません。[ファイルタスクの名前](/tasks/file-tasks.html#task-grouping) を参照してください。 |
| `MISE_TASK_FILE`            | タスクのスクリプト。ファイルタスクそのもの、または TOML タスクの `file` で指定されたファイルです。インラインの `run` を持つ TOML タスクでは、それを定義している設定ファイルです。                                                    |
| `MISE_TASK_DIR`             | `MISE_TASK_FILE` を含むディレクトリ。                                                                                                                                                                         |
| `MISE_TASK_COLOR`           | タスクのラベルの色を表す ANSI シーケンス。色が無効な場合、タスクが quiet の場合、または出力スタイルがラベルを表示しない場合（`interleave`、`silent`）は空です。                                                                   |
| `MISE_ENV`                  | 何らかの [設定環境](/configuration/environments.html) が設定されている場合の、有効な設定環境のカンマ区切りの一覧。                                                                                                   |
| `TRACEPARENT`, `TRACESTATE` | [OpenTelemetry（原文）](https://mise.jdx.dev/tasks/opentelemetry.html#trace-propagation) のエクスポートが有効な場合の、タスクのトレースコンテキスト。                                                                  |
| `usage_*`                   | タスクの [引数とオプション（原文）](https://mise.jdx.dev/tasks/task-arguments.html) の値。                                                                                                                        |

`~/proj/.config/mise.toml` 内の TOML タスクでは、`MISE_TASK_DIR` は `~/proj/.config` ですが、`MISE_CONFIG_ROOT` は `~/proj` です。`MISE_TASK_COLOR` を使って表示する場合は、テキストの後で色をリセットしてください。

```sh
printf '%smessage\033[0m\n' "$MISE_TASK_COLOR"
```
