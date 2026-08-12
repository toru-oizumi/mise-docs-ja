---
title: タスクの概要
upstreamPath: docs/tasks/index.md
upstreamUrl: https://mise.jdx.dev/tasks/
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

# タスクの概要 {#tasks}

> ビルド、テスト、リント、デプロイ、そして日々の開発ワークフローのために、プロジェクトの _タスク_ を定義し、実行します。

タスクは `mise.toml` ファイルの中で定義することも、スタンドアロンのシェルスクリプトとして定義することもできます。これは、リンター、テスト、ビルダー、サーバーなど、プロジェクト固有のタスクを実行する際に便利です。もちろん、mise で起動したタスクには mise の環境が含まれます — つまり `mise.toml` で定義されたツールや環境変数です。

mise のタスクランナーで気に入っている機能を紹介します。

- 依存関係を並列にビルドできる点 — デフォルトで、追加の設定は不要
- 変更が無いときの再ビルドを避けられる点 — 最終更新時刻によるチェックで、最小限の設定で済む
- 変更を検知して自動的に再ビルドする [mise watch](/tasks/running-tasks.html#watching-files) が使える点 — 設定は不要だが、あると便利
- シンタックスハイライトやリンティング/チェックのサポートが無い yml/json/toml の文字列の中身としてではなく、実際の bash スクリプトファイルとしてタスクを書ける点

タスクを定義する方法は2つあります。[`mise.toml` ファイルの内部](/tasks/toml-tasks.html)で定義する方法と、[スタンドアロンのシェルスクリプト](/tasks/file-tasks.html)として定義する方法です。再利用可能なタスク定義を作るために、[タスクテンプレート（原文）](https://mise.jdx.dev/templates.html)を使うこともできます。

## `mise.toml` ファイルでのタスク {#tasks-in-mise-toml-files}

タスクは `mise.toml` ファイルの `[tasks]` セクションで定義します。

```toml [mise.toml]
[tasks.build]
description = "Build the CLI"
run = "cargo build"
```

その後、`mise run build`（既存のコマンドと衝突しなければ `mise build` でも可）でタスクを実行できます。

- 詳細は [TOML タスク](/tasks/toml-tasks.html) を参照してください。
- タスクの実行方法については [タスクの実行](/tasks/running-tasks.html) を参照してください。

## ファイルタスク {#file-tasks}

タスクはスタンドアロンのシェルスクリプトとしても定義できます。必要なのは、`mise-tasks` のような特定のディレクトリに `executable`（実行可能）なファイルを作成することだけです。

```sh [mise-tasks/build]
#!/usr/bin/env bash
#MISE description="Build the CLI"
cargo build
```

TOML タスクと同様に、`mise run build` でタスクを実行できます。
詳細は [ファイルタスクのリファレンス](/tasks/file-tasks.html) を参照してください。

## タスクに渡される環境変数 {#environment-variables-passed-to-tasks}

以下の環境変数がタスクに渡されます。

- `MISE_ORIGINAL_CWD`: タスクが実行された元の作業ディレクトリ。
- `MISE_CONFIG_ROOT`: タスクが定義された `mise.toml` ファイルを含むディレクトリ。設定ファイルのパスが `~/src/myproj/.config/mise.toml` のような形式であれば、`~/src/myproj` になります。
- `MISE_PROJECT_ROOT`: タスクを定義するプロジェクトのルート。モノレポのサブプロジェクトのタスクの場合、これはそのサブプロジェクトのディレクトリであり、タスクがどのディレクトリから呼び出されたかにかかわらず安定しています。
- `MISE_MONOREPO_ROOT`: モノレポのルート（`monorepo_root = true` の設定を含むディレクトリ）。モノレポ内でのみ設定されます。
- `MISE_TASK_NAME`: 実行されているタスクの名前。
- `MISE_TASK_DIR`: タスクスクリプトを含むディレクトリ。
- `MISE_TASK_FILE`: タスクスクリプトへのフルパス。
