---
title: 環境変数
description: "Set project environment variables in mise.toml, load them from files and scripts, and add directories to PATH."
upstreamPath: docs/environments/index.md
upstreamUrl: https://mise.jdx.dev/environments/
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# 環境変数 {#environment-variables}

`mise.toml` の `[env]` にプロジェクトの環境変数を設定します。mise は、`mise exec` で実行するコマンド、タスク、shim、そして mise が有効化されたシェルにこれらを適用します。

`mise.production.toml` のようにデプロイ先ごとにファイルを分ける場合は、[設定環境](/configuration/environments.html) を参照してください。テンプレートでのみ必要な値には [`[vars]`（原文）](https://mise.jdx.dev/configuration/vars.html) を使います。シークレットの値を平文の設定に置かないようにするには、[シークレット（原文）](https://mise.jdx.dev/environments/secrets/) を参照してください。

## 変数の設定と解除 {#set-and-unset}

```toml [mise.toml]
[env]
NODE_ENV = "production"
```

シェルを変更せずに、子プロセスで値を確認します。

```sh
mise exec -- sh -c 'echo "$NODE_ENV"'
# production
```

値には文字列または整数を指定でき、`true` は文字列 `"true"` になります。変数に `false` を設定すると、その変数を未設定にできます。例えば、シェルや親ディレクトリの設定ファイルが設定した変数にも使えます。

```toml [mise.toml]
[env]
NODE_ENV = false
```

[`mise set`（原文）](https://mise.jdx.dev/cli/set.html) と [`mise unset`（原文）](https://mise.jdx.dev/cli/unset.html) は、コマンドラインから `[env]` を編集します。

```sh
mise set NODE_ENV=development   # writes NODE_ENV = "development" under [env]
mise set NODE_ENV               # prints development
mise set                        # lists each variable, its value, and the file it comes from
mise unset NODE_ENV             # removes it
```

`mise set` は、設定ファイルがある最も近いディレクトリに書き込みます。そのディレクトリに `mise.toml` と `mise.local.toml` の両方がある場合は `mise.toml` に書き込みます。[書き込みに使われるファイル](/configuration.html#target-file-for-write-operations) を参照してください。`-E staging` を渡すと `mise.staging.toml` に、`-g` を渡すとグローバル設定に書き込みます。値をシェルの履歴に残さないようにするには `--prompt` または `--stdin` を渡します。

`PATH` エントリやツールが設定する変数を含め、解決済みの環境を出力するには [`mise env`（原文）](https://mise.jdx.dev/cli/env.html) を実行します。別の形式で出力するには `--json` または `--dotenv` を付けます。

## 変数が適用される場面 {#using-environment-variables}

| コマンドの実行方法 | `[env]` を受け取るか |
| --- | --- |
| `mise exec -- <command>` | はい |
| `mise run <task>` | はい。加えてタスク自身の `env` も受け取ります |
| [mise が有効化された（原文）](https://mise.jdx.dev/shell-setup.html) シェル | はい。ディレクトリを移動するたびに更新されます |
| [shim](/dev-tools/shims.html) | はい。shim が実行するプログラムが受け取ります |
| [`mise en`（原文）](https://mise.jdx.dev/cli/en.html) | はい。ディレクトリを移動しても更新されない新しいシェルで受け取ります |

変数は、同じファイル内の [ツール](/dev-tools/) と組み合わせられます。

```sh
mise use node@24
mise set MY_VAR=123
mise exec -- node -p process.env.MY_VAR
# 123
```

### タスク固有の変数 {#environment-in-tasks}

タスク自身の `env` はそのタスクにだけ適用され、`[env]` と同じ値とディレクティブを受け付けます。

```mise-toml [mise.toml]
[tasks.print]
env = { MY_VAR = "my variable", _.file = ".env.print" }
run = "echo $MY_VAR"
```

[タスクの `env`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#env) を参照してください。

## デフォルト値と必須変数 {#defaults-and-required}

### デフォルト値 {#defaults}

`default` はフォールバック値を設定し、すでにある値は保持します。

```toml [mise.toml]
[env]
NODE_ENV = { default = "development" }
```

`NODE_ENV` が、mise の起動時の環境で、またはグローバル設定のような優先度の低い設定ファイルによって、すでに空でない値に設定されている場合、mise はその値を保持します。それ以外の場合は `NODE_ENV` を `development` に設定します。デフォルト値は文字列または整数でなければなりません。

### 必須変数 {#required-variables}

`required = true` は、他の何かが設定しなければならない変数を宣言します。mise は変数が設定されていることを確認しますが、値を割り当てることはありません。この確認は、変数が mise の起動時の環境にある場合、または `mise.local.toml`、親ディレクトリの設定、グローバル設定など、他のいずれかの設定ファイルがその変数を設定している場合に通ります。

```toml [mise.toml]
[env]
DATABASE_URL = { required = true }
```

```toml [mise.local.toml]
[env]
DATABASE_URL = "postgres://localhost/app"
```

`required` に `true` の代わりに文字列を指定すると、変数がないときにヘルプテキストを表示します。

```toml [mise.toml]
[env]
DATABASE_URL = { required = "Set DATABASE_URL to your PostgreSQL connection string" }
```

必須変数がない場合、`mise exec`、`mise run`、`mise env`、`mise set` はヘルプテキストを含むエラーで停止します。有効化されたシェルでは代わりに警告を表示して処理を続けるため、値がなくてもプロンプトが壊れることはありません。

```text
mise WARN  Required environment variable 'DATABASE_URL' is not defined. It must be set before mise runs or in a later config file. (Required in: ~/src/app/mise.toml)
Help: Set DATABASE_URL to your PostgreSQL connection string
```

`required` は `value` や `default` と組み合わせられません。

呼び出し側が `required` 変数に与えた値を含め、タスクの出力で値をマスクするには、`redact = true` を付けます。[redaction（値の削除）と CI でのマスク（原文）](https://mise.jdx.dev/environments/secrets/#redaction) を参照してください。

## 他の値の参照 {#reference-other-values}

値は [Tera テンプレート（原文）](https://mise.jdx.dev/templates.html) であり、シェル形式の `$VAR` 展開にも対応しています。

```toml [mise.toml]
[env]
PROJECT_LIB = "{{config_root}}/lib"
LD_LIBRARY_PATH = "{{env.PROJECT_LIB}}:${LD_LIBRARY_PATH:-}"
```

値で使えるのは、同じファイル内でそれより上に定義された変数、優先度の低い設定ファイルで定義された変数、または mise の起動時の環境にある変数だけです。

### テンプレート {#templates}

<span v-pre>`{{config_root}}`</span> はプロジェクトディレクトリで、<span v-pre>`{{env.NAME}}`</span> は変数を読み取ります。利用できるコンテキストとフィルターの一覧は [Tera テンプレート（原文）](https://mise.jdx.dev/templates.html) を参照してください。

### シェル形式の展開 {#shell-style-variable-expansion}

| 構文 | 結果 |
| --- | --- |
| `$VAR` | `VAR` の値 |
| `${VAR}` | 同じ。`${VAR}_suffix` のように、後に英字や数字が続く場合に使います |
| `${VAR:-default}` | `VAR` が未設定または空のときは `default` |
| `${VAR:-}` | `VAR` が未設定のときは空文字列。警告は出ません |

展開はテンプレートのレンダリング後に実行されるため、1つの値に両方を混在させられます。定義されておらずデフォルト値もない変数は書いたまま残り、mise は警告を表示します。展開は [`env_shell_expand = false`（原文）](https://mise.jdx.dev/configuration/settings.html#env_shell_expand) で無効にできます。

## ツールが設定する値の利用 {#lazy-eval}

mise はツールを読み込む前に `[env]` を解決するため、値でツールのインストールを設定できます。例えば、ソースビルド用の `CFLAGS` です。ツールのバージョンや `PATH` エントリなど、ツールが提供するものを使うには `tools = true` を追加します。すると mise は、そのエントリをツールの読み込み後に解決します。

```toml [mise.toml]
[env]
NODE_VERSION = { value = "{{ tools.node.version }}", tools = true }
_.path = { path = "{{env.GEM_HOME}}/bin", tools = true }
```

`tools = true` は、変数、`_.file`、`_.path`、`_.source`、[プラグインのディレクティブ](#plugin-directives) で使えます。`_.python.venv` は常にツールの後に解決され、このオプションを受け付けません。

## 優先順位 {#precedence}

複数の設定ファイルが同じ変数を設定している場合、より限定的なファイルが優先されます。

- `mise.local.toml` は `mise.toml` より優先されます。
- `MISE_ENV=dev` の場合、`mise.dev.toml` は `mise.toml` より、`mise.local.toml` は `mise.dev.toml` より優先され、`mise.dev.local.toml` はこの3つすべてより優先されます。
- プロジェクトの設定は、親ディレクトリの設定より優先されます。
- どのプロジェクト設定も、グローバル設定（`~/.config/mise/config.toml`）より優先されます。

場所の一覧は [設定ファイル](/configuration.html#mise-toml) を参照してください。

mise は設定ファイルを優先度の低いものから高いものの順に評価し、各ファイル内のエントリは書かれた順に評価します。そのため、各値はそれより前に設定されたものを参照できます。`[env]` の値は、mise の起動時の環境にある同名の変数を置き換えます。例外は、上で説明した `default` と `required` です。

## env ディレクティブ {#env-directives}

ディレクティブは、ファイルやスクリプトから変数を読み込み、`PATH` エントリを追加します。変数はネストしたテーブルを持てないため、ディレクティブは `_` という名前のテーブルに置きます。`_.file`、`_.path`、`_.source` はそれぞれ、パス、`path` とオプションを持つテーブル、またはそれらの配列を受け付けます。

```toml [mise.toml]
[env]
_.file = ".env"
_.path = ["bin", "node_modules/.bin"]
_.source = { path = "scripts/env.sh", redact = true }
```

相対パスは、設定ファイルが `.config/mise/` や `.mise/` にある場合でも、プロジェクトディレクトリを基準に解決されます（[`config_root`](/configuration.html#config-root) を参照）。パスにはテンプレート、`$VAR`、`~` を使えます。ディレクティブは書かれた順に実行されるため、`_.path` はそれより上の `_.source` が設定した変数を使えます。`_.python.venv` は常に最後に実行されます。

| オプション | `_.file` | `_.source` | `_.path` | 効果 |
| --- | --- | --- | --- | --- |
| `path` | はい | はい | はい | 1つのパス、またはパスのリスト |
| `tools` | はい | はい | はい | ツールの読み込み後に解決する（[詳細](#lazy-eval)） |
| `redact` | はい | はい | いいえ | 読み込んだすべての値を [機密情報（原文）](https://mise.jdx.dev/environments/secrets/#redaction) としてマークする |
| `expand` | はい | いいえ | いいえ | ファイルが、それより前に読み込まれた値を使えるようにする |

### `env._.file` {#env-file}

ファイルから変数を読み込みます。

```toml [mise.toml]
[env]
_.file = ".env"
```

- 拡張子で形式が決まります。`.json`、`.yaml`、`.toml` ファイルは構造化ファイルとして解析され、トップレベルのキーが変数になります。`.yml` や `.env` を含むそれ以外の名前は dotenv として解析されます。
- YAML の値は書かれたとおりに読み取られます。`VERSION: 1.10` は `1.10` を設定し、`ZIP: 02134` は先頭のゼロを保持します。
- パスには `.env.*` のような glob パターンを指定でき、一致するすべてのファイルが読み込まれます。
- どのファイルにも一致しないパスはエラーにならずスキップされるため、`_.file` でバージョン管理されていない任意の `.env` を指定できます。
- ファイルの値は、環境にすでにある変数を置き換えます。

```toml [mise.toml]
[env]
_.file = [
  ".env.json",
  "~/.config/myapp/.env",
  { path = ".secrets.yaml", redact = true },
]
```

dotenv ファイルは `KEY=value` の行で構成され、`#` によるコメントとクォートされた値を使えます。クォートはシェルと同じように動作します。シングルクォートで囲んだテキストはリテラルとして扱われ、隣り合うクォートされた部分とクォートされていない部分はクォートを取り除いて連結されるため、`'it'\''s'` は `it's` になります。`O'Brien` のように、同じ行の後方に対になるクォートがないクォートは書いたまま保持されます。末尾のコメント内のクォートも対として数えられるため、`NAME="O'Brien" # owner's name` のように書きます。JSON のように値自体のクォートを保持する必要がある場合は、シングルクォートで囲みます（`CONFIG='{"debug": true}'`）。dotenv の値は、同じファイル内でそれより前に代入された変数、次に mise の起動時の環境にある変数を参照できます。JSON、YAML、TOML の値はリテラルとして読み取られるため、`$` は `$` のまま残ります。`expand = true` を設定すると、どの形式のファイルでも、それより前に読み込まれた値（前のファイルや前の `[env]` エントリ）を参照できます。

```toml [mise.toml]
[env]
BASE = "/opt/project"
_.file = { path = ".env.json", expand = true }
```

[`env_shell_expand`（原文）](https://mise.jdx.dev/configuration/settings.html#env_shell_expand) が `false` の場合、`expand = true` は効果がありません。

mise は、SOPS で暗号化された JSON、YAML、TOML ファイルを読み込む際に復号します。[SOPS ファイル（原文）](https://mise.jdx.dev/environments/secrets/sops.html) を参照してください。

現在のディレクトリとすべての親ディレクトリから dotenv ファイルを読み込むには、[`env_file`（原文）](https://mise.jdx.dev/configuration/settings.html#env_file) 設定項目を設定します（例: `MISE_ENV_FILE=.env`）。パスをそれを宣言した設定ファイルを基準に解決する `_.file` とは異なり、`env_file` は現在のディレクトリから上に向かって探索し、より近いファイルが優先されます。

### `env._.path` {#env-path}

`PATH` にディレクトリを追加します。追加したディレクトリは、すでに `PATH` にあるディレクトリより前に置かれます。

```toml [mise.toml]
[env]
_.path = [
  "bin",
  "{{config_root}}/node_modules/.bin",
  "~/.local/share/mytool/bin",
]
```

`PATH` には `_.path` を使ってください。`[env]` の `PATH` キーは、`mise exec`、`mise env`、有効化されたシェルでは無視されます。

### `env._.source` {#env-source}

bash スクリプトを実行し、そのスクリプトが export した変数を取り込みます。

```toml [mise.toml]
[env]
_.source = "scripts/env.sh"
```

mise は、`source scripts/env.sh` を実行したときと同じようにスクリプトを bash で実行し、シバンは無視します。他の言語を使う場合は、タスクまたは [環境プラグイン（原文）](https://mise.jdx.dev/env-plugin-development.html) を使います。

- スクリプトが export した変数や変更した変数は追加され、unset した変数は削除されます。
- `_.file` と同様に、パスには glob パターンを指定でき、どのファイルにも一致しないパスはスキップされます。
- スクリプトは mise が環境を計算するたびに実行されるため、高速で、複数回実行しても安全なものにしてください。
- [セーフモード（原文）](https://mise.jdx.dev/security.html#safe-mode) では、グローバル設定からであっても実行されません。

スクリプトは `PATH` に前置できます。

```sh
export PATH="/new/bin:$PATH"
```

追記・削除・並べ替えなど、`PATH` へのその他の変更は無視されます。mise は `PATH` エントリを自身で管理しており、ディレクトリを離れたときにきれいに削除できるようにしているためです。前置された相対エントリはプロジェクトディレクトリを基準に解決され、空のエントリは無視されます。

Windows では、`_.source` には [Git for Windows](https://gitforwindows.org/) や MSYS2 のような POSIX bash が必要です。mise は bash タスクと同じ方法でそれを見つけ、`PATH` にない一般的なインストール場所も探索します。使う bash を選ぶには `MISE_BASH_PATH` を設定します。`C:\Windows\System32\bash.exe` にある WSL のランチャーは、WSL が Windows のスクリプトパスを読めないため、決して使われません。スクリプトが `/c/...` または `/cygdrive/c/...` 形式で前置した `PATH` エントリは、Windows 形式に変換されます。

### `env._.python.venv` {#env-python-venv}

Python の仮想環境を作成し、有効化します。

```toml [mise.toml]
[env]
_.python.venv = { path = ".venv", create = true }
```

すべてのオプションは [virtualenv の自動有効化（原文）](https://mise.jdx.dev/lang/python.html#automatic-virtualenv-activation) を参照してください。

### プラグインのディレクティブ {#plugin-directives}

環境プラグインは独自のディレクティブを追加します。[プラグインをインストール（原文）](https://mise.jdx.dev/plugins.html#environment-plugins)してから、プラグインのドキュメントに記載されたオプションとともに、`_` の下にその名前を指定します。

```toml [mise.toml]
[env]
_.my-env-plugin = { api_url = "https://api.example.com" }
```

`tools` と `redact` はプラグインのディレクティブでも使えます。プラグインがインストールされておらず、mise にインストール元もない場合、mise は警告を出してそのディレクティブをスキップします。環境プラグインを作成するには、[環境プラグイン（原文）](https://mise.jdx.dev/env-plugin-development.html) を参照してください。

## mise を設定する変数 {#mise-variables}

mise は `MISE_DATA_DIR` などの `MISE_*` 変数を、起動時、`[env]` を読み込む前に読み取ります。そのため、`[env]` でこれらを設定しても、その mise プロセスの動作は変わりません。シェルや CI 環境で設定するか、[`[settings]`（原文）](https://mise.jdx.dev/configuration/settings.html) を使ってください。[`MISE_*` 変数（原文）](https://mise.jdx.dev/configuration/environment-variables.html) を参照してください。

SOPS の鍵の変数は例外です。mise は `[env]` から `MISE_SOPS_AGE_KEY` と `MISE_SOPS_AGE_KEY_FILE` を読み取り、それより後に指定された暗号化ファイルの復号に使います。[SOPS ファイル（原文）](https://mise.jdx.dev/environments/secrets/sops.html#environment-variables) を参照してください。

## 設定ファイルの env の無効化 {#no-env}

`mise --no-env`、`MISE_NO_ENV=1`、または [`no_env`（原文）](https://mise.jdx.dev/configuration/settings.html#no_env) 設定項目を使うと、すべての設定ファイルの `[env]` と env ディレクティブをスキップします。

[セーフモード（原文）](https://mise.jdx.dev/security.html#safe-mode)（`MISE_SAFE=1`）では、mise はプロジェクト設定の `[env]` と env ディレクティブを無視し、`_.source` を実行しません。

## 次のステップ {#next-steps}

- [シークレット（原文）](https://mise.jdx.dev/environments/secrets/)：値を暗号化する、シークレットマネージャーから取得する、出力でマスクする方法
- [設定環境](/configuration/environments.html)：`MISE_ENV` で値のセットを切り替える方法
- [フック（原文）](https://mise.jdx.dev/hooks.html)：プロジェクトに入るとき・離れるときにコマンドを実行する方法
- [Tera テンプレート（原文）](https://mise.jdx.dev/templates.html)：値で使える関数とフィルター

## 非推奨の記法 {#deprecated-syntax}

| 非推奨 | 代替 | 削除されるバージョン |
| --- | --- | --- |
| `env.mise.*` | `env._.*` | 2026.12.0 |
| `_.file`、`_.path`、`_.source` のテーブル内の `value` または `values` | `path` | 2026.12.0 |
| トップレベルの `env_file` または `dotenv` | `env._.file` | 2027.4.0 |
| トップレベルの `env_path` | `env._.path` | 2027.4.0 |

`value` と `values` に関する規則は、`vars._` 配下のディレクティブにも適用されます。`SECRET = { value = "...", redact = true }` のような通常の変数テーブル内の `value` や、プラグインのディレクティブのオプションには影響しません。
