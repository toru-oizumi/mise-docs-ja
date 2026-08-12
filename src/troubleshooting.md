---
title: トラブルシューティング
upstreamPath: docs/troubleshooting.md
upstreamUrl: https://mise.jdx.dev/troubleshooting.html
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

# トラブルシューティング {#troubleshooting}

特定のエラーメッセージについてのヘルプをお探しの場合は、[エラー（原文）](https://mise.jdx.dev/errors.html) を参照してください —
このページは症状別に構成されています。

## `mise activate` は `~/.profile`、`~/.bash_profile`、`~/.zprofile` では動作しない {#mise-activate-doesn-t-work-in-profile-bash-profile-zprofile}

`mise activate` は `rc` ファイルでのみ使用してください。これらは、実際のユーザーがターミナルを使用しているときに
使われるインタラクティブなものです（IDE などによって実行される場合とは対照的です）。非インタラクティブな環境では
プロンプトが表示されないため、`PATH` は変更されません。

非インタラクティブな設定では、代わりに shim を使うことを検討してください。shim は実行されるたびに `PWD` を確認して
正しいディレクトリに呼び出しをルーティングします。`PATH` に直接あることを期待する代わりに `mise exec` を呼び出すこともできます。
非インタラクティブなシェルで `mise env` を実行することもできますが、これは
グローバルツールのみを設定します。別のプロジェクトに入った際に環境変数を変更することはありません。

::: warning
`mise activate --shims` は `mise activate` の全機能をサポートしていません。<br>
詳細は [shim と PATH の比較](/dev-tools/shims.html#shims-vs-path) を参照してください。
:::

スクリプトから mise を呼び出してランタイムを取得する方法については [shebang（原文）](https://mise.jdx.dev/tips-and-tricks.html#shebang)
の例も参照してください。
これも有効化なしで mise を使う別の方法です。

## シェルプロンプトが遅い {#slow-shell-prompts}

`mise activate` は、ツールや環境変数の更新が必要かどうかを確認するフックをプロンプトごとに実行します。通常これは数ミリ秒しかかかりませんが、プロンプトの動作が遅く感じる場合は `MISE_TIMINGS` でプロファイリングできます。

まず、プロンプトフックが測定に干渉しないように mise を無効化してから、タイミング付きで手動で `hook-env` を実行します。

```sh
mise deactivate

# Show timing per major step (color-coded: red = slow)
MISE_TIMINGS=1 mise hook-env -s bash 2>&1 >/dev/null

# Or use =2 for detailed per-step breakdowns with cumulative time
MISE_TIMINGS=2 mise hook-env -s bash 2>&1 >/dev/null
```

`bash` を自分のシェルに置き換えてください。プロンプトが遅くなる一般的な原因:

- `mise.toml` 内の高コストな `_.source` スクリプト — これらはプロンプトごとに再実行されます
- 多数のツールやプラグイン
- env ディレクティブ内のネットワーク依存の処理

[`mise activate --shims`](/dev-tools/shims) を使うと、コストがプロンプトごとからツールの呼び出しごとに移る点に注意してください。これがワークフローによって速くなるかどうかは変わります。トレードオフについては [shim と PATH の比較](/dev-tools/shims.html#shims-vs-path) を参照してください。

## mise が失敗する、または正しく動作しない {#mise-is-failing-or-not-working-right}

まず `MISE_DEBUG=1` または `MISE_TRACE=1` を設定して、より詳しい情報が得られるか確認してください。
`MISE_LOG_FILE_LEVEL=debug MISE_LOG_FILE=/path/to/logfile` を設定してログをファイルに書き出すこともできます。

有効化フックに何か問題が起きている場合は、それを無効化して `eval "$(mise hook-env)"` を手動で呼び出してみてください。
設定されるはずの環境変数だけを出力する `mise env` を使うのも役立ちます。
より互換性が高い場合がある [shim](/dev-tools/shims.md) の使用も検討してください。

ランタイムのインストールがうまく動作しない場合は、`--raw` オプションを試してください。これはインストールを直列に行い、
stdin/stdout/stderr を直接ターミナルに接続します。何らかの理由でプラグインがユーザーとやり取りしようとしている場合、
これによって動作するようになります。

もちろん `mise --version` で mise のバージョンを確認し、最新であることを確認してください。更新するには `mise self-update`
を使います。`mise cache clean` は内部キャッシュを消去するために使え、`mise implode` は設定以外のすべてを削除するために
使えます。

最後に、`mise doctor` があります。これは診断情報と、セットアップで検出された問題に関する警告を表示します。バグ報告を
提出する場合は、`mise doctor` の出力を含めてください。

## 意図しないバージョンのツールが使われる {#the-wrong-version-of-a-tool-is-being-used}

これはおそらく、shim や `mise activate` を使っていても mise が `PATH` の先頭にないことを意味します。これが該当するかを
`which -a` を呼び出すことで確認できます。例えば node@20.0.0 が使われているのに mise が node@26.0.0 を指定している場合、
まず `mise ls node` を実行して、mise がこのバージョンをインストール済みでアクティブになっているかを確認してください。
"missing" と表示されず、正しい "Requested" バージョンになっているはずです。

```bash
$ mise ls node
Plugin  Version  Config Source       Requested
node    24.0.0  ~/.mise/config.toml  24.0.0
```

`node -v` が正しいバージョンを表示していない場合は、`mise doctor` を実行して mise が有効化されているか確認してください。
mise が有効化されていないという「problem」が表示されていないはずです。最後に `which -a node` を実行してください。
表示されたディレクトリが mise のディレクトリでない場合、mise は `PATH` の先頭にありません。最初に実行される node の
ディレクトリが、mise より前に設定されている必要があります。通常、これは bashrc/zshrc の末尾で mise の shim 用に
`PATH` を設定することを意味します。

`mise activate` を使っている場合、`MISE_ACTIVATE_AGGRESSIVE=1` を有効化するという別の選択肢もあります。これにより
mise は常に自分のツールを `PATH` の先頭に追加するようになります。`mise activate` のように動的に `PATH` を変更する
別のものを使っている場合、そのツールが mise の後で `PATH` を変更している可能性があるため、これはうまく機能しないことがあります。

どうしても解決しない場合は、[`mise x --`（原文）](https://mise.jdx.dev/cli/exec.html) で実行することで、正しいバージョンが
使われることを確実にできます。

## ツールの新しいバージョンが利用できない {#new-version-of-a-tool-is-not-available}

バージョンがキャッシュされる場所は2箇所あるため、新しいリリースがすぐには表示されない場合があります。

1つ目は mise CLI がバージョンをキャッシュする場所です。このキャッシュは `mise cache clear` でクリアできます。

2つ目は、ほとんどのプラグインの全バージョンを一覧化する集中的な場所として <https://mise-versions.jdx.dev> ホストを
使う方法です。これは mise を高速化し、また新しいバージョンを問い合わせる際の GitHub のレート制限を回避することを
意図しています。使っているプラグインの更新されたバージョンがあるかどうかは、そのリポジトリを確認してください。
このサービスは `MISE_USE_VERSIONS_HOST=0` を設定することで無効化できます。

mise はこの versions host を、公開 GitHub リリースメタデータと GitHub アーティファクトの証明（attestation）の
共有キャッシュとしても使用します。これは、公開されている `github:` や多くの `aqua:` ツールの通常のインストールが、
トークンが設定されていない Docker ビルドや CI ジョブでも、未認証の GitHub API 呼び出しを避けられることを意味します。
versions host に要求されたメタデータがまだない場合、mise は GitHub の API にフォールバックします。

mise-versions 自体もレート制限に苦しんでいますが、その [GitHub アプリ](https://github.com/apps/mise-versions) で
認証すれば、より頻繁に取得できるように手助けできます。単に公開リポジトリの情報を取得するだけなので、
権限は一切必要ありません。これを行う人が増えるほど、mise がツールの新しいバージョンを取得できるようになるのが
早くなります。

## Windows の問題 {#windows-problems}

::: warning
現在、Windows 向けには非常に基本的なサポートのみが提供されていますが、Windows は asdf プラグインをサポートできないため、core と vfox のみを使う必要があります — つまり、Windows で利用可能なツールはごく一部だけです。
:::

### パスの長さの制限 {#path-limits}

`mise.toml` の階層に多数のツールを定義していると、`mise x` が生成する `Path` 環境変数が、一部のツール（特に `cmd.exe`）が処理できないほど長くなることがあります。これは `cmd.exe` を呼び出す `mise` のツール（`npm install` など）に影響します。

制限は **8191 文字** で、`cmd.exe` はこれより長い `Path` を切り詰めるのではなく、[完全に無視します](https://learn.microsoft.com/en-us/troubleshoot/windows-client/shell-experience/command-line-string-limitation)。そのため症状は1つのツールが見つからなくなるというものではなく、`Path` を通じて見つかっていたものがすべて一度に解決できなくなり、`is not recognized` と報告されます。`C:\Windows\System32` 内のプログラムは、`cmd.exe` が `Path` を参照せずにそれらを見つけるため動作を続けます — これが失敗を場当たり的に見せる原因であり、以下のテストが重要になる理由です。

いくつかの選択肢があります。

1. `MISE_INSTALLS_DIR` 環境変数をより短い場所に設定します。例: `C:\.mise-installs`
1. `cmd.exe` の代わりに `powershell.exe` や `pwsh.exe` を使います。これらはより長い `Path` を扱えます。
1. モノレポ内の `mise.toml` ファイルを再編成し、必要なツールのみを指定するようにします。
1. [shim](/dev-tools/shims.html) を使うと、**シェル自身**の `Path` がツールセットの増加とともに大きくなるのを防げます — `mise activate --shims` はツール1つにつき1ディレクトリではなく、1ディレクトリだけを追加します。これが対応していない点に注意してください。shim 経由でツールを実行する場合でも、アクティブな全ツールのディレクトリを含む環境が構築されるため、`cmd.exe` を自分自身で呼び出す mise 管理のツール（`npm` など）は、どちらの場合でも同じ長さの `Path` を目にします。shim も `mise activate` の [全機能をサポートしていません](/dev-tools/shims.html#shims-vs-path)。

以下のコマンドを実行して、`cmd.exe` の `Path` 制限に達しているかどうかをテストできます。

```powershell
# Path is within limits
❯ mise x -- cmd.exe /d /s /c "git --version"
git version 2.55.0.windows.3
# Path exceeds cmd.exe limits
❯ mise x -- cmd.exe /d /s /c "git --version"
'git' is not recognized as an internal or external command,
operable program or batch file.
mise ERROR command failed: exit code 1
mise ERROR Run with --verbose or MISE_VERBOSE=1 for more information
```

このテストで正しく行うべき点が2つあります。`C:\Windows\System32` に **無い**、かつテストを実行するディレクトリにも無いプログラムを選んでください。`cmd.exe` はカレントディレクトリを `Path` より先に検索し、システムディレクトリのプログラムは `Path` を一切参照せずに見つけるため、どちらの場所にあるプログラムでの確認も、`Path` がどれだけ長くても成功してしまいます。まさにこれが `where.exe` が何も教えてくれない理由です。次に、選んだプログラムがまず通常どおり動作すること（シェルで `git --version`）を確認してください。単に持っていないプログラムでも、制限に達したときと同じ `is not recognized` が発生するためです。

`Path` の重複エントリは以前ほど大きな要因ではありません。再有効化の際、mise は現在のツールセットを追加する前に、継承した `Path` 上で見つかった古いインストールディレクトリを削除するようになりました（v2026.5.18）。また、mise が計算する環境（`mise x`、`mise run`、`mise env`、`mise doctor`）では完全な重複をまとめるようになりました（v2026.7.18 時点）。これにより mise が寄与する分は減りますが、上限が上がるわけではありません — 十分な数の異なるツールがあれば、依然として 8191 に達します。

### shim が WSL に漏れ出す {#shims-leaking-into-wsl}

`windows_shim_mode` が `file` に設定されている場合、mise は各 `<tool>.cmd` shim の横に拡張子のない bash
スクリプトを書き出します（これにより Git Bash / Cygwin がツールを解決できます）。WSL のデフォルトの
Windows-PATH 相互運用は shim ディレクトリを `/mnt/c/...` に公開し、そこではすべてのファイルが実行可能として
扱われるため、WSL 内で shim 化されたツールを実行すると、そのスクリプトがネイティブに実行されます。mise は
生成したスクリプトを保護します。WSL を検出した場合、shim ディレクトリを `PATH` から削除し、ネイティブの
Linux ツールがインストールされていればそれを実行し、そうでなければ無限に再帰したり `mise: not found` という
エラーになったりする代わりに、単純な `<tool>: not found` で失敗します。

デフォルトの `exe` モードはこの影響を受けません。ネイティブの `<tool>.exe` ファイルのみを書き出すため、WSL は
これを無視し、Linux 側には何も漏れません。

Windows の shim を WSL から完全に排除するには、WSL 内で mise を使ってツールをインストール・管理するか、
`/etc/wsl.conf` で Windows-PATH 相互運用を無効化してください。

```ini
[interop]
appendWindowsPath = false
```

### `shell = "bash -c"` のタスクが PowerShell から実行すると `command not found` で失敗する {#shell-bash-c-task-fails-with-command-not-found-from-powershell}

`shell = "bash -c"` に固定されたタスクが Git Bash からは動作するのに PowerShell からは `command not found` で
失敗する場合、mise が `bash` を本物の POSIX bash ではなく `C:\Windows\System32\bash.exe` にある WSL ランチャーに
解決している可能性が高いです。このランチャーは WSL ディストリビューションの Linux ユーザースペースに
ディスパッチするため、mise が管理する Windows のツールは見えません。

mise は、標準的なインストール場所に本物の POSIX bash（Git Bash / MSYS2）が見つかる場合、自動的にそれを優先します。
別の場所にインストールしている場合は、`MISE_BASH_PATH` を設定して上書きしてください。

```powershell
$env:MISE_BASH_PATH = "C:\tools\msys64\usr\bin\bash.exe"
mise run my-bash-task
```

```toml
# Alternatively, scope it to one project from mise.toml
[env]
MISE_BASH_PATH = "C:/tools/msys64/usr/bin/bash.exe"
```

mise は **明示的な** bash パスをそのまま尊重します。（タスクの）`shell` や `windows_default_inline_shell_args`
を `C:/msys64/usr/bin/bash.exe -c` のような絶対パスに設定した場合、mise はまさにそのバイナリを使います —
`MISE_BASH_PATH` による上書きと Git Bash / MSYS2 の自動検出は、シェルが単なる名前 `bash` である場合にのみ
適用されます。

同じ解決方法（自動検出、`MISE_BASH_PATH`、WSL ランチャーは決して使わない）は、[`[env] _.source`](/environments/#env-source)
スクリプトを読み込む（source する）ために mise が起動する bash にも適用されます。

シェルのパスにスペースが含まれる場合（例: `C:\Program Files\Git\bin\bash.exe`）、スペースが引数の区切りとして
扱われないように、プログラムをダブルクォートで囲んでください。Windows ではバックスラッシュはそのまま扱われるため
エスケープは不要です。スラッシュも使えます。

```toml
[tasks.build]
run = "echo hi"
shell = '"C:\Program Files\Git\bin\bash.exe" -c'
```

（macOS/Linux では、`shell` は代わりに POSIX のクォート規則に従います。）

#### Cygwin {#cygwin}

mise は Cygwin の bash も検出します（パスに `cygwin` / `cygwin64` / `cygwin32` というセグメントがあるかどうかで
判断します）。そして `PATH` を Git Bash の `/c/...` 形式ではなく Cygwin の `/cygdrive/c/...` 形式に変換するため、
`PATH` 上のバイナリが正しく解決されます。意図したものが使われるように、`MISE_BASH_PATH` を Cygwin の bash に
向けてください。

```powershell
$env:MISE_BASH_PATH = "C:\cygwin64\bin\bash.exe"
```

#### カスタムの `cygdrive` マウントルート（Cygwin **と** Git Bash / MSYS2） {#custom-cygdrive-mount-root-cygwin-and-git-bash-msys2}

`cygdrive` の自動マウントの仕組みは Cygwin と MSYS2 / Git Bash で共有されています — どちらも `/etc/fstab` で
マウントルートを変更できます（Cygwin のデフォルトは `/cygdrive`、Git Bash / MSYS2 のデフォルトは `/`、つまり
`/c/...` です）。mise は `/etc/fstab` を読み取らないため、変更した場合は `MISE_CYGDRIVE_PREFIX` をそれに合わせて
設定してください — これは **どちらの** シェルでも機能します。

```powershell
# e.g. for an fstab that mounts drives under /mnt
$env:MISE_CYGDRIVE_PREFIX = "/mnt"
```

プレフィックスは絶対パス（`/` で始まる）でなければなりません。`mnt` のような相対的な値は警告付きで拒否され、
代わりにシェルのデフォルトが使われます。`MISE_CYGDRIVE_PREFIX=/` は Git Bash の `/c/...` 形式に折りたたまれます。

## tmux や他のシェル初期化スクリプトから呼び出すと mise が動作しない {#mise-isn-t-working-when-calling-from-tmux-or-another-shell-initialization-script}

`mise activate` は、シェルのプロンプトが表示されるまで `PATH` を更新しません。そのため、プロンプトが表示される前に
mise が提供するツールにアクセスする必要がある場合は、[shim を PATH に追加する](/dev-tools/shims.html#how-to-add-mise-shims-to-path)
か、次のようにします。

```bash
export PATH="$HOME/.local/share/mise/shims:$PATH"
python --version # will work after adding shims to PATH
```

あるいは、`hook-env` を手動で呼び出すこともできます。

```bash
eval "$(mise activate bash)"
eval "$(mise hook-env)"
python --version # will work only after calling hook-env explicitly
```

詳しくは [`mise activate` は何をするのか？](/faq#what-does-mise-activate-do) を参照してください。

## mise は安全か？ {#is-mise-secure}

安全なサプライチェーンを提供することは非常に重要です。mise は asdf と比較して既により安全な体験を提供しています。
セキュリティ観点での評価や貢献を歓迎します。また、ユーザーには使用するプラグインに気を配ることを、プラグインの
作者にはそれを使うユーザーに気を配ることを求めます。

詳細は [SECURITY.md](https://github.com/jdx/mise/blob/main/SECURITY.md) を参照してください。

## ツールのインストール時の 403 Forbidden {#_403-forbidden-when-installing-a-tool}

次のようなエラーが表示されることがあります。

```text
HTTP status client error (403 Forbidden) for url
403 API rate limit exceeded for
```

これは、ツールが GitHub でホストされていて、API レート制限に達した場合に発生することがあります。これは GitHub
Actions のような CI 環境で mise を実行している場合に特に多く見られます。

デフォルトでは、mise はリリースメタデータとアーティファクトの証明チェックについて、ほとんどの公開 GitHub API
呼び出しを避けるために <https://mise-versions.jdx.dev> を使用します。それでもこのエラーが表示される場合、通常は
versions host にまだそのメタデータが無いこと、`MISE_USE_VERSIONS_HOST=0` が設定されていること、そのツールが
プライベートリポジトリを使っていること、またはそのツールが GitHub Enterprise やカスタム API 設定を使っている
ことのいずれかを意味します。

認証を設定してレート制限を回避する方法については、[GitHub トークン（原文）](https://mise.jdx.dev/dev-tools/github-tokens.html)
を参照してください。

## スクリプト内で `mise install` や `mise use` を実行した後にツールが見つからない {#tool-not-found-after-mise-install-or-mise-use-in-a-script}

スクリプト内で `mise use` や `mise install` を実行し、その直後にツールを使おうとすると、見つからないことがあります。
これは `mise activate` が次のプロンプトで `PATH` を更新するためで、スクリプトの中ではそのプロンプトが表示される
ことはありません。

**解決方法:**

```bash
# Option 1: Use mise exec (recommended)
mise install
mise exec -- my-tool --version

# Option 2: Re-evaluate the environment after install
mise install
eval "$(mise hook-env)"
my-tool --version

# Option 3: Use shims (they always resolve dynamically)
export PATH="$HOME/.local/share/mise/shims:$PATH"
mise install
my-tool --version
```

## `~/.bash_profile` の作成で Ubuntu/Debian の既存の `~/.profile` が動かなくなる {#creating-bash-profile-breaks-existing-profile-on-ubuntu-debian}

多くの Linux ディストリビューションでは、`~/.profile` が `~/.bashrc` を読み込んで（source して）環境をセットアップ
します。しかし `~/.bash_profile` が存在する場合、bash は `~/.profile` の **代わりに** それを読み込みます。

mise のために `~/.bash_profile` を作成するセットアップ手順に従った場合、既存の `~/.profile` の設定（`PATH` や
環境変数など）が読み込まれなくなることがあります。

**修正方法:** mise の有効化を代わりに `~/.bashrc` に追加するか、`~/.bash_profile` から `~/.profile` を source
してください。

```bash
# ~/.bash_profile
[[ -f ~/.profile ]] && source ~/.profile
```

## `redact` 環境変数を使うタスクは `raw` 出力を壊す {#tasks-with-redact-env-vars-break-raw-output}

設定内のいずれかの環境変数に `redact = true` を設定していると、`raw = true` のタスクは出力を何も生成していない
ように見えます。これは mise が削除（redaction）を行うために stdout/stderr を横取りするためで、raw モードと
衝突します。

**回避策**: 必要のない環境変数から `redact` を外す、あるいは削除が有効な間は raw タスクが見える出力を生成しない
ことを許容してください。

## CI / 非インタラクティブなシェルでの `mise activate` {#mise-activate-in-ci-non-interactive-shells}

`mise activate` はシェルのプロンプトにフックして `PATH` を更新するため、歴史的に非インタラクティブなシェルでは
動作しませんでした。`chpwd` サポートの追加により、現在ではより多くの状況で動作しますが、CI やスクリプトについては
依然として以下の方法を推奨します。

```bash
# Option 1: Use shims (recommended for CI)
export PATH="$HOME/.local/share/mise/shims:$PATH"
# In GitHub Actions, use: echo "$HOME/.local/share/mise/shims" >> $GITHUB_PATH

# Option 2: Use mise exec
mise exec -- npm test

# Option 3: Manually call hook-env after activate
eval "$(mise activate bash)"
eval "$(mise hook-env)"
```

関連情報として、Tips & Tricks の [CI/CD の節（原文）](https://mise.jdx.dev/tips-and-tricks.html#ci-cd) も参照してください。

## コマンドが見つからないときの自動インストールが実行されない {#auto-install-on-command-not-found-does-not-trigger}

存在しないコマンドを実行すると、mise はそれを提供するツールをインストールできます（[`not_found_auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#not_found_auto_install)
機能）。これは mise のレジストリ内の `bins` メタデータを使ってコマンドをツールに逆マッピングします。つまり、
設定はされているがまだインストールされていないツールも処理対象になります — 既に持っているツールの不足している
バージョンだけではありません。

何も起きない場合、通常は次のいずれかです。

- **ツールが raw なバックエンド指定で設定されている。** `"cargo:some-crate" = "1.0.0"` や `"ubi:owner/repo" = "1.0.0"` はレジストリのエントリではないため、bin メタデータを持たず、入力したコマンドとそのツールを結びつけるものが何もありません。
- **ツールが全く設定されていない。** このハンドラーは、現在のディレクトリの設定が既に要求しているツールのみをインストールします。宣言したことのないコマンドに対してツールを選ぶことはありません。
- **そのツールでは機能がオフになっている** — [`not_found_auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#not_found_auto_install) が `false` になっている、またはそのツールが [`auto_install_disable_tools`（原文）](https://mise.jdx.dev/configuration/settings.html#auto_install_disable_tools) に列挙されています。

**回避策:**

- レジストリのエントリが存在する場合は、raw なバックエンド指定（`ubi:BurntSushi/ripgrep`）ではなく、レジストリ名（`ripgrep`）でツールを参照してください。そうすればハンドラーがコマンドをそれにマッピングできます。
- そうでなければ、オンデマンドではなく明示的にインストールしてください。`mise install`、または [`mise x|exec`（原文）](https://mise.jdx.dev/cli/exec.html) でインストールしてから1ステップで何かを実行できます。どちらも設定済みのツールセット全体を実体化するため、バックエンドは問題になりません。[`mise r|run`（原文）](https://mise.jdx.dev/cli/run.html) も同じことを行いますが、タスクの実行の一部としてのみです。
- 手動で1度インストールすれば、それ以降はハンドラーが機能するようになります。バージョンが存在すれば、mise はインストールされた実行可能ファイルからマッピングを見つけることもできます。
