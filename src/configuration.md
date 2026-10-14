---
title: mise.toml
description: "Configure tools, environment variables, and tasks in mise.toml, and control where mise finds and writes config files."
socialDescription: "Configure tools, environment variables, and tasks in mise.toml, and where mise finds config files."
upstreamPath: docs/configuration.md
upstreamUrl: https://mise.jdx.dev/configuration.html
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# mise.toml {#mise-toml-reference}

プロジェクトの `mise.toml` は、そのプロジェクトが必要とするツール、環境変数、タスクを宣言します。mise はこれを、グローバル設定や親ディレクトリにある設定ファイルと組み合わせます。

```mise-toml [mise.toml]
[tools]
node = "24"

[env]
NODE_ENV = "development"

[tasks.hello]
run = "node --eval 'console.log(process.env.NODE_ENV)'"
```

`mise run hello` を実行すると、Node.js がなければインストールしたうえで `development` を出力します。[`mise config`（原文）](https://mise.jdx.dev/cli/config.html) を実行すると mise が読み込んだ設定ファイルの一覧を、`mise ls --current` を実行すると選択されたツールのバージョンを確認できます。

| 設定する内容                                      | リファレンス                                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| ツールのバージョンとインストールオプション        | [開発ツール](/dev-tools/)                                                                      |
| コマンドに渡す環境変数                            | [環境変数](/environments/)                                                                     |
| テンプレート内で再利用する値                      | [設定変数（原文）](https://mise.jdx.dev/configuration/vars.html)                               |
| 開発・テスト・本番用のオーバーレイ                | [設定環境](/configuration/environments.html)                                                   |
| コマンドとその依存関係                            | [タスク](/tasks/)                                                                              |
| `cd` 時、インストール時、変更時に実行するコマンド | [フック（原文）](https://mise.jdx.dev/hooks.html)                                              |
| マシンがプロジェクトをビルドできるかのチェック    | [プロジェクト診断（原文）](https://mise.jdx.dev/configuration/project-diagnostics.html)        |
| 長時間動作するサービス                            | [デーモン（原文）](https://mise.jdx.dev/daemons.html)                                          |
| mise 自体の動作                                   | [設定項目（原文）](https://mise.jdx.dev/configuration/settings.html)                           |

[トップレベルキー](#top-level-keys) に、`mise.toml` に含められるすべてのセクションを示します。

## 設定ファイルの組み合わせ方 {#configuration-hierarchy}

mise は次の順序で設定を読み込み、後のファイルが前のファイルを上書きします。

1. `/etc/mise` にあるシステム設定。
2. `~/.config/mise` にあるグローバル設定。
3. ファイルシステムのルートから現在のディレクトリまでの、各ディレクトリにある設定ファイル。[`ceiling_paths`（原文）](https://mise.jdx.dev/configuration/settings.html#ceiling_paths) が設定されている場合、探索は最も近い ceiling ディレクトリの下から始まります。ceiling ディレクトリ自体にあるファイルは読み込まれません。

そのため、深いディレクトリにあるファイルが親ディレクトリにあるファイルを上書きします。各ディレクトリで、mise は [設定ファイルの場所](#mise-toml) にあるファイルを読み込み、どれが優先されるかはその表の順序で決まります。[設定環境](/configuration/environments.html) を選択すると、この探索の各階層に環境ファイルが追加されます。親ディレクトリにある環境ファイルは、子ディレクトリにある通常のファイルを上書きしません。

```text
/
├── etc/mise/                         # system config (lowest precedence)
│   ├── conf.d/*.toml
│   ├── config.toml
│   └── config.<env>.toml
└── home/user/
    ├── .config/mise/                 # global config
    │   ├── conf.d/*.toml
    │   ├── config.toml
    │   ├── config.<env>.toml
    │   ├── config.local.toml
    │   └── config.<env>.local.toml
    └── work/
        ├── mise.toml                 # shared by every project in work/
        └── myproject/
            ├── mise.toml             # project config
            ├── mise.<env>.toml       # environment config
            ├── mise.local.toml       # personal overrides, not committed
            ├── mise.<env>.local.toml
            └── backend/
                └── mise.toml         # nearest file (highest precedence)
```

値はファイル全体を置き換えるのではなく、マージされます。次の 3 つのファイルがある場合、`~/src/app` で作業すると、mise は `mise.local.toml` の `node` のリクエストと、グローバル設定の `python` のリクエストを使用します。

::: code-group

```toml [~/.config/mise/config.toml]
[tools]
node = "22"
python = "3.13"
```

```toml [~/src/app/mise.toml]
[tools]
node = "24"
```

```toml [~/src/app/mise.local.toml]
[tools]
node = "25"
```

:::

これらはバージョン指定であり、mise はその後これを具体的なバージョンに解決します。

### セクションごとのマージ方法 {#merge-behavior-by-section}

| セクション           | ファイルの組み合わせ方                                                                                                                                                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[tools]`            | ツールごと。最も近いファイルのエントリが、オプションを含めてそのツールのエントリ全体を置き換えます。他のツールは継承されます。                                                                                                                                                         |
| `[env]`              | 変数ごと。最も近いファイルが優先されます。[環境変数](/environments/) を参照してください。                                                                                                                                                                                              |
| `[vars]`             | 変数ごと。最も近いファイルが優先されます。                                                                                                                                                                                                                                             |
| `[settings]`         | 設定項目ごと。                                                                                                                                                                                                                                                                         |
| `[tasks]`            | タスク名ごと。より近いディレクトリのタスクが親のタスクを置き換えます。同じディレクトリ内では、`run`、`run_windows`、`file` のいずれも持たないブロックは、置き換えではなくメタデータを追加します。[どの定義が優先されるか（原文）](https://mise.jdx.dev/tasks/task-discovery.html#which-definition-wins) を参照してください。 |
| `[tool_config]`      | マージされません。同じ [設定ルート](#config-root) で宣言されたツールにのみ適用されます。                                                                                                                                                                                               |
| `[secrets.*]`        | フィールドごと。最も近いプロジェクトファイルが優先されます。グローバル設定では無視されます。                                                                                                                                                                                           |
| `[daemons]`          | デーモンごと。最も近い宣言がデーモン全体を置き換えます。                                                                                                                                                                                                                               |
| `[daemons_settings]` | キーごと。子プロジェクトに継承されます。グローバル設定とシステム設定では無視されます。                                                                                                                                                                                                 |

## 設定ファイルの場所 {#mise-toml}

これらは、mise が探索する各ディレクトリ（ファイルシステムのルートから現在のディレクトリまで）で探すファイル名です。同じディレクトリ内では、表の上にあるファイルが下にあるファイルを上書きします。システム設定とグローバル設定は、[グローバル設定とシステム設定](#global-config) にある名前を使用します。

| ファイル                          | 用途                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `mise.local.toml`                 | 個人用の上書き。バージョン管理には含めないでください。                                                       |
| `mise.toml`                       | 共有するプロジェクト設定                                                                                     |
| `mise/config.toml`                | `mise/` ディレクトリ内のプロジェクト設定                                                                     |
| `mise/conf.d/*/mise.toml`         | `mise/` 内のディレクトリフラグメント。[conf.d 内のディレクトリ](#conf-d-folders) を参照                      |
| `mise/conf.d/*.toml`              | アルファベット順に読み込まれる設定フラグメント。[conf.d](#conf-d) を参照                                     |
| `.mise/config.toml`               | 隠しディレクトリ `.mise/` 内のプロジェクト設定                                                               |
| `.mise/conf.d/*/mise.toml`        | `.mise/` 内のディレクトリフラグメント                                                                        |
| `.mise/conf.d/*.toml`             | `.mise/` 内のフラグメント                                                                                    |
| `.config/mise.toml`               | `.config/` 配下のプロジェクト設定                                                                            |
| `.config/mise/mise.toml`          | `.config/mise/` 内のプロジェクト設定                                                                         |
| `.config/mise/config.toml`        | `.config/mise/` 内のプロジェクト設定                                                                         |
| `.config/mise/conf.d/*/mise.toml` | `.config/mise/` 内のディレクトリフラグメント                                                                 |
| `.config/mise/conf.d/*.toml`      | `.config/mise/` 内のフラグメント                                                                             |
| `.tool-versions`                  | [`.tool-versions` 形式（原文）](https://mise.jdx.dev/dev-tools/versions.html#tool-versions) のツールバージョン |

- `mise.toml` と `mise.local.toml` はドットファイルとしても機能します。`.mise.toml` は `mise.toml` を、`.mise.local.toml` は `mise.local.toml` を上書きします。
- 各 `config.toml` の隣には `.config/mise/config.local.toml` のように `config.local.toml` を、それ以外の各 `mise.toml` の隣には `.config/mise.local.toml` のように `mise.local.toml` を置けます。ローカルファイルはすべて、同じディレクトリにあるすべての共有ファイルを上書きします。
- `mise.production.toml` のような環境ファイルは、その環境が選択されている場合に共有ファイルを上書きし、さらにローカルファイルがそれを上書きします。`mise.production.local.toml` のような環境ローカルファイルは、これらすべてを上書きします。複数の環境が選択されている場合、同じ種類のファイルでは、後の環境のファイルが前の環境のファイルを上書きします。[設定環境](/configuration/environments.html#file-names-and-precedence) を参照してください。
- [`override_config_filenames`（原文）](https://mise.jdx.dev/configuration/settings.html#override_config_filenames) 設定項目は、このリストの TOML の名前を独自の名前に置き換えます（環境ファイルは引き続き読み込まれます）。また、[`override_tool_versions_filenames`（原文）](https://mise.jdx.dev/configuration/settings.html#override_tool_versions_filenames) は `.tool-versions` を置き換えます。[`default_config_filename`（原文）](https://mise.jdx.dev/configuration/settings.html#default_config_filename) は、mise が作成するファイルの名前を変更します。

`mise config` は、mise が読み込んだファイルを優先順位の低い順に一覧表示します。後のファイルが前のファイルを上書きします。

## conf.d による設定の分割 {#conf-d}

`conf.d` ディレクトリに `*.toml` ファイルを置くと、設定をトピックごとに分割できます。mise はこれらをアルファベット順に、そのディレクトリ自身の `config.toml` より前に読み込むため、`config.toml` がフラグメントを上書きします。これはプロジェクト内の `mise/conf.d`、`.mise/conf.d`、`.config/mise/conf.d`、およびグローバル（`~/.config/mise/conf.d`）とシステム（`/etc/mise/conf.d`）のディレクトリで機能します。名前が `.` で始まるファイルはスキップされます。

`node.tools.toml` のようにフラグメント名にドットを含めることは非推奨です。ファイル名を `node-tools.toml` に変更してください。[conf.d の環境](/configuration/environments.html#conf-d-environments) を参照してください。

### conf.d 内のディレクトリ {#conf-d-folders}

`conf.d` ディレクトリ内のディレクトリは、設定をそれが使うファイルの隣に置いておけるフラグメントです。

```text
~/.config/mise/conf.d/
├── git.toml                  # single-file fragment
└── git-tools/                # folder fragment
    ├── mise.toml             # always loaded
    ├── mise.local.toml       # always loaded, usually gitignored
    ├── mise.linux.toml       # loaded when the linux environment is active
    ├── mise.linux.local.toml
    └── gitconfig
```

このディレクトリは、その中のファイルにとっての [設定ルート](#config-root) です。[dotfile（原文）](https://mise.jdx.dev/dotfiles.html) のソースとして指定した `"gitconfig"` のような相対パスはこのディレクトリ内で解決され、<code v-pre>{{ config_root }}</code> はこのディレクトリのパスになり、ここで定義されたタスクはデフォルトでこのディレクトリで実行されます。このディレクトリはシンボリックリンクでもよいため、dotfiles のチェックアウトは独自のレイアウトを保てます。

```sh
ln -s ~/src/dotfiles/git ~/.config/mise/conf.d/git-tools
```

mise はこのディレクトリから `mise.toml`、`mise.local.toml`、`mise.<env>.toml`、`mise.<env>.local.toml` のみを読み込み、再帰的には探索しません。名前が `.` で始まるディレクトリは無視されます。`mise.<env>.toml` ファイルは、明示的な [設定環境](/configuration/environments.html) と [プラットフォーム環境](/configuration/environments.html#platform-environments) で読み込まれ、`env_conf_d` の移行の影響を受けません。

ディレクトリフラグメントは、同じ `conf.d` ディレクトリ内の単一ファイルのフラグメントの後に、ディレクトリ名のアルファベット順で、そのディレクトリ自身の設定（`config.toml` など）より前に読み込まれます。その環境ファイルは、`conf.d/<name>.<env>.toml` や `conf.d/<name>.<env>.local.toml` が占めるのと同じ位置に入ります。ディレクトリフラグメントの `mise.local.toml` は、親ディレクトリ自身の `config.local.toml` の直前に読み込まれます。つまり、[環境ファイルの順序](/configuration/environments.html#file-names-and-precedence) に従い、ディレクトリフラグメントと親ディレクトリの `.<env>.toml` ファイルは上書きしますが、それらの `.<env>.local.toml` ファイルは上書きしません。プロジェクトのディレクトリフラグメントで宣言されたツールは、プロジェクトのロックファイルを共有します。

タスクについては、ディレクトリフラグメントはそれ自体がルートになります。その `[task_config]` はそのディレクトリフラグメントが定義するタスクにのみ適用され、`task_config.includes = ["tasks"]` は、`~/.config/mise/tasks` のような周囲の設定のデフォルトのタスクディレクトリを置き換えることなく、ディレクトリフラグメントの `tasks/` ディレクトリからファイルタスクを読み込みます。周囲の設定が `cascade = true` で設定した `[task_config]` の値は、`includes` を除いて引き続き適用されます。ディレクトリフラグメントと他の設定が同じ名前のタスクを定義している場合は、優先順位の高いファイルのタスクが優先されます。また、`.mise/tasks` のようなデフォルトのタスクディレクトリでのみ見つかったタスクは、設定ファイルが定義するタスクに負けます。[タスクの探索と優先順位（原文）](https://mise.jdx.dev/tasks/task-discovery.html) を参照してください。

## グローバル設定とシステム設定 {#global-config}

グローバル設定はすべてのディレクトリに適用されます。グローバル設定は `~/.config/mise`（[`MISE_CONFIG_DIR`（原文）](https://mise.jdx.dev/directories.html#config-mise)）にあり、通常は `config.toml` に記述します。このディレクトリには、`mise.toml`、`conf.d/` のフラグメント、マシン固有の値のための `config.local.toml`、`config.work.toml` のような環境ファイルも置けます。`mise use --global` と `mise settings` はここに書き込みます。

```toml [~/.config/mise/config.toml]
[tools]
node = "lts"
python = ["3.14", "3.13"]

[settings]
idiomatic_version_file_enable_tools = ["node"]
trusted_config_paths = ["~/work"]

[settings.status]
show_env = false
show_tools = false
```

グローバル設定は、いくつかの点でプロジェクト設定と異なります。

- [設定ルート](#config-root) はホームディレクトリ、または [`global_config_root`（原文）](https://mise.jdx.dev/configuration/settings.html#global_config_root) です。
- `[secrets.*]` と `[daemons_settings]` はグローバル設定では無視され、`[daemon_providers]` はグローバル設定でのみ使用できます。
- [`global_config_file`（原文）](https://mise.jdx.dev/configuration/settings.html#global_config_file)（`MISE_GLOBAL_CONFIG_FILE`）は、これらすべてのファイルを 1 つのファイルに置き換えます。

システム設定はマシン上のすべてのユーザーに適用され、優先順位が最も低くなります。システム設定は `/etc/mise`（[`MISE_SYSTEM_CONFIG_DIR`（原文）](https://mise.jdx.dev/directories.html#system-config)）にあり、`/etc/mise/config.toml` のように、グローバルディレクトリと同じファイル名を受け付けます。[`system_config_file`（原文）](https://mise.jdx.dev/configuration/settings.html#system_config_file)（`MISE_SYSTEM_CONFIG_FILE`）は、これらを単一のファイルに置き換えます。

## mise が書き込むファイル {#target-file-for-write-operations}

[`mise use`（原文）](https://mise.jdx.dev/cli/use.html)、[`mise set`（原文）](https://mise.jdx.dev/cli/set.html)、[`mise unset`（原文）](https://mise.jdx.dev/cli/unset.html)、`mise settings --local`、[`mise tasks add`（原文）](https://mise.jdx.dev/cli/tasks/add.html) がプロジェクト設定を変更するときは、設定がある最も近いディレクトリの中で、最も優先順位の低いファイルに書き込みます。デフォルトでは共有設定が更新され、個人用のファイルや環境ファイルは明示的に指定した場合にのみ変更されます。

```sh
# In a directory with mise.toml and mise.local.toml:
mise use node@24                # writes mise.toml
mise set NODE_ENV=production    # writes mise.toml
mise use --env local node@25    # writes mise.local.toml
mise use --env staging node@24  # writes mise.staging.toml
```

ディレクトリに `mise.local.toml` しかない場合、書き込みは `mise.local.toml` に対して行われます。設定のないサブディレクトリからは、親ディレクトリのファイルに書き込まれます。設定ファイルを持つディレクトリがない場合、mise は現在のディレクトリに `mise.toml` を作成します。ホームディレクトリでは、代わりにグローバル設定に書き込みます。グローバル設定に書き込むには `--global` を、ファイルを選ぶには `--path` を使用します。

他のコマンドは、別の方法で書き込み先を選びます。

- [`mise config get`（原文）](https://mise.jdx.dev/cli/config/get.html) と [`mise config set`（原文）](https://mise.jdx.dev/cli/config/set.html) は、読み込まれた TOML ファイルのうち最も優先順位の高いものを使用します。これは `mise.local.toml` になることもあります。別のプロジェクトファイルを選ぶには `--file` を使用します。
- [`mise unuse`（原文）](https://mise.jdx.dev/cli/unuse.html) は、指定されたツールを宣言している設定のうち、最初に読み込まれたものを使用します。バージョンを指定した引数は、設定されたリクエストと文字どおりに照合されます。`node@20` は `node = "20"` に一致しますが、`node = "20.0.0"` には一致しません。ファイルを選ぶには `--path` を使用します。

### グローバルな書き込みを別のファイルに振り分ける {#global-section-write-targets}

グローバルなツール、ブートストラップのパッケージ、dotfiles を別々のファイルで管理するには、[`write_targets`（原文）](https://mise.jdx.dev/configuration/settings.html#write_targets) でそれぞれの書き込み先を設定します。

```toml [~/.config/mise/config.toml]
[settings.write_targets]
tools = "~/.config/mise/conf.d/10-tools.toml"
packages = "~/.config/mise/conf.d/20-packages.toml"
dotfiles = "~/.config/mise/conf.d/30-dotfiles.toml"
```

すると、`mise use --global`、`mise bootstrap packages use --global`、`mise bootstrap packages import --global`、`mise dotfiles add`（デフォルトでグローバル設定に書き込みます）による新しい宣言は、それらのファイルに書き込まれます。書き込み先は、mise がグローバル設定ディレクトリから読み込むファイル（`config.toml`、`mise.toml`、または `conf.d` のフラグメント）への絶対パス（または `~/` で始まるパス）でなければなりません。`~/.config/mise/tools.toml` のようなパスは読み込まれないため、mise はこれを拒否します。

移動するのは新しいエントリだけです。既存のツール、パッケージ、dotfile は、それを宣言しているファイルに残ります。また、1 つのコマンドが複数のグローバルファイルにあるエントリを更新する場合、mise は処理を止めて `--path` の指定を求めます。`--path` は常に優先され、`mise use --env staging` のようなプロジェクトへの書き込みは影響を受けません。書き込み先が設定されていないものは、通常のグローバル設定ファイルを使用します。

## .miserc.toml {#miserc}

`.miserc.toml` は、どの [設定環境](/configuration/environments.html) を読み込むかなど、mise が設定ファイルを探す前に必要とする設定項目を保持します。mise はどの `mise.toml` よりも先にこれを読み込むため、これらの値を `mise.toml` の `[settings]` で設定しても、設定ファイルの探索には影響しません。

```toml [.miserc.toml]
env = ["development"]
```

受け付けるキーは次のものだけです: [`env`（原文）](https://mise.jdx.dev/configuration/settings.html#env)、[`auto_env`（原文）](https://mise.jdx.dev/configuration/settings.html#auto_env)、[`env_conf_d`（原文）](https://mise.jdx.dev/configuration/settings.html#env_conf_d)、[`ceiling_paths`（原文）](https://mise.jdx.dev/configuration/settings.html#ceiling_paths)、[`ignored_config_paths`（原文）](https://mise.jdx.dev/configuration/settings.html#ignored_config_paths)、[`override_config_filenames`（原文）](https://mise.jdx.dev/configuration/settings.html#override_config_filenames)、[`override_tool_versions_filenames`（原文）](https://mise.jdx.dev/configuration/settings.html#override_tool_versions_filenames)。JSON スキーマは [schema/miserc.json](https://github.com/jdx/mise/blob/main/schema/miserc.json) です。`ignored_config_paths` 内の相対パスは、その `.miserc.toml` ファイルがあるディレクトリから解決されます。

### mise が .miserc.toml を探す場所 {#miserc-locations}

優先順位の高い順に示します。

1. 現在のディレクトリ、次に各親ディレクトリの `.miserc.local.toml`、`.miserc.toml`、`.config/miserc.toml`（この順）。探索はホームディレクトリの後で終了し、ホームディレクトリの外にいる場合はファイルシステムのルートで終了します。また、`MISE_CEILING_PATHS` 環境変数に列挙されたディレクトリの手前で停止し、そのディレクトリは探索されません。ホームディレクトリとルートでは、`.miserc.local.toml` と `.miserc.toml` のみが読み込まれます。
2. `~/.config/mise/miserc.local.toml`、次に `~/.config/mise/miserc.toml`。どのディレクトリからでも読み込まれます。
3. `/etc/mise/miserc.toml`。

ファイルは自身が設定したキーだけを上書きし、それ以外のキーは継承された値を保持します。`env` は継承されたリストを置き換え、`env = []` はリストを空にします。`-E` オプションと `MISE_ENV` のような環境変数は、すべての `.miserc.toml` ファイルを上書きします。

### 個人単位とマシン全体での選択 {#personal-and-machine-wide-choices}

プロジェクト全体ではなく自分のチェックアウトに属する選択には、`.miserc.local.toml` を使用します。

```toml [.miserc.local.toml]
env = ["native"]
```

これにより、`mise install` や `mise run dev` などのコマンドは `mise.native.toml` を読み込みます。`.miserc.local.toml` をグローバルな Git の ignore ファイル（`core.excludesFile`）に追加して、すべてのリポジトリで追跡対象外のままにし、各ワークツリーで個別に作成してください。

共有のグローバル `miserc.toml` を編集せずにマシン全体で選択するには、`~/.config/mise` の `miserc.local.toml` を使用します。

```toml [~/.config/mise/miserc.local.toml]
env = ["work"]
```

プロジェクトの `.miserc.toml` ファイルや `.miserc.local.toml` ファイルは、引き続きこれを上書きできます。

### .miserc.toml でのテンプレート {#templates-in-miserc-toml}

`.miserc.toml` 内の値には、<code v-pre>ceiling_paths = ["{{ env.HOME }}"]</code> のように、限られたコンテキストで [Tera テンプレート（原文）](https://mise.jdx.dev/templates.html) を使用できます。利用できるものについては [.miserc.toml でのテンプレート（原文）](https://mise.jdx.dev/templates.html#miserc-template-support) を参照してください。テンプレートのレンダリングに失敗した場合、mise は警告を表示せずにファイルの生の内容を使用します。

## config_root {#config-root}

`config_root` は、設定ファイルの相対パスを解決する基準となるディレクトリであり、そのファイルのテンプレートにおける <code v-pre>{{ config_root }}</code> の値です。プロジェクト設定の場合、ファイルが `.config/mise.toml`、`.config/mise/config.toml`、`.mise/config.toml`、`mise/config.toml`、または `conf.d/*.toml` のフラグメントであっても、またサブディレクトリから mise を実行した場合でも、これはプロジェクトディレクトリになります。そのファイルで定義されたタスクは、デフォルトでそこで実行されます。例外は `.config/mise/mise.toml` と `.config/mise/mise.local.toml` で、これらのルートは `.config/mise/` 自体です。

| 設定ファイル                                 | `config_root`                |
| -------------------------------------------- | ---------------------------- |
| `~/src/app/mise.toml`                        | `~/src/app`                  |
| `~/src/app/.config/mise.toml`                | `~/src/app`                  |
| `~/src/app/.config/mise/config.toml`         | `~/src/app`                  |
| `~/src/app/.config/mise/conf.d/tools.toml`   | `~/src/app`                  |
| `~/src/app/.mise/config.toml`                | `~/src/app`                  |
| `~/src/app/mise/conf.d/node/mise.toml`       | `~/src/app/mise/conf.d/node` |
| `~/.config/mise/config.toml`（グローバル設定） | `~`                          |

[conf.d 内のディレクトリ](#conf-d-folders) は、それ自体がルートです。グローバル設定で別のディレクトリを使うには、[`global_config_root`（原文）](https://mise.jdx.dev/configuration/settings.html#global_config_root) を設定します。

```toml
[env]
# Both entries resolve against the project root
_.path = ["tools/bin", "{{ config_root }}/tools/bin"]

# Same as "{{ config_root }}/scripts/env.sh"
_.source = "scripts/env.sh"
```

## トップレベルキー {#top-level-keys}

| キー                                | 用途                                                                         | ドキュメント                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `[tools]`                           | ツールのバージョンとツールごとのオプション                                   | [開発ツール](/dev-tools/)、[ツールのオプション](/dev-tools/#tool-options)                     |
| `[tool_config]`                     | この設定ルートが宣言するツールに対するポリシー                               | [`[tool_config]`](#tool-config)                                                               |
| `[tool_alias]`                      | ツールのカスタムバージョン名                                                 | [ツールのエイリアス](/dev-tools/aliases.html)                                                 |
| `[plugins]`                         | プラグインのリポジトリ URL とローカルプラグインのパス                        | [`[plugins]`](#plugins)                                                                       |
| `[env]`                             | コマンドとタスクの環境変数                                                   | [環境変数](/environments/)                                                                    |
| `[vars]`                            | テンプレート用の値（エクスポートされない）                                   | [設定変数（原文）](https://mise.jdx.dev/configuration/vars.html)                              |
| `redactions`                        | 出力で隠す `env` または `vars` のキー                                        | [redaction（値の削除）（原文）](https://mise.jdx.dev/environments/secrets/#redaction)         |
| `[secrets.*]`（実験的）             | mise のシークレットのソース。プロジェクト設定のみ                            | [fnox（原文）](https://mise.jdx.dev/environments/secrets/fnox.html)                           |
| `[tasks]`                           | タスク                                                                       | [タスク](/tasks/)                                                                             |
| `[task_config]`                     | タスクのインクルード、除外、デフォルト値                                     | [タスク設定リファレンス（原文）](https://mise.jdx.dev/tasks/task-configuration.html)          |
| `[task_templates]`                  | `extends` 用の共有タスク定義                                                 | [タスクテンプレート（原文）](https://mise.jdx.dev/tasks/templates.html)                       |
| `[settings]`                        | mise 自体の動作                                                              | [設定項目（原文）](https://mise.jdx.dev/configuration/settings.html)                          |
| `[hooks]`                           | `cd` 時、ディレクトリに入ったとき・出たとき、インストール時に実行するコマンド | [フック（原文）](https://mise.jdx.dev/hooks.html)                                             |
| `[[watch_files]]`                   | ファイルの変更時に実行するコマンド                                           | [フック（原文）](https://mise.jdx.dev/hooks.html)                                             |
| `[shell_alias]`                     | ディレクトリ内にいる間に定義されるシェルエイリアス。有効化が必要             | [シェルエイリアス（原文）](https://mise.jdx.dev/shell-aliases.html)                           |
| `[wrappers]`                        | バイナリ名を横取りするコマンド                                               | [コマンドラッパー](/dev-tools/shims.html#command-wrappers)                                    |
| `include`                           | この設定にマージされる設定ファイル                                           | [`include`](#include)                                                                         |
| `min_version`                       | このファイルを使用できる最も古い mise のリリース                             | [`min_version`](#minimum-mise-version)                                                        |
| `monorepo_root`、`[monorepo]`       | `//path:task` 形式でのタスク指定。ルートを信頼すると、その配下の設定も信頼される | [モノレポタスク（原文）](https://mise.jdx.dev/tasks/monorepo.html)                         |
| `[doctor]`                          | `mise doctor project` 用のプロジェクトのチェック                             | [プロジェクト診断（原文）](https://mise.jdx.dev/configuration/project-diagnostics.html)       |
| `[deps]`（実験的）                  | プロジェクトの依存関係のプロバイダー                                         | [プロジェクトの依存関係（原文）](https://mise.jdx.dev/dev-tools/deps.html)                    |
| `[oci]`（実験的）                   | `mise oci build` の設定項目                                                  | [OCI イメージ（原文）](https://mise.jdx.dev/dev-tools/mise-oci.html)                          |
| `[daemons]`（実験的）               | バックグラウンドプロセスとサービスのプリセット                               | [デーモン（原文）](https://mise.jdx.dev/daemons.html)                                         |
| `[daemon_groups]`（実験的）         | 名前付きのデーモンのセット                                                   | [グループ（原文）](https://mise.jdx.dev/daemons.html#groups)                                  |
| `[daemons_settings]`（実験的）      | デーモンの ID とホスト名の名前空間                                           | [ポート、URL、ワークツリー（原文）](https://mise.jdx.dev/daemons/worktrees.html#namespaces)   |
| `[daemon_providers]`（実験的）      | 共有サーバー。グローバル設定のみ                                             | [プロジェクト間でデーモンを共有する（原文）](https://mise.jdx.dev/daemons/sharing.html)       |
| `[bootstrap]`                       | マシンのセットアップ（パッケージ、リポジトリ、サービスなど）                 | [ブートストラップ（原文）](https://mise.jdx.dev/bootstrap.html)                               |
| `[dotfiles]`                        | mise がホームディレクトリで管理するファイル                                  | [dotfiles（原文）](https://mise.jdx.dev/dotfiles.html)                                        |
| `[dotfile_groups]`                  | dotfiles の名前付きディレクトリツリー                                        | [グループ（原文）](https://mise.jdx.dev/dotfiles/groups.html)                                 |
| `[history]`                         | dotfiles の履歴が記録する内容                                                | [履歴（原文）](https://mise.jdx.dev/dotfiles/history.html)                                    |
| `[_]`                               | mise が無視する自由形式のデータ                                              | [`[_]`](#free-form-data)                                                                      |

バージョン指定、`prefix:1.25` のようなプレフィックス、`.tool-versions` については、[バージョン指定とバージョンファイル（原文）](https://mise.jdx.dev/dev-tools/versions.html) で説明しています。グローバルなツールは [`auto_update`](/dev-tools/#automatic-tool-updates) で自身を更新できます。

次のキーは非推奨です。

| 非推奨のキー                 | 代わりに使うもの | 削除予定のバージョン |
| ---------------------------- | ---------------- | -------------------- |
| `[alias]`                    | `[tool_alias]`   | 未定                 |
| `env_file`、`dotenv`         | `env._.file`     | 2027.4.0             |
| `env_path`                   | `env._.path`     | 2027.4.0             |
| `experimental_monorepo_root` | `monorepo_root`  | 2027.12.0            |

### `[tool_config]` {#tool-config}

`[tool_config]` は、同じ [設定ルート](#config-root) を共有する設定ファイルが宣言するツールにポリシーを適用します。`mise.local.toml` のポリシーは、その隣にある `mise.toml` のツールにも適用されます。グローバル、システム、または親の設定ルートから継承されたツールには影響しません。

```toml
[tool_config]
locked = true

[tools]
node = "24"
```

ポリシーは `locked` だけです。これは、この設定ルートのツールをロックファイルから解決・インストールすることを必須にします。[厳格なロックファイルモード（原文）](https://mise.jdx.dev/dev-tools/mise-lock.html#strict-lockfile-mode) を参照してください。

### `[plugins]` {#plugins}

`[plugins]` はプラグイン名に対応するリポジトリを設定するため、プロジェクトの全員が同じプラグインをインストールすることになります。

```toml
[plugins]
elixir = "https://github.com/my-org/mise-elixir.git"
node = "https://github.com/my-org/mise-node.git#v1.2.0" # a branch, tag, or full commit SHA
"vfox-backend:myplugin" = "https://github.com/jdx/vfox-npm"
```

コミットに固定する ref は完全な SHA でなければなりません。省略形の SHA はリモートから取得できないため、mise は拒否します。`asdf:`、`vfox:`、`vfox-backend:` のようなプラグインの種類を示すプレフィックスは省略可能です。省略した場合、mise はプラグインをクローンし、プラグインのファイルからその種類を検出します。

エントリは新規インストールにのみ適用されます。インストール済みのプラグインがエントリと一致しなくなった場合（URL が異なる、または ref がチェックアウトされていない場合）、`mise install`、`mise plugins install`、`mise doctor` が警告を出します。`[plugins]` の内容で再インストールするには、`mise plugins install --force <name>` を実行してください。共有せずに URL からプラグインを一度だけインストールするには、代わりに `mise plugins install <name> <git-url>` を実行してください。

エントリはローカルディレクトリを指すこともできます。絶対パスと `~/` で始まるパスはそのまま使用されます。`./` や `../` で始まる相対パスは、それを宣言したファイルの [設定ルート](#config-root) から解決されます。

```toml
[plugins]
example = "./plugins/mise-example"
```

mise は [`mise plugins link`（原文）](https://mise.jdx.dev/cli/plugins/link.html) と同様に、ローカルプラグインをプラグインディレクトリにシンボリックリンクするため、ソースへの変更は即座に反映されます。`file://` URL は Git リポジトリとして扱われ、クローンされます。

`[plugins]` は、非推奨の `shorthands_file` 設定項目（`MISE_SHORTHANDS_FILE`）を置き換えるものです。その `shortname = "backend-or-url"` の行をここに移してください。

### `include` {#include}

`include` は他の設定ファイルをこのファイルにマージします。これにより、組織はすべてのリポジトリが使うベースラインを公開でき、リポジトリは大きな設定を複数の部分に分割できます。

```toml
include = [
  "./config/tools.toml",
  "git::https://github.com/myorg/platform.git//mise.toml?ref=main",
  "oci::ghcr.io/myorg/platform-config@sha256:0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0",
]

[tools]
node = "24" # this file's own entries override the included ones
```

ローカルの include は `.toml` ファイルへのパスで、インクルードする側のファイルからの相対パスか絶対パスです。`git::` の include は `.toml` ファイルを指します。`oci::` の include は、ルートに `mise.toml` を持つアーティファクトを指します。

インクルードされたファイルの優先順位は、それをインクルードするファイルのすぐ下になり、`include` 内で後にあるエントリが前のエントリを上書きします。インクルードされたファイルの `_.file` のような相対パスや <code v-pre>{{ config_root }}</code> は、インクルードする側のファイルを基準に解決されます。そのツールはインクルードする側のファイルのロックファイルでロックされ、その `min_version` も適用されます。

インクルードされるファイルには、`[tools]`、`[tool_alias]`、`[env]`、`[vars]`、`[hooks]`、`[shell_alias]`、`[plugins]`、`[wrappers]`、`[bootstrap]`、`min_version`、`[_]` を含められます。非推奨の `[alias]` キーと `env_path` キーも受け付けます。そのフックは、同じイベントについて、インクルードする側のファイルのフックより前に実行されます。`[bootstrap]` のエントリはキーごとにマージされ、インクルードする側のファイル自身のエントリが優先されます。それ以外のキーはエラーになります。該当するのは、`include`（include はネストできません）、`[settings]` とモノレポ関連のキー（mise は include を解決する前にこれらを読み込みます）、`[tasks]`、`task_config`、`task_templates`（タスクは [`task_config.includes`（原文）](https://mise.jdx.dev/tasks/task-discovery.html) で共有してください）、および `[dotfiles]` や `[daemons]` のようなマシン用のセクションです。

include は、インクルードする側のファイルの信頼を使用します。未信頼のプロジェクトが、`cd` したときに mise に URL を取得させることはできません。また、[セーフモード（原文）](https://mise.jdx.dev/security.html#safe-mode) では、プロジェクト設定の include を取得することはありません。ファイルを信頼すると、`git pull` で変更される `mise.toml` と同様に、インクルードされた内容はその信頼のもとで実行されます。[パラノイドモード（原文）](https://mise.jdx.dev/paranoid.html#remote-includes) では、include はコミット SHA または OCI ダイジェストに固定されている必要があり、ローカルの include は、その内容がファイルの信頼ハッシュの対象にならないためエラーになります。

ローカルの include は読み込みのたびに読み取られ、キャッシュされることはありません。mise はリモートからインクルードしたファイルをそれぞれ `MISE_CACHE_DIR` 配下にキャッシュし、コミット SHA や OCI ダイジェストを再取得することはありません。`mise install`、`mise use`、`mise upgrade` などのコマンドは、キャッシュされたコピーが [`fetch_remote_versions_cache`（原文）](https://mise.jdx.dev/configuration/settings.html#fetch_remote_versions_cache) より古くなると、ブランチ、タグ、OCI タグを更新します。シェルの有効化、`mise exec`、`mise env`、`mise ls`、shim、および [オフライン（原文）](https://mise.jdx.dev/configuration/settings.html#offline) モードでは、常にキャッシュされたコピーが使用されます。更新に失敗した場合や、この mise では読み込めないファイルが返された場合、mise は警告を出してキャッシュされたコピーを使い続けます。キャッシュがない場合はエラーになります。`mise cache clear` で強制的に再取得できます。

### `min_version` {#minimum-mise-version}

文字列だけを指定すると、ハード最小値になります。古い mise のリリースはエラーで停止し、アップグレードの手順を表示します。

```toml
min_version = "2026.1.0"
```

失敗させずに警告を出すには、ソフト最小値を追加します。

```toml
min_version = { hard = "2025.6.0", soft = "2026.1.0" }
```

`hard` にはこのファイルを理解できる最も古いリリースを、`soft` にはチームメイトに使ってほしいリリースを設定します。`{ soft = "2026.1.0" }` を単独で指定することもできます。

### `[_]` {#free-form-data}

mise は `[_]` テーブルを一切読み込まないため、mise にキーを拒否されることなく、設定ファイルに独自のデータを保持できます。

```toml
[_]
owner = "platform-team"
```

### エディター用のスキーマ {#mise-toml-schema}

`mise.toml` の JSON スキーマは <https://mise.jdx.dev/schema/mise.json> と [JSON Schema Store](https://www.schemastore.org/) にあるため、[VS Code](https://code.visualstudio.com/docs/languages/json#_json-schemas-and-settings)、[IntelliJ](https://www.jetbrains.com/help/idea/json.html#ws_json_using_schemas)、[Neovim](https://github.com/b0o/SchemaStore.nvim) などのエディターで補完とバリデーションを行えます。`task_config.includes` で読み込むタスクファイルには、別のスキーマ <https://mise.jdx.dev/schema/mise-task.json> を使用します。

## idiomatic バージョンファイル {#idiomatic-version-files}

mise は、ツールに対して有効化すれば、`.nvmrc` や `.python-version` のような他のツールが使うバージョンファイルを読み込めます。サポートされているファイルと有効化の方法については、[idiomatic バージョンファイル（原文）](https://mise.jdx.dev/dev-tools/versions.html#idiomatic-version-files) を参照してください。
