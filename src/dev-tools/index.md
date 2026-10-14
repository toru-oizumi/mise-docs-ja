---
title: 開発ツールの概要
description: "Install tools such as Node.js and Python, pick their versions per project, and upgrade or remove them."
upstreamPath: docs/dev-tools/index.md
upstreamUrl: https://mise.jdx.dev/dev-tools/
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# 開発ツールの概要 {#dev-tools}

mise は Node.js、Python、Go などのツールをインストールし、プロジェクトごとにそのバージョンを選択します。プロジェクトが使うバージョンを `mise.toml` で宣言すると、そのディレクトリで作業している間、mise がそれらを `PATH` に追加します。

## プロジェクトにツールを追加する {#add-a-tool-to-a-project}

プロジェクトのディレクトリで次を実行します。

```sh
mise use node@24 python@3.14
```

これにより両方のツールがインストールされ、バージョン指定がプロジェクトの設定に記録されます。

```toml [mise.toml]
[tools]
node = "24"
python = "3.14"
```

それらのツールを使ってコマンドを実行します。

```sh
mise exec -- node --version
# v24.x.x
```

[シェルの有効化（原文）](https://mise.jdx.dev/shell-setup.html)を行えば `node --version` を直接実行でき、プロジェクト間を移動するたびに mise がバージョンを切り替えます。リポジトリをクローンした後や、その `mise.toml` を編集した後は、`mise install` を実行して宣言されたツールをインストールしてください。

## よく使うコマンド {#choose-the-right-command}

| 目的                                   | コマンド                              |
| -------------------------------------- | ------------------------------------- |
| プロジェクトのツールのバージョンを追加・変更する | `mise use node@24`                    |
| 個人のデフォルトを設定する             | `mise use --global node@24`           |
| プロジェクトが宣言するツールをインストールする | `mise install`                        |
| タスクが必要とするツールもインストールする | `mise install --include-task-tools`   |
| 保存せずにあるバージョンを1回だけ実行する | `mise exec node@24 -- node --version` |
| このディレクトリが使うツールを表示する | `mise ls --current`                   |
| インストール可能なバージョンを一覧表示する | `mise ls-remote node`                 |
| コマンドが実行する実行ファイルを表示する | `mise which node`                     |
| 新しいバージョンがあるツールを表示する | `mise outdated`                       |
| 設定された指定の範囲内でアップグレードする | `mise upgrade node`                   |
| アップグレードして指定を書き換える     | `mise upgrade --bump node`            |
| プロジェクトからツールを削除する       | `mise unuse node`                     |
| インストール済みのバージョンを削除する | `mise uninstall node@22`              |

[`mise use`（原文）](https://mise.jdx.dev/cli/use.html) はバージョンをインストールし、その指定をプロジェクトの `mise.toml` に書き込みます。`--pin` を付けると代わりに解決後のバージョンを書き込み、`--global` を付けると個人のデフォルトを `~/.config/mise/config.toml` に書き込み、`--path` を付けると書き込むファイルを選べます。詳細は[mise が書き込むファイル](/configuration.html#target-file-for-write-operations)を参照してください。`mise use` は自身が実行されたシェルを変更できません。有効化している場合は次のプロンプトで変更が反映され、`mise exec` とタスクは毎回設定を読み込みます。

[`mise install`（原文）](https://mise.jdx.dev/cli/install.html) は設定を一切変更せずにツールをインストールします。

- `mise install node@24.11.1` はそのバージョンをインストールします。
- `mise install node@24` は 24.x の最新リリースをインストールします。
- `mise install node` は設定が選択するバージョンをインストールします。
- `mise install` は、[`lazy = true`](/dev-tools/shims.html#lazy-tools) が指定されたツールを除く、設定されたすべてのツールをインストールします。それらもインストールするには `--include-lazy` を付けます。
- `mise install --include-task-tools` は、現在のスコープのタスクが必要とするツールも、タスクを実行せずにインストールします。これは CI、コンテナー、オフラインのキャッシュを事前に温めるのに使えます。`--monorepo` を付けると、設定されたすべてのモノレポのルートが対象に含まれます。

[`mise exec`（原文）](https://mise.jdx.dev/cli/exec.html) は同じ設定ファイルを読み込むため、有効化や shim を使わなくても、任意のコマンドの前に `mise exec --` を付けるだけで使えます。`alias mx='mise exec --'` のようなエイリアスを作ると入力の手間が省けます。[`mise run`](/tasks/) はタスクのために同じツールと環境を読み込みます。

## mise がツールを選択する仕組み {#how-tools-are-selected}

1. mise は、現在のディレクトリ、その親ディレクトリ、グローバル設定から `mise.toml` などの設定ファイルを読み込みます。現在のディレクトリに近いファイルが、より上位のファイルを上書きします。[設定ファイルの場所](/configuration.html#mise-toml)を参照してください。
2. [レジストリ（原文）](https://mise.jdx.dev/registry.html)は、`node` のような短い名前を[バックエンド（原文）](https://mise.jdx.dev/dev-tools/backends/)に対応付けます。バックエンドはバージョンを一覧表示し、ツールをインストールします。
3. バックエンドは、`24` や `latest` のような[バージョン指定（原文）](https://mise.jdx.dev/dev-tools/versions.html)を解決します。mise は新しいバージョンを探す前に、一致するインストール済みのバージョンを再利用します。また、[ロックファイル（原文）](https://mise.jdx.dev/dev-tools/mise-lock.html)で結果を固定できます。
4. mise は選択したツールを、コマンド、タスク、またはシェルの `PATH` に追加します。`mise exec` と `mise run` は、不足しているツールを先にインストールします。

mise は `.tool-versions` ファイルも読み込みます。`.nvmrc` や `.python-version` のような他のツールのバージョンファイルを使うには、[idiomatic バージョンファイル（idiomatic version file）（原文）](https://mise.jdx.dev/dev-tools/versions.html#idiomatic-version-files)を有効にする必要があります。asdf から移行する場合は、[asdf からの移行](/dev-tools/comparison-to-asdf.html)を参照してください。あるディレクトリでどの設定ファイルが適用されるかを確認するには、`mise config ls` を実行します。

## シェル、エディター、スクリプト {#shells-editors-and-scripts}

- インタラクティブシェルでは、[mise を有効化（原文）](https://mise.jdx.dev/shell-setup.html)すると、プロンプトのたびに `PATH` とプロジェクトの環境変数が更新されます。
- エディターや IDE では、プログラムが固定の実行ファイルのパスを必要とする場合に、[shim](/dev-tools/shims.html) または[エディターとの統合](/ide-integration.html)を使います。
- スクリプトや CI では、`mise exec -- <command>` または `mise run <task>` を実行します。[継続的インテグレーション](/continuous-integration.html)を参照してください。

3つのアプローチの比較は [shim](/dev-tools/shims.html#overview) を参照してください。

## ツールのアップグレード {#upgrade-tools}

[`mise outdated`（原文）](https://mise.jdx.dev/cli/outdated.html) は、設定されたツールのうち、その指定に一致する新しいリリースがあるものを一覧表示します。`--bump` を付けると、全体で最新のリリースと比較します。

[`mise upgrade`（原文）](https://mise.jdx.dev/cli/upgrade.html) は、各指定の範囲内で最新のリリースをインストールします。`mise.toml` に `node = "24"` がある場合、`mise upgrade node` は 24.x の最新をインストールし、`mise.toml` は変更しません。プロジェクトが[ロックファイル（原文）](https://mise.jdx.dev/dev-tools/mise-lock.html)を使っている場合、mise は `mise.lock` を新しいバージョンに更新します。

`--bump` は最新のリリースにアップグレードし、同じ精度で指定を書き換えます。`node = "24"` は `node = "26"` になり、`node = "24.11.1"` は最新の正確なバージョンになります。`mise upgrade --bump node@latest` のように指定を明示すると、mise は代わりにその指定を書き込みます。

```sh
mise upgrade --dry-run      # show what would change
mise upgrade --interactive  # pick tools from a list
mise upgrade --bump --local # bump only tools in project config
mise upgrade --global       # upgrade only tools in global config
```

`--global` は、プロジェクトが独自にあるツールのバージョンを設定している場合でも、グローバル設定の指定をアップグレードします。プロジェクトの設定やロックファイルは決して変更しません。`mise outdated --global` は、それによってインストールされるものを表示します。自身を更新するツールもこの2つのコマンドを使います。[自己更新するツール（原文）](https://mise.jdx.dev/dev-tools/self-updating-tools.html)を参照してください。

アップグレード後、mise は置き換えた古いバージョンを、[`upgrade.prune_after`（原文）](https://mise.jdx.dev/configuration/settings.html#upgrade.prune_after) の期間が経過した時点で削除するようにスケジュールします。これにより、実行中のプログラムは引き続きそのバージョンを使えます。すぐに削除するには `--prune` を、残すには `--no-prune` を指定します。置き換えたバージョンをデフォルトで残すには、[`upgrade.auto_prune`（原文）](https://mise.jdx.dev/configuration/settings.html#upgrade.auto_prune) を `false` に設定します。

## ツールの自動更新 {#automatic-tool-updates}

グローバル設定（`~/.config/mise/config.toml`）にあるツールは、自身を最新の状態に保てます。そのエントリに `auto_update` を設定します。

```toml [~/.config/mise/config.toml]
[tools]
claude = { version = "latest", auto_update = true }
node = { version = "24", auto_update = "6h" }
```

shim または `mise exec` がツールを実行しようとしたとき、その間隔内に mise が更新を確認していなければ、mise は先にそのツールに対して `mise upgrade` を実行し、通常のインストールの進行状況を表示してから、新しいバージョンを実行します。更新は指定の範囲内に留まります。`node = "24"` は 24.x の最新になり、26 になることはありません。更新に失敗した場合やオフラインの場合、mise は警告を出し、手元にあるバージョンを実行します。

[`mise activate`（原文）](https://mise.jdx.dev/shell-setup.html) を使ったシェルでは、ツールは `PATH` から直接実行されるため、コマンドとの間に何も挟まりません。代わりに、シェルのプロンプトが表示され、あるツールの確認時期が来ていれば、mise はバックグラウンドで更新を開始し、プロンプトは待たされません。更新が完了し、シェルが環境を再読み込みした後（これはプロンプトの表示時に行われます）、コマンドは新しいバージョンを使います。更新の出力は破棄されます。失敗した場合は `mise doctor` がエラーを表示します。

`auto_update = true` は [`tool_update.check_duration`（原文）](https://mise.jdx.dev/configuration/settings.html#tool_update.check_duration) ごとに確認します。`"6h"` のような期間を指定すると、そのツール独自の間隔を設定します。1時間未満の間隔は1時間に引き上げられます。

各ツールに個別に指定せずにグローバル設定のすべてのツールを更新するには、[`tool_update.global_auto`（原文）](https://mise.jdx.dev/configuration/settings.html#tool_update.global_auto) を `true` または間隔に設定します。ツール自身の `auto_update` が引き続き優先されるため、`auto_update = false` でそのツールを対象外にできます。

```toml [~/.config/mise/config.toml]
[settings]
tool_update.global_auto = "12h"

[tools]
claude = "latest"
node = { version = "24", auto_update = "6h" }
python = { version = "3.13", auto_update = false }
```

::: tip 24h の待機は最大 48h になりうる
更新は [`minimum_release_age`（原文）](https://mise.jdx.dev/security.html#minimum-release-age) に従います。これは[ほとんどのバックエンド（原文）](https://mise.jdx.dev/security.html#which-backends-have-a-default)でデフォルトが `24h` です。リリースは公開から24時間後に対象となり、mise はそれを次の確認時にようやく検知します。そのため、確認間隔ごとに少なくとも1回ツールを起動していれば、更新はリリースから24〜48時間後に適用されます。そうでなければ、さらに遅くなります。
:::

さらに長く待つには、ツールに `minimum_release_age` を設定します。

```toml [~/.config/mise/config.toml]
[tools]
node = { version = "24", auto_update = "6h", minimum_release_age = "3d" }
```

- これを有効にできるのはグローバル設定だけです。プロジェクトの設定では有効にできません。また、プロジェクトがそのツールの独自のバージョンを設定している場合、そのプロジェクト内での実行ではツールは更新されません。
- 起動時に確認されるのは、実行されるツールだけです。`mise exec -- npm test` は `claude` を更新しません。有効化したシェルでは、プロンプトの表示時に、間隔が経過したすべての対象ツールを確認します。タスクがツールを更新することはありません。
- `node = "24.11.1"` のような正確なバージョンは決して更新されません。グローバルのロックファイル（`mise lock --global`）がツールを固定している場合、更新によってロックのエントリが新しいバージョンに移ります。プロジェクトの設定とロックファイルは決して変更されません。
- 更新されるのはインストール済みのツールだけです。誰もまだ実行していない[遅延ツール（lazy tool）](/dev-tools/shims.html#lazy-tools)のように、インストール済みのバージョンがないツールは、何かがインストールするまでそのままです。
- オフライン、CI、または `locked = true` の場合、更新は実行されません。
- 以前のバージョンは、`mise upgrade` の後と同じスケジュールで削除されます。
- ツールの最後の更新が失敗した場合、`mise doctor` がエラーを表示します。

起動時やプロンプトの表示時ではなくスケジュールに沿って確認し、シェルを使っていないときでもツールを最新に保つには、グローバル設定で `tool-update` サービスを宣言し、`mise bootstrap services apply` を実行します。

```toml [~/.config/mise/config.toml]
[bootstrap.services.mise-tool-update]
builtin = "tool-update"
```

このサービスは1時間に1回確認し、間隔が来た各ツールを更新します。サービスの実行中は、起動時やプロンプトの表示時にツール自身が更新されることはありません。[ユーザーサービス（原文）](https://mise.jdx.dev/bootstrap/services.html#user-services)を参照してください。

## ツールの削除 {#remove-tools}

| コマンド                 | 設定の編集          | 削除されるインストール済みのバージョン                        |
| ------------------------ | ------------------- | ------------------------------------------------------------- |
| `mise unuse node`        | 指定を削除する      | 追跡中の設定ファイルやツールスタブがもう必要としないバージョン |
| `mise uninstall node@22` | いいえ              | そのバージョン。`--all` でそのツールのすべてのバージョンを削除 |
| `mise prune`             | いいえ              | 追跡中の設定ファイルやツールスタブがもう必要としないすべてのバージョン |

[`mise unuse`（原文）](https://mise.jdx.dev/cli/unuse.html) は、そのツールを宣言している最初に読み込まれた設定ファイル、または `--path`、`--global`、`--env` で選んだファイルを編集します。バージョンの引数は書かれたとおりの指定と照合されるため、`node = "24"` は解決後のバージョンではなく `mise unuse node@24` で削除します。インストールを残すには `--no-prune` を付けます。

[`mise uninstall`（原文）](https://mise.jdx.dev/cli/uninstall.html) はインストールを削除し、設定はそのままにします。そのため、まだ設定されているツールは次の `mise install` で再びインストールされます。

[`mise prune`（原文）](https://mise.jdx.dev/cli/prune.html) は、mise が使ったことのあるどの設定ファイルも、実行されたことのあるどのツールスタブも、もう必要としないバージョンを削除します。mise はそれらのファイルを `~/.local/state/mise/tracked-configs` と `tracked-stubs` に記録しています。実行中のプロセスの起動元になったバージョンは残します。何が削除されるかを確認するには、`mise ls --prunable` または `mise prune --dry-run` を実行します。

## 自動インストール {#auto-install-mechanisms}

設定されたツールが見つからないとき、mise は失敗する代わりにそれをインストールできます。[`auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#auto_install) を `false` に設定すると、以下の最初の4つのケースが無効になります。また、[`auto_install_disable_tools`（原文）](https://mise.jdx.dev/configuration/settings.html#auto_install_disable_tools) には、それらがスキップするツールを列挙します。遅延ツールはそれでも初回使用時にインストールされます。

| 実行するもの                                                              | mise がインストールするもの                                    | 制御する設定                                                                                                      |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `mise exec`                                                               | 設定が選択する、不足しているツール                             | [`exec_auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#exec_auto_install)                 |
| `mise run`                                                                | タスクが必要とする、不足しているツール                         | [`task.run_auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#task.run_auto_install)         |
| 有効化したシェルでの不明なコマンド、または不足しているバージョンの shim   | そのコマンドを提供する、設定済みのツール                       | [`not_found_auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#not_found_auto_install)       |
| どの設定にも記載されていない不明なコマンド                                | それを提供する唯一のレジストリのツール（グローバル設定に追加） | [`not_found_auto_install_registry`（原文）](https://mise.jdx.dev/configuration/settings.html#not_found_auto_install_registry)（デフォルトは無効） |
| [遅延ツール](/dev-tools/shims.html#lazy-tools)のコマンド                  | そのツール（初回使用時）                                       | ツールの `lazy = true`                                                                                            |

自動インストールが無効の場合、`mise exec` はツールが不足していると警告し、`PATH` 上にあるそのコマンドを実行します。コマンドが見つからない場合のハンドラーはレジストリのコマンド名からツールを探すため、`cargo:some-crate` のような生のバックエンド指定で宣言されたツールは、そのいずれかのバージョンがインストールされるまでインストールできません。[トラブルシューティング](/troubleshooting.html#auto-install-on-command-not-found-does-not-trigger)を参照してください。

## ツールオプション {#tool-options}

オプションを設定するには、ツールをバージョン文字列ではなくテーブルとして記述します。以下のオプションは、対応するバックエンドが行に明記されている場合を除き、どのツールのエントリでも使えます。GitHub の `matching` のようなバックエンド固有のオプションは、各[バックエンドのページ（原文）](https://mise.jdx.dev/dev-tools/backends/)に記載されています。

| オプション            | 機能                                                                                                                                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`             | [バージョン指定（原文）](https://mise.jdx.dev/dev-tools/versions.html)。[それらの種類の指定（原文）](https://mise.jdx.dev/dev-tools/versions.html#scopes)には、代わりに `prefix`、`ref`、`path` を使います。 |
| `os`                  | これらのプラットフォームでのみツールをインストール・使用します。[OS 固有のツール](#os-specific-tools)を参照してください。 |
| `depends`             | これらのツールを先にインストールします。[ツールの依存関係](#tool-dependencies)を参照してください。 |
| `install_env`         | ツールをインストールするコマンド（ビルドスクリプト、パッケージマネージャー、プラグインのフック）とその `postinstall` のための環境変数。mise はツールの解決とダウンロードの際に、ここから GitHub、GitLab、Forgejo のトークンの変数も読み込みます。[トークン（原文）](https://mise.jdx.dev/dev-tools/github-tokens.html)を参照してください。 |
| `postinstall`         | ツールのインストール後に実行するコマンド。[ツールの postinstall コマンド](#tool-postinstall-commands)を参照してください。 |
| `lazy`, `lazy_bins`   | ツールのコマンドのいずれかが初めて実行されたときにツールをインストールします。[遅延ツール](/dev-tools/shims.html#lazy-tools)を参照してください。 |
| `auto_update`         | グローバル設定でのみ、ツールの実行前にツールを更新します。[ツールの自動更新](#automatic-tool-updates)を参照してください。 |
| `minimum_release_age` | バックエンドがリリース日を報告する場合に、リリースから少なくともこの期間が経過したバージョンのみを選択します。[最小リリース経過期間（原文）](https://mise.jdx.dev/security.html#minimum-release-age)を参照してください。 |
| `prerelease`          | `mise ls-remote` と、`latest` やプレフィックスの解決にプレリリースを含めます。core の `java` プラグインを除くすべてのバックエンドがこれに従います。[`prereleases`（原文）](https://mise.jdx.dev/configuration/settings.html#prereleases)を参照してください。 |
| `version_order`       | aqua、github、gitlab、forgejo、http のツールで、バージョンを `semver` または `source` の順に並べます。[バージョンの順序（原文）](https://mise.jdx.dev/dev-tools/versions.html#version-ordering)を参照してください。 |

mise の HTTP クライアントは `install_env` からプロキシの変数を読み込まないため、`HTTPS_PROXY` などの変数は mise を起動する環境で設定してください。

### インライン記法とテーブル記法 {#table-format}

短いオプションは1行に収まります。ツールに複数のオプションがある場合はテーブルを使います。次の2つは同等です。

::: code-group

```toml [Inline]
[tools]
ripgrep = { version = "15", os = ["linux", "macos"] }
```

```toml [Table]
[tools.ripgrep]
version = "15"
os = ["linux", "macos"]
```

:::

mise は TOML 1.1 を読み込むため、インラインテーブルは複数行にまたがり、末尾にカンマを付けられます。HTTP バックエンドのプラットフォームごとの `platforms` のような入れ子のオプションには、ドット区切りのキーを使うか、プラットフォームごとに1行ずつ書けます。

```toml [mise.toml]
[tools."http:my-tool"]
version = "1.0.0"
platforms.macos-arm64.url = "https://example.com/my-tool-macos-arm64.tar.gz"
platforms.linux-x64.url = "https://example.com/my-tool-linux-x64.tar.gz"
```

チェックサムと実行ファイルの選択については、[HTTP バックエンド（原文）](https://mise.jdx.dev/dev-tools/backends/http.html)を参照してください。

### コマンドラインでのオプション指定 {#on-the-command-line}

ツール名の後、バージョンの前に、角括弧で囲んだオプションをカンマ区切りで付け加えます。シェルが角括弧を展開しないように、引数をクォートしてください。

```sh
mise use 'github:jqlang/jq[version_prefix=jq-,rename_exe=jq]@1.8.2'
```

同じ形式は `mise install` と `mise exec` でも使えます。`mise use` はオプションを `mise.toml` に書き込みます。

```toml [mise.toml]
[tools]
"github:jqlang/jq" = { version = "1.8.2", version_prefix = "jq-", rename_exe = "jq" }
```

`mise use --tool-option KEY=VALUE` は、その後に続くツールにオプションを設定します。`mise use --tool-option mr_boxington=true rust mr-boxington` は `rust` にオプションを設定し、そのオプションが必要とする `mr-boxington` ツールを追加します。[Mr Boxington で Cargo のビルドをキャッシュする（原文）](https://mise.jdx.dev/lang/rust.html#share-cargo-builds-with-mr-boxington)を参照してください。

### ツールオプションでの変数 {#templates-in-tool-configuration}

バージョンとオプションの値には、環境変数や [`vars`（原文）](https://mise.jdx.dev/configuration/vars.html) を使った[テンプレート（原文）](https://mise.jdx.dev/templates.html)を使えます。これには、`[env]` が `_.source`、`_.file`、env モジュールで読み込む値も含まれます。例えば、Go のインストールで社内のモジュールプロキシを使うには次のようにします。

```toml [mise.toml]
[vars]
goproxy = "https://goproxy.example.com"

[tools]
go = "1.27"
"go:github.com/mikefarah/yq/v4" = { version = "latest", install_env = { GOPROXY = "{{ vars.goproxy }}" } }
```

### OS 固有のツール {#os-specific-tools}

`os` を設定すると、一部のプラットフォームでのみツールをインストール・使用します。それ以外のプラットフォームでは、mise はそのツールをスキップします。

```toml [mise.toml]
[tools]
# Linux and macOS only
ripgrep = { version = "latest", os = ["linux", "macos"] }

# Windows only
"github:PowerShell/PowerShell" = { version = "latest", os = ["windows"] }

# Linux, and macOS on Apple silicon
hk = { version = "latest", os = ["linux", "macos/arm64"] }
```

値は `linux`、`macos`（または `darwin`）、`windows`（または `win`）、`unix`（Windows 以外のすべてのプラットフォーム）です。`macos/arm64` や `linux/x64` のようにアーキテクチャを付けると、値を絞り込めます。アーキテクチャは `arm64`（または `aarch64`）と `x64`（または `x86_64`、`amd64`）です。アーキテクチャを付けない値は、そのプラットフォーム上のすべてのアーキテクチャにマッチします。

### ツールの依存関係 {#tool-dependencies}

`depends` は、あるツールが他のツールのインストール完了を待つようにします。ツールのインストールや `postinstall` が、そのバックエンドがもともと必要としない別のツールを実行する場合に使います。

```toml [mise.toml]
[tools]
node = "24"
# postinstall runs npm, so node must finish installing first
# (github:example/acme is a placeholder)
"github:example/acme" = { version = "1.2.3", depends = ["node"], postinstall = "npm install --prefix ~/.acme acme-plugins" }
```

`depends` には1つのツール名またはリストを指定します。これはインストールの順序を決めるだけで、列挙されたツールを追加したりインストールしたりはしません。それぞれのツールは `[tools]` にあって先にインストールされるか、すでに `PATH` 上にある必要があります。依存する側のツールがインストールされ、その `postinstall` を実行している間、列挙されたツールは `PATH` 上にあります。プラグインの作者は、プラグイン自身の要件を `PLUGIN.depends` で宣言します。[ツールプラグイン開発（原文）](https://mise.jdx.dev/tool-plugin-development.html#depends)を参照してください。

### ツールの postinstall コマンド {#tool-postinstall-commands}

`postinstall` は、このツールのインストール後にコマンドを実行します。これは、`mise install` 全体の後に1回実行される [`[hooks].postinstall`（原文）](https://mise.jdx.dev/hooks.html) フックとは別物です。

```toml [mise.toml]
[tools]
node = { version = "24", postinstall = "corepack enable" }
```

デフォルトでは、コマンドは mise がツールをインストールまたは修復したときにのみ実行され、インストールが失敗した後や `--dry-run` のときには決して実行されません。バージョンがすでにインストールされていても、`mise install` と `mise use` のたびに実行するには、`when = "always"` を設定します。

```toml [mise.toml]
[tools]
node = { version = "24", postinstall = { run = "corepack enable", when = "always" } }
```

コマンドは、ツールの `bin` ディレクトリと[依存関係](#tool-dependencies)が `PATH` 上にあり、ツールの `install_env` とプロジェクトの `[env]` の値が設定された状態で実行されます。<code v-pre>{{ tools.ripgrep.path }}</code> のようなテンプレートは先にレンダリングされます。また、次の環境変数も受け取ります。

- `MISE_TOOL_NAME`: ツールの短い名前（`node` など）。
- `MISE_TOOL_VERSION`: インストールされたバージョン（`24.11.1` など）。
- `MISE_TOOL_INSTALL_PATH`: ツールがインストールされたディレクトリ。
- `MISE_CONFIG_FILE`: ツールを宣言した設定ファイル。
- `MISE_CONFIG_ROOT`: そのファイルの[設定ルート](/configuration.html#config-root)。
- `MISE_PROJECT_ROOT`: アクティブなプロジェクトのルート。アクティブなプロジェクトがない場合は設定ルート。

`postinstall` が失敗すると、インストールも失敗します。

## システムへのインストール {#system-installations}

`mise install --system` は、ツールを共有ディレクトリ（デフォルトでは `/usr/local/share/mise/installs`）にインストールするため、マシン上のすべてのユーザーアカウントが1つのコピーを使えます。通常のユーザーとして実行してください。Unix では、mise は保護されたディレクトリに書き込むときにのみ `sudo` を呼び出します。対応するバックエンド、ディレクトリ、sudo の設定については、[システムインストール（原文）](https://mise.jdx.dev/dev-tools/system-installs.html)を参照してください。

## キャッシュ {#caching-and-performance}

mise は、ツールのリモートバージョンの一覧を [`fetch_remote_versions_cache`（原文）](https://mise.jdx.dev/configuration/settings.html#fetch_remote_versions_cache) で設定された期間だけ再利用します。一覧を更新するには `mise cache clear <tool>` を実行します。[キャッシュ（原文）](https://mise.jdx.dev/cache-behavior.html)を参照してください。また、有効化後の動作が遅いと感じる場合は[シェルプロンプトが遅い](/troubleshooting.html#slow-shell-prompts)を参照してください。
