---
title: よくある質問
upstreamPath: docs/faq.md
upstreamUrl: https://mise.jdx.dev/faq.html
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

# よくある質問 {#faqs}

## git が未追跡ファイルとして表示するので、`mise.toml`/`.tool-versions` ファイルをプロジェクトに置きたくない {#i-don-t-want-to-put-a-mise-toml-tool-versions-file-into-my-project-since-git-shows-it-as-an-untracked-file}

[`mise.local.toml`](/configuration.html#mise-toml) を使い、それをグローバルな gitignore ファイルに入れてください。このファイルは絶対にコミットしないでください。

どうしても `mise.toml` や `.tool-versions` を使いたい場合、git にこれらのファイルを無視させる方法が3つあります。

- `mise.toml` をプロジェクトの `.git/info/exclude` に追加する。このファイルはプロジェクトにローカルなので、
  コミットする必要はありません。
- `mise.toml` をプロジェクトの `.gitignore` ファイルに追加する。この方法には、ignore ファイルへの変更を
  コミットする必要があるという欠点があります。
- `mise.toml` をグローバル gitignore（`core.excludesFile`）に追加する。これにより git はすべてのプロジェクトで
  `mise.toml` ファイルを無視するようになります。必要であれば `git add --force mise.toml` で明示的にプロジェクトに
  追加できます。

## 「nodejs」と「node」（または「golang」と「go」）の違いは？ {#what-is-the-difference-between-nodejs-and-node-or-golang-and-go}

これらはエイリアスになっています。例えば `mise use nodejs@14.0` は `mise install node@14.0` と同じです。つまり、
これらを別々のプラグインにすることはできません。

これはどちらが「正式な」名前か覚えなくていいようにするための便宜です。ただし、このエイリアスの動作がおかしいと感じたら、
チケットを投稿するか、単に「node」と「go」を使い続けてください。内部的には、mise が設定ファイルを読んだり CLI 入力を
受け取ったりする際に「nodejs」と「golang」を置き換えます。

mise が `mise.toml` に _書き込む_ とき（`mise use`, `mise unuse`）は、正規の名前を書き込みます — `nodejs` という
エントリはコメントを保ったまま `node` になります。`.tool-versions` ファイルは影響を受けず、依然として asdf の表記を
使います。

## `mise activate` は何をするのか？ {#what-does-mise-activate-do}

シェルプロンプトが表示されるたびに `mise hook-env` を実行するシェルフックを登録します。`mise hook-env` は現在の
環境変数（最も重要なのは `PATH` ですが、ツールによっては `GOROOT` や `JAVA_HOME` など他の変数もあります）を確認し、
変更があったものを追加・削除・更新します。

例えば、`java 17` の代わりに `java 18` が指定された別のディレクトリに `cd` した場合、次のプロンプトが表示される
直前に、シェルは `eval "$(mise hook-env)"` を実行します。これは現在のシェルセッションで次のような内容を実行する
ことになります。

```sh
export JAVA_HOME=$HOME/.local/share/installs/java/18
export PATH=$HOME/.local/share/installs/java/18/bin:$PATH
```

実際には `PATH` の更新はもう少し複雑です。java-17 を削除する処理も必要になるからですが、大体のイメージは伝わるかと
思います。

プロンプトが表示されるたびに `mise hook-env` を実行するのは過剰で、`cd` したときだけ実行すればいいと思うかもしれ
ませんが、ディレクトリが変わらなくても実行が必要な状況は多くあります。例えば、現在のシェルで `.tool-versions` や
`mise.toml` を編集した直後などです。

プロンプト表示時に実行される仕組みなので、非インタラクティブなセッション（bash スクリプトなど）で
`mise activate` を使おうとすると、プロンプトが一度も表示されないため `mise hook-env` は呼ばれず、結果として
`PATH` は一切変更されません。このような用途では、`PATH` を更新したいたびに手動で `mise hook-env` を呼ぶか、
代わりに [shim](/dev-tools/shims.md) を使う方法があります（こちらが推奨です）。あるいは、特定のコマンドだけで
mise を使いたい場合は、コマンドの前に [`mise x --`（原文）](https://mise.jdx.dev/cli/exec.html) を付けるだけで
済みます。例えば `mise x -- npm test` や `mise x -- ./my_script.sh` のようにします。

`mise hook-env` は、変更がない場合はさまざまな状況で早期に終了します。これにより、コマンドを実行するたびに
シェルプロンプトに遅延が追加されるのを防いでいます。`mise hook-env` を自分で実行して、何が出力されるか確認
できますが、すでに有効化されているシェルではおそらく何も出力されません。

`mise activate` は（ほとんどのシェルで）`mise` という名前のシェル関数も作成します。これは `mise shell` や
`mise deactivate` を `eval "$(mise shell)"` で包まなくても動作させるためのトリックです。

## Windows のサポートは？ {#windows-support}

::: warning
mise は WSL でも問題なく動作しますが、誰かが [powershell](https://github.com/jdx/mise/discussions/6733) 対応を
追加するまでは、ネイティブ Windows も shim を使う形でサポートされています。

shim を使う必要があるため、[`mise x`（原文）](https://mise.jdx.dev/cli/exec.html) や
[`mise run`（原文）](https://mise.jdx.dev/cli/run.html) 経由で mise を実行しない限り、`mise.toml` からの
環境変数は反映されません。
:::

## mise で http プロキシを使うには？ {#how-do-i-use-mise-with-http-proxies}

簡単に言うと、`http_proxy` と `https_proxy` の環境変数を設定するだけです。これらは小文字である必要があります。

これらの環境変数を使うように設定されていないプラグインでは、動作しない場合があります。特定のツールのインストールで
プロキシ関連の問題が発生した場合は、そのプラグインのリポジトリに issue を投稿してください。

## プラグインの省略形の名前はどうやってリポジトリに対応づけられるのか？ {#how-do-the-shorthand-plugin-names-map-to-repositories}

例えば、`mise plugin install elixir` はどうやって <https://github.com/asdf-vm/asdf-elixir> を取得すると
分かるのでしょうか？

mise が基盤として使う省略形の[インデックス](https://github.com/mise-plugins/registry)を管理しています。これは
mise がリリースされるたびに定期的に更新されます。このリポジトリは
[registry/](https://github.com/jdx/mise/blob/main/registry/) としてコードベースに直接格納されています。

## 「node@20」は node の最新の利用可能なバージョンを意味するのか？ {#does-node-20-mean-the-newest-available-version-of-node}

コマンドによります。通常、ほとんどのコマンドや設定ファイルの中では、「node@20」は node-20.x の最新の
_インストール済み_ バージョンを指します。このバージョンは `mise latest --installed node@20` を実行するか、
`~/.local/share/mise/installs/node/20` のシンボリックリンクが指す先を見ることで確認できます。

```sh
$ ls -l ~/.local/share/mise/installs/node/20
[...] /home/jdx/.local/share/mise/installs/node/20 -> node-v20.0.0-linux-x64
```

これにはいくつか例外があります。例えば次のようなものです。

- `mise install node@20`
- `mise latest node@20`
- `mise upgrade node@20`

これらは node-20.x の最新の _利用可能な_ バージョンを使用します。すでにインストールされているバージョンを
インストールしたいとは思わないはずなので、これは概ね理にかなっています。

## asdf から移行するには？ {#how-do-i-migrate-from-asdf}

- [はじめに](/getting-started) ガイドの説明に従って mise をインストールし、`mise activate` を設定する
- シェルの rc ファイルから asdf を削除する
- asdf の `.tool-versions` ファイルがあるディレクトリで `mise install` を実行すると、mise がツールをインストールする

::: info
`mise` は `asdf` と違い、`~/.tool-versions` ファイルをグローバルな設定ファイルとは見なさない点に注意してください。
`mise` はグローバル設定に `~/.config/mise/config.toml` ファイルを使用します。
:::

グローバルな `.tool-versions` ファイルを mise に移行するために使えるスクリプトの例を示します。

```shell
mv ~/.tool-versions ~/.tool-versions.bak
cat ~/.tool-versions.bak | tr -s ' ' | tr ' ' '@' | xargs -n2 mise use -g
```

mise に慣れてきたら、`.tool-versions.bak` ファイルを削除し、
[`asdf` をアンインストール](https://asdf-vm.com/manage/core.html#uninstall) できます

## mise は asdf とどの程度互換性があるのか？ {#how-compatible-is-mise-with-asdf}

mise は asdf が使用する `.tool-versions` ファイルをすべて読み込み・インストールできるはずです。asdf のプラグインは
すべて mise でも使用できます。mise のコマンドは `mise install node@20.0.0` と `asdf install node 20.0.0` のように
少し異なりますが、これは複数のツールを一度に指定できるようにするためです。ただし、asdf 形式の構文も依然として
サポートされています（`mise install node 20.0.0`）。ほとんどのコマンドでこれが当てはまりますが、コマンドのヘルプに
asdf 形式の構文がサポートされていると書かれている場合もあります。迷ったら、まずは asdf の構文を試してみてください。
おそらく動作します。

::: info
更新（2025-01-01）: mise は bash で書かれた asdf（0.15 以下）と互換性を持つように設計されました。go で書かれた
新しい asdf（0.16 以上）には、`asdf set` のように mise がサポートしないコマンドがあります。`mise set` は既存の
コマンドですが、`asdf set` とは完全に別物です — mise では環境変数を設定するコマンドです。

これは使いやすさの観点で重要というよりは、プラグインのコード内で asdf のコマンドを呼び出しているプラグインが
動作し続けるようにするためのものです。
:::

`mise use` のようなコマンドを使うと、あいまいなバージョン指定などにより asdf と互換性のない `.tool-versions`
ファイルが出力されることがあります。`--pin` または `MISE_PIN=1` を設定すると、`mise use` が `.tool-versions` に
asdf 互換のバージョンを出力するようになります。あるいは、`mise.toml` と `.tool-versions` を並べて配置することも
できます。`mise.toml` のツールは、同じディレクトリの `.tool-versions` で定義されたツールを上書きします。

とはいえ、asdf との互換性はもはや一般的な設計目標ではありません。asdf を mise より優先する理由はもはや無いという
のが長らくの状況であり、ユーザーは移行すべきです。両方を併用しているチームのユーザーも多くいますが、そのような
構成に関する問題は優先的には対応されない可能性があります。

## CLI のカラー出力を無効化・強制するには？ {#how-do-i-disable-force-cli-color-output}

mise は [console.rs](https://docs.rs/console/latest/console/fn.colors_enabled.html) を使用しており、これは
[clicolors 仕様](https://bixense.com/clicolors/) に従います。

- `CLICOLOR != 0`: ANSI カラーがサポートされ、プログラムがパイプされていない場合に使用されます。
- `CLICOLOR == 0`: ANSI カラーのエスケープコードを出力しません。
- `CLICOLOR_FORCE != 0`: 何があっても ANSI カラーを有効にします。

## mise は安全か？ {#is-mise-secure}

安全なサプライチェーンを提供することは非常に重要です。mise は asdf と比較して、すでにより安全な体験を提供して
います。セキュリティを重視した評価や貢献を歓迎します。また、ユーザーには使用するプラグインに気を配ることを、
プラグインの作者には自分が提供しているユーザーに気を配ることを求めています。

詳細は [SECURITY.md](https://github.com/jdx/mise/blob/main/SECURITY.md) を参照してください。

## usage とは？ {#what-is-usage}

usage（<https://usage.jdx.dev/>）は、CLI ツールを定義するための仕様であり CLI です。

引数、オプション、環境変数、設定ファイルはすべて Usage の仕様の中で定義できます。CLI 向けの OpenAPI（swagger）
のようなものだと考えられます。

`usage` は `mise use -g usage` を使って `mise` でインストールできます。自動補完を動作させるために必要です。
[自動補完](/installing-mise.html#autocompletion) を参照してください。

ファイルタスクで usage を活用して自動補完を動作させることもできます。
[ファイルタスクの引数](/tasks/file-tasks.html#arguments) を参照してください。

## pitchfork とは？ {#what-is-pitchfork}

pitchfork（<https://pitchfork.jdx.dev/>）は、開発者向けのプロセスマネージャーです。

失敗時の自動再起動、賢い準備状態チェック、プロジェクトディレクトリに入った際のシェルベースの自動起動・停止、
定期タスクのための cron 形式のスケジューリングといった機能を備えたデーモン管理を行います。

## VSCode の Windows 拡張機能で `spawn EINVAL` エラーが発生する {#vscode-for-windows-extension-with-error-spawn-einval}

VSCode では、
[Node.js のセキュリティ修正](https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high)
が原因で、多くの拡張機能が「error spawn EINVAL」を発生させます。

デフォルトの `exe` shim モードでこれは解決するはずです。古いモードを使用している場合は、
[windows_shim_mode（原文）](https://mise.jdx.dev/configuration/settings.html#windows_shim_mode) を `exe`、
`hardlink`、`symlink` のいずれかに変更してください。

## `mise install` と `mise use` の違いは？ {#what-is-the-difference-between-mise-install-and-mise-use}

`mise install` はツールのバージョンをダウンロード・インストールしますが、設定ファイルには**追加しません**。
そのツールが `mise.toml` や `.tool-versions` に既に記載されていない限り、シェルで自動的に有効化されることは
ありません。

`mise use` はツールをインストール**し**、`mise.toml`（`-g` を付ければ `~/.config/mise/config.toml`）に追加します。
そのため、ディレクトリに入ると自動的に有効化されます。

プロジェクトのためにツールを固定したいだけなら `mise use` を使ってください。設定ファイルに既に記載されている
バージョンをインストールしたいなら `mise install` を使ってください。

::: tip
`mise install node`（バージョン指定なし）は、node が設定に無い場合に**最新**バージョンをインストールします。
`mise install`（引数なし）は、設定ファイルに記載されているツールだけをインストールします。
:::

## `latest` は最新のリモートバージョンを意味するのか？ {#does-latest-mean-the-newest-remote-version}

文脈によります。設定ファイルやほとんどのコマンドでは、`latest` は最新の**インストール済み**バージョンに解決
されます。つまり、node 20.0.0 がインストール済みで node 22.0.0 がリモートで利用可能でも、`latest` は依然として
20.0.0 を指します。

しかし、一部のコマンドは `latest` を最新の**利用可能な**（リモートの）バージョンに解決します。

- `mise install node@latest` — 最新の利用可能なバージョンをインストールします
- `mise x node@latest -- node -v` — 最新の利用可能なバージョンを使用します
- `mise latest node` — 最新の利用可能なバージョンを表示します

最新の利用可能なバージョンにアップグレードし、設定を更新するには、以下を実行します。

```sh
mise upgrade node
# or to also update mise.toml:
mise upgrade --bump node
```

## 設定ファイルが無視される / `mise trust` の問題 {#my-config-file-is-being-ignored-mise-trust-issues}

mise では、自分が作成していない設定ファイルを信頼する必要があります。安全な設定ファイル — `min_version`、
単純なバージョン文字列（またはその配列）を持つ `[tools]` エントリ、`[tasks]`（テンプレートやツールオプションを
含まないもの）だけを含むもの — は、読み込み時にコードを実行するものが何もないため、信頼なしで読み込まれます。
ツールのインストールやタスクの実行は、`mise install` や `mise run` のような明示的なコマンドでのみ行われます。
それ以外のすべて（環境変数、フック、設定項目、エイリアス、テンプレート、ツールオプション）は信頼が必要です。
よくある問題は次のとおりです。

- **誤って信頼を拒否した場合**: mise がファイルを信頼するようプロンプトを出し、そこで「いいえ」と答えると、
  ignore リストに追加されます。[mise の状態ディレクトリ（原文）](https://mise.jdx.dev/directories.html) にある
  `ignored-configs` ディレクトリ（デフォルト: `~/.local/state/mise/ignored-configs/`）を確認し、該当する
  シンボリックリンクを削除すると無視を解除できます。
- **シンボリックリンクされた設定**: 設定ファイルがシンボリックリンクされている場合（例えば GNU Stow 経由など）、
  mise はシンボリックリンクの対象パスを追跡することがあります。実際のファイルパスを指定して `mise trust` を
  試してください。
- **CI**: CI と検知された環境では、パラノイドモードが有効でない限り、mise は設定ファイルを信頼済みとみなします。
- **非インタラクティブモード**: CI と検知されない非インタラクティブなシェル（IDE の拡張機能や TTY のない
  スクリプトなど）では、mise は設定を信頼するかどうかプロンプトを出せません。未信頼の `mise.toml` を直接読み込む
  コマンドは、untrusted-config エラーで失敗する場合があります。以前に追跡した設定を発見するコマンドは、代わりに
  未信頼のエントリをスキップすることがあります。事前に `mise trust` を実行するか、信頼する設定についてグローバル
  設定で [`trusted_config_paths`（原文）](https://mise.jdx.dev/configuration/settings.html#trusted_config_paths) を
  設定してください。
- **グローバル設定**（`~/.config/mise/config.toml`）は自動的に信頼されるはずです。そうなっていない場合は、
  `mise trust ~/.config/mise/config.toml` を明示的に実行してください。

`mise doctor`（`mise dr`）を実行すると、未信頼の設定ファイルがあるかどうかを確認できます — 「problems」の下に
一覧表示されます。

## idiomatic バージョンファイル（`.python-version`、`.node-version` など）はどう機能するのか？ {#how-do-idiomatic-version-files-python-version-node-version-etc-work}

idiomatic バージョンファイル（`.python-version`、`.node-version`、`.ruby-version` など）は、mise では
**デフォルトで無効**になっています。これらは、
[`idiomatic_version_file_enable_tools`（原文）](https://mise.jdx.dev/configuration/settings.html#idiomatic_version_file_enable_tools)
を使ってツールごとに明示的に有効化した場合にのみ読み込まれます。

```sh
# Enable reading .node-version files
mise settings add idiomatic_version_file_enable_tools node
```

以前に idiomatic ファイルを有効化していて、mise がそれらを読み込まないようにしたい場合（例えば `uv` が
`.python-version` を管理しているなど）は、そのツールをリストに追加しないようにするだけです。

詳細は [idiomatic バージョンファイル](/configuration.html#idiomatic-version-files) を参照してください。

## `mise activate`、shim、`mise exec`、`mise env` はどう関係しているのか？ {#how-do-mise-activate-shims-mise-exec-and-mise-env-relate}

これらはすべて同じ核心的な処理を行います。つまり、mise が管理するツールを使用できるように環境（主に `PATH`）を
整えます。違いは、_いつ_、_どのように_ それを行うかです。

| Method                              | How it works                                           | Best for                                   |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------ |
| `mise activate`                     | シェルプロンプトにフックし、動的に PATH を更新する      | インタラクティブなターミナルでの使用       |
| `mise activate --shims`             | shim ディレクトリを一度だけ PATH に追加する             | IDE、シンプルな構成（フック・env 未対応）  |
| `mise exec` / `mise x`              | 環境を整え、単一のコマンドを実行してから終了する        | スクリプト、CI、単発のコマンド             |
| `mise env`                          | `eval` できる環境変数を出力する                         | 他のツールとの連携                         |
| `mise run`                          | 環境を整えてからタスクを実行する                        | タスクの実行                               |
| Shims (`~/.local/share/mise/shims`) | 呼び出しごとに mise を呼び出すラッパースクリプト        | 非インタラクティブなシェル、IDE            |

::: warning
`mise activate --shims` は、フック、`[env]` からの環境変数、`watch_files` を**サポートしません**。shim を PATH に
置くだけです。これらの機能が必要な場合は、（`--shims` なしの）`mise activate` を使用してください。
:::

## `mise exec` はどう動作するのか？ {#how-does-mise-exec-work}

`mise exec`（または `mise x`）は、設定を読み込み、`PATH` と環境変数を整え、`--` の後に指定したコマンドを
実行します。

```sh
# Uses whatever node version is in your mise.toml
mise x -- node script.js

# Override with a specific version (useful when it differs from config)
mise x node@22 -- node script.js
```

Discord でよく見られるパターンとして、`mise.toml` に既に node@20 が指定されている場合に
`mise x node@20 -- node script.js` と書くケースがあります。これは動作しますが冗長です — 設定されているバージョンを
そのまま使いたいだけなら `mise x -- node script.js` の方がシンプルです。

## `mise use` はどこに書き込むのか？ {#where-does-mise-use-write-to}

`mise use` は、ディレクトリ階層の中で最も近い `mise.toml` に書き込みます。親ディレクトリに `mise.toml`
（`-g` の場合は `~/.config/mise/config.toml` を含む）があれば、そのファイルを更新します。

```sh
mise use node@22           # writes to nearest mise.toml (may be a parent dir!)
mise use -g node@22        # writes to ~/.config/mise/config.toml
mise use --path mise.toml node@22  # writes to a specific file
```

現在のディレクトリで mise がどの設定ファイルを読み込んでいるかを確認するには `mise cfg` を使用します。

## mise は開発ツールのためのものであり、アプリケーションやシステムパッケージのためのものではない {#mise-is-for-dev-tools-not-applications-or-system-packages}

mise は**開発ツールのバージョン**（node、python、go、rust など）と CLI ユーティリティを管理します。`apt`、
`brew`、`pacman` のようなシステムパッケージマネージャーの代替ではありません。

mise が**行わない**こと:

- システムライブラリ（libssl、zlib など）のインストール
- デスクトップアプリケーションの管理
- ツールのコンパイルに必要なシステムレベルの依存関係の扱い

mise でインストールしたツールがシステムライブラリを必要とする場合は、先に OS のパッケージマネージャーでその
ライブラリをインストールしてください。

## mise のバージョニングはどう機能するのか？ {#how-does-mise-versioning-work}

mise は [Calver](https://calver.org/) 形式のバージョニング（`2024.1.0`）を使用しています。破壊的変更は少ないはず
ですが、発生する場合は可能な限り十分な予告とともに CLI で伝えられます。

大きなリリースでの変更を伝えるための SemVer のメジャーリリースを設けるのではなく、新機能や変更は
`experimental = true` のような設定でオプトインできます。これにより、プラグインの作者やユーザーはメジャーリリースを
待たずに、新しい機能をすぐに試せます。

Calver（YYYY.MM.RELEASE）の数字は、単純にリリースの日付を表しているだけで、互換性や追加された新機能の数を表す
ものではありません。各リリースは小さく、段階的なものになります。
