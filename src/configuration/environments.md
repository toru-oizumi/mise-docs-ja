---
title: 設定環境
description: "Load extra config files such as mise.production.toml by selecting a config environment with -E or MISE_ENV."
socialDescription: "Load extra config files such as mise.production.toml with -E or MISE_ENV."
upstreamPath: docs/configuration/environments.md
upstreamUrl: https://mise.jdx.dev/configuration/environments.html
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# 設定環境 {#config-environments}

設定環境は、`mise.development.toml` や `mise.production.toml` のような追加の設定ファイルを、`mise.toml` に重ねて読み込みます。`-E` または `MISE_ENV` で1つ選択します。ベースの `mise.toml` は引き続き読み込まれ、同じディレクトリ内では環境ファイルがそれを上書きします。

設定環境を選択しても、アプリケーション向けの `NODE_ENV` のような変数は設定されません。それらは環境ファイル内の [`[env]`](/environments/) で定義してください。

## 環境を試す {#try-an-environment}

::: code-group

```toml [mise.toml]
[env]
APP_MODE = "development"
```

```toml [mise.production.toml]
[env]
APP_MODE = "production"
```

:::

```sh
mise exec -- sh -c 'echo "$APP_MODE"'               # development
mise -E production exec -- sh -c 'echo "$APP_MODE"' # production
mise -E production config                           # list the loaded files
```

## 環境の選択 {#select-environments}

`mise.toml` 内で環境を選択することはできません。選択によってどの設定ファイルを読み込むかが決まるためです。代わりに次のいずれかを使います。優先順位の高い順に並べています。

