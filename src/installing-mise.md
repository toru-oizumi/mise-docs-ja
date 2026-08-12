---
title: mise のインストール
upstreamPath: docs/installing-mise.md
upstreamUrl: https://mise.jdx.dev/installing-mise.html
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

# mise のインストール {#installing-mise}

`mise` を初めて使う場合は、まず [はじめに](/getting-started) ガイドに従ってください。

## インストール方法 {#installation-methods}

このページでは、システムに `mise` をインストールするさまざまな方法を紹介します。

| プラットフォーム  | 推奨           | 代替               |
| ----------------- | -------------- | ------------------ |
| macOS             | mise.run       | Homebrew           |
| Linux             | mise.run       | システムパッケージ |
| Windows           | Scoop          | winget             |
| 任意（Rust 利用者） | cargo binstall | cargo install     |
| CI/Docker         | mise.run       | GitHub Releases    |

`mise.run` によってインストールされる公式のシングルバイナリリリースは、macOS と Linux での推奨方法です。これらのバイナリは mise
の最適化されたリリースプロファイルでビルドされており、`mise self-update` で即座に更新できます。Homebrew を含むパッケージマネージャー版のビルドは最適化の度合いが低く、mise
のリリース後すぐには利用できない場合があります。

::: tip どのインストール方法が自動更新される？
パッケージマネージャー（apt、dnf、brew、pacman など）は、システムパッケージを更新すると mise も更新します。他の方法でインストールした場合は、`mise self-update` で更新できます。
:::

::: tip mise を最新の状態に保つ
mise は aqua、GitHub のリリース、言語パッケージレジストリ、システムパッケージマネージャーなど、多くの外部レジストリやバックエンドに接続します。これらのサービスは時間とともに変化するため、mise は CLI
を最近のバージョンに保つことで最もよく機能します。

