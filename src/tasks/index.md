---
title: タスクの概要
description: "Run builds, tests, and deployments with your project's tools and environment."
upstreamPath: docs/tasks/index.md
upstreamUrl: https://mise.jdx.dev/tasks/
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# タスクの概要 {#tasks}

タスクとは、プロジェクトのツールと環境変数を使って実行される、名前付きのコマンドまたはスクリプトです。ビルド、テスト、リンター、開発サーバーなど、チームメンバーと CI が同じ方法で実行すべきコマンドにタスクを使います。

## 最初のタスクを実行する {#run-your-first-task}

プロジェクトディレクトリの `mise.toml` にタスクを追加します。

```mise-toml [mise.toml]
[tasks.hello]
description = "Check that task execution works"
run = "echo hello from mise"
```

[`mise run`（原文）](https://mise.jdx.dev/cli/run.html) で実行します。

```sh
mise run hello
```

```text
[hello] $ echo hello from mise
hello from mise
```

mise は実行するコマンドを表示し、続いてそのコマンドの出力を表示します。シェルの有効化は必要ありません。`mise run` はプロジェクトの設定を読み込み、[`task.run_auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#task.run_auto_install) がオフでない限り、タスクの開始前に不足しているツールをインストールします。`mise tasks ls` でタスクの一覧を表示し、`mise tasks info hello` でタスクがどこで定義されているかを確認できます。

## タスクの形式を選ぶ {#choose-a-task-format}

| 形式                                 | 使う場面                                                                          | 置き場所                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [TOML タスク](/tasks/toml-tasks.html) | コマンドが1〜2行に収まる場合、またはタスクの大半が他のタスクの実行である場合。 | `mise.toml` 内の `[tasks.<name>]`                                 |
| [ファイルタスク](/tasks/file-tasks.html) | スクリプトが長く、エディターのシンタックスハイライトやリントの恩恵を受けられる場合。 | `mise-tasks/` または別のタスクディレクトリにある実行可能なスクリプト |

どちらの形式も同じランナーを使い、ほとんどのプロパティを共通して受け付けます。まず TOML で始め、スクリプトが大きくなったらファイルに移すとよいでしょう。どちらの形式も、[タスクテンプレート（原文）](https://mise.jdx.dev/tasks/templates.html)から共通の設定を継承できます。

## タスクをスクリプトとして書く {#write-a-task-as-a-script}

スクリプトを `mise-tasks/hello` として保存します。

```sh [mise-tasks/hello]
#!/usr/bin/env bash
#MISE description="Check that task execution works"
echo "hello from a file task"
```

Linux と macOS では、`chmod +x mise-tasks/hello` で実行可能にしてから `mise run hello` を実行します。`hello` という名前は、このファイルか上記の TOML タスクのどちらか一方で定義し、両方で定義しないでください。Windows でどのファイルがタスクとして扱われるかは [ファイルタスク](/tasks/file-tasks.html#windows) で説明しています。

## 依存関係でタスクをまとめる {#group-tasks-with-dependencies}

`depends` だけを持つタスクは、他のタスクを実行します。前提となるタスクは並列に実行される場合があり、`depends` 内の順序は実行順を決めません。

```mise-toml [mise.toml]
[tasks.check]
depends = ["format", "test"]

[tasks.format]
run = "echo checking formatting"

[tasks.test]
run = "echo running tests"
```

`mise run check` は `format` と `test` を実行します。`echo` コマンドはプロジェクトのチェックに置き換えてください。あるステップが終わってから次のステップを始める必要がある場合は、代わりに [実行ステップ（原文）](https://mise.jdx.dev/tasks/architecture.html#run-steps-in-order) を使います。

## タスクのワークフローを組み立てる {#build-a-task-workflow}

- [タスクの実行](/tasks/running-tasks.html): 名前やパターンでタスクを選択し、引数を渡し、並列度と出力を制御します。タスクには [タスクを説明する変数](/tasks/running-tasks.html#task-environment)も渡されます。
- [タスクの引数（原文）](https://mise.jdx.dev/tasks/task-arguments.html): バリデーション、`--help`、自動補完を備えたコマンドラインインターフェースをタスクに持たせます。
- [依存関係と実行順序（原文）](https://mise.jdx.dev/tasks/architecture.html): `depends`、`wait_for`、`depends_post`、実行ステップの中から選びます。
- [タスクの検出と優先順位（原文）](https://mise.jdx.dev/tasks/task-discovery.html): mise がタスクをどこで見つけるか、どの定義が優先されるかを説明します。
- [タスクテンプレート（原文）](https://mise.jdx.dev/tasks/templates.html): ツール、環境変数、引数を複数のタスクで共有します。
- [タスクのキャッシュ（原文）](https://mise.jdx.dev/tasks/caching.html): 入力が変わっていない作業をスキップまたは復元します。
- [モノレポのタスク（原文）](https://mise.jdx.dev/tasks/monorepo.html): 複数のプロジェクトルートにまたがってタスクを実行します。
- [タスク設定リファレンス（原文）](https://mise.jdx.dev/tasks/task-configuration.html): すべてのタスクプロパティと `task.*` 設定項目を掲載しています。
