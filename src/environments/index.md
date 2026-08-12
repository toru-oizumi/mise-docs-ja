---
title: 環境変数
upstreamPath: docs/environments/index.md
upstreamUrl: https://mise.jdx.dev/environments/
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

# 環境変数 {#environments}

> プロジェクトディレクトリごとに、正しい _環境変数_ を自動的に読み込みます。

mise を使うと、プロジェクトごとに異なる環境変数を指定できます。

始めるには、プロジェクトディレクトリのルートに `mise.toml` ファイルを作成します。

```toml [mise.toml]
[env]
NODE_ENV = 'production'
```

環境変数をクリアするには、`false` を設定します。

```toml [mise.toml]
[env]
NODE_ENV = false # unset a previously set NODE_ENV
```

既存の値が空でない場合はそれを保持しつつフォールバック値を設定するには、`default` を使います。

```toml [mise.toml]
[env]
NODE_ENV = { default = "development" }
```

これにより、`NODE_ENV` が mise の実行前や以前の設定ファイルによってすでに設定されていた場合は、その値が保持されます。未設定または空の場合、mise は `"development"` を設定します。
デフォルト値は文字列または整数にできます。

CLI を使って環境変数を取得・設定することもできます。

```sh
mise set NODE_ENV=development
# mise set NODE_ENV
# development

mise set
# key       value        source
# NODE_ENV  development  mise.toml

cat mise.toml
# [env]
# NODE_ENV = 'development'

mise unset NODE_ENV
```