プロジェクトや組織は、新しい mise の機能が必要な場合、全ユーザーを特定の mise 実行ファイルに固定するのではなく、一般的に [`min_version`](/configuration.html#minimum-mise-version)
を設定するべきです。特定の mise バージョンを固定したりブートストラップしたりする方法はありますが、ユーザーを1つの mise バージョンに固定することは一般的には推奨されません。mise を古いバージョンに固定することは、`apt update`
や `brew update` がパッケージメタデータを更新するのを妨げるのと同じです。非推奨の通知が見えなくなり、aqua-registry のような上流の連携が陳腐化する可能性があります。破壊的変更は長い非推奨化プロセスを経ない限り避けられるため、最新の状態を保つことは通常は低リスクであるはずです。
:::

### <https://mise.run> {#mise-run}

`mise` が `PATH` 上にある必要はない点に注意してください。シェルの rc
ファイルで activate スクリプトを実行すれば、mise は自動的に自身を `PATH` に追加します。

```sh
curl https://mise.run | sh
```

オプション付きの場合

```sh
curl https://mise.run | MISE_INSTALL_PATH=/usr/local/bin/mise sh
```

#### シェル別のインストール + 有効化 {#shell-specific-installation-activation}

より簡単なセットアップのために、mise をインストールしてシェルの設定ファイルに有効化を自動的に設定するシェル別のエンドポイントを使用できます。

::: code-group

```sh [zsh]
curl https://mise.run/zsh | sh
# Installs mise and adds activation to ~/.zshrc
```

```sh [bash]
curl https://mise.run/bash | sh
# Installs mise and adds activation to ~/.bashrc
```

```sh [fish]
curl https://mise.run/fish | sh
# Installs mise and adds activation to ~/.config/fish/config.fish
```

:::

これらのシェル別インストーラーは、以下を行います。

- メインのインストーラーと同じロジックで mise をインストールします
- シェルの設定ファイルを自動的に検出します
- 有効化の行がまだ無い場合は追加します
- すでに設定されている場合は有効化の追加をスキップします（複数回実行しても安全です）

オプション:

- `MISE_DEBUG=1` – デバッグログを有効にします
- `MISE_QUIET=1` – エラー以外の出力を無効にします
- `MISE_INSTALL_PATH=/some/path` – バイナリのパスを変更します（デフォルト: `~/.local/bin/mise`）
- `MISE_VERSION=v2025.12.0` – 特定のバージョンをインストールします
- `MISE_INSTALL_SKIP_IF_EXISTS=1` – インストール先のパスにある mise バイナリがすでに要求されたバージョンと一致している場合、ダウンロードとインストールをスキップします

インストールスクリプトが改ざんされていないことを確認したい場合は、

```sh
gpg --keyserver hkps://keys.openpgp.org --recv-keys 24853EC9F655CE80B48E6C3A8B81C9D17413A06D
curl https://mise.jdx.dev/install.sh.sig | gpg --decrypt > install.sh
# ensure the above is signed with the mise release key
sh ./install.sh
```

::: tip
`MISE_VERSION` でバージョンを変更しない限り、インストールスクリプトはダウンロードされた時点の最新バージョンに固定され、ファイル内にチェックサムが含まれます。このため、このファイルをダウンロードしてプロジェクトに配置しておくことは、そのスクリプトでインストールする誰もが完全に同じ
mise バイナリを取得できるようにする優れた方法です。
:::

サポートされる os/arch:

- `macos-x64`
- `macos-arm64`
- `linux-x64`
- `linux-x64-musl`
- `linux-arm64`
- `linux-arm64-musl`
- `linux-armv6`
- `linux-armv6-musl`
- `linux-armv7`
- `linux-armv7-musl`

他の環境が必要な場合は、`cargo install mise` でコンパイルしてください（後述）。

### apk {#apk}

Alpine Linux の場合:

```sh
apk add mise
```

_mise は [コミュニティリポジトリ](https://gitlab.alpinelinux.org/alpine/aports/-/blob/master/community/mise/APKBUILD) にあります。_

### apt {#apt}

Ubuntu 26.04 以降では、mise は PPA から利用できます。

```sh
sudo add-apt-repository -y ppa:jdxcode/mise
sudo apt update
sudo apt install -y mise
```

Debian 11 以降および Ubuntu 22.04 以降では、extrepo を使って mise のリポジトリを有効化できます。

```sh
sudo apt install -y extrepo
sudo extrepo enable mise
sudo apt update
sudo apt install -y mise
```

### pacman {#pacman}

Arch Linux の場合:

```sh
sudo pacman -S mise
```

[Arch パッケージ](https://archlinux.org/packages/extra/x86_64/mise/)

### Cargo {#cargo}

Cargo でソースからビルドします。

```sh
cargo install --locked mise
```

[cargo-binstall](https://github.com/cargo-bins/cargo-binstall) を使えばより速くできます。

```sh
cargo install cargo-binstall
cargo binstall mise
```

main の最新コミットからビルドします。

```sh
cargo install mise --git https://github.com/jdx/mise --branch main
```

### dnf {#dnf}

#### Fedora 41 以降、CentOS Stream 9 以降、RHEL 10 以降 {#fedora-41-centos-stream-9-rhel-10}

```sh
dnf copr enable jdxcode/mise
dnf install mise
```

#### RHEL 9 / AlmaLinux 9 / Rocky 9 {#rhel-9-almalinux-9-rocky-9}

RHEL 9 の AppStream は現在 Rust 1.88 に固定されており、これは mise がサポートする最小 Rust バージョンより古いバージョンです。代わりに
CentOS Stream 9 のビルドを使用してください。生成されるバイナリは RHEL 9 派生ディストリビューションでも動作します。

```sh
dnf copr enable jdxcode/mise centos-stream+epel-next-9
dnf install mise
```

[COPR のパッケージページ](https://copr.fedorainfracloud.org/coprs/jdxcode/mise/)

### Snap (Linux) {#snap-linux}

```sh
sudo snap install mise --classic
```

[snapcraft.io のページ](https://snapcraft.io/mise)

### Docker {#docker}

Docker で mise を使うためのヒントは [Docker クックブック（原文）](https://mise.jdx.dev/mise-cookbook/docker.html) を参照してください。

::: details Dockerfile の例

```dockerfile
FROM debian:13-slim

RUN apt-get update \
    && apt-get -y --no-install-recommends install sudo curl git ca-certificates build-essential \
    && rm -rf /var/lib/apt/lists/*

SHELL ["/bin/bash", "-o", "pipefail", "-c"]
ENV MISE_DATA_DIR="/mise"
ENV MISE_CONFIG_DIR="/mise"
ENV MISE_CACHE_DIR="/mise/cache"
ENV MISE_INSTALL_PATH="/usr/local/bin/mise"
ENV PATH="/mise/shims:$PATH"
RUN curl https://mise.run | sh
RUN mise trust -a && mise install
```

:::

### Homebrew {#homebrew}

::: warning
Homebrew のフォーミュラは便利ですが、推奨されるインストール方法ではありません。Homebrew は、公式のより最適化されたリリースバイナリとは別に mise をビルドします。最高のパフォーマンスと新しいリリースへの最速アクセスのためには、代わりに
[`mise.run`](#mise-run) インストーラーを使用してください。
:::

```sh
brew install mise
```

[Homebrew フォーミュラ](https://formulae.brew.sh/formula/mise)

### npm {#npm}

mise はプリコンパイルされたバイナリとして npm で利用できます。これは Node.js パッケージではなく、単に npm 経由で配布されているだけです。これは
`package.json` や `npx` を使って mise をセットアップしたい JS プロジェクトに便利です。

```sh
npm install -g mise
```

完全にインストールせずに単発のコマンドで試してみたい場合は、npx を使用します。

```sh
npx mise exec python@3.11 -- python some_script.py
```

[npm パッケージ](https://www.npmjs.com/package/mise)

旧来の [`@jdxcode/mise`](https://www.npmjs.com/package/@jdxcode/mise) パッケージも依然として公開されています。

### GitHub Releases {#github-releases}

[GitHub](https://github.com/jdx/mise/releases) から最新のリリースをダウンロードします。

```sh
curl -L https://github.com/jdx/mise/releases/download/v2025.12.0/mise-v2025.12.0-linux-x64 > /usr/local/bin/mise
chmod +x /usr/local/bin/mise
```

### MacPorts {#macports}

```sh
sudo port install mise
```

[MacPorts のポート](https://ports.macports.org/port/mise/)

### nix {#nix}

Nix パッケージマネージャーの場合、リリース 24.05 以降で:

```sh
nix-env -iA mise
```

`mise-flake.packages.${system}.mise` を使ってパッケージを直接インポートすることもできます。これはすべてのデフォルトの
Nix システムをサポートしています。

::: tip NixOS はデフォルトでソースからコンパイルする
プリコンパイルされたバイナリを使うには、[nix-ld](https://github.com/Mic92/nix-ld) を有効にし、[`all_compile`（原文）](https://mise.jdx.dev/configuration/settings.html#all_compile) を無効にしてください。
:::

### yum (RHEL 8, CentOS Stream 8, Amazon Linux 2) {#yum-rhel-8-centos-stream-8-amazon-linux-2}

```sh
yum install -y yum-utils
yum-config-manager --add-repo https://mise.jdx.dev/rpm/mise.repo
yum install -y mise
```

### zypper {#zypper}

```sh
sudo wget https://mise.jdx.dev/rpm/mise.repo -O /etc/zypp/repos.d/mise.repo
sudo zypper refresh
sudo zypper install mise
```

### Windows - Scoop {#windows-scoop}

これは Windows に mise をインストールする推奨方法です。shim を自動的に PATH に追加します。

```sh
scoop install mise
```

[Scoop マニフェスト](https://github.com/ScoopInstaller/Main/blob/master/bucket/mise.json)

### Windows - winget {#windows-winget}

```sh
winget install jdx.mise
```

[winget マニフェスト](https://github.com/microsoft/winget-pkgs/tree/master/manifests/j/jdx/mise)

### Windows - Chocolatey {#windows-chocolatey}

::: info
chocolatey 版は現在古くなっています。
:::

```sh
choco install mise
```

### Windows - manual {#windows-manual}

[GitHub](https://github.com/jdx/mise/releases) から最新のリリースをダウンロードし、バイナリを PATH に追加します。

シェルが `mise activate` をサポートしていない場合は、shim ディレクトリ（デフォルト: `%LOCALAPPDATA%\mise\shims`）を含むように PATH
を編集しておくとよいでしょう。

## シェル {#shells}

### Bash {#bash}

```sh
echo 'eval "$(mise activate bash)"' >> ~/.bashrc
```

### Zsh {#zsh}

```sh
echo 'eval "$(mise activate zsh)"' >> "${ZDOTDIR-$HOME}/.zshrc"
```

### Fish {#fish}

```sh
echo 'mise activate fish | source' >> ~/.config/fish/config.fish
```

::: tip
Homebrew や、場合によっては他のインストール方法では mise は自動的に有効化されるため、これは不要です。

詳細は [`MISE_FISH_AUTO_ACTIVATE=1`](/configuration#mise-fish-auto-activate-1) を参照してください。
:::

### PowerShell {#powershell}

::: warning
実際のプロファイルの場所を確認するには [about_Profiles](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_profiles) のドキュメントを参照してください。
親ディレクトリが存在しない場合は、先に作成する必要があります。
:::

```powershell
echo '(&mise activate pwsh) | Out-String | Invoke-Expression' >> $HOME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1
```

### Nushell {#nushell}

Nu は [`eval` をサポートしていません](https://www.nushell.sh/book/how_nushell_code_gets_run.html#eval-function)。
`env.nu` と `config.nu` に追記して mise をインストールします。

```nushell
'
let mise_path = $nu.default-config-dir | path join mise.nu
^mise activate nu | save $mise_path --force
' | save $nu.env-path --append
"\nuse ($nu.default-config-dir | path join mise.nu)" | save $nu.config-path --append
```

dotfiles をきれいに保ちたい場合は、別のディレクトリに保存してから `$env.NU_LIB_DIRS` を更新することもできます。

```nushell
"\n$env.NU_LIB_DIRS ++= ($mise_path | path dirname | to nuon)" | save $nu.env-path --append
```

### Xonsh {#xonsh}

`.xsh` ファイルは [コンパイルされない](https://github.com/xonsh/xonsh/issues/3953) ため、純粋な Python の
import を使うことで起動時間を少し削減できます。例えば `~/.config/xonsh/mise.py` 設定ファイルに以下のコードを追加し、
`~/.config/xonsh/rc.xsh` で `import mise` してください。

```python
from pathlib import Path
from xonsh.built_ins import XSH

ctx = XSH.ctx
mise_init = subprocess.run([Path('~/bin/mise').expanduser(),'activate','xonsh'],capture_output=True,encoding="UTF-8").stdout
XSH.builtins.execx(mise_init,'exec',ctx,filename='mise')
```

または `rc.xsh`/`.xonshrc` を使い続けます。

```sh
echo 'execx($(~/bin/mise activate xonsh))' >> ~/.config/xonsh/rc.xsh # or ~/.xonshrc
```

`mise` はシェルの env `$PATH` と OS の environ `PATH` の両方を置き換えるため、設定でこの2つが異なる値に設定されていないよう注意してください（両者を一致させるために、設定の最後に
`os.environ['PATH'] = xonsh.built_ins.XSH.env.get_detyped('PATH')` を実行させてもよいでしょう）

### Elvish {#elvish}

`rc.elv` に以下を追加します。

```shell
var mise: = (ns [&])
eval (mise activate elvish | slurp) &ns=$mise: &on-end={|ns| set mise: = $ns }
mise:activate
```

オプションで `mise` を `mise:mise` にエイリアスすると、`mise {activate,deactivate,shell}` をシームレスに統合できます。

```shell
edit:add-var mise~ {|@args| mise:mise $@args }
```

### その他のシェルは？ {#something-else}

このプロジェクトのシェル関連のコードは非常に少ないため、新しいシェルを追加するのはまったく難しくありません。
他のシェルがどのように実装されているかは [こちら](https://github.com/jdx/mise/tree/main/src/shell) を参照してください。もしお使いのシェルが現在サポートされていない場合は、統合のお手伝いを喜んでいたします。

## 自動補完 {#autocompletion}

::: tip
一部のインストール方法では自動補完スクリプトが自動的にインストールされます。
:::

[`mise completion`（原文）](https://mise.jdx.dev/cli/completion.html) コマンドは、シェル用の自動補完スクリプトを生成できます。これには
`usage` がインストールされている必要があります。インストールされていない場合は、以下でインストールします。

```shell
mise use -g usage
```

次に、以下のコマンドを実行してシェル用の補完スクリプトをインストールします。

::: code-group

```sh [bash]
# This requires bash-completion to be installed
mkdir -p ~/.local/share/bash-completion/completions/
mise completion bash --include-bash-completion-lib > ~/.local/share/bash-completion/completions/mise
```

```sh [zsh]
# If you use oh-my-zsh, there is a `mise` plugin. Update your .zshrc file with:
# plugins=(... mise)

# Otherwise, look where zsh search for completions with
echo $fpath | tr ' ' '\n'

# if you installed zsh with `apt-get` for example, this will work:
mkdir -p /usr/local/share/zsh/site-functions
mise completion zsh  > /usr/local/share/zsh/site-functions/_mise
```

```sh [fish]
mise completion fish > ~/.config/fish/completions/mise.fish
```

:::

その後、シェルの rc ファイルを source するか、シェルを再起動してください。

## トラブルシューティング {#troubleshooting}

インストール後に問題が発生した場合は、以下を実行します。

```sh
mise doctor
```

これにより、mise のセットアップに関する一般的な問題を診断します。詳細は [mise doctor（原文）](https://mise.jdx.dev/cli/doctor.html) を参照してください。

## アンインストール {#uninstalling}

mise をアンインストールするには `mise implode` を使用します。これにより mise のバイナリとすべてのデータが削除されます。詳細は
`mise implode --help` を使用してください。

あるいは、完全にクリーンアップするために以下のディレクトリを手動で削除します。

- `~/.local/share/mise`（`MISE_DATA_DIR` または `XDG_DATA_HOME/mise` の場合もあります）
- `~/.local/state/mise`（`MISE_STATE_DIR` または `XDG_STATE_HOME/mise` の場合もあります）
- `~/.config/mise`（`MISE_CONFIG_DIR` または `XDG_CONFIG_HOME/mise` の場合もあります）
- Linux の場合: `~/.cache/mise`（`MISE_CACHE_DIR` または `XDG_CACHE_HOME/mise` の場合もあります）
- macOS の場合: `~/Library/Caches/mise`（`MISE_CACHE_DIR` の場合もあります）
