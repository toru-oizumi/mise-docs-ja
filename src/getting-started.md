---
title: はじめに
description: "Install mise, then give a project its own Node.js version, environment variable, and task."
upstreamPath: docs/getting-started.md
upstreamUrl: https://mise.jdx.dev/getting-started.html
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# はじめに {#getting-started}

mise をインストールし、プロジェクトに専用の Node.js バージョン、環境変数、タスクを持たせます。ステップ 1 から 3 はシェルの設定を変更せずに動作します。ステップ 4 では任意のシェルの有効化を追加します。

すでに `mise.toml` があるプロジェクトに参加する場合は、mise をインストールし（ステップ 1）、プロジェクトの `mise.toml` を読んでから（[信頼](#trust)を参照）、プロジェクトディレクトリで `mise install` を実行し、`mise tasks ls` でタスクの一覧を表示します。まだ mise を使っていないプロジェクトに mise を導入する方法は、[既存のプロジェクトで mise を使う](/walkthrough.html)で説明しています。

## 1. mise のインストール {#installing-mise-cli}

macOS または Linux では、インストーラーを実行します。

```sh
curl -fsSL https://mise.run | sh
~/.local/bin/mise --version
# 2026.x.x linux-x64 (2026-xx-xx)
```

インストーラーは `mise` 実行ファイルを `~/.local/bin/mise` に配置します。以降のステップでシェルが `mise` を見つけられない場合は、ステップ 4 で [mise を有効化](#activate-mise)して `PATH` に追加されるまで、`~/.local/bin/mise` として実行してください。

Windows では `winget install jdx.mise` を実行します。Homebrew、apt、dnf などのパッケージマネージャーについては、[mise のインストール](/installing-mise.html)を参照してください。

## 2. ツールの実行 {#mise-exec-run}

[`mise exec`（原文）](https://mise.jdx.dev/cli/exec.html) は、特定のバージョンのツールでコマンドを実行します。

```sh
mise exec node@24 -- node --version
# v24.x.x
```

mise は Node.js 24 がインストールされていなければダウンロードし、`--` の後のコマンドを実行します。これによって設定ファイルや現在のシェルの環境が変更されることはありません。

## 3. プロジェクトのセットアップ {#set-up-a-project}

ディレクトリを作成し、そのディレクトリ用に Node.js 24 を選択します。

```sh
mkdir my-project
cd my-project
mise use node@24
```

[`mise use`（原文）](https://mise.jdx.dev/cli/use.html) は必要に応じて Node.js 24 をインストールし、その指定を新しい `mise.toml` に記録します。

```toml [mise.toml]
[tools]
node = "24"
```

### 環境変数の設定 {#environment-variables}

[`mise set`（原文）](https://mise.jdx.dev/cli/set.html) を実行して `[env]` セクションを追加します。

```sh
mise set NODE_ENV=development
```

`mise.toml` は次の内容になります。

```toml [mise.toml]
[tools]
node = "24"

[env]
NODE_ENV = "development"
```

mise を通じて実行したコマンドには、ツールと変数の両方が渡されます。

```sh
mise exec -- node -p process.env.NODE_ENV
# development
```

[`.env` ファイルから変数を読み込む](/environments/#env-directives)こともできます。

### タスクの実行 {#run-a-task}

同じ `mise.toml` にタスクを追加します。

```toml [mise.toml]
[tasks.hello]
description = "Print the Node.js version and NODE_ENV"
run = 'node -e "console.log(process.version, process.env.NODE_ENV)"'
```

```sh
mise run hello
```

```text
[hello] $ node -e "console.log(process.version, process.env.NODE_ENV)"
v24.x.x development
```

[`mise run`（原文）](https://mise.jdx.dev/cli/run.html) は不足しているツールをインストールし、プロジェクトの環境を設定してから、タスクを実行します。

### mise が選択した内容の確認 {#confirm-what-is-active}

プロジェクトディレクトリで次を実行します。

```sh
mise config ls     # config files in use
mise ls --current  # selected tool versions
mise tasks ls      # available tasks
```

### プロジェクト設定の信頼 {#trust}

`[env]`、フック、テンプレート、設定項目を含む `mise.toml` はコードを実行したり環境を変更したりできるため、mise はそれが信頼済みになって初めて読み込みます。`mise use` や `mise set` で書き込んだファイルは信頼済みとなり、`mise install`、`mise exec`、`mise run` を実行したプロジェクトも同様です。他の人のプロジェクトでは、これらのコマンドや [`mise trust`（原文）](https://mise.jdx.dev/cli/trust.html) を実行する前に、タスクも含めてその設定を読んでください。規則については [設定の信頼（原文）](https://mise.jdx.dev/security.html#configuration-trust) を参照してください。

### プロジェクトの共有 {#share-the-project}

`mise.toml` をコミットします。チームメイトや CI はプロジェクトで `mise install` を実行すれば、同じツールを入手できます。`"24"` は正確なバージョンではなくプレフィックスなので、2台のマシンで異なる Node.js 24 のリリースに解決される可能性があります。正確なバージョンを記録するには、`mise lock` で[ロックファイル（原文）](https://mise.jdx.dev/dev-tools/mise-lock.html)を追加します。

## 4. mise の有効化 <Badge text="optional" /> {#activate-mise}

インタラクティブシェルで mise を有効化すると、プロジェクトディレクトリに入ったときにそのツールが `PATH` に追加され、環境変数が設定されます。有効化によってフックが追加され、プロンプトの表示やディレクトリの移動のたびに実行されて、現在のディレクトリに合わせて環境を更新します。スクリプトや CI では有効化は不要です。そこでは引き続き `mise exec` と `mise run` を使ってください。

使っているシェル用のコマンドを一度だけ実行します。有効化の行がシェルの起動ファイルに追記されます。

::: code-group

```sh [bash]
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc
```

```sh [zsh]
echo 'eval "$(~/.local/bin/mise activate zsh)"' >> "${ZDOTDIR:-$HOME}/.zshrc"
```

```fish [fish]
mkdir -p ~/.config/fish
echo '~/.local/bin/mise activate fish | source' >> ~/.config/fish/config.fish
```

```powershell [PowerShell]
if (-not (Test-Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force | Out-Null }
Add-Content $PROFILE '(&mise activate pwsh) | Out-String | Invoke-Expression'
```

:::

パッケージマネージャーで mise をインストールした場合は、`~/.local/bin/mise` の代わりに `mise` と書いてください。Homebrew の場合、fish ではこの手順なしで mise が有効化されます。[シェルのセットアップ（原文）](https://mise.jdx.dev/shell-setup.html)では、Nushell、Xonsh、Elvish、Git Bash、cmd.exe について説明しており、2回実行しても重複して追加されない形のこれらの行も載せています。

新しいターミナルを開き、プロジェクト内のディレクトリとプロジェクト外のディレクトリを比べます。

```sh
cd my-project
node --version
# v24.x.x
cd ..
node --version
# another Node.js version, or "command not found"
```

どのプロジェクトの外でもバージョンを使えるようにするには、`mise use --global node@24` で個人用のデフォルトを設定します。これは `~/.config/mise/config.toml` に書き込まれ、プロジェクトの設定がそれを上書きします。

セットアップを確認するには [`mise doctor`（原文）](https://mise.jdx.dev/cli/doctor.html) を実行します。シェルの起動ファイルを読み込まないエディターなどのプログラムでは、代わりに [shim](/dev-tools/shims.html) を使えますが、[いくつかの制限](/dev-tools/shims.html#shims-vs-path)があります。

## 5. さらにツールを探す {#tool-backends}

`node`、`python`、`jq`、`ripgrep` などのツール名は[レジストリ（原文）](https://mise.jdx.dev/registry.html)で探せます。通常は名前だけで十分です。以下は `my-project` ディレクトリで実行してください。ステップ 4 のデモの後であれば、先に `cd my-project` を実行します。

```sh
mise use ripgrep
mise exec -- rg --version
```

これでプロジェクトの `mise.toml` に `ripgrep` が追加されます。プロジェクトの外では、`mise use` は現在のディレクトリに `mise.toml` を作成します。そのディレクトリがホームディレクトリの場合は、グローバル設定に書き込みます。

バックエンドは、ツールをどこから取得し、どのようにインストールするかを mise に指示します。レジストリに登録されていないツールも含め、バックエンドを明示的に指定できます。

```sh
mise exec github:BurntSushi/ripgrep -- rg --version
```

バックエンドによっては、`npm:` に対する Node.js のように、別のツールやパッケージマネージャーが必要です。新しいエコシステムを使う前に [バックエンドガイド（原文）](https://mise.jdx.dev/dev-tools/backends/) を確認してください。

## うまく動かない場合 {#if-something-doesn-t-work}

セットアップを確認するには `mise doctor` を実行します。ツールが `mise exec` 経由では動くのに通常のコマンドとしては動かない場合は、[シェルの有効化](#activate-mise)を確認し、新しいターミナルを開いてください。その他の問題については [トラブルシューティング](/troubleshooting.html) を参照してください。

### GitHub API のレート制限 {#github-api-rate-limiting}

エラーで GitHub API のレート制限が報告された場合は、mise に [GitHub トークン（原文）](https://mise.jdx.dev/dev-tools/github-tokens.html) を設定してください。

## 次のステップ {#next-steps}

- [既存のプロジェクトで mise を使う](/walkthrough.html)
- [タスク](/tasks/): ビルド、テストなどのプロジェクトのコマンド
- [エディター](/ide-integration.html) と [継続的インテグレーション](/continuous-integration.html)
- [シェルの自動補完（原文）](https://mise.jdx.dev/shell-setup.html#autocompletion)
- [Bootstrap（原文）](https://mise.jdx.dev/bootstrap.html): マシン全体のシステムパッケージ、dotfiles、サービス
