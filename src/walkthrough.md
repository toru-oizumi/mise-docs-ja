---
title: 既存のプロジェクトで mise を使う
description: "Adopt mise in an existing repository, share the setup with your team, and run the project's commands as tasks."
socialDescription: "Adopt mise in an existing repository and share the setup with your team."
upstreamPath: docs/walkthrough.md
upstreamUrl: https://mise.jdx.dev/walkthrough.html
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# 既存のプロジェクトで mise を使う {#use-mise-in-an-existing-project}

すでに取り組んでいるプロジェクトに mise を導入します。プロジェクトのツールを宣言し、個人的な設定を共有の設定から切り離し、セットアップをチームと共有し、プロジェクトのコマンドを mise 経由で実行します。まだ mise をインストールしていない場合は、[はじめに](/getting-started.html) から始めてください。

例では `mise exec` と `mise run` を使うので、シェルの有効化は任意です。
[有効化](/getting-started.html#activate-mise) すると、選択されたツールをプロンプトから直接実行することもできます。

## プロジェクトのツールを宣言する {#installing-dev-tools}

プロジェクトにすでにあるバージョンファイルから始めます。mise は設定なしで `.tool-versions` を読み込みます。

```sh
cat .tool-versions
# nodejs 24
mise ls --current
# node  24.x.x  ~/src/app/.tool-versions  24
```

`.nvmrc`、`.node-version`、`.python-version`、`.ruby-version` など、他のバージョンマネージャーのファイルは [idiomatic バージョンファイル（idiomatic version file）（原文）](https://mise.jdx.dev/dev-tools/versions.html#idiomatic-version-files) です。
mise はこれらを有効にしたツールについてのみ読み込みます。これらのファイルを引き続き正とするには、プロジェクトの設定で有効にします。

```toml [mise.toml]
[settings]
idiomatic_version_file_enable_tools = ["node", "python"]
```

プロジェクトがまだ宣言していないツールについては、プロジェクトのルートで [`mise use`（原文）](https://mise.jdx.dev/cli/use.html) を実行します。
ツールをインストールし、その指定を `mise.toml` に書き込みます。

```sh
mise use node@24 python@3.14
```

```toml [mise.toml]
[tools]
node = "24"
python = "3.14"
```

それぞれの指定をどの程度厳密にするかを選びます。`node@24` のようなプレフィックスは Node.js 24 のどのリリースも受け入れるので、マシンによって解決結果が異なることがあります。
`mise use --pin` は代わりに正確なバージョンを書き込みます。また、[ロックファイル](#share-the-setup) は `mise.toml` にプレフィックスを残したまま、正確なバージョンを記録します。
バージョンを省略すると、`mise use node` は `node = "latest"` を書き込みます。
それぞれの形式がどのように解決されるかは [バージョン指定（原文）](https://mise.jdx.dev/dev-tools/versions.html) を、`mise use` と `mise install` の違いについては [適切なコマンドの選び方](/dev-tools/#choose-the-right-command) を参照してください。

言語のパッケージマネージャーもバックエンドとして機能します。それらが必要とするランタイムを並べて宣言します。

```sh
mise use node@24 'npm:@antfu/ni'
mise use rust@stable cargo:starship
```

mise がインストール元として使える他のソースについては [バックエンド（原文）](https://mise.jdx.dev/dev-tools/backends/) を参照してください。
[`mise edit`（原文）](https://mise.jdx.dev/cli/edit.html) は `mise.toml` 用のインタラクティブなエディターを開き、レジストリからツールを検索できます。

## 個人的な設定をローカルに留める {#mise-toml-configuration}

`mise.toml` は、プロジェクトをクローンするすべての人と共有されます。テスト用の別バージョンやローカルの `DATABASE_URL` など、自分用の上書き設定は、その隣の `mise.local.toml` に置き、そのファイルを `.gitignore` に追加します。

```sh
mise use --env local node@26
echo 'mise.local.toml' >> .gitignore
```

mise は、カレントディレクトリとすべての親ディレクトリにある設定ファイルを、グローバル設定とあわせてマージします。カレントディレクトリに近いファイルが優先されます。

1. `~/.config/mise/config.toml`：グローバルなデフォルト
2. `~/work/mise.toml`：`~/work` 以下のすべてのプロジェクトに適用される設定
3. `~/work/app/mise.toml`：共有されるプロジェクトの設定
4. `~/work/app/mise.local.toml`：プロジェクトに対する個人的な上書き設定

どのファイルが有効になっているかを確認するには [`mise config ls`（原文）](https://mise.jdx.dev/cli/config/ls.html) を実行します。mise が読み込むすべての場所については [設定ファイル](/configuration.html#mise-toml) を参照してください。

`mise.local.toml` はプレーンテキストです。この名前によってファイルが暗号化されたり、Git から除外されたりするわけではありません。コミットする設定にはシークレットを含めず、非公開にしておく必要がある値には [シークレットプロバイダー（原文）](https://mise.jdx.dev/environments/secrets/) を使ってください。

## セットアップを共有する {#share-the-setup}

`mise.toml` をコミットします。指定が解決された正確なバージョンとダウンロードのチェックサムを記録するには、ロックファイルを作成し、それもコミットします。

```sh
mise lock
git add mise.toml mise.lock
```

ロックファイルの更新と強制については [ロックファイル（原文）](https://mise.jdx.dev/dev-tools/mise-lock.html) を参照してください。設定が最近の mise リリースの機能を使う場合は、全員に特定のバージョンのインストールを求める代わりに、[`min_version`](/configuration.html#minimum-mise-version) でそのリリースを必須にします。

```toml [mise.toml]
min_version = "2026.10.0"
```

クローンした後、チームメイトはプロジェクトの設定を読みます（タスク、フック、`[env]` はコードを実行できるため）。その後、次を実行します。

```sh
mise install    # installs the declared tools and trusts the project
mise tasks ls   # lists the project's tasks
```

信頼によって何が許可されるかについては [設定ファイルの信頼（原文）](https://mise.jdx.dev/security.html#configuration-trust) を参照してください。

mise を持っていないコントリビューターのために、初回使用時に固定されたバージョンの mise リリースをダウンロードするラッパースクリプトをコミットします。

```sh
mise generate install-script --localize --write
./bin/mise install
```

ラッパーのオプション（Windows 用ランチャーを含む）については [CI のページ](/continuous-integration.html#bootstrapping) で説明しています。

## プロジェクトのコマンドをタスクとして実行する {#tasks}

プロジェクトですでに実行しているコマンドをラップし、mise のツールと環境が適用されるようにします。

```toml [mise.toml]
[tasks]
build = "npm run build"
test = "npm test"
```

```sh
mise run test
```

`mise run test` は、不足しているツールをインストールし、`[env]` を設定してから `npm test` を実行します。シェルの有効化の有無にかかわらず動作します。

タスクは `mise-tasks/` 内の実行可能なスクリプトにすることもできます。同じ名前のタスクを `mise.toml` と `mise-tasks/` の両方で定義しないでください。

```sh [mise-tasks/build]
#!/usr/bin/env bash
npm run build
```

Unix では、`chmod +x mise-tasks/build` でスクリプトを実行可能にします。ファイルタスクは `#USAGE` コメントでオプションと引数を宣言できます。mise はそれらを解析し、`--help` を追加し、シェルで補完します。
[タスクの引数（原文）](https://mise.jdx.dev/tasks/task-arguments.html) を参照してください。

プロジェクトの npm パッケージの実行ファイルを直接呼び出すには、プロジェクトの `PATH` に `node_modules/.bin` を追加します。

```toml [mise.toml]
[env]
_.path = "./node_modules/.bin"
```

このパスは `mise.toml` があるディレクトリからの相対パスなので、サブディレクトリからでも機能します。詳しくは [環境変数](/environments/) を参照してください。

## ツールを最新に保つ {#upgrading-dev-tools}

[`mise outdated`（原文）](https://mise.jdx.dev/cli/outdated.html) は新しいバージョンがあるツールを一覧表示し、[`mise upgrade`（原文）](https://mise.jdx.dev/cli/upgrade.html) は `mise.toml` の指定の範囲内でそれらをインストールします。
`--bump`、ロックファイル、自動更新については [ツールのアップグレード](/dev-tools/#upgrade-tools) を参照してください。

## 日常的に使うコマンド {#common-commands}

| 目的 | コマンド |
| --- | --- |
| 有効な設定ファイルを表示する | [`mise config ls`（原文）](https://mise.jdx.dev/cli/config/ls.html) |
| 選択されたツールのバージョンを調べる | [`mise ls --current`（原文）](https://mise.jdx.dev/cli/ls.html) |
| 利用可能なリリースを探す | [`mise ls-remote TOOL`（原文）](https://mise.jdx.dev/cli/ls-remote.html) |
| 更新のあるツールを確認する | [`mise outdated`（原文）](https://mise.jdx.dev/cli/outdated.html) |
| プロジェクトのタスクを一覧表示する | [`mise tasks ls`（原文）](https://mise.jdx.dev/cli/tasks/ls.html) |
| 環境の問題を診断する | [`mise doctor`（原文）](https://mise.jdx.dev/cli/doctor.html) |
| mise 自体を更新する | [`mise self-update`（原文）](https://mise.jdx.dev/cli/self-update.html)、またはインストールに使ったパッケージマネージャー |

## さらに詳しく {#final-thoughts}

- [開発ツール](/dev-tools/)：バージョン、バックエンド、ツールのオプション
- [環境変数](/environments/)：変数、`.env` ファイル、シークレット
- [タスク](/tasks/)
- [設定](/configuration.html) と [設定項目（原文）](https://mise.jdx.dev/configuration/settings.html)
- [レジストリ（原文）](https://mise.jdx.dev/registry.html)：`node` のような短い名前と、それぞれが対応するバックエンド
- [CLI リファレンス（原文）](https://mise.jdx.dev/cli/)
