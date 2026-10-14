---
title: ツールのエイリアス
description: "Use [tool_alias] to point a tool name at a different backend or give a version request a stable name."
upstreamPath: docs/dev-tools/aliases.md
upstreamUrl: https://mise.jdx.dev/dev-tools/aliases.html
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# ツールのエイリアス {#tool-aliases}

`[tool_alias]` を使うと、ツール名を別のバックエンドに向けたり、バージョン指定に名前を付けたりできます。共有するエイリアスはプロジェクトの `mise.toml` に置くと、チームメンバーがツールの宣言と一緒にエイリアスも受け取れます。個人的なエイリアスは `~/.config/mise/config.toml` に置きます。

mise には、エイリアスと呼ばれるものが他に2つあります。レジストリエイリアス（`ripgrep` に対する `rg` など）は [レジストリ（原文）](https://mise.jdx.dev/registry.html) に組み込まれた別名で、自分で定義するものではありません。`alias ll='ls -la'` のようなコマンドのショートカットについては、[シェルエイリアス（原文）](https://mise.jdx.dev/shell-aliases.html) を参照してください。

::: warning 設定キーの名前変更
`[alias]` は `[tool_alias]` に名前が変更されました。古いキーもまだ動作しますが、非推奨であり、警告が表示されます。
:::

## バックエンドエイリアス {#aliased-backends}

バックエンドエイリアスは、mise がツールを取得する場所を変更します。例えば、誰かが `node` プラグインをインストールしていて、本来ならそちらが優先される場合でも、mise に組み込まれた Node.js を使い続けられます。

```toml [mise.toml]
[tool_alias]
node = "core:node"

[tools]
node = "24"
```

`mise tool node` で結果を確認してから、`mise install` を実行します。インストール済みのプラグインや環境変数によって、想定と異なる取得元が選ばれる場合は、[バックエンドの選択の仕組み（原文）](https://mise.jdx.dev/dev-tools/backends/#how-backend-selection-works) を参照してください。

エイリアスを使うと、1つの GitHub リポジトリにある別々のリリースアセットを、別々のツールとしてインストールすることもできます。

```toml [mise.toml]
[tool_alias]
dhall-json = "github:dhall-lang/dhall-haskell"
dhall-lsp = "github:dhall-lang/dhall-haskell"

[tools]
dhall-json = { version = "v1.42.2", matching = "dhall-json" }
dhall-lsp = { version = "latest", matching = "dhall-lsp-server" }
```

各エイリアスはそれぞれ独自のバージョン指定と [GitHub のアセットフィルター（原文）](https://mise.jdx.dev/dev-tools/backends/github.html#matching) を持つため、複数のツールを独立してリリースしているリポジトリで役立ちます。

## バージョンエイリアス {#aliased-versions}

バージョンエイリアスは、バージョン指定に名前を付けます。これにより、チームで使う Node.js のリリース系列を1か所で管理できます。

```toml [mise.toml]
[tool_alias.node.versions]
project-lts = "24"

[tools]
node = "project-lts"
```

`project-lts` は指定 `24` として解決されるため、厳密なパッチバージョンではなく 24.x のリリースが選ばれます。解決されたバージョンを記録するには [mise.lock（原文）](https://mise.jdx.dev/dev-tools/mise-lock.html) を使ってください。エイリアスを変更すると、それを使っているすべての宣言のバージョン指定が変わります。

バックエンドの中には、Node.js の `lts` や `lts-jod`、Java の `lts` のように、独自のエイリアスを提供するものがあります。これらを定義し直す必要はありません。旧来の asdf プラグインは、エイリアスとバージョンを1行に1組ずつ出力する `bin/list-aliases` スクリプトを通じて、独自のエイリアスを提供します。

## コマンドラインからのエイリアスの管理 {#manage-aliases}

[`mise tool-alias ls`（原文）](https://mise.jdx.dev/cli/tool-alias/ls.html) は、バックエンドが提供するものも含めてエイリアスを一覧表示します。

```sh
mise tool-alias ls node
```

```text
node  lts          24
node  lts-argon    4
node  lts-boron    6
...
```

[`mise tool-alias set`（原文）](https://mise.jdx.dev/cli/tool-alias/set.html) と [`mise tool-alias unset`（原文）](https://mise.jdx.dev/cli/tool-alias/unset.html) は、グローバルの設定ファイルを編集します。プロジェクトのエイリアスは `mise.toml` を直接編集してください。

```sh
mise tool-alias set node project-lts 24  # version alias
mise tool-alias set mytool github:owner/repo  # backend alias
mise tool-alias unset node project-lts
```

## テンプレート {#templates}

エイリアスの値は [テンプレート（原文）](https://mise.jdx.dev/templates.html) に対応しています。例えば、リリース系列をデフォルト値付きで環境変数から読み取れます。

```toml [mise.toml]
[tool_alias.node.versions]
project-lts = "{{ env.PROJECT_NODE_VERSION | default(value='24') }}"
```

mise を実行する前に `PROJECT_NODE_VERSION` を設定してください。エイリアスのテンプレートの中で、あるツールのバージョンをそのツール自身を実行して算出しないでください。mise がツールのインストール前にバージョンを解決しようとしたり、shim を通じて mise 自身が再帰的に呼び出されたりする可能性があります。