| 方法 | 例 |
| -------------------- | --------------------------------------------------------------------- |
| CLI オプション | `mise -E production run deploy` または `--env production` |
| 環境変数 | `MISE_ENV=production` |
| `.miserc.toml` | `env = ["production"]`。[後述](#setting-mise-env-in-miserc-toml)を参照 |

複数の環境を選択するには、カンマで区切ります。
`mise -E ci,test run build` または `MISE_ENV=ci,test` のようにします。選択した2つの環境が同じディレクトリ内で同じ値を設定している場合、同じ種類のファイル同士では最後のものが優先されますが、ローカルファイルは引き続きすべての共有ファイルを上書きします（[ファイル名と優先順位](#file-names-and-precedence)を参照）。例えば `ci,test` では、`mise.ci.local.toml` が `mise.test.toml` を上書きします。組み合わせた選択の結果を確認するには `mise -E ci,test config` を実行します。

### .miserc.toml でデフォルトを設定する {#setting-mise-env-in-miserc-toml}

デフォルトの選択を `.miserc.toml` にコミットします。mise はこのファイルを他のどの設定ファイルよりも先に読み込みます。

```toml [.miserc.toml]
env = ["development"]
```

個人的な選択には `.miserc.local.toml`（コミットしない）を、1台のマシン向けには `~/.config/mise/miserc.local.toml` を使います。すべての場所とファイルの組み合わせ方については [`.miserc.toml`](/configuration.html#miserc) を参照してください。

## ファイル名と優先順位 {#file-names-and-precedence}

プロジェクトディレクトリでは、この表で上にあるファイルが下にあるファイルを上書きします。

| ファイル | 用途 |
| ----------------------- | ----------------------------------------------------- |
| `mise.<env>.local.toml` | 1つの環境向けの個人的な上書き。コミットしない |
| `mise.local.toml` | 個人的な上書き。コミットしない |
| `mise.<env>.toml` | 1つの環境向けの共有設定 |
| `mise.toml` | 共有設定 |

そのため、`production` 環境が選択されているとき、自分の `mise.local.toml` はコミット済みの `mise.production.toml` を上書きします。1つの環境に限って値を上書きするには、`mise.production.local.toml` に書きます。`mise.local.toml` と `mise.*.local.toml` は `.gitignore` に追加してください。

その他のプロジェクト内の場所も、`mise/config.<env>.toml`、`.mise/config.<env>.toml`、`.config/mise.<env>.toml` のように同じ方法で環境名を取ります。[設定ファイルの場所](/configuration.html#mise-toml)を参照してください。
同じディレクトリ内では、`mise/config.<env>.toml` のような環境ファイルは環境のないすべての共有ファイルを上書きし、`mise/config.local.toml` のようなローカルファイルはその両方を上書きし、`mise/config.<env>.local.toml` のような環境ローカルファイルはそれらすべてを上書きします。これらの各層の中では、後に選択された環境が優先されます。

グローバル設定ディレクトリ（`~/.config/mise`）は `config.<env>.toml` と `config.<env>.local.toml` を同じ順序で使います。そのため、`config.local.toml` は `config.<env>.toml` を上書きします。

[`override_config_filenames`（原文）](https://mise.jdx.dev/configuration/settings.html#override_config_filenames) が設定されている場合、そのファイル名が `mise.toml`、`mise.local.toml` などのデフォルトの名前を置き換えます。`mise.<env>.toml` や `mise.<env>.local.toml` のような環境ファイルは引き続き読み込まれます。

## 環境ファイルへの書き込み {#write-to-an-environment-file}

`mise use` と `mise set` は、サブコマンド自身の `--env` オプションで環境を指定しない限り、共有ファイルに書き込みます。

```sh
mise use --env staging node@24                             # writes mise.staging.toml
mise set --env staging API_URL=https://staging.example.com # writes mise.staging.toml
```

`mise -E staging set ...` のようにサブコマンドの前に置いたグローバルな `-E` は、どのファイルを読み込むかを選択するだけで、書き込み先は共有の `mise.toml` のままです。どちらのコマンドも、環境ファイルが存在しなければ作成します。完全な規則については
[mise がどのファイルに書き込むか](/configuration.html#target-file-for-write-operations)
を参照してください。

## タスクとテンプレートでの環境の利用 {#use-the-environment-in-tasks-and-templates}

mise は選択された環境を、カンマ区切りの `MISE_ENV` として、タスクや mise が実行するその他のコマンドにエクスポートします。テンプレートは同じリストを <code v-pre>{{ mise_env }}</code> として読み取ります。

```mise-toml [mise.toml]
[tasks.deploy]
run = """
{% if mise_env is not defined %}echo "select an environment with -E" >&2; exit 1{% endif %}
echo deploying to {{ mise_env | first }}
"""
```

`mise -E staging run deploy` は `deploying to staging` を出力し、`mise run deploy` は `select an environment with -E` で失敗します。環境が選択されていない場合、`mise_env` は未定義です。そのとき、そのままの <code v-pre>{{ mise_env }}</code> はレンダリングに失敗し、`join` のようなフィルターも同様に失敗しますが、`first` はエラーにならず空の値を返します。使う前に `mise_env is defined` を確認してください。
[プラットフォーム環境](#platform-environments)は `MISE_ENV` にも `mise_env` にも含まれません。

## conf.d の環境 {#conf-d-environments}

::: warning 移行中
環境別の `conf.d` ファイル名は、mise 2027.8.10 まではオプトインです。デフォルトでは、`node.tools.toml` のような名前を含め、隠しファイルでないすべての TOML フラグメントが引き続き読み込まれます。

フラグメント名にドットを使うことは非推奨です。mise 2027.8.10 より前に、`node-tools.toml` のようにハイフンを使う名前に変更してください。そのリリース以降は、最初のドットより後ろのサフィックスが環境を選択します。
:::

今すぐオプトインするには、`miserc.toml` ファイルで `env_conf_d = true` を設定するか、`MISE_ENV_CONF_D=true` を設定します。すると、`mise/conf.d`、`.mise/conf.d`、`.config/mise/conf.d` 内のフラグメントは、他の設定ファイルと同じ環境サフィックスを使うようになります。

```text
mise/conf.d/tools.toml                    # always loaded
mise/conf.d/tools.local.toml              # always loaded, usually gitignored
mise/conf.d/tools.development.toml        # MISE_ENV=development
mise/conf.d/tools.development.local.toml  # MISE_ENV=development, usually gitignored
```

この設定項目は設定ファイルの検出を制御するため、`miserc.toml` または環境変数で設定してください。`mise.toml` では遅すぎます。移行期間中に非推奨の警告を出さずに従来の動作を維持するには、明示的に `env_conf_d = false` を設定します。

## プラットフォーム環境 {#platform-environments}

[`auto_env`（原文）](https://mise.jdx.dev/configuration/settings.html#auto_env) 設定項目を有効にすると、mise は現在のプラットフォームに基づいて、以下もアクティブな設定環境として扱います。

| Environment   | Values                                               |
| ------------- | ---------------------------------------------------- |
| `{os_family}` | `unix`（Windows では未定義。`windows` を使用） |
| `{os}`        | `linux`, `macos`, `windows`                          |
| `{os}-{arch}` | `linux-x64`、`macos-arm64`、`windows-x64` など |

アーキテクチャには mise での名前が使われます。`x86_64` は `x64` に、`aarch64` は `arm64` になります。

すると、`mise.windows.toml`、`mise.macos-arm64.toml`、`mise.unix.toml` のようなファイルが、すべての設定ファイルの場所で、それぞれの `.local.toml` のバリエーションとともに自動的に読み込まれ、mise は `mise.windows.lock` のような対応するロックファイルを選択します。

プラットフォーム環境は、自分で選択した環境よりも優先順位が低くなります。低い順に、`unix`、`{os}`、`{os}-{arch}`、そして `-E` または `MISE_ENV` のエントリです。複数の環境を選択した場合と同様に、この順序は同じ種類のファイル同士に適用されるため、`mise.linux.local.toml` は引き続き `mise.ci.toml` を上書きします。
プラットフォーム環境が影響するのは設定ファイルの検出とロックファイルの選択だけなので、<code v-pre>{{ mise_env }}</code> と、タスクに渡される `MISE_ENV` 変数には、自分で選択した環境だけが列挙されます。

### ロールアウト {#rollout}

`auto_env` はデフォルトで無効です。mise 2027.6.0 でデフォルトで有効になり、2026.12.0 からそれまでの間は、新しいデフォルトで読み込まれることになるプラットフォーム設定ファイルが見つかると mise が警告を表示します。今のうちに選んでおくには、`.miserc.toml` で設定します。

```toml [.miserc.toml]
auto_env = false # keep the old behavior and silence the warning
```

新しい動作を採用するには `auto_env = true` を設定するか、`MISE_AUTO_ENV=true` または `MISE_AUTO_ENV=false` を使います。`env` と同様に、この設定項目は設定ファイルの検出を制御するため、`mise.toml` 内では効果がありません。

## 関連項目 {#related}

- [Bootstrap モジュール（原文）](https://mise.jdx.dev/bootstrap/modules.html): マシンの役割ごとに1つの環境ファイルを用意し、各マシンで選択する
