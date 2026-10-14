---
title: トラブルシューティング
description: "Diagnose problems with shell activation, tool versions, downloads, tasks, and Windows setups."
outline: [2, 3]
upstreamPath: docs/troubleshooting.md
upstreamUrl: https://mise.jdx.dev/troubleshooting.html
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# トラブルシューティング {#troubleshooting}

シェルの有効化、ツールのバージョン、ダウンロード、タスク、Windows のセットアップでよくある問題の解決方法を、症状別にまとめています。mise が表示したメッセージを調べるには、[エラーメッセージ（原文）](https://mise.jdx.dev/errors.html) を参照してください。

## 診断情報の収集 {#mise-is-failing-or-not-working-right}

問題が起きるディレクトリで、次のコマンドを実行してください。

```sh
mise --version
mise doctor        # setup problems, config files, tools, and activation status
mise doctor path   # the PATH entries mise adds
```

失敗したコマンドを `--verbose` 付きで、または `MISE_DEBUG=1` 付きで再実行してください（より詳しく見るには `MISE_TRACE=1`）。ログを残すには `MISE_LOG_FILE=mise.log MISE_LOG_FILE_LEVEL=debug` を追加します。インストールが明確な原因なく失敗する場合、`mise install --raw` はツールを1つずつインストールし、インストーラーをターミナルに接続します。これにより、進捗表示に隠れていたプロンプトやビルドエラーが表示されます。

シェルの問題であれば、シェルで実行したコマンドと `mise exec -- <command>` を比較してください。`mise exec` はそのコマンド1つのためにプロジェクトの環境を計算します。

ログ、トレース出力、`mise env` の出力には秘密情報や非公開のパスが含まれることがあるため、共有する前に内容を確認してください。

mise は、インストールに使ったパッケージマネージャーか `mise self-update` で更新してください。[mise の更新](/installing-mise.html#updating) を参照してください。症状が古いメタデータによるものであれば、[キャッシュ（原文）](https://mise.jdx.dev/cache-behavior.html) を消去してください。mise のデータを削除したり、すべてのツールを再インストールしたりしても、バージョン選択やシェルの問題が解決することはほとんどありません。

それでも問題が残る場合は、実行したコマンド、設定、OS、シェル、mise のバージョン、`mise doctor` の出力を添えて [GitHub Issue](https://github.com/jdx/mise/issues) を作成してください。質問は [Discussion（原文）](https://mise.jdx.dev/contact.html) で受け付けています。

## シェルの有効化と PATH {#shell-activation-and-path}

### ログインシェル、エディター、スクリプト、CI でツールが見つからない {#mise-activate-doesn-t-work-in-profile-bash-profile-zprofile}

<a id="tool-not-found-after-mise-install-or-mise-use-in-a-script"></a>
<a id="mise-activate-in-ci-non-interactive-shells"></a>
<a id="mise-isn-t-working-when-calling-from-tmux-or-another-shell-initialization-script"></a>

`mise activate` は実行された時点で環境を適用し、その後は各プロンプトの前と、ほとんどのシェルでは各 `cd` の後に実行されるフックから環境を更新します。そのフックを一度も実行しないプロセスは、起動時の環境を保ったままです。

- ログインプロファイル（`~/.profile`、`~/.bash_profile`、`~/.zprofile`）を読み込むのはログインシェルだけです。サブシェルや、非ログインシェルを開くターミナルのように、これらを読み込まずに起動したシェルやプログラムは、`PATH` は継承しますがフックは継承しないため、プロジェクト間を移動してもツールが追従しなくなります。`mise activate` はインタラクティブシェルの起動ファイル（`~/.bashrc`、`~/.zshrc`、`~/.config/fish/config.fish`）に、`mise activate --shims` はプロファイルに書いてください。[shim を PATH に追加する](/dev-tools/shims.html#how-to-add-mise-shims-to-path) を参照してください。
- エディターなどの GUI プログラムは、ログインプロファイルを読み込むとしても起動時に1度だけです。上記のとおり shim をそれらの `PATH` に追加してから、エディターを再起動してください。[エディターと IDE](/ide-integration.html) を参照してください。shim は [有効化が行うことのすべてをカバーするわけではありません](/dev-tools/shims.html#shims-vs-path)。
- スクリプトや CI ジョブではプロンプトが表示されることはありません。コマンドは `mise exec -- <command>` または `mise run <task>` で実行してください。これらはそのコマンドのために環境を計算します。mise が設定を見つけられるように、スクリプトはプロジェクトのディレクトリに置いてください。[継続的インテグレーション](/continuous-integration.html) を参照してください。
- スクリプト内でツールをインストールしても、そのスクリプトの `PATH` は変わりません。次のコマンドは `mise exec` 経由で実行してください。

  ```sh
  mise install
  mise exec -- node --version
  ```

- Bash、Zsh、Fish、PowerShell では、また Elvish では `mise:activate` の後であれば、同じ起動ファイル内で有効化の行より後にある行からは、すでに mise のツールが見えます。有効化の行より前にある行や、tmux が `tmux.conf` から実行する `sh -c` コマンドのようにそのファイルを読み込まないシェルからは見えません。そうした場所では `mise exec -- <command>` を使うか、先に shim を `PATH` に追加してください。Nushell と Xonsh では、有効化は最初のプロンプトで環境を適用します。[スクリプトとシェルの起動ファイル](/dev-tools/shims.html#using-mise-in-rc-files) を参照してください。

`eval "$(mise env -s bash)"` は、現在のプロジェクトのツールと変数をシェルに1度だけ読み込みます。ディレクトリを移動しても更新されません。単体のスクリプトであれば、[シバン（原文）](https://mise.jdx.dev/tips-and-tricks.html#shebang) でツールを指定することもできます。

### `~/.bash_profile` を作成したら `~/.profile` が読み込まれなくなった {#creating-bash-profile-breaks-existing-profile-on-ubuntu-debian}

ログイン時の Bash は、`~/.bash_profile`、`~/.bash_login`、`~/.profile` のうち、最初に存在するものだけを読み込みます。Ubuntu と Debian は `PATH` の設定を `~/.profile` に置いているため、新しい `~/.bash_profile` があるとそれが隠れてしまいます。手作業で作成した場合も、[shim](/dev-tools/shims.html#how-to-add-mise-shims-to-path) のために作成した場合も、[`[bootstrap.mise_shell_activate]`（原文）](https://mise.jdx.dev/bootstrap/shell.html) の `bash = true` で作成した場合も同様です。新しいファイルから `~/.profile` を読み込んでください。

```sh [~/.bash_profile]
[[ -f ~/.profile ]] && source ~/.profile
```

### 意図しないバージョンのツールが実行される {#the-wrong-version-of-a-tool-is-being-used}

プロジェクトが選択しているものと、シェルが実行しているものを比較してください。Node.js の場合は次のとおりです。

```sh
mise ls --current node       # the version and the config file that selects it
mise which node              # the executable mise would run
mise exec -- node --version  # the version mise runs
node --version               # the version your shell runs
type -a node                 # every node your shell can find, in order
mise doctor path             # the PATH entries mise adds
```

`mise ls` がそのバージョンを missing と表示する場合は、`mise install` を実行してください。要求されたバージョンや設定ファイルが意図と違う場合は、現在のディレクトリ、選択されている [設定環境](/configuration/environments.html)、[設定ファイルがどう組み合わされるか](/configuration.html#configuration-hierarchy) を確認してください。インストール済みのバージョンの中から mise がどれを選ぶかについては、[リクエストの解決方法（原文）](https://mise.jdx.dev/dev-tools/versions.html#how-requests-resolve) を参照してください。

`mise exec` では期待どおりのバージョンが実行されるのに `node` ではそうならない場合、`type -a node` で先頭に来ているエイリアス、関数、実行可能ファイルがわかります。他のバージョンマネージャーの有効化を取り除き、起動ファイル内で `mise activate` を、Zinit や Oh My Zsh のプラグインのように `PATH` を編集するものすべてより後に置いてください。編集した後は新しいシェルを開いてください。[`activate_aggressive`（原文）](https://mise.jdx.dev/configuration/settings.html#activate_aggressive) を使うと、起動ファイル内の後続の行のように有効化より後に追加された `PATH` のエントリよりも、ツールのディレクトリを前に保ちます。mise のフックより後に実行されるプロンプトフックは、プロンプトごとに順序を変えてしまう可能性があります。そのフックを `mise activate` より前に移すか、`mise exec -- <command>` を使ってください。エディターでのみ起きる問題については、[エディターと IDE](/ide-integration.html) を参照してください。

### シェルのプロンプトが遅い {#slow-shell-prompts}

`mise activate` はプロンプトごとにフックを実行します。関係する変更が何もなければフックはすぐに終了するため、コストは通常数ミリ秒です。環境の計算を1回分まるごと計測するには、次のようにします。

```sh
MISE_TIMINGS=1 mise hook-env --force -s bash >/dev/null  # time per step
MISE_TIMINGS=2 mise hook-env --force -s bash >/dev/null  # with sub-steps
```

`bash` は自分のシェルに置き換えてください。`--force` は早期終了の判定を飛ばすため、このコマンドはセッションを変更せずに計算全体を計測します。計算が遅くなるよくある原因は次のとおりです。

- 環境の再計算が必要なときに実行される `_.source` スクリプト
- 多数のツールや環境プラグイン
- ネットワークリクエストを行う env ディレクティブやテンプレート

[環境のキャッシュ（原文）](https://mise.jdx.dev/cache-behavior.html#environment-caching) と `watch_files` は、環境プラグインの繰り返し処理を減らします。NFS のような遅いファイルシステムでは、[`hook_env.chpwd_only`（原文）](https://mise.jdx.dev/configuration/settings.html#hook_env.chpwd_only) を使うとディレクトリを移動したときにだけ設定を確認するようになり、[`hook_env.cache_ttl`（原文）](https://mise.jdx.dev/configuration/settings.html#hook_env.cache_ttl) はその確認結果をキャッシュします。

[`mise activate --shims`](/dev-tools/shims.html) を使うと、コストがプロンプトごとからツールの呼び出しごとに移ります。これが速くなるか遅くなるかは、ツールを実行する頻度によります。[パフォーマンス](/dev-tools/shims.html#performance) を参照してください。

## バージョンとダウンロード {#versions-and-downloads}

### 新しいリリースが一覧に表示されない {#new-version-of-a-tool-is-not-available}

直近1日以内のリリースが表示されない原因は3つあります。

- [最小リリース経過時間（原文）](https://mise.jdx.dev/security.html#minimum-release-age)。ほとんどのバックエンドでは、リリースから 24 時間が経つまで、mise はそのリリースを一覧に表示せず、プレフィックスや `latest` に対しても選びません。このとき `mise ls-remote` は `1 newer node release hidden by minimum_release_age` と警告します。そのリリースを今すぐインストールするには、`mise use node@24.11.1` のように正確なバージョンを指定してください。一致するリリースがすべて隠れているプレフィックス（例えば 24.12.0 が公開されてから1日以内の `node@24.12`）は、[404（原文）](https://mise.jdx.dev/errors.html#http-404) で失敗します。
- mise がキャッシュしているバージョン一覧。どのコマンドがキャッシュを使うかについては、[mise がバージョン一覧を更新するタイミング（原文）](https://mise.jdx.dev/cache-behavior.html#version-list-refresh) を参照してください。
- [mise-versions](https://mise-versions.jdx.dev) ホスト。ほとんどのツールのバージョン一覧を提供しており、上流を定期的に確認しています。

バックエンドが持つすべてのリリースを確認するには、そのツールのキャッシュを消去してから、versions host と経過時間のフィルターを飛ばしてください。

```sh
mise cache clear node
mise ls-remote --no-versions-host --minimum-release-age 0s node
```

versions host を使わない場合、mise は [GitHub トークン（原文）](https://mise.jdx.dev/dev-tools/github-tokens.html) のようなバックエンドの認証情報を必要とすることがあります。[`use_versions_host`（原文）](https://mise.jdx.dev/configuration/settings.html#use_versions_host) 設定項目を使うと、すべてのコマンドで versions host を無効にできます。

versions host も GitHub のレート制限を受けます。権限を一切要求しない [mise-versions GitHub アプリ](https://github.com/apps/mise-versions) を認可すると、versions host が使える API の割り当てが増え、新しいリリースがより早く表示されるようになります。

### ダウンロードが 403 Forbidden で失敗する {#_403-forbidden-when-installing-a-tool}

GitHub からの 403 は、たいていレート制限によるもので、特に CI でよく起きます。[`HTTP status client error (403 Forbidden)`（原文）](https://mise.jdx.dev/errors.html#http-403) を参照してください。

### 存在しないコマンドを入力してもインストールされない {#auto-install-on-command-not-found-does-not-trigger}

見つからないコマンドを入力すると、mise はそれを提供する設定済みのツールをインストールできます（[`not_found_auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#not_found_auto_install)）。mise はレジストリにある各ツールのコマンド一覧からツールを見つけるため、一度もインストールされたことのない設定済みのツールも対象になります。次の場合は何も起きません。

- mise が Bash、Zsh、Fish、PowerShell の `mise activate` で有効化されていない。他のシェルには command-not-found フックがなく、shim はすでにインストール済みのツールのコマンドに対してしか存在しません。
- ツールが `ripgrep` のようなレジストリ名ではなく、`"cargo:some-crate"` や `"github:owner/repo"` のようなバックエンド識別子で設定されている。バックエンド識別子はコマンド一覧を持たないため、レジストリ名がある場合はそちらを使ってください。
- ツールが設定に含まれていない。[`not_found_auto_install_registry`（原文）](https://mise.jdx.dev/configuration/settings.html#not_found_auto_install_registry) を設定すると、そのコマンドを提供するレジストリのエントリがちょうど1つだけのツールをインストールします。mise はそのツールをグローバル設定に追加します。
- [`auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#auto_install) または `not_found_auto_install` が `false` になっている、あるいはそのツールが [`auto_install_disable_tools`（原文）](https://mise.jdx.dev/configuration/settings.html#auto_install_disable_tools) に列挙されている。

バックエンド識別子で指定したツールは、`lazy = true` を付け、`lazy_bins` にそのコマンドを列挙してください。すると mise は、そのコマンドのいずれかが初めて実行されたときにツールをインストールする shim を作成します。[遅延ツール](/dev-tools/shims.html#lazy-tools) を参照してください。

```toml [mise.toml]
[tools]
"github:owner/repo" = { version = "1.2.3", lazy = true, lazy_bins = ["tool"] }
```

それ以外の場合は、`mise install` を実行するか、コマンドを実行する前に不足しているツールをインストールする [`mise exec`（原文）](https://mise.jdx.dev/cli/exec.html) を使ってください。どちらも `lazy = true` が付いたツールについては、そのコマンドが実行されるまでインストールを飛ばします。`mise install --include-lazy` はそれらもインストールします。ツールのいずれかのバージョンが一度インストールされれば、mise はそのインストールからもコマンドを見つけるため、ハンドラーはプロジェクトが後から要求する別のバージョンもインストールできます。

## タスク {#tasks}

### raw なタスクの出力で秘密情報が隠されない {#tasks-with-redact-env-vars-break-raw-output}

[`raw = true`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#raw) や [`interactive = true`（原文）](https://mise.jdx.dev/tasks/task-configuration.html#interactive) を指定したタスク、および `--raw` を付けた実行は、ターミナルに直接書き込むため、mise はその出力の中の、[redaction（値の削除）の対象（原文）](https://mise.jdx.dev/environments/secrets/#redaction) となる値をマスクできません。これに該当する場合、mise はヒントを表示します。出力に秘密情報が含まれる可能性があるタスクでは `raw` を無効のままにしてください。[redaction の対象範囲（原文）](https://mise.jdx.dev/environments/secrets/#what-redaction-covers) を参照してください。

タスクが間違った順序で実行される場合や、mise がタスクを見つけられない場合は、[依存関係と実行順序（原文）](https://mise.jdx.dev/tasks/architecture.html) と [`no task <name> found`（原文）](https://mise.jdx.dev/errors.html#task-not-found) を参照してください。

## Windows {#windows-problems}

Windows でどのツールやバックエンドが動作するかについては、[mise は Windows で動作しますか？](/faq.html#windows-support) を参照してください。

### `cmd.exe` がプログラムを見つけられなくなる: PATH が長すぎる {#path-limits}

mise は、自分が構築した `PATH` が `cmd.exe` の受け付ける長さを超えると警告します。

```text
mise WARN  PATH is 9120 characters, longer than the 8191 cmd.exe accepts. ...
```

`cmd.exe` は長すぎる `PATH` を切り詰めるのではなく、[変数そのものを無視します](https://learn.microsoft.com/en-us/troubleshoot/windows-client/shell-experience/command-line-string-limitation)。その結果、`PATH` を通じて見つかるはずのものはすべて `is not recognized` で失敗しますが、`C:\Windows\System32` 内のプログラムは動作し続けます。`npm`、`npx`、バッチスクリプトのように `cmd.exe` を通じて実行されるツールが影響を受けます。

`PATH` を短くするには、次のようにします。

1. `MISE_INSTALLS_DIR` を `C:\.mise-installs` のような短いディレクトリに設定します。
2. ツールは、それを必要とする `mise.toml` ファイルでのみ宣言します。モノレポでは、ツールをルートの設定から移します。
3. より長い `PATH` を受け付ける PowerShell からコマンドを実行します。

mise は、`mise exec`、`mise run`、`mise env` に渡す `PATH` からすでに完全な重複を取り除いているため、長さは異なるディレクトリの数から来ています。[shim](/dev-tools/shims.html) を使うと自分のシェルの `PATH` は短く保てますが、shim 経由で起動したツールにはやはりアクティブな全ツールのディレクトリが渡されるため、`cmd.exe` を呼び出すツールには同じ長さの `PATH` が見えます。

確認するには、`C:\Windows\System32` に無いプログラムを、そのプログラムを含まないディレクトリから `cmd.exe` 経由で実行してください。`cmd.exe` はこの2箇所にあるプログラムを `PATH` を読まずに見つけるためです。

```powershell
mise exec -- cmd.exe /d /s /c "git --version"
```

シェルでは `git --version` が動作するのに、これが `'git' is not recognized as an internal or external command` と表示する場合、`PATH` は上限を超えています。

### エディターが `spawn EINVAL` を報告する {#vscode-for-windows-extension-with-error-spawn-einval}

`.cmd` の shim を直接起動するエディター拡張機能は、[Node.js のセキュリティ修正](https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2#command-injection-via-args-parameter-of-child_processspawn-without-shell-option-enabled-on-windows-cve-2024-27980---high) 以降、`spawn EINVAL` で失敗します。デフォルトの [`windows_shim_mode = "exe"`（原文）](https://mise.jdx.dev/configuration/settings.html#windows_shim_mode) を使い、`mise reshim` を実行してから、拡張機能や言語サーバーを再起動してください。それでも拡張機能が `.cmd` のパスを起動する場合は、拡張機能のツールパスの設定を、`%LOCALAPPDATA%\mise\shims` にある `.exe` の shim か、`mise which <tool>` が表示するパスに変更してください。

### `bash -c` のタスクが PowerShell から実行すると `command not found` で失敗する {#shell-bash-c-task-fails-with-command-not-found-from-powershell}

`shell = "bash -c"` を指定したタスクには、Git Bash や MSYS2 のような POSIX の bash が必要です。PowerShell からだと、`PATH` 上で最初に見つかる `bash` は WSL ランチャー `C:\Windows\System32\bash.exe` であることが多く、これはコマンドを Linux 内で実行するため、mise の Windows 用ツールが見えません。mise は WSL ランチャーを飛ばし、標準のインストール場所または `PATH` から Git Bash か MSYS2 を使います。どちらも見つからない場合は `no real POSIX bash found on PATH (only the WSL launcher)` と警告します。Git for Windows か MSYS2 をインストールするか、`MISE_BASH_PATH` で bash を指定してください。

```powershell
$env:MISE_BASH_PATH = "C:\tools\msys64\usr\bin\bash.exe"
mise run my-bash-task
```

1つのプロジェクトに対して設定するには、`mise.toml` に書きます。

```toml [mise.toml]
[env]
MISE_BASH_PATH = "C:/tools/msys64/usr/bin/bash.exe"
```

`MISE_BASH_PATH` と自動検出が適用されるのは、シェルが単なる名前 `bash` の場合だけです。タスクの `shell` や [`windows_default_inline_shell_args`（原文）](https://mise.jdx.dev/configuration/settings.html#windows_default_inline_shell_args) が `C:/msys64/usr/bin/bash.exe -c` のようにパスを指定している場合、mise はそのバイナリを実行します。[`_.source`](/environments/#env-source) スクリプトを実行する bash も、同じ規則で選ばれます。

スペースを含むパスはクォートしてください。Windows では `shell` 内のバックスラッシュはそのまま扱われ、スラッシュも使えます。macOS と Linux では、`shell` は POSIX のクォート規則に従います。

```toml [mise.toml]
[tasks.build]
run = "echo hi"
shell = '"C:\Program Files\Git\bin\bash.exe" -c'
```

### Git Bash、MSYS2、Cygwin {#cygwin}

ネイティブの Windows 版 mise は、Git Bash、MSYS2、Cygwin 上で動作する Bash、Zsh、Fish を有効化できます。[シェルのセットアップ（原文）](https://mise.jdx.dev/shell-setup.html#windows) に示すとおり、`mise activate` はそのシェル自身の起動ファイルから実行してください。mise はその行が実行されたときにランタイムを検出し、そのランタイムが期待する形式で `PATH` を書き出します。PowerShell で生成したスクリプトを後で別のシェルで読み込んでも動作しません。

`PATH` 上のディレクトリがカスタムのマウントポイントを使っている場合は、ランタイムの `/etc/fstab` または `/etc/fstab.d` で宣言してください。mise はランタイムのデフォルトのマウントとこれらのファイルだけを使ってパスを変換するため、現在のセッションで `mount` によって作成したマウントや、シンボリックリンクされたディレクトリは変換されません。マウントを変更した後はシェルを再起動してください。

`shell = "bash -c"` を指定したタスクで Cygwin の bash を選ぶには、`MISE_BASH_PATH` を設定してください。

```powershell
$env:MISE_BASH_PATH = "C:\cygwin64\bin\bash.exe"
```

mise はこれらのシェルに `PATH` をそのまま渡し、シェル側が双方向に変換するため、`PATH` には設定が不要です。他の引数は事情が異なります。Git Bash や MSYS2 はネイティブのプログラムを起動するとき、POSIX のパスに見える引数や環境変数を書き換えます（`/c` は `C:/` になります）が、Cygwin は書き換えません。1つのコマンドに対してこれを無効にするには、コマンドの前に `MSYS_NO_PATHCONV=1` を付けてください。

### Windows のツールが WSL 内で実行される {#shims-leaking-into-wsl}

WSL はデフォルトで Windows の `PATH` を Linux 側に追加します。[`windows_shim_mode = "file"`（原文）](https://mise.jdx.dev/configuration/settings.html#windows_shim_mode) の場合、mise は各 `.cmd` の shim の横に拡張子のない bash スクリプトを書き出し、WSL で入力したコマンドが `/mnt/c` の下でそれを見つけることがあります。このスクリプトは WSL を検出すると自分のディレクトリを `PATH` から取り除き、Linux 版のツールがインストールされていればそれを実行し、そうでなければ `<tool>: not found` で失敗します。デフォルトの `exe` モードは `<tool>.exe` ファイルだけを書き出すため、WSL で `<tool>` という名前のコマンドを入力しても一致しません。

WSL 内で Linux のツールを管理するには、WSL 内に Linux 版の mise をインストールしてください。Windows のパスを WSL から完全に排除するには、`/etc/wsl.conf` に次の内容を追加し、PowerShell から `wsl --shutdown` を実行して、WSL を開き直してください。

```ini [/etc/wsl.conf]
[interop]
appendWindowsPath = false
```

`wsl --shutdown` は実行中のすべての WSL ディストリビューションを停止するため、先に作業内容を保存してください。
