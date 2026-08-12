---
title: 開発ツールの概要
upstreamPath: docs/dev-tools/index.md
upstreamUrl: https://mise.jdx.dev/dev-tools/
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

# 開発ツールの概要 {#dev-tools}

> _mise を使うと、node、python、cmake、terraform、そして[他多数（原文）](https://mise.jdx.dev/registry.html)の開発ツールを、同じプロジェクト設定からインストールし、切り替えられます。_

`mise` は、ローカル開発向けにプログラミング言語のランタイムやその他のツールのインストールを管理するツールです。例えば、同じマシン上で Node.js、Python、Ruby、Go などの複数バージョンを管理するために使えます。

[有効化](/getting-started.html#activate-mise)すると、mise はディレクトリに応じてツールの異なるバージョンを自動的に切り替えられます。
つまり、Node.js 18 を必要とするプロジェクトと Node.js 22 を必要とする別のプロジェクトがある場合、2つのプロジェクト間を移動するたびに mise が自動的に切り替えます。mise で利用可能なツールは[レジストリ（原文）](https://mise.jdx.dev/registry.html)で確認できます。

使用するツールのバージョンを知るために、mise は通常、現在のディレクトリとその親ディレクトリにある `mise.toml` ファイルを探します。ツールがどのように指定されるかを把握するために、[mise.toml](/configuration.html) ファイルの例を示します。

```toml [mise.toml]
[tools]
node = '24'
python = '3'
ruby = 'latest'
```

asdf の
`.tool-versions` ファイルとの互換性もあり、`.node-version` や
`.ruby-version` のような[idiomatic バージョンファイル（idiomatic version file）](/configuration#idiomatic-version-files)にも対応しています。詳細は[設定](/configuration)を参照してください。

ツールのバージョンやツールオプションを指定する際には、設定の階層で定義された環境変数や
[`vars`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#vars)を参照することもできます。これには `_.source`、`_.file`、env
モジュールなどのディレクティブによって生成される値も含まれます。これらは、ツールのバージョンとオプションのテンプレートがレンダリングされる前に解決されます。

::: info
mise は asdf の `.tool-versions` ファイルと互換性があり、必要に応じて asdf の
プラグインも使用できます。asdf から移行する場合は、
[比較ガイド](/dev-tools/comparison-to-asdf)を参照してください。
:::

## 動作の仕組み {#how-it-works}

mise は、ツールのインストール、バージョン管理、環境設定を自動的に処理する、高度でありながら使いやすいシステムを通じて開発ツールを管理します。

### ツール解決のフロー {#tool-resolution-flow}

ディレクトリに入るか、コマンドを実行すると、mise は次のプロセスに従います。

1. **設定の探索**: mise はディレクトリツリーをさかのぼって設定ファイル（`mise.toml`、`.tool-versions` など）を探し、それらを階層的にマージします
2. **ツールの解決**: mise は、レジストリとバージョンリストを使って、バージョン指定（`node@latest` や `python@3` など）を具体的なバージョンに解決します
3. **バックエンドの選択**: mise は各ツールを処理するための適切な[バックエンド（原文）](https://mise.jdx.dev/dev-tools/backend_architecture.html)を選択します（core、asdf、aqua など）
4. **インストールの確認**: mise は必要なツールのバージョンがインストールされているかを確認し、不足しているものは自動的にインストールします
5. **環境の設定**: mise は、解決されたツールのバージョンを使用するように `PATH` や環境変数を設定します

### 環境の統合 {#environment-integration}

mise は、開発環境と統合するためのいくつかの方法を提供します。

**自動有効化**: `mise activate` を使うと、mise はシェルのプロンプトにフックし、ディレクトリを変更したときに環境を自動的に更新します。

```bash
eval "$(mise activate zsh)"  # In your ~/.zshrc
cd my-project               # Automatically loads mise.toml tools
```

**オンデマンド実行**: 永続的な有効化なしに mise の環境でコマンドを実行するには `mise exec` を使います。

```bash
mise exec -- node my-script.js  # Runs with tools from mise.toml
```

**shim**: mise は、正しいツールのバージョンを自動的に使用する軽量なラッパースクリプトを作成できます。

```bash
mise activate --shims  # Creates shims instead of modifying PATH
```

### パスの管理 {#path-management}

mise は、正しいツールのバージョンを優先させるために `PATH` 環境変数を変更します。

```bash
# Before mise
echo $PATH
/usr/local/bin:/usr/bin:/bin

# After mise activation in a project with node@20
echo $PATH
/home/user/.local/share/mise/installs/node/20.11.0/bin:/usr/local/bin:/usr/bin:/bin
```

これにより、`node` を実行したときに、システム全体のインストールではなく、プロジェクトの設定で指定されたバージョンが使われることが保証されます。

### 設定の階層 {#configuration-hierarchy}

mise は、広い範囲から特定の設定へと段階的に適用される、入れ子の設定をサポートしています。

```bash
~/.config/mise/config.toml      # Global defaults
~/work/mise.toml                # Work-specific tools
~/work/project/mise.toml        # Project-specific overrides
~/work/project/.tool-versions   # Legacy asdf compatibility
```

各レベルは前のレベルを上書きまたは拡張でき、さまざまなコンテキストにわたってツールのバージョンを細かく制御できます。

## ツールオプション {#tool-options}

ツールオプションを使うと、ツールのインストールと設定の方法をカスタマイズできます。整理しやすくするために入れ子の設定に対応しており、プラットフォーム固有の設定に特に便利です。

### テーブル形式（推奨） {#table-format-recommended}

入れ子のオプションを指定する最もクリーンな方法は、TOML のテーブルを使うことです。

```toml
[tools."http:my-tool"]
version = "1.0.0"

[tools."http:my-tool".platforms]
macos-x64 = {
  url = "https://example.com/my-tool-macos-x64.tar.gz",
  checksum = "sha256:abc123",
}
linux-x64 = {
  url = "https://example.com/my-tool-linux-x64.tar.gz",
  checksum = "sha256:def456",
}
```

### ドット記法 {#dotted-notation}

よりシンプルな入れ子の設定には、ドット記法も使えます。

```toml
[tools."http:my-tool"]
version = "1.0.0"
platforms.macos-x64.url = "https://example.com/my-tool-macos-x64.tar.gz"
platforms.linux-x64.url = "https://example.com/my-tool-linux-x64.tar.gz"
simple_option = "value"
```

### 汎用的な入れ子サポート {#generic-nested-support}

どのバックエンドでも、複雑な設定を整理するために入れ子のオプションを使えます。

```toml
[tools."custom:my-backend"]
version = "1.0.0"

[tools."custom:my-backend".database]
host = "localhost"
port = 5432

[tools."custom:my-backend".cache.redis]
host = "redis.example.com"
port = 6379
```

内部的には、バックエンドがアクセスできるように、入れ子のオプションはドット記法（例: `platforms.macos-x64.url`、`database.host`、`cache.redis.port`）にフラット化されます。

### バージョンの順序 {#version-ordering}

バックエンドは通常、バージョンソースから返される順序を保持します。Aqua、
GitHub、GitLab、Forgejo、HTTP の各ツールは、アップストリームが新しいリリースラインの後にバックポートを公開する場合に、
セマンティックバージョンの優先順位を選択できます。

```toml
[tools]
"github:owner/tool" = { version = "latest", version_order = "semver" }
```

`latest` の場合、バックエンドからの信頼できる（authoritative）結果が依然として優先されます。例えば、
GitHub や Forgejo で **Latest** と印付けられたリリースです。そのリリースが要求されたパッケージと一致しない場合、
またはバックエンドに信頼できる latest の結果がない場合、mise はバージョンリストにフォールバックし、そこで `version_order` を適用します。これは
複数のプロダクトを含むリポジトリで重要です。リポジトリ全体の Latest リリースには、すべてのパッケージのアセットが含まれているとは限らないためです。

`version_order = "semver"` を指定すると、mise はそのフォールバックリストやバージョンのプレフィックスを解決する際に、有効な
セマンティックバージョンを優先順位で並べます。不透明な（opaque）バージョンはセマンティックバージョンより前のソース順を保持するため、正確なリクエストである
`nightly` は引き続き動作します。ビルドメタデータは優先順位に影響しません。レジストリの
エントリでは、セマンティックバージョニングに従うことが分かっているツールに対してこのオプションを設定することがあります。
ユーザーは `version_order = "source"` を設定することで、バックエンドのデフォルトの順序に戻せます。

このオプションはバージョンの解決にのみ影響します。`mise ls-remote` は、
バックエンドから返される正規の順序を引き続き表示します。

### ツールの postinstall コマンド {#tool-postinstall-commands}

ツールの設定に `postinstall` フィールドを追加すると、そのツールのインストールが完了した直後にコマンドを実行できます。これは `[hooks].postinstall` とは別物で、特定のツールがインストールされたときにのみ適用されます。

```toml
[tools]
node = { version = "22", postinstall = "corepack enable" }
```

動作:

- そのツール / バージョンのインストールが正常に完了すると、コマンドが1回実行されます。
- コマンドの実行中は、そのツールの bin パスが PATH 上にあるため、インストールされたツールを直接呼び出せます。
- 環境変数には、そのツールのインストールディレクトリを指す `MISE_TOOL_INSTALL_PATH` と、そのツールの `install_env` オプションで指定された変数が含まれます。
- インストールが失敗した場合、`postinstall` コマンドは実行されません。

## OS 固有のツール {#os-specific-tools}

`os` フィールドを使うと、ツールを特定のオペレーティングシステムに制限できます。

```toml
[tools]
# Only install on Linux and macOS
ripgrep = { version = "latest", os = ["linux", "macos"] }

# Only install on Windows
"npm:windows-terminal" = { version = "latest", os = ["windows"] }

# Works with other options
"cargo:usage-cli" = {
    version = "latest",
    os = ["linux", "macos"],
    locked = false
}
```

`os` フィールドには、オペレーティングシステムの識別子の配列を指定できます。

- `"linux"` - すべての Linux ディストリビューション
- `"macos"` - macOS（Darwin）。エイリアスとして `"darwin"` も使えます
- `"windows"` - Windows。エイリアスとして `"win"` も使えます

### OS / アーキテクチャの組み合わせ {#os-architecture-combinations}

`os/arch` という構文を使うと、特定の OS とアーキテクチャの組み合わせにツールを制限することもできます。

```toml
[tools]
# Only install on macOS ARM64 and all Linux (skips macOS x86_64)
hk = { version = "latest", os = ["linux", "macos/arm64"] }

# Only install on Linux x86_64
mytool = { version = "latest", os = ["linux/x64"] }
```

サポートされているアーキテクチャの識別子:

- `"arm64"`（または `"aarch64"`）
- `"x64"`（または `"x86_64"` または `"amd64"`）

エントリに `/` が含まれる場合、OS とアーキテクチャの両方が一致する必要があります。エントリが OS 名だけの場合、その OS 上のどのアーキテクチャにもマッチします。

ツールが `os` の制限を指定していて、現在のオペレーティングシステムがそのリストに含まれない場合、mise はそのツールのインストールと使用をスキップします。

## ツールの依存関係 {#tool-dependencies}

`depends` フィールドを使うと、ツール間の明示的なインストール依存関係を宣言できます。これにより、あるツールが完全にインストールされてから別のツールのインストールが始まることが保証されます。

```toml
[tools]
python = "3.12.11"
"pipx:ruff" = { version = "latest", depends = ["python"] }
```

この例では、`pipx:ruff` は `python` のインストールが完了するのを待ってから開始します。

`depends` フィールドには、単一の文字列または文字列の配列を指定できます。

```toml
[tools]
# Single dependency
"pipx:ruff" = { version = "latest", depends = "python" }

# Multiple dependencies
"pipx:ruff" = { version = "latest", depends = ["python", "pipx"] }
```

ユーザーが指定した `depends` は、現在のインストール対象に含まれるツールに順序の制約を追加します。設定されたあるツールのインストールが、別の設定済みツールのインストールが始まる前に完了しなければならない場合、特にそれらが本来は並列に実行されるようなときに使います。

### vfox プラグインのフック依存関係 {#vfox-plugin-hook-dependencies}

`[tools]` 内の `depends` は、インストールグラフの順序を追加するだけです。それ自体では、フック実行時の依存関係を宣言したり、vfox のインストールフックの実行中に使われる `PATH` にそれらのツールを追加したりはしません。

vfox プラグインの場合、インストールフックが必要とするツールは `metadata.lua` の `PLUGIN` テーブルで宣言します。

```lua
PLUGIN = {
    name = "example",
    version = "1.0.0",
    depends = { "go" },
}
```

ツール名は `mise.toml` に記述する形式と同じものを使います。一致するツールが設定されている場合、mise はそれらのメタデータのエントリを使って、現在のインストールジョブの順序を決め、フックの実行環境を構築します。詳細は[ツールプラグイン開発（原文）](https://mise.jdx.dev/tool-plugin-development.html#_2-metadata-lua)を参照してください。

## キャッシュとパフォーマンス {#caching-and-performance}

mise はオーバーヘッドを最小化するために、インテリジェントなキャッシュを使用します。

- **バージョンリスト**: API 呼び出しの繰り返しを避けるため、毎日キャッシュされます
- **インストールアーティファクト**: 再インストールを高速化するため、ダウンロードがキャッシュされます
- **環境の解決**: シェルのプロンプトを高速化するため、環境のセットアップがキャッシュされます
- **プラグインのメタデータ**: 操作を高速化するため、プラグイン情報がキャッシュされます

これにより、mise が日々の開発ワークフローに与えるレイテンシは最小限に抑えられます。

::: info
有効化した後、mise はディレクトリが変更されたとき、またはプロンプトが_表示された_ときに、PATH のような環境変数を更新します。
[よくある質問](/faq#what-does-mise-activate-do)を参照してください。
:::

有効化した後は、プロンプトが表示されるたびに `mise hook-env` を呼び出して新しい
環境変数を取得します。
これは非常に高速です。ディレクトリが変更されていない場合や
`mise.toml`/`.tool-versions` ファイルが変更されていない場合は、早期に終了します。

`mise` はランタイムが直接呼び出されるように、事前に `PATH` を変更します。これにより、ツールの呼び出しにオーバーヘッドはゼロになり、`which node` のようなコマンドはバイナリの実際のパスを返します。
asdf のような他のツールは、呼び出されたときにランタイムを動的に特定するための shim ファイルのみをサポートしており、これはわずかな遅延を追加し、一部のコマンドで問題を引き起こすことがあります。詳細は[shim](/dev-tools/shims)を参照してください。

## よく使うコマンド {#common-commands}

開発ツールを扱う上で特に重要なコマンドを紹介します。各コマンドの見出しを
クリックすると
そのリファレンスドキュメントページに移動し、利用可能なすべてのオプションや、さらに多く
の
例を確認できます。

### [`mise use`（原文）](https://mise.jdx.dev/cli/use.html) {#mise-use}

一部のユーザーにとっては、`mise use` だけ覚えれば十分なコマンドかもしれません。これは次のことを行います。

- 必要であれば、そのツールのプラグインをインストールします
- 指定されたバージョンをインストールします
- そのバージョンをアクティブに設定します（つまり `PATH` を更新します）
- 現在の設定ファイル（`mise.toml` または `.tool-versions`）を更新します

```shell
> cd my-project
> mise use node@26
# download node, verify signature...
mise node@26.x.x ✓ installed
mise ~/my-project/mise.toml tools: node@26.x.x # mise.toml created/updated

> which node
~/.local/share/mise/installs/node/26/bin/node
```

`mise use node@26` は node-26 の最新バージョンをインストールし、ローカルディレクトリの
`mise.toml`
設定ファイルを作成または更新します。結果として得られるファイルは次のようになります。

```toml [mise.toml]
[tools]
node = "26"
```

そのディレクトリにいる間は、常にその `node` のバージョンが使用されます。

`mise use -g node@26` も同様の処理を行いますが、[グローバル設定](/configuration.html#global-config-config-mise-config-toml)（`~/.config/mise/config.toml`）を更新するため、ローカルディレクトリの階層に設定ファイルが無い限り、node-26 がそのユーザーの
デフォルトバージョンになります。

`mise use` を使う代わりに `mise.toml` を直接編集することもできます — 効果は同じです。編集後に新しいツールをインストールするには `mise install` を実行してください。

### [`mise install`（原文）](https://mise.jdx.dev/cli/install.html) {#mise-install}

`mise install` はツールをインストールしますが有効化はしません。つまり、ツールをダウンロード / ビルド / コンパイル
して `~/.local/share/mise/installs` に配置しますが、`.mise-toml` や `.tool-versions` ファイルでバージョンを
「設定」しない限り使用できません。

::: tip
`asdf` から移行してきた場合、プラグインを先にインストールするために `mise plugin add` を実行する必要はありません。
必要であれば自動的に行われます。もちろん、そうしたい場合や、デフォルトのレジストリに無いプラグインを使いたい場合は、手動で
インストールすることもできます。
:::

使い方には多くのパターンがあります。

- `mise install node@20.0.0` - 特定のバージョンをインストールします
- `mise install node@20` - このプレフィックスに一致する最新のバージョンをインストールします
- `mise install node` - `mise.toml`（または他の
  設定ファイル）で現在指定されている node のバージョンをインストールします
- `mise install` - 設定ファイルで指定されたすべてのプラグインとツールをインストールします

### [`mise exec`|`mise x`（原文）](https://mise.jdx.dev/cli/exec.html) {#mise-exec-mise-x}

`mise x` は、特定のツールを使った単発のコマンドに使えます。例えば、python3.12 でスクリプトを実行したい
場合:

```sh
mise x python@3.12 -- ./myscript.py
```

Python がまだインストールされていなければインストールされます。`mise x` はローカル / グローバルの
`.mise-toml`/`.tool-versions` ファイルも読み込むため、`mise activate` や shim を使いたくない場合は、コマンドの前に
`mise x --` を付けるだけで mise を使えます。

```sh
$ mise use node@20
$ mise x -- node -v
20.x.x
```

::: tip
これを頻繁に使うなら、エイリアスが便利です。

```sh
alias mx="mise x --"
```

:::

同様に、`mise run` を使うと[タスクを実行](/tasks/)でき、その際にすべてのツールを含む mise の
環境も有効化されます。

## 自動インストールの仕組み {#auto-install-mechanisms}

mise には、不足しているツールやバージョンを必要に応じて自動的にインストールする複数の仕組みがあります。以下では、これらをトリガーされる方法とタイミングごとにグループ化し、それぞれの関連する設定項目を示します。すべての仕組みは、グローバルな[`auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#auto_install)設定を有効にする必要があります（**すべての `auto_install` 系の設定はデフォルトで有効です**）。

### オンデマンド実行（[`mise x`（原文）](https://mise.jdx.dev/cli/exec.html)、[`mise r`（原文）](https://mise.jdx.dev/cli/run.html)） {#on-demand-execution-mise-x-mise-r}

[`mise x`（原文）](https://mise.jdx.dev/cli/exec.html) や [`mise r`（原文）](https://mise.jdx.dev/cli/run.html) のようなコマンドを実行すると、mise はそのコマンドの実行に必要な、不足しているツールのバージョンを自動的にインストールします。

- **トリガーのタイミング:** まだインストールされていないツール / バージョンで [`mise x`（原文）](https://mise.jdx.dev/cli/exec.html) や [`mise r`（原文）](https://mise.jdx.dev/cli/run.html) を使ったとき
- **制御方法:**
  - 設定項目: [`exec_auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#exec_auto_install)（デフォルト: true）
  - 設定項目: [`task_auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#task_auto_install)（デフォルト: true）

### コマンドが見つからない場合のハンドラー（シェル統合） {#command-not-found-handler-shell-integration}

シェルでコマンド（例: `node`）を入力してそれが見つからない場合、そのバイナリを提供するツールが分かれば、mise は不足しているツールのバージョンを自動的にインストールしようとします。

- **トリガーのタイミング:** シェルでコマンドが見つからず、ハンドラーが有効になっているとき
- **制御方法:**
  - 設定項目: [`not_found_auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#not_found_auto_install)（デフォルト: true）
- **制限事項:** mise はレジストリの bin メタデータからプロバイダーを特定するため、これは一度もインストールされたことがないツールでも、設定済みであれば対象になります — ただし、そのようなメタデータを持たない生のバックエンド指定（例: `cargo:some-crate`）で設定されたツールは対象外です。それらは `mise install` で明示的にインストールするか、`mise x` でインストールと実行を一度に行ってください。詳細は[トラブルシューティング](/troubleshooting.html#auto-install-on-command-not-found-does-not-trigger)を参照してください。

::: tip
[`auto_install_disable_tools`（原文）](https://mise.jdx.dev/configuration/settings.html#auto_install_disable_tools) にツール名のリストを設定することで、特定のツールの auto_install を無効化できます。
:::
