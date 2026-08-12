---
title: ウォークスルー
upstreamPath: docs/walkthrough.md
upstreamUrl: https://mise.jdx.dev/walkthrough.html
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

# ウォークスルー {#walkthrough}

[はじめに](/getting-started) ガイドを完了したら、mise を使い始める準備が整います。
このドキュメントでは、最初に試してみるとよいことについて簡単に紹介します。

## 開発ツールのインストール {#installing-dev-tools}

mise でツールを操作する際の中心となるコマンドは [`mise u|use`（原文）](https://mise.jdx.dev/cli/use.html) です。これは主に2つのことを行います。

- ツールをインストールします（まだインストールされていない場合）
- ツールを `mise.toml` 設定ファイルに追加します — mise では、ツールが `mise.toml` に含まれていれば、そのツールは「アクティブ」であると言います

:::warning
ツールを使うには、この2つがどちらも必要です。`mise install` でツールを単純にインストールするだけでは、シェルで使えるようになりません。
`mise.toml` にも追加する必要があります — そのため、両方を一度に行う `mise use` の利用を推奨しています。
:::

次のように使います（この例が動作するには、`mise` が [有効化](/getting-started.html#activate-mise) されている必要があります）。

```bash
mkdir example-project && cd example-project
mise use node@26
node -v
# v26.x.x
```

また、以下の内容を持つ `mise.toml` ファイルが作成されていることにも気づくでしょう。

```mise-toml [mise.toml]
[tools]
node = "26"
```

- このファイルがプロジェクトのルートにある場合、誰かが [`mise install|i`（原文）](https://mise.jdx.dev/cli/install.html) を実行するたびに `node` がインストールされます。
- これは、プロジェクトを最初にクローンしたときや、インストール済みのツールを更新したいときに実行するコマンドです。

## `mise.toml` の設定 {#mise-toml-configuration}

`mise.toml` ファイルは、手動で作成することも、CLI を使って作成することもできます。

> [!TIP]
> `mise edit` を使うと、設定用のインタラクティブなエディタが開きます。セクション間を移動したり、レジストリからファジー検索でツールを追加したり、スキーマに基づいた自動補完で設定項目を設定したりできる TUI が提供されます。

[`mise.toml`](/configuration#mise-toml) を使うと、ツールの設定を他の人と共有できます。このファイルはバージョン管理にコミットされるべきもので、プロジェクトに必要な共通のツールセットを含みます。

非公開にしておきたいツールや設定項目については、[`mise.local.toml`](/configuration#mise-toml) を使います。このファイルは `.gitignore` に追加するべきもので、個人の好みや設定に最適です。

`mise` は、広い範囲から特定の範囲へと段階的に適用される、入れ子になった設定ファイルをサポートしています。

1. `~/.config/mise/config.toml` - すべてのプロジェクトに適用されるグローバルな設定項目
2. `~/work/mise.toml` - 仕事用の設定項目
3. `~/work/project/mise.toml` - プロジェクト固有の設定項目
4. `~/work/project/mise.local.toml` - 共有すべきでないプロジェクト固有の設定項目

`mise` はすべての親ディレクトリを合わせて使い、ツールの集合を決定します — 階層を下るごとに設定を上書きしていきます。

:::tip
`mise` が現在使用している設定ファイルを確認するには、[`mise config ls`（原文）](https://mise.jdx.dev/cli/config/ls.html) を使います。
:::

一般的に、`mise` では `node@26` のような緩いバージョン指定を使うことが好まれます。そうすることで、プロジェクトに取り組む他の人が、使用しているツールの正確なバージョンを気にする必要がなくなります。特定のバージョンを強制するためにバージョンを固定したい場合は、`mise use --pin` または [`lockfile`（原文）](https://mise.jdx.dev/configuration/settings.html#lockfile) 設定項目を使います。

バージョンを省略した場合、mise はデフォルトで `node@latest` になります。

## 開発ツールのバックエンド {#dev-tool-backends}

ツールは `aqua`, `github`, `gitlab` など様々なバックエンドでインストールされます。`node` のような使用可能な省略形の全リストについては、[レジストリ（原文）](https://mise.jdx.dev/registry.html) を参照してください。

`npm` や `cargo` のような、それぞれのレジストリから任意のパッケージをインストールできる他のバックエンドも使用できます。

```bash
mise use npm:@antfu/ni
mise use cargo:starship
```

## 開発ツールのアップグレード {#upgrading-dev-tools}

ツールのバージョンのアップグレードは、[`mise up|upgrade`（原文）](https://mise.jdx.dev/cli/upgrade.html) で行えます。デフォルトでは、`mise.toml` に指定されたバージョンのプレフィックスを尊重します。[ロックファイル（原文）](https://mise.jdx.dev/configuration/settings.html#lockfile) が存在する場合、mise は `mise.toml` のプレフィックスに従って `mise.lock` をツールの最新バージョンに更新します。

つまり、`mise.toml` に `node = "26"` と書かれている場合、`mise upgrade node` は `node 26` の最新バージョンにアップグレードします。

`mise.toml` のバージョンをより新しいものに更新したい場合は、`mise upgrade --bump node` を使用できます。これは現在のバージョンと同じ粒度でバージョンを設定します。つまり `node = "24"` の状態で `mise upgrade --bump node` を使って `node@26` に更新すると、`mise.toml` には `node = "26"` が設定されます。

_ツールの操作についての詳細は [開発ツール](/dev-tools/) を参照してください。_

## 環境変数の設定 {#setting-environment-variables}

mise は、プロジェクトの環境変数を設定するためにも使用できます。環境変数は CLI で設定できます。

```bash
mise set MY_VAR=123
echo $MY_VAR
# 123
```

または、`mise.toml` を直接編集することでも設定できます。

```toml
[env]
MY_VAR = "123"
```

使用例をいくつか挙げます。

- Node.js プロジェクトで `NODE_ENV` を設定する
- データベース接続のために `DATABASE_URL` を設定する
- cargo のテストを直列に実行するために `RUST_TEST_THREADS=1` を設定する

プロジェクトの mise.toml にシークレットを設定しないでください。このファイルはバージョン管理に追加されることを意図しています。
<!-- 原文のリンク先は #misetoml-configuration だが、実在するアンカーは #mise-toml-configuration。原文サイトでも壊れている -->
シークレットには、代わりに [`mise.local.toml` を使ってください](#mise-toml-configuration)。

`mise.toml` で `PATH` を変更することもできます。この例は、`npm` でインストールした CLI を使えるようにするものです。

```toml
[env]
_.path = "./node_modules/.bin"
```

これにより、プロジェクトの PATH に `./node_modules/.bin` が追加されます — ここでの `.` は `mise.toml` ファイルが置かれているディレクトリを指すため、サブディレクトリに入った場合でも機能します。

_環境変数の操作についての詳細は [環境変数](/environments/) を参照してください。_

## タスク {#tasks}

タスクは、コマンドを実行するためにプロジェクト内で定義します。

タスクは `mise.toml` の中で定義できます。

```mise-toml [mise.toml]
[tasks]
build = "npm run build"
test = "npm test"
```

または、`mise-tasks` ディレクトリの中に、`mise-tasks/build` のような単独のファイルとして定義することもできます。

```bash [mise-tasks/build]
#!/bin/bash
npm run build
```

タスクは [`mise r|run`（原文）](https://mise.jdx.dev/cli/run.html) で実行します。

```bash
mise run build
mise run test
```

:::tip
`mise run` は、タスクを実行する前に「mise 環境」（ツールと環境変数）をセットアップします。
そのため、シェルで mise を有効化したくない場合でも、`mise run` を使ってタスクを実行すれば、PATH にツールが入り、`mise.toml` の環境変数が設定された状態になります。
:::

`mise` は、タスクのドキュメント化と実行のための多くの機能を提供する [usage](https://usage.jdx.dev) と連携しています。

usage の仕様を使ったタスクの例を示します。

```bash [mise-tasks/greet]
#!/usr/bin/env bash
set -e

#MISE description="Greet a user with a message"
#USAGE flag "-g --greeting <greeting>" help="The greeting word to use" {
#USAGE   choices "hi" "hello" "hey"
#USAGE }
#USAGE flag "-u --user <user>" help="The user to greet"
#USAGE flag "--dir <dir>" help="The directory to greet from" default="."
#USAGE complete "dir" run="find . -maxdepth 1 -type d"
#USAGE arg "<message>" help="Greeting message"

echo "all available options are in the env with the prefix 'usage_'"
env | grep usage_

echo "${usage_greeting?}, ${usage_user?}! Your message is: ${usage_message?}"
```

このタスクは次のように実行できます。

```shell
mise run greet --user jdx -g "hey" "How are you?"
```

- オプションはすべて `usage_user` のように `usage_` を接頭辞に付けた環境変数として渡されます。
- `mise run greet --help` でヘルプを利用でき、タスクで定義されたオプションが表示されます。
- 期待どおりに補完も利用できます。`mise run greet --greeting <tag>` と入力すると、`hi`、`hello`、`hey` がオプションとして表示されます。
- [カスタム補完](https://usage.jdx.dev/spec/reference/complete) は CLI から提供できます。`mise run greet --dir <tab>` を実行すると、補完を提供するために `find . -maxdepth 1 -type d` が実行されます。

自動補完を機能させるには、[mise の自動補完](/installing-mise.html#autocompletion) を設定してください。

_タスクの操作についての詳細は [タスク](/tasks/) を参照してください。_

## よく使うコマンド {#common-commands}

mise には多くのコマンドが用意されているので、特に重要だと考えるものを以下に挙げます。

- [`mise completion`（原文）](https://mise.jdx.dev/cli/completion.html) – シェルの自動補完を設定します。
- [`mise cfg|config`（原文）](https://mise.jdx.dev/cli/config.html) – CLI から `mise.toml` ファイルを操作するための様々なコマンドです。
- [`mise x|exec`（原文）](https://mise.jdx.dev/cli/exec.html) – mise を有効化せずに、mise 環境内でコマンドを実行します。
- [`mise g|generate`（原文）](https://mise.jdx.dev/cli/generate.html) – プロジェクト用に git フック、タスクのドキュメント、GitHub Actions などを生成します。
- [`mise i|install`（原文）](https://mise.jdx.dev/cli/install.html) – ツールをインストールします。
- [`mise link`（原文）](https://mise.jdx.dev/cli/link.html) – 他の方法でインストールされたツールを mise にシンボリックリンクします。
- [`mise ls-remote`（原文）](https://mise.jdx.dev/cli/ls-remote.html) – ツールの利用可能なバージョンをすべて一覧表示します。
- [`mise ls`（原文）](https://mise.jdx.dev/cli/ls.html) – インストール済み・アクティブなツールの情報を一覧表示します。
- [`mise outdated`（原文）](https://mise.jdx.dev/cli/outdated.html) – 新しいバージョンが利用可能なツールを通知します。
- [`mise plugin`（原文）](https://mise.jdx.dev/cli/plugins.html) – プラグインは、追加のツールや環境変数の管理といった新しい機能で mise を拡張できます。多くの場合、これらは単純な asdf プラグインまたはモダンプラグインです。
- [`mise r|run`（原文）](https://mise.jdx.dev/cli/run.html) – `mise.toml` または `mise-tasks` で定義されたタスクを実行します。
- [`mise self-update`（原文）](https://mise.jdx.dev/cli/self-update.html) – mise を最新バージョンに更新します。パッケージマネージャー経由で mise をインストールした場合は使用しないでください。
- [`mise settings`（原文）](https://mise.jdx.dev/cli/settings.html) – 設定項目を取得・設定するための CLI アクセスです。
- [`mise rm|uninstall`（原文）](https://mise.jdx.dev/cli/uninstall.html) – ツールをアンインストールします。
- [`mise up|upgrade`（原文）](https://mise.jdx.dev/cli/upgrade.html) – ツールのバージョンをアップグレードします。
- [`mise u|use`（原文）](https://mise.jdx.dev/cli/use.html) – ツールをインストールして有効化します。
- [`mise w|watch`（原文）](https://mise.jdx.dev/cli/watch.html) – プロジェクト内の変更を監視し、変更が発生したときにタスクを実行します。

## 最後に {#final-thoughts}

開発ツール、環境変数、タスクが連携することで、開発環境の管理が容易になります — 特に他の人と一緒に作業する場合です。目標は、プロジェクトで使われているプログラミング言語やツールに関わらず、一貫した UX でプロジェクトとやり取りできるようにすることです。

さらに詳しく知るには:

- [開発ツール](/dev-tools/) – 開発ツールの操作についての詳しい概要
- [環境変数](/environments/) – 環境変数の操作についての詳しい概要
- [タスク](/tasks/) – タスクの操作についての詳しい概要
- [設定](/configuration) – `mise.toml` ファイルについての詳しい情報
- [設定項目（原文）](https://mise.jdx.dev/configuration/settings.html) – mise で利用可能なすべての設定項目
- [バックエンド（原文）](https://mise.jdx.dev/dev-tools/backends/) – mise で利用可能なすべてのバックエンドの索引
- [レジストリ（原文）](https://mise.jdx.dev/registry.html) – mise でツールに使える「省略形」の一覧。`node`、`terraform`、`watchexec` のような省略形は、それぞれ `core:node`、`asdf:asdf-community/asdf-hashicorp`、`aqua:watchexec/watchexec` を指します
- [CLI（原文）](https://mise.jdx.dev/cli/) – mise で利用可能なコマンドの全リスト
