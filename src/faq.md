---
title: よくある質問
description: "Get short answers about mise commands, version requests, shell activation, config trust, and related tools."
socialDescription: "Short answers about mise commands, version requests, activation, and config trust."
outline: [2, 3]
upstreamPath: docs/faq.md
upstreamUrl: https://mise.jdx.dev/faq.html
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# よくある質問 {#faq}

コマンドが失敗した場合は [トラブルシューティング](/troubleshooting.html) を参照するか、
[エラーメッセージ（原文）](https://mise.jdx.dev/errors.html) でメッセージを調べてください。

## 日常的なコマンド {#daily-commands}

### `mise install` と `mise use` の違いは？ {#what-is-the-difference-between-mise-install-and-mise-use}

`mise install` はツールをインストールします。`mise use` はツールをインストールし、さらにそのバージョン指定を
設定ファイルに書き込みます。

```sh
mise use node@24      # add Node 24 to mise.toml and install it
mise install          # install every tool the project declares
mise install node@24  # install Node 24 without changing config
```

どちらのコマンドも、実行したシェルの環境は変更しません。シェルの有効化を設定している場合は次のプロンプトで
変更が反映されます。そうでない場合は、`mise exec` や `mise run` でツールを実行してください。バージョンを
指定しない `mise install node` は、プロジェクトが指定しているバージョンを、何も指定していなければ `latest` を
インストールします。引数なしの `mise install` は `lazy = true` が付いたツールをスキップします。それらも
インストールするには `--include-lazy` を付けてください。

### `mise use` はどこに書き込むのか？ {#where-does-mise-use-write-to}

`mise use` は、現在のディレクトリに適用される最も近い設定ファイルに書き込みます。これは親ディレクトリの
`mise.toml` や、`.tool-versions` ファイルであることもあります。同じディレクトリに `mise.toml` と
`mise.local.toml` の両方がある場合、mise は `mise.toml` に書き込みます。
[mise が書き込むファイル](/configuration.html#target-file-for-write-operations) を参照してください。

書き込むファイルを自分で選ぶには、次のようにします。

```sh
mise use --path mise.toml node@24  # this file
mise use --global node@24          # your global config
mise use --env local node@24       # mise.local.toml, for personal versions
```

`mise use --dry-run node@24` は何が変更されるかを表示し、`mise config ls` は現在のディレクトリで mise が
読み込む設定ファイルを一覧表示します。

### `node@20` は最新の Node 20 リリースを使うのか？ {#does-node20-mean-the-newest-available-version-of-node}

自動的には使いません。プロジェクトが `node = "20"` を指定している場合、mise はすでにインストール済みの
Node 20 のうち最新のリリースを使います。利用可能なリリースの中から選ぶのは、20.x が1つもインストールされて
いない場合か、`mise install node@20` や `mise upgrade node` を実行した場合だけです。

```sh
mise latest --installed node@20  # the installed 20.x that mise uses
mise latest node@20              # the newest 20.x available
mise upgrade node                # install that release and use it
```

[ロックファイル（原文）](https://mise.jdx.dev/dev-tools/mise-lock.html) がある場合、mise はそこに記録された
バージョンを使います。[バージョン指定の解決方法（原文）](https://mise.jdx.dev/dev-tools/versions.html#how-requests-resolve) を参照してください。

### `latest` は最新のリリースを意味するのか？ {#does-latest-mean-the-newest-remote-version}

設定ファイルの中では違います。`node = "latest"` はインストール済みの最新バージョンを使うので、上流で新しい
リリースが出ても、`mise upgrade node` を実行するまで環境は変わりません。コマンドラインでは、
`mise install node@latest`、`mise exec node@latest -- node -v`、`mise latest node` はバックエンドに最新の
リリースを問い合わせます。

`latest` が何を意味するかは各バックエンドが決めます。常に最も大きいバージョン番号とは限らず、ほとんどの
バックエンドはプレリリースを除外します。
[バージョン指定とバージョンファイル（原文）](https://mise.jdx.dev/dev-tools/versions.html) と
[ツールのアップグレード](/dev-tools/#upgrade-tools) を参照してください。

### `mise exec` はどう動作するのか？ {#how-does-mise-exec-work}

[`mise exec`（原文）](https://mise.jdx.dev/cli/exec.html) は現在のディレクトリの設定を読み込み、足りない
ツールをインストールし、プロジェクトのツールと環境変数を使って `--` の後のコマンドを実行します。

```sh
mise exec -- node --version          # the Node version the project selects
mise exec node@24 -- node --version  # Node 24 for this one command
```

その環境を受け取るのはコマンドとその子プロセスで、シェルは変更されません。

## シェルとエディター {#shells-and-editors}

### `mise activate` は何をするのか？ {#what-does-mise-activate-do}

`mise activate` はシェル用のスクリプトを出力します。シェルの起動ファイルがそれを実行すると、mise は現在の
ディレクトリに応じて `PATH` と `[env]` の変数を設定し、各プロンプトの前と、ほとんどのシェルでは各 `cd` の後に
実行されるフックを追加します。このフックは、今いるディレクトリに合わせて環境を更新し、前のプロジェクトの値を
取り除きます。有効化によって `mise` というシェル関数も定義され、`mise shell` や `mise deactivate` が現在の
セッションを変更できるようになります。

設定は [シェルのセットアップ（原文）](https://mise.jdx.dev/shell-setup.html) から行ってください。スクリプトや
CI ジョブではプロンプトが表示されないので、そこでは `mise exec` や `mise run` を使ってください。

### `mise activate`、shim、`mise exec`、`mise env` はどう関係しているのか？ {#how-do-mise-activate-shims-mise-exec-and-mise-env-relate}

これらは、mise のツールをそれぞれ異なる場所で使えるようにします。`mise activate` はインタラクティブシェルを
更新し、shim は `PATH` を通じてツールを探すエディターや他のプログラムに対応し、`mise exec` と `mise run` は
1つのコマンドやタスクのための環境を整え、`mise env` は他のプログラムが読み込むための変数を出力します。比較は
[mise のツールの使い方を選ぶ](/dev-tools/shims.html#overview) を参照してください。

### mise は Windows で動作するのか？ {#windows-support}

はい。mise は Windows 上でネイティブに動作し、PowerShell での有効化、shim、`mise exec`、`mise run` を
利用できます。`winget install jdx.mise` でインストールするか、Scoop や Chocolatey については
[Windows](/installing-mise.html#windows) を参照してください。PowerShell、Git Bash、`cmd.exe` の設定は
[シェルのセットアップ（原文）](https://mise.jdx.dev/shell-setup.html#windows) を参照してください。

asdf プラグインのツールはネイティブの Windows では動作しません。プラグインがシェルスクリプトだからです。
コアツールや、aqua、github、http、npm、vfox などのバックエンドは、ツール自体が Windows をサポートしていれば
動作します。`mise registry <tool>` は、そのツールが使えるバックエンドを一覧表示します。WSL では、Linux 版の
mise をインストールし、そこで Linux のツールを管理してください。Windows での問題については
[トラブルシューティング](/troubleshooting.html#windows-problems) を参照してください。

### カラー出力を無効化・強制するには？ {#how-do-i-disable-force-cli-color-output}

カラーを無効にするには `NO_COLOR=1` または `MISE_COLOR=0` を、出力をパイプに渡すときもカラーを維持するには
`CLICOLOR_FORCE=1` を設定します。

```sh
NO_COLOR=1 mise ls
CLICOLOR_FORCE=1 mise ls | less -R
```

`NO_COLOR=1` と `MISE_COLOR=0` は `CLICOLOR_FORCE=1` より優先されます。これらの変数が制御するのは mise
自身の出力です。mise が実行するツールには、それぞれ独自のカラーオプションがあります。

## 設定とネットワーク {#configuration-and-networking}

### 個人用の設定を Git に入れないようにするには？ {#i-don-t-want-to-put-a-mise-toml-tool-versions-file-into-my-project-since-git-shows-it-as-an-untracked-file}

個人用の設定は `mise.local.toml` に置き、共有するツールやタスクはコミットする `mise.toml` に置いてください。
1つのチェックアウトで `mise.local.toml` を無視するには `.git/info/exclude` に追加し、すべてのプロジェクトで
無視するにはグローバルな Git の ignore ファイルに追加します。

`mise.toml` 自体を非公開にしておく場合も同じ方法が使えます。あるいは、チームでプロジェクトの `.gitignore` に
記載することもできます。ignore のルールは未追跡のファイルにしか適用されないので、すでに Git に入っている
ファイルの変更は隠せません。

### 「nodejs」と「node」（または「golang」と「go」）の違いは？ {#what-is-the-difference-between-nodejs-and-node-or-golang-and-go}

これらは同じツールです。mise は、コマンドライン、`mise.toml`、`.tool-versions` のいずれでも、`nodejs` と
`golang` を `node` と `go` のエイリアスとして受け付けます。`mise use` が `nodejs` と書かれた `mise.toml` の
エントリを変更する場合は、コメントを保ったままエントリ名を `node` に変更します。`.tool-versions` には、asdf が
読み取る名前である `nodejs` と `golang` を書き込みます。

### mise が設定ファイルの信頼を求めるのはなぜか？ {#my-config-file-is-being-ignored-mise-trust-issues}

プロジェクトの設定ファイルはコードを実行できます。テンプレートはコマンドを実行でき、`[env]` のディレクティブや
フックはスクリプトを実行し、`postinstall` のようなツールオプションはインストール中に実行されます。ツールの
バージョン、`min_version`、単純なタスクだけを記載したファイルは、mise は確認なしに読み込みます。それ以外の
ものは信頼されるまで保留されるので、リポジトリをクローンしてそのディレクトリに入っても、そのコードは実行され
ません。ファイルを読んでから [`mise trust`（原文）](https://mise.jdx.dev/cli/trust.html) を実行してください。

`mise run`、`mise install`、`mise exec`、`mise watch`、および `mise daemons start`、`restart`、`register` は、
プロジェクトの設定を自ら信頼します。これらを実行すること自体が、そのコードを実行するという判断だからです。
CI では、mise は設定を信頼済みとして扱います。CI 以外では、`--yes` や `MISE_YES=1` が信頼のプロンプトに
「はい」と答えるので、確認済みの設定に対してだけ使ってください。
[パラノイドモード（原文）](https://mise.jdx.dev/paranoid.html) を使うと、この自動的な信頼が無効になります。
グローバル設定 `~/.config/mise/config.toml` は信頼を必要としません。

mise が設定ファイルを無視しているように見える場合:

- `mise trust --show` を実行すると、現在のディレクトリから上へ向かって、各設定ディレクトリの信頼の状態を確認
  できます。`mise doctor` は未信頼のファイルを
  `failed to load config: error parsing config file: <path>` としてしか報告しません。
- 信頼のプロンプトで「いいえ」と答えた場合、mise はその設定を再度確認せずにスキップします。確認したうえで
  `mise trust path/to/mise.toml` を実行してください。
- エディターの拡張機能など端末がない環境では、mise は確認できないため、コマンドは
  [`Config files in <path> are not trusted`（原文）](https://mise.jdx.dev/errors.html#untrusted-config)
  で失敗します。先に端末からファイルを信頼してください。
- `mise.<env>.toml` ファイルは、その [設定環境](/configuration/environments.html) が選択されている場合にのみ
  読み込まれます。

シンボリックリンクされた設定や、あるディレクトリ配下のすべてのプロジェクトを信頼する方法を含む詳細なルールは、
[設定の信頼（原文）](https://mise.jdx.dev/security.html#configuration-trust) を参照してください。

### mise は `.nvmrc` や `.python-version` を読み込むのか？ {#how-do-idiomatic-version-files-python-version-node-version-etc-work}

有効にしたツールについてのみ読み込みます。mise は `.nvmrc`、`.node-version`、`.python-version`、
`.ruby-version` のような他のバージョンマネージャーのファイルを、ツールごとに有効にした後でのみ読み込みます。

```sh
mise settings add idiomatic_version_file_enable_tools node  # read .nvmrc, .node-version, package.json
mise settings unset idiomatic_version_file_enable_tools     # stop reading them for every tool
```

ツールの他のファイルは有効なまま、特定の1ファイルだけを無効にするには、
[`idiomatic_version_file_disable_files`（原文）](https://mise.jdx.dev/configuration/settings.html#idiomatic_version_file_disable_files)
に `node:package.json` のような `tool:file` の組を追加します。各ツールが読み込むファイルについては
[idiomatic バージョンファイル（原文）](https://mise.jdx.dev/dev-tools/versions.html#idiomatic-version-files) を
参照してください。

### mise は短いツール名をどうやって取得元に対応づけるのか？ {#how-do-the-shorthand-plugin-names-map-to-repositories}

mise に同梱されている [レジストリ（原文）](https://mise.jdx.dev/registry.html) が、`ripgrep` のような短い名前を
`aqua:BurntSushi/ripgrep` のようなバックエンド識別子に対応づけます。そのソースは mise リポジトリの
[`registry/`](https://github.com/jdx/mise/tree/main/registry) ディレクトリです。ほとんどのツールはプラグインを
必要としません。

`mise registry ripgrep` はツールが使えるバックエンドを一覧表示し、`mise tool ripgrep` は mise が選択した
バックエンドを表示します。
[mise がバックエンドを選ぶ仕組み（原文）](https://mise.jdx.dev/dev-tools/backends/#how-backend-selection-works) を
参照してください。

### mise で HTTP プロキシを使うには？ {#how-do-i-use-mise-with-http-proxies}

mise は標準的な `https_proxy`、`http_proxy`、`all_proxy`、`no_proxy` の変数を、小文字・大文字のどちらでも
読み取ります。

```sh
export https_proxy=http://proxy.example.com:8080
mise install
```

代わりに社内ミラーを経由してダウンロードするには、
[URL の置き換え（原文）](https://mise.jdx.dev/url-replacements.html) を使ってください。npm、pip、cargo、asdf
プラグインなど、mise が実行するパッケージマネージャーやプラグインは、それぞれ独自のプロキシと証明書の設定を
読み取ります。

## asdf からの移行 {#migration}

### asdf から切り替えるには？ {#how-do-i-migrate-from-asdf}

<a id="how-compatible-is-mise-with-asdf"></a>

mise は `.tool-versions` ファイルを読み込むので、シェルの設定を変える前に1つのプロジェクトで試すことができ、
チームメンバーは asdf を使い続けられます。[asdf からの移行](/dev-tools/comparison-to-asdf.html) では、手順、
コマンドの対応関係、asdf ユーザーと `.tool-versions` を共有する方法を説明しています。最初に知っておくべき違いが
1つあります。`mise set` は環境変数を設定するコマンドで、ツールのバージョンを選ぶのは `mise use` です。

## 対象範囲と関連ツール {#scope-and-related-tools}

### mise はシステムパッケージや、mise なしで動くツールをインストールできるのか？ {#mise-is-for-dev-tools-not-applications-or-system-packages}

<a id="how-do-i-install-tools-other-users-can-run-without-mise"></a>

`[tools]` は、ディレクトリを移動するたびに mise が切り替える、プロジェクトごとのバージョンのためのものです。
システムライブラリ、デスクトップアプリ、他のユーザーが mise なしで実行するコマンドなど、マシン全体に一度だけ
インストールするものには、次のいずれかを使ってください。

- [`[bootstrap.packages]`（原文）](https://mise.jdx.dev/bootstrap/packages/) は apt、dnf、Homebrew、WinGet
  などのパッケージマネージャー向けのパッケージを宣言し、`mise bootstrap` がそれらをインストールします。
  `brew:` と `brew-cask:` のエントリは mise 自身がインストールするので、Homebrew をインストールしておく必要は
  ありません。[Homebrew のフォーミュラ（原文）](https://mise.jdx.dev/bootstrap/packages/brew.html) を参照してください。
- [`mise install-into`（原文）](https://mise.jdx.dev/cli/install-into.html) は、mise がサポートする任意の
  ツールの1つのバージョンを、指定したディレクトリにインストールします。

  ```sh
  mise install-into node@24 ~/standalone-node
  ~/standalone-node/bin/node --version
  ```

  新しいディレクトリか空のディレクトリを使ってください。`install-into` はすでにある内容を、確認したうえで、
  または `--yes` の場合は確認なしに削除します。その `bin` ディレクトリを `PATH` に追加し、`JAVA_HOME` などの
  変数は自分で設定してください。

どちらの方法でも、すべてのユーザーに1つのバージョンが提供され、プロジェクトごとの切り替えはありません。代わりに
各ユーザーに mise が管理するツールを提供するには、それらを `[tools]` に記載したままにし、
[`mise bootstrap`（原文）](https://mise.jdx.dev/bootstrap.html) に各ユーザーの有効化とツールをセットアップさせて
ください。

### mise は安全か？ {#is-mise-secure}

mise は、バックエンドが対応している場合はダウンロードを検証し、プロジェクトの設定にあるコードを実行する前に
確認を求めます。また、より厳しい制限のためのセーフモードとパラノイドモードがあります。各検証が何を対象とするかは
バックエンドによって異なります。[セキュリティ（原文）](https://mise.jdx.dev/security.html) を参照し、脆弱性は
[脆弱性の報告（原文）](https://mise.jdx.dev/security.html#reporting-a-vulnerability) の説明に従って報告して
ください。

### usage とは？ {#what-is-usage}

[usage](https://usage.jdx.dev/) は、コマンドの引数、オプション、自動補完を記述するための spec です。mise には
これが組み込まれています。タスクの引数、`mise run <task> --help`、mise とそのタスクの自動補完はすべて usage の
spec から生成されるので、別途 `usage` CLI をインストールする必要はありません。
[タスクの引数（原文）](https://mise.jdx.dev/tasks/task-arguments.html) を参照してください。

### pitchfork とは？ {#what-is-pitchfork}

[pitchfork](https://pitchfork.jdx.dev/) は、開発用サービスのためのプロセススーパーバイザーです。mise の実験的な
[デーモン（原文）](https://mise.jdx.dev/daemons.html) 機能はこれを使って、`mise.toml` で宣言されたデータベースや
開発サーバーを実行し、準備ができているかを確認し、再起動します。終了するコマンドには [タスク](/tasks/) を、
動き続けるプロセスにはデーモンを使ってください。

### mise のバージョニングはどう機能するのか？ {#how-does-mise-versioning-work}

mise は `2026.10.4` のようなカレンダーバージョンを使っており、その数字は互換性について何も表しません。
[バージョン番号（原文）](https://mise.jdx.dev/releases.html#versioning) を参照してください。
