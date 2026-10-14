---
title: shim
description: "Choose between shell activation, shims and mise exec, and run the right tool version from editors and scripts."
upstreamPath: docs/dev-tools/shims.md
upstreamUrl: https://mise.jdx.dev/dev-tools/shims.html
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# shim {#shims}

shim は、`node` のようにツールのコマンドと同じ名前を持つ小さな実行可能ファイルです。プログラムが shim を実行すると、shim は現在のディレクトリでどのバージョンが選択されているかを mise に問い合わせ、そのプロジェクトの環境を読み込んでから、実際の実行可能ファイルを実行します。有効化されたシェルを経由しないエディターなどのプログラムのために、shim ディレクトリを `PATH` に追加してください。

## mise のツールの使い方を選ぶ {#overview}

| 方法 | 環境が適用される範囲 | 更新のタイミング | 用途 |
| --- | --- | --- | --- |
| [`mise activate`（原文）](https://mise.jdx.dev/cli/activate.html) | 現在のシェル | 各プロンプトの表示時、およびほとんどのシェルでは `cd` 時 | インタラクティブなターミナル |
| [`mise activate --shims`](#how-to-add-mise-shims-to-path) | shim ディレクトリをシェルの `PATH` に追加する | shim 経由のコマンドが実行されるたび | エディター、IDE、GUI アプリ、ログインプロファイル |
| shim | 起動したプログラムとその子プロセス | 実行されるたび | `PATH` から見つかるコマンド |
| [`mise exec`（原文）](https://mise.jdx.dev/cli/exec.html) | 1 つのコマンドとその子プロセス | コマンドごとに 1 回 | スクリプトと CI |
| [`mise run`（原文）](https://mise.jdx.dev/cli/run.html) | タスクとその依存関係 | タスクごとに 1 回 | 名前付きのプロジェクトコマンド |
| [`mise env`（原文）](https://mise.jdx.dev/cli/env.html) | 別のプログラムが適用するための代入文を出力する | 実行したとき | 他の環境管理ツール |

入力に使うシェルでは `mise activate` を使うと、`node` や `[env]` の変数がプロジェクト間の移動に追従します。IDE に Python の実行可能ファイルを設定する場合のように、プログラムがツールへの固定のパスを必要とする場面では shim を使います。shim で使えなくなるものは [shim と PATH 有効化の比較](#shims-vs-path) にまとめています。両方を併用することもできます。[shim を PATH に追加する](#how-to-add-mise-shims-to-path) で示すように、ログインプロファイルに `mise activate --shims` を、インタラクティブシェルの起動ファイルに `mise activate` を書きます。有効化の設定方法は [シェルのセットアップ（原文）](https://mise.jdx.dev/shell-setup.html) を参照してください。

### 有効化も shim も使わない方法 {#neither-shims-nor-path}

[`mise exec`（原文）](https://mise.jdx.dev/cli/exec.html)、[`mise run`（原文）](https://mise.jdx.dev/cli/run.html)、[`mise en`（原文）](https://mise.jdx.dev/cli/en.html) は、起動ファイルを一切変更せずにツールと環境変数を読み込みます。

```sh
mise exec -- node --version
mise run build # runs the task named build
```

これは CI やスクリプト、シェルの起動ファイルを変更したくないプロジェクトで役立ちます。`PATH` 上に `mise` があれば動作し、有効化や shim ディレクトリは不要です。

## shim の仕組み {#mise-activate-shims}

mise は 2 つの shim ディレクトリを持ちます。

- [`shims_dir`（原文）](https://mise.jdx.dev/configuration/settings.html#shims_dir) で設定される、ユーザーの shim ディレクトリ `~/.local/share/mise/shims`（Windows では `%LOCALAPPDATA%\mise\shims`）
- [システムインストール（原文）](https://mise.jdx.dev/dev-tools/system-installs.html) 用の、システムの shim ディレクトリ `/usr/local/share/mise/shims`

ツールをインストールすると、mise はそのツールが提供するすべての実行可能ファイルについて、shim ディレクトリに shim を追加します。Unix では各 shim は `mise` バイナリへのシンボリックリンクです。Windows ではデフォルトで小さな実行可能ファイルになります（[`windows_shim_mode`（原文）](https://mise.jdx.dev/configuration/settings.html#windows_shim_mode) を参照）。

```sh
mise use node@24 npm:prettier@3
ls -l ~/.local/share/mise/shims/node
# ~/.local/share/mise/shims/node -> ~/.local/bin/mise
~/.local/share/mise/shims/prettier --version
```

1 つの shim は、そのツールのインストール済みのすべてのバージョンを扱います。shim は実行されるたびに、現在のディレクトリの設定を読み、バージョンを選び、そのプロジェクトの `[env]` 変数を設定して、実際の実行可能ファイルを実行します。

shim が設定されたバージョンを見つけられない場合、[`not_found_auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#not_found_auto_install) が有効であればそのバージョンをインストールします。無効であれば、`PATH` 上にある同名の次の実行可能ファイルを実行します。このフォールバックは mise の外でも使いたいツールには便利ですが、Debian や Ubuntu の `python3` のように OS も提供しているコマンドの場合、shim が無関係なシステムのバイナリを黙って実行してしまうことがあります。解決できない shim を失敗させるには、[`not_found_system_fallback`（原文）](https://mise.jdx.dev/configuration/settings.html#not_found_system_fallback) と `not_found_auto_install` を `false` に設定してください。

## shim を PATH に追加する {#how-to-add-mise-shims-to-path}

`mise activate --shims` は、shim ディレクトリと [コマンドラッパー](#command-wrappers) のディレクトリを `PATH` に追加する行を出力します。既存の設定は残したまま、対象のプログラムが読み込む起動ファイルに追加してください。

::: code-group

```sh [Bash: ~/.bash_profile]
# Use ~/.bash_login or ~/.profile instead if that is the file you already have.
eval "$(mise activate bash --shims)"
```

```sh [Bash: ~/.bashrc]
eval "$(mise activate bash)"
```

```sh [Zsh: ~/.zprofile]
eval "$(mise activate zsh --shims)"
```

```sh [Zsh: ~/.zshrc]
eval "$(mise activate zsh)"
```

```fish [Fish: ~/.config/fish/config.fish]
if status is-interactive
    mise activate fish | source
else
    mise activate fish --shims | source
end
```

:::

ログインシェルはプロファイルファイルを読み込み、インタラクティブシェルは `~/.bashrc` と `~/.zshrc` を読み込みます。ログインシェルの Bash は `~/.bash_profile`、`~/.bash_login`、`~/.profile` のうち最初に見つかった 1 つのファイルだけを読み込み、`~/.bashrc` はそのファイルが source している場合にのみ読み込みます。Ubuntu や Debian では通常 `~/.profile` が `~/.bashrc` を source して `PATH` を設定しているため、`~/.bash_profile` を新たに作ると `~/.profile` が読み込まれなくなります。既存のファイルに行を追加するか、新しい `~/.bash_profile` から `~/.profile` を source してください。

```sh [~/.bash_profile]
[[ -f ~/.profile ]] && source ~/.profile
eval "$(mise activate bash --shims)"
```

プロファイルの実行時に `mise` が `PATH` 上にない場合は、`eval "$($HOME/.local/bin/mise activate zsh --shims)"` のようにフルパスで呼び出すか、ユーザーの shim ディレクトリを直接追加します。ただし、次の行ではシステムの shim ディレクトリとコマンドラッパーが含まれません。

```sh
export PATH="$HOME/.local/share/mise/shims:$PATH"
```

エディターなどの GUI プログラムはこれらのファイルを起動時にしか読み込まず、デスクトップ環境によってはログイン時にしかログインプロファイルを読み込みません。変更後はエディターを再起動するか、一度ログアウトしてから再度ログインしてください。エディターごとの設定は [IDE 連携](/ide-integration.html) を参照してください。スケジューラーやサービスマネージャー、プロファイルを読み込まない IDE から起動されるプログラムには、個別の `PATH` 設定が必要です。または `mise exec` を呼び出すこともできます。

Windows では、エディターなどの GUI プログラムは `$PROFILE` を読み込みません。[Windows のシェル（原文）](https://mise.jdx.dev/shell-setup.html#windows) に示すように `%LOCALAPPDATA%\mise\shims` をユーザーの `Path` に追加し、PowerShell 自体のために `$PROFILE` には `mise activate pwsh` を残しておいてください。

## shim と PATH 有効化の比較 {#shims-vs-path}

shim が扱うのはツールそのものです。shim はシェルに [`[env]` 変数](#env-vars-and-shims) を設定せず、[フック](#hooks-and-shims) はインストール時のものしか実行せず、[`which`](#which) が shim を表示するようになります。入力に使うシェルには [PATH 有効化](#path-activation) を、そのシェルから起動されないプログラムには shim を使ってください。

### PATH 有効化 {#path-activation}

[`mise activate`（原文）](https://mise.jdx.dev/cli/activate.html) を使うと、mise は選択された各ツールの `bin` ディレクトリを `PATH` の先頭に追加します。

```sh
echo "$PATH"
# ~/.local/share/mise/installs/python/3.14.8/bin:/usr/local/bin:/usr/bin:/bin
```

bash、zsh、fish、elvish、PowerShell では、mise は有効化スクリプトの実行時に `PATH` と `[env]` 変数を設定します。Nushell と xonsh では、最初のプロンプトかディレクトリの変更まで待ちます。その後、mise は各プロンプトの表示時に、また [ディレクトリ変更フック](#hook-on-cd) を持つシェルでは `cd` のたびに環境を更新します。子プロセスはその結果を引き継ぎます。

[遅延ツール](#lazy-tools) や `not_found_auto_install` のために shim が必要な間は、有効化は shim ディレクトリを実際のツールのディレクトリの後ろに置いたまま `PATH` に残します。取り除く方法は [mise activate から shim を除外する](#activate-shims) を参照してください。

### ディレクトリの変更 {#hook-on-cd}

ほとんどのシェルでは、mise はプロンプトの描画時だけでなくディレクトリが変わったときにも環境を更新します。そのため、`cd ~/proj && node -v` ではプロジェクトのバージョンが使われます。

| シェル | `cd` での更新 | 仕組み |
| --- | --- | --- |
| bash | はい | `cd`、`pushd`、`popd` のラップ、および `PROMPT_COMMAND` |
| zsh | はい | `chpwd` フック |
| fish | はい | `--on-variable PWD` ハンドラー |
| elvish | はい | `after-chdir` フック |
| xonsh | はい | `on_chdir` イベント |
| PowerShell 7+ | はい | `LocationChangedAction` |
| PowerShell 5.x | 次のプロンプト時 | プロンプトフックのみ |
| Nushell | 次のプロンプト時 | `env_change.PWD` フック（Nushell はプロンプト時に実行する） |

fish では、`mise_fish_mode` を `eval_after_arrow` に設定すると次のコマンドの開始時まで更新を遅らせ、`disable_arrow` に設定するとプロンプト時にのみ更新します。

::: details 複数のコマンドを1行で実行する

PowerShell 5.x と Nushell では、1 行で書いたコマンドは、その行を開始したディレクトリのツールを使い続けます。

```sh
cd ~
cd ~/src/proj1 && node -v && cd ~/src/proj2 && node -v
```

どちらの `node -v` も `~` 用に選択されたツールを使います。shim は常に現在のディレクトリから解決するため、どのシェルでもこの行を正しく扱えます。

:::

### 環境変数 {#env-vars-and-shims}

シェルで `[env]` 変数を読み取れるのは `mise activate` の下でだけです。

```sh
mise set NODE_ENV=production
echo "$NODE_ENV"
# production
```

次はどちらでも動作します。`node` が shim 経由で実行されるためです。

```sh
mise set NODE_ENV=production
node -p process.env.NODE_ENV
# production
```

`mise exec` と `mise run` は、コマンドが mise のツールを必要としない場合でも環境を読み込みます。[タスク](/tasks/) は常に環境を読み込んだ状態で実行されます。

```sh
mise exec -- bash -c 'echo $NODE_ENV'
# production
```

### フック {#hooks-and-shims}

`cd`、`enter`、`leave` の [フック（原文）](https://mise.jdx.dev/hooks.html) と [`watch_files`（原文）](https://mise.jdx.dev/hooks.html#watch-files-hook) は `mise activate` でのみ実行されます。`preinstall` と `postinstall` はシェルからではなくインストール中に実行されるため、shim でも実行されます。

### `which` {#which}

shim を使う場合、`which node` は shim のパスを表示し、`mise which node` は実際の実行可能ファイルを表示します。PATH 有効化の場合、`which node` はインストール先のパスを表示します。

```sh
which node
# ~/.local/share/mise/installs/node/24/bin/node
```

このパスは、解決されたバージョンではなく、`node/24` のように要求した名前のリンクを経由することがあります。実験的なレイアウトでのパスについては [インストールレイアウト（原文）](https://mise.jdx.dev/dev-tools/install-layout.html) を参照してください。

### ツールがインストールされているかの確認 {#command-v}

shim が `PATH` 上にあると、`node` がインストールされていない場合や現在のディレクトリで有効でない場合でも、shim が存在するため `command -v node` は成功します。そのため、`command -v` でインストール済みかを確認するスクリプトは誤検知します。`which` と `whence` も同じ動作をします。

`command -v` はそのまま使い、それが shim を見つけた場合にだけ mise に問い合わせます。shim は、[`shims_dir`（原文）](https://mise.jdx.dev/configuration/settings.html#shims_dir) や `system_shims_dir` がどこに置いていても、`mise` バイナリへのシンボリックリンクです。`command mise` は、`mise activate` が定義する `mise` シェル関数を迂回します。`mise which` は、現在のディレクトリでツールが解決されない限り 0 以外の終了コードで終了します。

```sh [have.sh]
have() {
    p=$(command -v "$1") || return 1
    if [ -L "$p" ] && [ "$(basename "$(readlink "$p")")" = mise ]; then
        command mise which "$1" >/dev/null 2>&1
    else
        return 0
    fi
}

have prettier || echo "prettier is not installed"
```

mise を使っていないユーザーは `mise which` の分岐に入らないため、一部のメンバーだけが mise を使っているチームでも同じスクリプトが動作します。この例はシンボリックリンクの shim を前提としているため、Windows には対応しません。[コマンドラッパー](#command-wrappers) も `mise` へのシンボリックリンクですが、`mise which` はその名前を解決しないため、`have` はラップされたコマンドを、実行すれば動作するにもかかわらず存在しないと報告します。

解決できない shim は、`PATH` 上でさらに後ろにある同名の別の実行可能ファイルを実行することがあるため、`have` は shim が実際には実行できるツールを存在しないと報告することがあります。[遅延ツール](#lazy-tools) が提供できる場合を除き、こうしたケースでも shim を失敗させるには、`not_found_system_fallback` と `not_found_auto_install` を `false` に設定してください。[shim の仕組み](#mise-activate-shims) を参照してください。

### パフォーマンス {#performance}

PATH 有効化は、プロンプトの表示時とディレクトリの変更時に処理を行います。shim はコマンドが実行されるたびに環境を解決するため、ループの中で shim を呼び出すと、呼び出しのたびにそのコストがかかります。例えば、次のスクリプトは環境を 500 回解決します。

```sh [benchmark.sh]
for i in {1..500}; do
    node script.js
done
```

`mise exec -- bash benchmark.sh` として実行すると、環境の解決は 1 回で済みます。その後、子プロセスは shim ディレクトリより前にある実際のツールのディレクトリを見つけます。shim から起動されたプログラムも、同じように解決済みの環境を子プロセスに引き継ぎます。有効化のオーバーヘッドを診断するには [シェルプロンプトが遅い場合](/troubleshooting.html#slow-shell-prompts) を参照してください。

### スクリプトとシェルの起動ファイル {#using-mise-in-rc-files}

スクリプトはプロンプトを表示しません。有効化の後、スクリプトから見えるのは、有効化スクリプトが適用した環境と、[`cd` フック](#hook-on-cd) を持つシェルでのディレクトリ変更による更新です。実行中に行われた設定の変更は反映されません。環境を更新するには `eval "$(mise hook-env -s bash)"` を実行するか、`mise exec` でコマンドを実行してください。

`~/.zshrc` のようなシェルの起動ファイルもスクリプトです。bash、zsh、fish では、有効化した次の行からツールを利用できます。

::: code-group

```sh [activate]
eval "$(mise activate zsh)"
node some_script.js
```

```sh [shims]
eval "$(mise activate zsh --shims)" # should be first
eval "$(mise activate zsh)"
node some_script.js
```

:::

最初のプロンプトで環境を適用する Nushell と xonsh では、先に shim を `PATH` に追加するか、`mise exec` を使ってください。

## mise reshim による shim の再構築 {#mise-reshim}

mise は、ツールのインストール・アップグレード・削除の際に shim を追加・削除します。グローバルなパッケージのインストール後など、別のプログラムが既存のインストールに実行可能ファイルを追加した場合は [`mise reshim`（原文）](https://mise.jdx.dev/cli/reshim.html) を実行してください。Node.js のコアツールは、[`node.npm_shim`（原文）](https://mise.jdx.dev/configuration/settings.html#node.npm_shim) ラッパーを通じて `npm install -g` の際にこれを行います。他のパッケージマネージャーにはそのようなフックはありません。

`mise reshim` は shim の追加と削除だけを行います。誤ったバージョンや壊れたインストールを直すものではありません。期待するコマンドが shim ディレクトリにない場合に実行してください。`mise reshim --system` はシステムの shim ディレクトリを再構築します。

ユーザーの shim ディレクトリには `~/.local/bin` のような共有ディレクトリも指定できます。`mise reshim` は、mise の shim と認識したエントリだけを置き換え・削除します。ただし、有効化と hook-env はディレクトリ全体を shim ディレクトリとして扱うため、有効化と併用する場合は専用の [`shims_dir`（原文）](https://mise.jdx.dev/configuration/settings.html#shims_dir) を使ってください。

## shim からコマンドを除外する {#excluding-command-names}

コマンドの中には OS も提供しているものがあり、マシン上の他のソフトウェアはシステム側のものが使われることを前提にしています。[`shims.exclude`（原文）](https://mise.jdx.dev/configuration/settings.html#shims.exclude) を使うと、そうした名前を shim ディレクトリから除外できます。mise はそのツールのインストールと管理を続け、shim の作成だけを省きます。次のコマンドは、この設定をグローバル設定に追加します。

```sh
mise settings shims.exclude=python,python3,pip,pip3
```

例えば Arch Linux では、`/usr/bin/python` はディストリビューションのインタープリターで、そのモジュールは対応する `site-packages` ディレクトリにあります。除外しないと、`python` を固定しているプロジェクトに入ったときに `#!/usr/bin/env python` のスクリプトが使うインタープリターが変わり、ビルド中に `python` を呼び出す `PKGBUILD` も固定されたバージョンを拾ってしまいます。

次回の `mise reshim` で除外した名前は削除され、遅延ツールのブートストラップ shim やプラグインが提供する shim でもスキップされます。バージョン付きの shim は残るため、`python3.12` は引き続き設定で選択されたバージョンに解決されます。shim がなければ mise はそのコマンドの経路から外れ、実行のたびに設定を読み込むこともなくなります。

::: warning
`python3` を除外すると、`python3 -m venv` はシステムのインタープリターから黙って virtualenv を作成します。mise 管理のバージョンを使うには、`python3.12 -m venv` のようにバージョン付きのコマンドを使ってください。この設定が影響するのは shim だけです。`--shims` なしの `mise activate` では、ツールの `bin` ディレクトリ全体が `PATH` に加わるため、除外した名前もそこから見つかります。
:::

## mise activate から shim を除外する {#activate-shims}

PATH 有効化は実際のツールのディレクトリを先頭に置きます。ツールセットに [遅延ツール](#lazy-tools) が含まれる場合や `not_found_auto_install` が有効な場合は、ユーザーとシステムの shim ディレクトリもその後ろに置いたまま `PATH` に残すため、存在しないツールのコマンドを実行してもインストールできます。有効化から shim ディレクトリを完全に取り除くには、`mise settings activate_shims=false` を実行してシェルを再起動してください。何が動作しなくなるかは [`activate_shims`（原文）](https://mise.jdx.dev/configuration/settings.html#activate_shims) を参照してください。[コマンドラッパー](#command-wrappers) は専用のディレクトリを使うため引き続き動作し、明示的に `mise activate --shims` を実行した場合は shim が追加されます。

## 遅延ツール {#lazy-tools}

ツールに `lazy = true` を設定すると、`mise install` の実行時ではなく、そのツールのコマンドが初めて実行されたときにインストールされます。

```toml [mise.toml]
[tools]
node = { version = "24", lazy = true }
```

レジストリのツールの場合、mise はレジストリのコマンド一覧からブートストラップ shim を作成します。バックエンドを明示したツールやレジストリにないツールは、`lazy_bins` でコマンドを指定します。

```toml [mise.toml]
[tools]
"github:example/acme" = { version = "1.2.3", lazy = true, lazy_bins = ["acme", "acmectl"] }
```

遅延ツールのコマンドを実行すると、そのツールと、それが [依存](/dev-tools/#tool-dependencies) する設定済みのツールのうち不足しているものがインストールされ、その後コマンドが実行されます。それ以外は何もインストールされません。これは `not_found_auto_install` が無効でも動作します。遅延宣言が、`lazy` なしで同じツールを選択している優先度の高い設定を上書きすることはありません。

引数なしの `mise install` は遅延ツールをスキップします。`mise install --include-lazy` はそれらをすべてその場でインストールし、`mise install node` は 1 つだけをインストールします。インストール後は `mise activate` が実際のツールを shim より前に置くため、以降の呼び出しに追加のコストはかかりません。`mise activate --shims` では、引き続きすべての呼び出しが mise を経由します。

タスク、`mise exec`、`mise env` は、ツールセットに遅延ツールが含まれる場合、ブートストラップ shim をツールのディレクトリの後ろに追加します。そのため、タスクは遅延ツールのコマンドを初めて実行したときにそのツールをインストールします。`mise run` は遅延ツールを事前にはインストールしません。`mise use` は遅延宣言を変更したときに shim を再構築します。手作業で編集した場合は `mise reshim` を実行してください。

## コマンドラッパー {#command-wrappers}

コマンドラッパーは、コマンドの名前はそのままで別のプログラムを実行します。例えば、`terraform` で OpenTofu を実行するには次のようにします。

```toml [mise.toml]
[tools]
opentofu = "1"

[wrappers]
terraform = "tofu"
```

ラッパーを追加・削除した後は `mise reshim` を実行してください。ラッパーは `mise activate` と `mise activate --shims` のどちらでも動作し、同名の実行可能ファイルより優先されます。ラッパーのコマンドを提供する設定済みのツールが存在しない場合、ラッパーはそのコマンド自身の shim と同じように、まずそのツールをインストールします。これは、ツールが遅延ツールでない限り `not_found_auto_install` に従います。

テーブル形式では、ユーザー自身の引数の前に引数を挿入でき、環境変数も設定できます。

```toml [mise.toml]
[tools]
uv = "latest"

[wrappers.python]
command = "uv"
args = ["run", "python"]
```

Rust を mise ではなく rustup やシステムから導入している場合、次の設定ですべての `cargo` の呼び出しが [Mr Boxington](https://mr-boxington.jdx.dev/) を経由するようになります。

```toml [mise.toml]
[tools]
mr-boxington = "latest"

[wrappers.cargo]
command = "mbx"
env = { MBX_CARGO_SHIM_MODE = "1" }
```

ラッパーがコマンドを実行するとき、mise は shim とラッパーのディレクトリを `PATH` から取り除くため、`mbx` は本物の Cargo を見つけます。設定されていれば mise 管理の Rust、そうでなければ rustup またはシステムのインストールです。mise 管理の Rust の場合は、[Rust ガイド（原文）](https://mise.jdx.dev/lang/rust.html#share-cargo-builds-with-mr-boxington) が `mr_boxington` ツールオプションと `mr-boxington` ツールを使ってこれを設定します。
