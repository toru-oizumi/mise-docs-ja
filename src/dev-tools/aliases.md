---
title: ツールのエイリアス
upstreamPath: docs/dev-tools/aliases.md
upstreamUrl: https://mise.jdx.dev/dev-tools/aliases.html
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

# ツールのエイリアス {#tool-aliases}

::: tip
`[alias]` は `[shell_alias]` と区別するために `[tool_alias]` にリネームされました。
古い `[alias]` キーもまだ動作しますが、非推奨です。

シェルコマンドのエイリアス（`alias ll='ls -la'` のような）については、[シェルエイリアス（原文）](https://mise.jdx.dev/shell-aliases.html) を参照してください。
:::

## エイリアス化されたバックエンド {#aliased-backends}

ツールはエイリアス化できるため、通常は `core:node` にマッピングされる `node` のようなものを、
別のバックエンドに変更できます。

```toml [~/.config/mise/config.toml]
[tool_alias]
node = 'github:company/our-custom-node'   # shorthand for https://github.com/company/our-custom-node
erlang = 'aqua:company/our-custom-erlang' # use an aqua registry entry
```

これは、同じ GitHub リリースから複数のツールをインストールする際にも使用できます。

```toml [~/.config/mise/config.toml]
[tool_alias]
dhall-json = 'github:dhall-lang/dhall-haskell'
dhall-lsp = 'github:dhall-lang/dhall-haskell'

[tools]
dhall-json = { version = "v1.42.2", matching = "dhall-json" }
dhall-lsp = { version = "latest", matching = "dhall-lsp-server" }
```

上記の例では、[GitHub バックエンドの `matching`（原文）](https://mise.jdx.dev/dev-tools/backends/github.html#matching) 機能を使って、同じ GitHub リポジトリの異なるリリースから2つの異なるバイナリをダウンロードしています。

## エイリアス化されたバージョン {#aliased-versions}

mise はランタイムのバージョンのエイリアス化をサポートしています。この使用例の1つは、特定のバージョンを指す安定した名前を定義することで、
`mise.toml`/`.tool-versions` の中でシンボリックに参照できるようにすることです。例えば、`lts-iron` を Node.js 20 にマッピングしたい場合、
`node = "lts-iron"` として設定できます。

ユーザーエイリアスは、`~/.config/mise/config.toml` に `tool_alias.<TOOL>.versions` セクションを追加することで作成できます。

```toml
[tool_alias.node.versions]
lts-iron = '20'
```

その後、ツールを固定する際にそのエイリアスを参照します。

```toml
[tools]
node = "lts-iron"
```

プラグインは `bin/list-aliases` スクリプトを通じてエイリアスを提供することもできます。以下は node.js のバージョンを示す例です。

```bash
#!/usr/bin/env bash

echo "lts-krypton 24"
echo "lts-jod 22"
echo "lts-iron 20"
```

（mise の組み込み node プラグインは既にこれらの LTS エイリアスを同梱しています。上記の例は、他のプラグインが使用できる形式を示しています。）

## テンプレート {#templates}

エイリアスの値はテンプレートにできます。詳細は [テンプレート（原文）](https://mise.jdx.dev/templates.html) を参照してください。

```toml
[tool_alias.node.versions]
current = "{{exec(command='node --version')}}"
```