さらに、[mise env [--json] [--dotenv]（原文）](https://mise.jdx.dev/cli/env.html) コマンドを使うと、環境変数を様々な形式（`PATH` やツール・プラグインによって設定された環境変数を含む）で出力できます。

## 環境変数の使用 {#using-environment-variables}

環境変数は [`mise x|exec`（原文）](https://mise.jdx.dev/cli/exec.html) を使う場合、または [`mise r|run`（原文）](https://mise.jdx.dev/cli/run.html)（つまり [タスク](/tasks/)）を使う場合に利用できます。

```shell
mise set MY_VAR=123
mise exec -- bash -c 'echo $MY_VAR'
# 123
```

もちろん [ツール](/dev-tools/) と組み合わせることもできます。

```sh
mise use node@26
mise set MY_VAR=123
cat mise.toml
# [tools]
# node = '24'
# [env]
# MY_VAR = '123'
mise exec -- node --eval 'console.log(process.env.MY_VAR)'
# 123
```

[mise が有効化されている](/getting-started.html#activate-mise)場合、ディレクトリに `cd` すると現在のシェルセッションに自動的に環境変数が設定されます。

```shell
cd /path/to/project
mise set NODE_ENV=production
cat mise.toml
# [env]
# NODE_ENV = 'production'

echo $NODE_ENV
# production
```

[`shims`](/dev-tools/shims.html) を使用している場合、shim を使う際にも環境変数が利用できます。

```shell
mise set NODE_ENV=production
mise use node@26
# using the absolute path for the example
~/.local/share/mise/shims/node --eval 'console.log(process.env.NODE_ENV)'
```

最後に、[`mise en`（原文）](https://mise.jdx.dev/cli/en.html) を使って、環境変数が設定された新しいシェルセッションを開始することもできます。

```shell
mise set FOO=bar
mise en
> echo $FOO
# bar
```

## タスクにおける環境 {#environment-in-tasks}

タスクの内部で環境を定義することも可能です。

```toml [mise.toml]
[tasks.print]
run = "echo $MY_VAR"
env = { _.file = '/path/to/file.env', "MY_VAR" = "my variable" }
```

## 遅延評価 {#lazy-eval}

環境変数は通常、ツールより先に解決されます — そうすることで、ツールのインストールのサブプロセスを環境変数で設定できます。これは、`MISE_DATA_DIR` や `MISE_INSTALLS_DIR` のような mise 自体を設定する変数には当てはまりません。これらの変数はプロセス開始時に読み込まれるため、`[env]` の中ではなく、mise を呼び出す前にシェルや CI 環境で設定してください。

ツールが生成した環境変数にアクセスしたい場合もあります。そのためには、`tools = true` を使って値をマップにします。

```toml
[env]
MY_VAR = { value = "tools path: {{env.PATH}}", tools = true }
_.path = { path = ["{{env.GEM_HOME}}/bin"], tools = true } # directives may also set tools = true
NODE_VERSION = { value = "{{ tools.node.version }}", tools = true }
```

## 削除（redaction） {#redactions}

`redact = true` を設定することで、変数を出力から削除（redact）できます。

```toml
[env]
SECRET = { value = "my_secret", redact = true }
_.file = { path = ".env.json", redact = true }
```

`redactions` 配列を使って、複数の環境変数をまとめて機密情報としてマークすることもできます。

```toml
redactions = ["SECRET_*", "*_TOKEN", "PASSWORD"]
[env]
SECRET_KEY = "sensitive_value"
API_TOKEN = "token_123"
PASSWORD = "my_password"
```

個々の変数に `redact = false` を設定すると、グローバル設定から継承されたパターンを含め、`redactions` パターンとのマッチングから除外できます。

```toml
[env]
TEST_TOKEN = { value = "not-sensitive", redact = false }
```

### 削除された環境変数の確認 {#viewing-redacted-environment-variables}

`mise env` コマンドには、削除された変数を扱うためのオプションが用意されています。

```bash
# Show only redacted environment variables
mise env --redacted

# Show only values (useful for piping)
mise env --values

# Show only values of redacted variables
mise env --redacted --values
```

::: warning
削除は、タスクの出力を1行ずつ横取りすることで機能するため、`raw` ではない出力モードが必要です。
`raw = true` のタスクはこの横取りをバイパスします（標準出力・標準エラー出力が直接ターミナルに渡される）。そのため削除を適用できません。

デフォルトでは、`mise run` は `replacing` 出力モードを使用し、これはフルの出力ではなく進捗を示すスピナーを表示します。
CI 環境では、削除を適用しつつタスクのフルログを確認できるように、`prefix` または `interleave` 出力を使うとよいでしょう。

```bash
MISE_TASK_OUTPUT=prefix mise run mytask
```

または、設定ファイルでグローバルに設定します。

```toml
[settings]
task.output = "prefix"
```

:::

::: danger
mise は機密情報を含む値を出力する可能性があり、それが CI のログに表示されてしまう場合があるため、どの値が機密情報であるかを CI 側の設定で認識させる必要があります。

例えば、GitHub Actions を使用する場合、`::add-mask::` を使ってログにシークレットが表示されるのを防ぐべきです。

```bash
# In a GitHub Actions workflow
for value in $(mise env --redacted --values); do
  echo "::add-mask::$value"
done
```

Note: [mise-action](https://github.com/jdx/mise-action) を使用している場合、`redact = true` でマークされた値や `redactions` 配列のパターンに一致する値は自動的に削除されます。
:::

## 必須変数 {#required-variables}

`required = true` を設定することで、環境変数を必須としてマークできます。これにより、その変数が mise の実行前、またはそれ以降の設定ファイル（`mise.local.toml` など）で定義されていることが保証されます。

```toml
[env]
DATABASE_URL = { required = true }
API_KEY = { required = true }
```

変数の設定方法をユーザーに案内するヘルプテキストを用意することもできます。

```toml
[env]
DATABASE_URL = {
  required = "Set DATABASE_URL to your PostgreSQL connection string (e.g., postgres://user:pass@localhost/dbname)",
}
API_KEY = {
  required = "Get your API key from https://example.com/api-keys",
}
AWS_REGION = {
  required = "Set to your AWS region (e.g., us-east-1, eu-west-1)",
}
```

必須変数が見つからない場合、mise はエラーメッセージ内にヘルプテキストを表示し、ユーザーを支援します。

### 必須変数の動作 {#required-variable-behavior}

変数が `required = true` としてマークされている場合、mise は以下のいずれかの方法でその変数が定義されていることを検証します。

1. **既存の環境** — mise の実行前に変数が設定されている
2. **後の設定ファイル** — 必須と宣言した設定ファイルより後に処理される設定ファイルで変数が定義されている

```toml
# In mise.toml
[env]
DATABASE_URL = { required = true }
```

```toml
# In mise.local.toml (processed later)
[env]
DATABASE_URL = "postgres://prod.example.com/db"  # This satisfies the requirement
```

### 検証の動作 {#validation-behavior}

- **通常のコマンド**（`mise env` など）— 必須変数が見つからない場合、明確なエラーメッセージを出して失敗します
- **シェルの有効化**（`hook-env`）— 必須変数が見つからないことを警告しますが、シェルのセットアップを壊さないよう実行を継続します

```bash
# This will fail if DATABASE_URL is not pre-defined or in a later config
$ mise env
Error: Required environment variable 'DATABASE_URL' is not defined...

# This will warn but continue (used by shell activation)
$ mise hook-env --shell bash
mise WARN Required environment variable 'DATABASE_URL' is not defined...
# Shell activation continues successfully
```

### 使用例 {#use-cases}

必須変数は、以下のような場合に便利です。

- **データベース接続** — 重要な接続文字列が明示的に設定されていることを保証する
- **API キー** — 機密性の高い認証情報の明示的な設定を必須にする
- **環境固有の設定** — 環境ごとに明示的な設定を強制する
- **チームでの共同作業** — チームメンバーが設定すべき変数を明文化する

```toml
[env]
# API keys (must be set in environment or mise.local.toml)
STRIPE_API_KEY = { required = true }
SENTRY_DSN = { required = true }

# Database connection (must be set in environment or mise.local.toml)
DATABASE_URL = { required = true }

# Feature flags (must be explicitly configured)
ENABLE_BETA_FEATURES = { required = true }
```

## `config_root` {#config-root}

`config_root` は、mise が設定ファイル内の相対パスを解決する際に使用する、正規のプロジェクトルートディレクトリです。一般に、mise で相対パスを使う場合、参照先はこのディレクトリです。

- 設定が `.config/mise/config.toml` や `.mise/config.toml` のようなネストしたパスにある場合、`config_root` はそれらのファイルを含むプロジェクトディレクトリ（例えば `/path/to/project`）を指します。
- 設定がプロジェクトルート（例えば `mise.toml`）にある場合、`config_root` は単にその時のディレクトリになります。
- 環境ディレクティブの相対パスは `config_root` に対して解決されるため、設定ファイル自体がどこにあっても一貫した動作になります。

以下は設定ファイルの例と、それぞれの `config_root` です。

| 設定ファイル                                 | `config_root` |
| ------------------------------------------- | ------------- |
| `~/src/foo/.config/mise/conf.d/config.toml` | `~/src/foo`   |
| `~/src/foo/.config/mise/config.toml`        | `~/src/foo`   |
| `~/src/foo/.mise/config.toml`               | `~/src/foo`   |
| `~/src/foo/mise.toml`                       | `~/src/foo`   |

実装は [config_root.rs](https://github.com/jdx/mise/blob/main/src/config/config_file/config_root.rs) で確認できます。

例:

```toml
[env]
# These are equivalent and both resolve against the project root
_.path = ["tools/bin", "{{config_root}}/tools/bin"]

# Likewise, a relative source path resolves against the project root
_.source = "scripts/env.sh"          # == "{{config_root}}/scripts/env.sh"
```

## `env._` ディレクティブ {#env-directives}

`env._.*` は、環境変数の設定に関する特別な動作を定義します（例: ファイルからの環境変数の読み込み）。ネストした環境変数には意味がないため、これを利用して、これらのディレクティブの設定用の
TOML テーブルである「\_」という名前のキーを作成しています。

::: warning
組み込みの `file`、`path`、`source` ディレクティブオブジェクトの `env._` または `vars._` 配下にある `value` と `values` キーは非推奨です。
文字列単体または文字列の配列を受け付ける `path` を使ってください。これらは mise 2026.12.0 で削除されます。これは、通常の環境変数オブジェクトでの `value` や、プラグイン提供のディレクティブのオプションには影響しません。

旧来の `env.mise.*` という記法は非推奨です。代わりに `env._.*` を使ってください。これは mise 2026.12.0 で削除されます。
:::

### `env._.file` {#env-file}

`mise.toml` において、`env._.file` を使って、読み込む [dotenv](https://dotenv.org) ファイルを指定できます。

::: warning
トップレベルの `env_file`、`dotenv`、`env_path` は非推奨です。代わりに `env._.file` と
`env._.path` を使ってください。これらのキーは mise 2027.4.0 で削除されます。
:::

```toml
[env]
_.file = '.env'
```

::: info
dotenv 形式のファイルのみ内部で [dotenvy](https://crates.io/crates/dotenvy) を使用します。dotenv の解析で問題が発生した場合は、mise 側では対応できることがほとんどないため、mise ではなくそちら（dotenvy）に issue を立てる必要があるでしょう。JSON、YAML、TOML ファイルはそれぞれ別のパーサーを使用します。
:::

`env._.file` ディレクティブは以下をサポートします。

- 単一ファイルを文字列またはオブジェクトとして指定
- 複数ファイルを文字列とオブジェクトの配列として指定
- 相対パスまたは絶対パスの使用
- `dotenv`、`json`、`yaml`、`toml` ファイル形式の使用
- `redact`、`tools`、`expand` オプション

```toml
[env]
_.file = '.env.yaml'
```

```toml
[env]
_.file = '.env.toml'
```

```toml
[env]
# Load env from the dotenv file after tools have defined environment variables
_.file = { path = ".env", tools = true }
```

構造化された JSON、YAML、TOML ファイルにおけるシェル形式の展開は、リテラルの `$` 文字を含む値が保持されるように、デフォルトでは無効になっています。ファイル内の値が同じファイル内の以前の値、以前のファイル、あるいは以前の `[env]` ブロックで定義された変数を参照できるようにするには、`expand = true` を設定します。

```toml
[env]
BASE = "/opt/project"
_.file = { path = ".env.json", expand = true }
```

`env_shell_expand` 設定はグローバルなスイッチとして残っており、ファイルが `expand = true` を設定していても展開を無効化できます。dotenv ファイルは、dotenvy が通常持つ同一ファイル内での展開動作をそのまま維持します。
dotenv ファイルの場合、`expand = true` はさらに、以前に読み込まれた値への参照を可能にします。

```toml
[env]
_.file = [
    # Load env from the json file relative to this config file
    '.env.json',
    # Load env from the dotenv file at an absolute path
    '/User/bob/.env',
    # Load env from the yaml file relative to this config file and redact the values
    { path = ".secrets.yaml", redact = true }
]
```

現在のディレクトリと親ディレクトリから dotenv ファイルを自動的に読み込むには、`~/.config/mise/config.toml` の `[settings]` 配下で
[`MISE_ENV_FILE=.env`](/configuration#mise-env-file) または `env_file = ".env"` を設定します。これは `env._.file` とは異なり、
`env._.file` はそれを宣言している設定ファイルからの相対パスで解決されます。

`env._.file` で暗号化されたファイルを読み込む方法については、[secrets（原文）](https://mise.jdx.dev/environments/secrets/) を参照してください。

### `env._.path` {#env-path}

`PATH` は特別に扱われます。`env._.path` を使うと `PATH` に追加のディレクトリを追加でき、それらのディレクトリ内の実行可能ファイルを、フルパスを入力しなくてもシェルから利用できるようになります。

```toml
[env]
_.path = './bin'
```

`env._.path` ディレクティブは以下をサポートします。

- 単一パスを文字列またはオブジェクトとして指定
- 複数パスを文字列とオブジェクトの配列として指定
- 相対パスまたは絶対パスの使用
- `tools` オプション

```toml
[env]
_.path = 'scripts'
```

```toml
[env]
# Define this path directory after tools have defined environment variables
_.path = { path = ["{{env.GEM_HOME}}/bin"], tools = true }
```

```toml
[env]
_.path = [
    # adds an absolute path
    "~/.local/share/bin",
    # adds a path relative to the project root (config_root)
    "{{config_root}}/node_modules/.bin",
    # adds a relative path (equivalent to "{{config_root}}/tools/bin")
    "tools/bin",
]
```

`tools/bin` や `./tools/bin` のような相対パスは、<span v-pre>`{{config_root}}`</span> に対して解決されます。例えば、設定ファイルが `/path/to/project/.config/mise/config.toml` にある場合、`tools/bin` は `/path/to/project/tools/bin` に解決されます。

### `env._.source` {#env-source}

外部の bash スクリプトを source し、そこから export された環境変数を取り込みます。

```toml
[env]
_.source = "./script.sh"
```

::: info
これは、次のように実行された場合と同じように bash 上で動作するスクリプトである**必要があります**。

```sh
source ./script.sh
```

shebang は**無視されます**。バイナリや他のスクリプト言語で動作する代替案については [#1448](https://github.com/jdx/mise/discussions/6734)
を参照してください。
:::

::: info Windows
Windows では、source の実行には [Git for Windows](https://gitforwindows.org/) や MSYS2 のような本物の POSIX bash が必要です。mise は bash タスクと同じ方法でそれを自動検出します（一般的なインストール場所は、bash が `PATH` に無い場合でも探索されます。特定の bash を指定するには `MISE_BASH_PATH` を設定してください。`C:\Windows\System32\bash.exe` にある WSL のランチャーは、WSL が Windows のスクリプトパスを読めないため、自動選択の対象には決してなりません）。スクリプトが前置する `PATH` エントリ（`/c/...` または `/cygdrive/c/...` 形式）は Windows 形式に変換し直されます。
:::

`env._.source` ディレクティブは以下をサポートします。

- 単一の source を文字列またはオブジェクトとして指定
- 複数の source を文字列とオブジェクトの配列として指定
- 相対パスまたは絶対パスの使用
- `redact` および `tools` オプション

`PATH` については、source されたスクリプトは、元の値を末尾にそのまま保持することで、エントリを前置できます。

```sh
export PATH="/new/bin:$PATH"
```

既存の `PATH` エントリの追記・削除・並べ替え・置き換えはサポートされていません。これらの変更は無視されます。これは、mise がパスの追加を別途追跡しており、有効化の順序を保持し、環境が変化したときにきれいに削除できるようにするためです。前置された相対エントリは <span v-pre>`{{config_root}}`</span> に対して解決され、
空のエントリは、現在のディレクトリを `PATH` に追加することなく無視されます。

```toml
[env]
_.source = 'source.sh'
```

```toml
[env]
# Source this file after tools have defined environment variables
_.source = { path = "my/env.sh", tools = true }
```

```toml
[env]
_.source = [
    # Sources the file relative to the config root
    './scripts/base.sh',
    # Sources a file at an absolute path
    '/User/bob/env.sh',
    # Sources the file relative to the config root and redacts the values
    { path = ".secrets.sh", redact = true }
]
```

## プラグイン提供の `env._` ディレクティブ {#plugin-provided-env-directives}

プラグインは、環境変数を動的に設定し `PATH` を変更する独自の `env._` ディレクティブを提供できます。これは特に以下の場合に便利です。

- 外部のシークレット管理システムと連携する
- 動的な条件に基づいて環境変数を設定する
- 複雑な `PATH` 設定を管理する
- チーム全体の環境の標準化を提供する

### 基本的な使い方 {#basic-usage}

シンプルなプラグインの有効化:

```toml
[env]
_.my-plugin = {}
```

設定オプション付きのプラグイン:

```toml
[env]
_.my-plugin = { option1 = "value1", option2 = "value2" }
```

### 仕組み {#how-it-works}

`env._.<plugin-name>` を使うと、mise は次のことを行います。

1. インストール済みのプラグインからそのプラグインを読み込む
2. プラグインの `MiseEnv` フックを呼び出して環境変数を取得する
3. プラグインの `MisePath` フックを呼び出して `PATH` エントリを取得する（定義されている場合）
4. `mise env` の実行時、またはシェル連携の使用時に、これらを環境に適用する

指定した設定オプション（`=` の後の TOML テーブル）は `ctx.options` を介してプラグインのフックに渡され、プロジェクトや環境ごとにプラグインを設定できるようになります。

### 例: シークレット管理プラグイン {#example-secret-management-plugin}

```toml
[env]
# Fetch secrets from a vault
_.vault-secrets = {
  vault_url = "https://vault.example.com",
  secrets_path = "secret/myapp"
}
```

このプラグインは、HashiCorp Vault からシークレットを取得し、それらを環境変数として公開できます。

### 例: 動的な環境プラグイン {#example-dynamic-environment-plugin}

```toml
[env]
# Set environment based on git branch
_.git-env = { production_branch = "main" }
```

このプラグインは、現在の git のブランチを検出し、`main` の場合は `ENVIRONMENT=production` を、それ以外の場合は `ENVIRONMENT=development` を設定できます。

### 環境プラグインの作成 {#creating-environment-plugins}

独自の環境プラグインを作成するための完全なガイドは、Plugins ドキュメントの [Environment Plugins（原文）](https://mise.jdx.dev/plugins.html#environment-plugins) を参照してください。

動作する例については、[mise-env-plugin-template](https://github.com/jdx/mise-env-plugin-template) リポジトリを参照してください。

## 複数の `env._` ディレクティブ {#multiple-env-directives}

一部のディレクティブは、複数回適用する必要がある場合に配列を受け付けます。例えば、単一の `_.source` キーで複数のスクリプトを順番に source できます。

```toml
[env]
_.source = ["./script_1.sh", "./script_2.sh"]
```

## テンプレート {#templates}

環境変数の値にはテンプレートを使用できます。詳細は [テンプレート（原文）](https://mise.jdx.dev/templates.html) を参照してください。

```toml
[env]
LD_LIBRARY_PATH = "/some/path:{{env.LD_LIBRARY_PATH}}"
```

## 他の環境変数の中で環境変数を使う {#using-env-vars-in-other-env-vars}

後続の環境変数の中で、ある環境変数の値を使用できます。

```toml
[env]
MY_PROJ_LIB = "{{config_root}}/lib"
LD_LIBRARY_PATH = "/some/path:{{env.MY_PROJ_LIB}}"
```

もちろん、これを行う場合は順序が重要です。

## シェル形式の変数展開 {#shell-style-variable-expansion}

環境変数を参照するための Tera テンプレートよりも簡単な代替手段として、シェル形式の `$VAR` 構文を使用できます。

```toml
[env]
MY_PROJ_LIB = "{{config_root}}/lib"
LD_LIBRARY_PATH = "$MY_PROJ_LIB:$LD_LIBRARY_PATH"
```

サポートされる構文:

| 構文               | 説明                                                                           |
| ----------------- | ------------------------------------------------------------------------------------- |
| `$VAR`            | `VAR` の値に展開されます                                                         |
| `${VAR}`          | 同様ですが、英数字が後に続く場合に便利です（例: `${VAR}_suffix`）         |
| `${VAR:-default}` | `VAR` が未設定または空の場合に `default` を使用します                                             |
| `${VAR:-}`        | `VAR` が未設定の場合に空文字列に展開されます（未定義変数の警告を抑制します） |

展開は Tera テンプレートのレンダリング後に実行されるため、両方の構文を混在させて使えます。
デフォルト値のない未定義の変数は展開されずそのまま残り、警告が発生します。

`env_shell_expand` 設定はシェル展開を制御します。

- **`true`** または**未設定**（デフォルト） — シェル展開を有効にする
- **`false`** — シェル展開を無効にする
