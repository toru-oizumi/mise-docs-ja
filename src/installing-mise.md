---
title: mise のインストール
description: "Install mise on macOS, Linux, or Windows, verify the executable, and keep it up to date."
upstreamPath: docs/installing-mise.md
upstreamUrl: https://mise.jdx.dev/installing-mise.html
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# mise のインストール {#installing-mise}

プラットフォームに合ったインストール方法を選び、実行ファイルを確認してから、[シェルをセットアップ（原文）](https://mise.jdx.dev/shell-setup.html)してください。最初のプロジェクトを手順に沿って進めたい場合は、[はじめに](/getting-started.html) を参照してください。

## 方法の選択 {#installation-methods}

| プラットフォーム | 推奨                                                                       | 代替                                                                                                |
| ---------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| macOS            | [mise.run](#mise-run)                                                      | [Homebrew](#homebrew)、[MacPorts](#macports)、[packslip](#packslip)（Apple シリコン）               |
| Linux            | [mise.run](#mise-run)                                                      | [packslip](#packslip)、[apt](#apt)、[dnf](#dnf)、[pacman](#pacman)、[apk](#apk)、[その他](#linux)   |
| Windows          | [winget](#windows-winget)                                                  | [Scoop](#windows-scoop)、[Chocolatey](#windows-chocolatey)、[packslip](#packslip)                   |
| CI               | [mise-action またはコミットしたラッパー](/continuous-integration.html)     |                                                                                                     |
| Docker           | [公式イメージ（原文）](https://mise.jdx.dev/mise-cookbook/docker.html)     |                                                                                                     |

mise.run、packslip、[GitHub Releases](#github-releases) は公式のリリースバイナリをインストールします。これらは mise の最適化されたリリースプロファイルでビルドされており、`mise self-update` で更新できます。パッケージマネージャー版のビルドはリリースより遅れることがあり、Homebrew のフォーミュラのビルドは目に見えて遅く、サイズも大きくなることがあります。

1台のマシンでは1つの方法だけを使ってください。`PATH` 上に2つのインストールがあると、古いバイナリが使われたままになることがあります。[実行ファイルの確認](#verify-the-executable) を参照してください。

## 公式のリリースバイナリ {#recommended}

### インストールスクリプト（mise.run） {#mise-run}

```sh
curl -fsSL https://mise.run | sh
```

このスクリプトは実行ファイルを `~/.local/bin/mise` にインストールします。このディレクトリが `PATH` 上にある必要はありません。[mise を有効化（原文）](https://mise.jdx.dev/shell-setup.html)すると、mise が自身のディレクトリを追加します。別のパスを選ぶ場合は、次のようにします（その親ディレクトリはユーザーが書き込み可能である必要があります）。

```sh
curl -fsSL https://mise.run | MISE_INSTALL_PATH="$HOME/bin/mise" sh
```

`MISE_VERSION` を指定しない場合、スクリプトは実行時点から少なくとも 24 時間前までに公開された最新の安定版リリースを選び、インストール先のパスにある既存の実行ファイルが同じリリースかそれより新しい場合はそれを残します。再現可能なインストールにするには `MISE_VERSION` を設定します。

```sh
curl -fsSL https://mise.run | MISE_VERSION=v2026.10.4 sh
```

#### インストールと有効化を一度に行う {#shell-specific-installation-activation}

シェル別のエンドポイントは、mise をインストールし、そのシェルの起動ファイルに有効化の設定を追記します。

::: code-group

```sh [zsh]
curl -fsSL https://mise.run/zsh | sh
# adds activation to ${ZDOTDIR:-$HOME}/.zshrc
```

```sh [bash]
curl -fsSL https://mise.run/bash | sh
# adds activation to ~/.bashrc
```

```sh [fish]
curl -fsSL https://mise.run/fish | sh
# adds activation to ~/.config/fish/config.fish
```

:::

ファイル内にすでに自身のマーカーコメントがある場合、これらは追記をスキップします。ユーザーやパッケージマネージャーが別の方法で追加した有効化の設定は認識しないため、以前に有効化を設定したことがある場合は先にファイルを確認してください。

#### インストーラーのオプション {#installer-options}

スクリプトは TOML の設定項目ではなく、以下の環境変数を読み取ります。

| 変数                                   | 効果                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MISE_INSTALL_PATH`                    | 実行ファイルのパス。デフォルトは `~/.local/bin/mise`。                                                                                                |
| `MISE_VERSION`                         | インストールするリリース（`v2026.10.4` など）。リリース経過時間による待機を回避します。                                                               |
| `MISE_SELF_UPDATE_MINIMUM_RELEASE_AGE` | これより新しいリリースをスキップします。`s`、`m`、`h`、`d`、`w` のいずれかを付けた整数（`7d` など）で指定し、待機なしにするには `0s`。未設定時は `MISE_MINIMUM_RELEASE_AGE`、次に `24h` にフォールバックします。 |
| `MISE_INSTALL_SKIP_IF_EXISTS`          | `1` にすると、インストール先のパスにある実行ファイルがすでに選択されたバージョンである場合にダウンロードをスキップします。                             |
| `MISE_INSTALL_MUSL`                    | `1` にすると、静的な musl ビルドをインストールします。                                                                                                |
| `MISE_INSTALL_OS`, `MISE_INSTALL_ARCH` | 検出されたプラットフォームを上書きします。例えば `MISE_INSTALL_ARCH=x64` にすると Apple シリコン上で Intel ビルドをインストールします。musl ビルドにするにはアーキテクチャに `-musl` を付けます。 |
| `MISE_INSTALL_EXT`                     | アーカイブ形式。`tar.zst` または `tar.gz`。`zstd` が利用できる場合のデフォルトは `tar.zst`。                                                           |
| `MISE_INSTALL_FROM_GITHUB`             | `1` にすると、mise.jdx.dev ではなく GitHub Releases からダウンロードします。                                                                          |
| `MISE_INSTALL_HELP`                    | `0` にすると、インストール後に有効化のヒントを表示しません。                                                                                          |
| `MISE_DEBUG`, `MISE_QUIET`             | `1` にすると、それぞれデバッグ出力を表示する／エラーのみを表示します。                                                                                |

#### インストールスクリプトの検証 {#verify-the-install-script}

実行する前にスクリプトの署名を確認するには、次のようにします。

```sh
gpg --keyserver hkps://keys.openpgp.org --recv-keys 24853EC9F655CE80B48E6C3A8B81C9D17413A06D
curl -fsSL -o install.sh.sig https://mise.jdx.dev/install.sh.sig
gpg --output install.sh --decrypt install.sh.sig
```

GPG が、フィンガープリント `24853EC9F655CE80B48E6C3A8B81C9D17413A06D` のリリース鍵による有効な署名であると報告することを確認してください。ダウンロードまたは確認が失敗した場合は、そこで中止し、出力されたファイルを実行しないでください。確認に成功したら、次を実行します。

```sh
sh ./install.sh
```

#### サポートされるプラットフォーム {#supported-platforms}

スクリプトは以下のいずれかのビルドをインストールします。

- `macos-x64`
- `macos-arm64`
- `linux-x64`
- `linux-x64-musl`
- `linux-arm64`
- `linux-arm64-musl`
- `linux-armv7`
- `linux-armv7-musl`

[GitHub Releases](#github-releases) には、同じビルドに加えて `windows-x64` と `windows-arm64` があります。

`linux-x64`、`linux-arm64`、`linux-armv7` のビルドは動的リンクされており、glibc 2.18 以降が必要です。`-musl` のビルドは静的で glibc を必要としません。Alpine Linux のような musl のシステムや、古い glibc のシステムではこちらを使ってください。

スクリプトは musl のシステムでは musl ビルドを選びます。glibc のシステムでは glibc のバージョンを確認せずに glibc ビルドを選ぶため、glibc が 2.18 より古い場合は自分で musl ビルドを選んでください。

```sh
curl -fsSL https://mise.run | MISE_INSTALL_MUSL=1 sh
```

::: details glibc の最小バージョンを引き上げる際の方針

mise が glibc の最小バージョンを引き上げる前に、それより古いバージョンを持つすべてのディストリビューションが、ベンダーの標準サポート終了を迎えている必要があります。Ubuntu ESM、RHEL ELS、SUSE LTSS などの延長サポートプログラムは、この期間を延長しません。それらのシステムの利用者は静的な musl ビルドを使用できます。

以下の表は、いくつかのディストリビューションの標準サポート終了日を示しています。

| glibc  | ディストリビューション                                 | 標準サポート終了                              |
| ------ | ------------------------------------------------------ | --------------------------------------------- |
| ≤ 2.27 | RHEL 7, Ubuntu 16.04 / 18.04, Debian 9, Amazon Linux 2 | 終了済み（最後: Amazon Linux 2、2026-06-30）  |
| 2.28   | Debian 10                                              | 2024-06-30 に終了                             |
| 2.28   | RHEL 8, Rocky 8, AlmaLinux 8                           | 2029-05-31                                    |
| 2.31   | Ubuntu 20.04, Debian 11                                | 終了済み（最後: Debian 11、2026-08-31）       |
| 2.34   | Amazon Linux 2023                                      | 2029-06-30                                    |
| 2.34   | RHEL 9, Rocky 9, AlmaLinux 9                           | 2032-05-31                                    |
| 2.35   | Ubuntu 22.04                                           | 2027-06-01                                    |

最小バージョンは引き続き glibc 2.18 です。これらの日付は今後の互換性の変更の参考にするもので、リリーススケジュールを定めるものではありません。表に載っていないディストリビューションにも同じサポート方針が適用されます。

:::

その他のプラットフォームでは、[Cargo でソースからビルド](#cargo)してください。

### packslip {#packslip}

[packslip](https://packslip.dev) は、mise のインストールスクリプトを実行せずに、署名された mise の上流リリースをインストールします。mise の GitHub リポジトリに対して Sigstore の署名と透明性ログのエントリーを検証し、アーカイブのダイジェストとサイズを確認したうえで、完全なアーカイブから `mise` 実行ファイルを公開します。

packslip 1.5.1 以降を、Linux x64 または arm64、macOS arm64、Windows x64 または arm64 で使用してください。Intel Mac では別のインストール方法が必要です。

packslip を、署名された [APT または RPM リポジトリ](https://packslip.dev/docs/distributions/) か、[packslip のはじめにガイド](https://packslip.dev/docs/getting-started/) にある他の方法のいずれかでインストールしてから、mise をインストールします。

```sh
packslip install github.com/jdx/mise --pin ps1_nlhmwtfeufglxv5myvwvronk7a
~/.local/bin/mise --version
```

packslip はインストールしたコマンドのパスを表示します。通常の Unix ユーザーでは `~/.local/bin/mise`、root では `/usr/local/bin/mise` です。`PATH` やシェルのファイルは変更しません。

`--pin` は mise の GitHub リポジトリのフィンガープリントです。これにより、リポジトリの名前が変更されたり、別のリポジトリがその名前を引き継いだりしても、packslip は mise 自身のリリースだけを受け入れます。`--pin` を指定しない場合、packslip は初回使用時にその名前に対して GitHub が返すリポジトリを信頼し、そのマシンでの以降のインストールをそのリポジトリに限定します。

`--version` を指定しない場合、または `--version latest` を指定した場合、packslip は現在の安定版リリースをインストールします。特定のリリースをインストールするには、次のようにします。

```sh
packslip install github.com/jdx/mise --version 2026.10.4 \
  --pin ps1_nlhmwtfeufglxv5myvwvronk7a
```

このインストールでは `mise self-update` が機能し、`packslip install` を再実行すると、要求したリリースで mise が置き換えられます。packslip は、packslip 自身も mise も自動では更新しません。システムスコープ、インストール先の上書き、信頼の設定については [packslip のインストールガイド](https://packslip.dev/docs/bootstrap/) を、mise が新しいリリースに移っても packslip を固定したままにする方法については [Docker のページ（原文）](https://mise.jdx.dev/mise-cookbook/docker.html#bootstrap-with-packslip) を参照してください。

## macOS {#macos}

macOS では [インストールスクリプト](#mise-run) が推奨方法です。

### Homebrew {#homebrew}

```sh
brew install mise
```

Homebrew は独自の設定でソースから mise をビルドします。[mise.run](#mise-run) の公式バイナリの方が高速で、より早く提供されます。このフォーミュラはシェルの自動補完をインストールし、fish では mise を自動的に有効化します。
[Homebrew フォーミュラ](https://formulae.brew.sh/formula/mise)

### MacPorts {#macports}

```sh
sudo port install mise
```

[MacPorts のポート](https://ports.macports.org/port/mise/)

## Linux {#linux}

Linux では [インストールスクリプト](#mise-run) が推奨方法です。以下のパッケージは、システムの他の部分と一緒に更新されます。

### apt {#apt}

Debian 11 以降および Ubuntu 22.04 以降では、extrepo で mise のリポジトリを有効化します。

```sh
sudo apt install -y extrepo
sudo extrepo enable mise
sudo apt update
sudo apt install -y mise
```

Ubuntu 26.04 以降では、代わりに PPA を使用できます。

```sh
sudo add-apt-repository -y ppa:jdxcode/mise
sudo apt update
sudo apt install -y mise
```

### dnf {#dnf}

mise は [jdxcode/mise COPR](https://copr.fedorainfracloud.org/coprs/jdxcode/mise/) にあります。

#### Fedora 43 以降、RHEL 10、CentOS Stream 10 とそのリビルド {#dnf-fedora}

```sh
sudo dnf copr enable jdxcode/mise
sudo dnf install mise
```

#### RHEL 9、CentOS Stream 9、AlmaLinux 9、Rocky 9 {#dnf-el9}

RHEL 9 の Rust は mise をビルドするには古すぎるため、これらすべてで動作する CentOS Stream 9 のビルドを有効化します。chroot 名を指定しないと、`dnf copr enable` は存在しない `epel-9` のビルドを探します。

```sh
sudo dnf copr enable jdxcode/mise centos-stream+epel-next-9
sudo dnf install mise
```

### yum（RHEL 8 とそのリビルド） {#yum}

```sh
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://mise.jdx.dev/rpm/mise.repo
sudo yum install -y mise
```

### zypper {#zypper}

```sh
sudo wget https://mise.jdx.dev/rpm/mise.repo -O /etc/zypp/repos.d/mise.repo
sudo zypper refresh
sudo zypper install mise
```

### pacman {#pacman}

Arch Linux の場合:

```sh
sudo pacman -S mise
```

[Arch パッケージ](https://archlinux.org/packages/extra/x86_64/mise/)

### apk {#apk}

Alpine Linux では、mise は [コミュニティリポジトリ](https://gitlab.alpinelinux.org/alpine/aports/-/blob/master/community/mise/APKBUILD) にあります。

```sh
apk add mise
```

::: warning Alpine でのソースビルドのデフォルトは非推奨
Alpine では、mise はデフォルトでツールをソースからコンパイルします。2026.8.0 からはこれについて警告が出るようになり、2027.8.0 ではデフォルトがプリコンパイル済みバイナリに切り替わります。コンパイルを続けるには、[`all_compile = true`（原文）](https://mise.jdx.dev/configuration/settings.html#all_compile) を設定してください。
:::

### Nix {#nix}

nixpkgs 24.05 以降の場合:

```sh
nix-env -iA nixpkgs.mise
```

永続的なインストールをせずに試すには、`nix-shell -p mise --run "mise --version"` を実行します。

mise のリポジトリは flake でもあります。

```nix
inputs.mise.url = "github:jdx/mise";
# then add inputs.mise.packages.${system}.mise to your packages
```

::: warning NixOS でのソースビルドのデフォルトは非推奨
NixOS では、mise はデフォルトでツールをソースからコンパイルします。2026.8.0 からはこれについて警告が出るようになり、2027.8.0 ではデフォルトがプリコンパイル済みバイナリに切り替わります。プリコンパイル済みバイナリには [nix-ld](https://github.com/Mic92/nix-ld) が必要です。コンパイルを続けるには、[`all_compile = true`（原文）](https://mise.jdx.dev/configuration/settings.html#all_compile) を設定してください。
:::

### Snap {#snap-linux}

```sh
sudo snap install mise --classic
```

[snapcraft.io のページ](https://snapcraft.io/mise)

## Windows {#windows}

Windows では winget が推奨方法です。インストール後に [PowerShell での有効化（原文）](https://mise.jdx.dev/shell-setup.html#powershell) を設定するか、[Windows のシェル（原文）](https://mise.jdx.dev/shell-setup.html#windows) の説明に従って cmd.exe 用に shim ディレクトリを `Path` に追加してください。

### winget {#windows-winget}

```powershell
winget install jdx.mise
```

[winget マニフェスト](https://github.com/microsoft/winget-pkgs/tree/master/manifests/j/jdx/mise)

### Scoop {#windows-scoop}

```powershell
scoop install mise
```

Scoop は独自のコマンド shim を通じて `mise` を `Path` に追加します。mise のツール用の shim ディレクトリは追加しないため、有効化または shim を別途設定してください。
[Scoop マニフェスト](https://github.com/ScoopInstaller/Main/blob/master/bucket/mise.json)

### Chocolatey {#windows-chocolatey}

```powershell
choco install mise
```

[Chocolatey パッケージ](https://community.chocolatey.org/packages/mise) は公式リリースより遅れることがあります。選ぶ前にバージョンを確認してください。

### Windows での手動インストール {#windows-manual}

[GitHub Releases](https://github.com/jdx/mise/releases) から `mise-v<version>-windows-x64.zip`（または `windows-arm64`）と `SHASUMS256.txt` をダウンロードします。PowerShell で zip のハッシュを表示します。

```powershell
(Get-FileHash mise-v2026.10.4-windows-x64.zip -Algorithm SHA256).Hash
```

これは `SHASUMS256.txt` の `./mise-v2026.10.4-windows-x64.zip` の行と一致する必要があります。PowerShell は大文字で表示します。`minisign` がインストールされていれば、[手動ダウンロード](#github-releases) で示す方法で `SHASUMS256.txt` の署名も確認できます。その後、`mise.exe` と `mise-shim.exe` を含む `mise\bin` ディレクトリを展開し、`Path` に追加します。この2つのファイルは一緒に置いておいてください。mise は `mise-shim.exe` をコピーして shim を作成します。

## 言語のパッケージマネージャー {#language-package-managers}

### Cargo {#cargo}

ソースビルドには、そのリリースの `rust-version` を満たす Rust ツールチェーンに加えて、プラットフォームのコンパイラーとネイティブライブラリが必要です。[ビルドの依存関係（原文）](https://mise.jdx.dev/contributing.html#build-dependencies) を参照してください。

```sh
cargo install --locked mise
```

[cargo-binstall](https://github.com/cargo-bins/cargo-binstall) は、コンパイルする代わりにビルド済みのバイナリをインストールします。

```sh
cargo install --locked cargo-binstall
cargo binstall mise
```

`main` の最新コミットをビルドするには、次のようにします。

```sh
cargo install --locked mise --git https://github.com/jdx/mise --branch main
```

### npm {#npm}

npm の `mise` パッケージはプリコンパイルされたバイナリを配布するもので、Node.js のライブラリではありません。`package.json` や `npx` を通じて mise をセットアップする JavaScript プロジェクトに適しています。旧来の `@jdxcode/mise` パッケージではなく、`mise` をインストールしてください。

```sh
npm install -g mise
```

npx を使うと、npm のグローバルインストールをせずに mise を実行できます。npm はダウンロードをキャッシュし、mise がインストールするツールは通常どおり mise のデータディレクトリに置かれます。

```sh
npx --yes mise exec python@3.14 -- python --version
```

[npm パッケージ](https://www.npmjs.com/package/mise)

## コンテナ {#docker}

公式イメージは、Linux amd64 と arm64 向けに `ghcr.io/jdx/mise` と Docker Hub（`jdxcode/mise`）で公開されています。CI や開発用のイメージとしては `-debian` タグを使うか、scratch イメージから `COPY --from=` で静的バイナリをコピーしてください。タグ、ダイジェストの固定、Dockerfile については [Docker（原文）](https://mise.jdx.dev/mise-cookbook/docker.html) を参照してください。

## 手動ダウンロード {#github-releases}

[GitHub Releases](https://github.com/jdx/mise/releases) からリリースとプラットフォームに合ったファイルを選びます。例えば、Linux x64 の実行ファイルをカレントディレクトリにダウンロードするには、次のようにします。

```sh
mise_version=2026.10.4
mise_platform=linux-x64
curl -fL -o mise "https://github.com/jdx/mise/releases/download/v${mise_version}/mise-v${mise_version}-${mise_platform}"
```

各リリースには `SHASUMS256.txt` も含まれており、minisign（`SHASUMS256.txt.minisig`）と GPG（`SHASUMS256.asc`）で署名されています。チェックサムファイルの署名を確認してから、ダウンロードしたファイルをそれと照合します。以下のコマンドには `minisign` と `sha256sum` が必要で（macOS では `sha256sum -c` の代わりに `shasum -a 256 -c` を使います）、上で設定した変数と `mise` ファイルを再利用します。

```sh
base="https://github.com/jdx/mise/releases/download/v${mise_version}"
curl -fL -O "$base/SHASUMS256.txt" -O "$base/SHASUMS256.txt.minisig"
minisign -Vm SHASUMS256.txt -P RWTC3g8W3z4RZK3V3qv7fa1QY4JEWyBtqIHW+85QlJpZc5yG+uNYNBSZ &&
  grep " ./mise-v${mise_version}-${mise_platform}$" SHASUMS256.txt | sed 's| ./mise-.*| mise|' | sha256sum -c
```

minisign の公開鍵は、リポジトリ内の [`minisign.pub`](https://github.com/jdx/mise/blob/main/minisign.pub) です。その後、書き込み可能なディレクトリに実行ファイルをインストールします。

```sh
mkdir -p ~/.local/bin
install -m 755 ./mise ~/.local/bin/mise
~/.local/bin/mise --version
```

## 実行ファイルの確認 {#verify-the-executable}

```sh
mise --version
mise doctor
```

有効化する前は、デフォルトの mise.run によるインストールは `~/.local/bin/mise --version` と `~/.local/bin/mise doctor` として実行します。表示されたバージョンがインストールしたものと異なる場合は、Unix では `command -v mise`、PowerShell では `Get-Command mise` で、どのコピーが実行されているかを確認してください。

mise はツール、キャッシュ、状態をホームディレクトリ以下に保存します。場所を変更するには [ディレクトリ（原文）](https://mise.jdx.dev/directories.html) を参照してください。その他の問題については [トラブルシューティング](/troubleshooting.html) を参照してください。

## シェル {#shells}

bash、zsh、fish、PowerShell、Nushell、Xonsh、Elvish で mise を有効化する方法と、シェルの自動補完をインストールする方法については、[シェルのセットアップ（原文）](https://mise.jdx.dev/shell-setup.html) を参照してください。

## mise の更新 {#updating}

パッケージマネージャーで mise をインストールした場合は、そのパッケージマネージャーで更新してください。それ以外の場合は [`mise self-update`（原文）](https://mise.jdx.dev/cli/self-update.html) を実行します。これは `--no-plugins` を渡さない限り、インストール済みのプラグインも更新します。`mise upgrade` はツールを更新するもので、mise 自体は更新しません。

自動的に更新するには、グローバル設定で [`self_update.auto`（原文）](https://mise.jdx.dev/configuration/settings.html#self_update.auto) を有効にします。

```sh
mise settings self_update.auto=true
```

すると mise は、[`self_update.check_duration`（原文）](https://mise.jdx.dev/configuration/settings.html#self_update.check_duration) で設定された間隔、または `true` の代わりに指定した間隔（`mise settings self_update.auto=1d` など）で新しいリリースを確認します。新しいリリースがある場合は、対象となるインタラクティブなコマンドの前にそれをインストールし、新しいバイナリでコマンドを再実行します。CI、オフラインモード、非インタラクティブなセッション、およびパッケージ作成者がセルフアップデートを無効にしたインストールでは、確認をスキップします。

`mise self-update` と自動更新は、[`self_update.minimum_release_age`（原文）](https://mise.jdx.dev/configuration/settings.html#self_update.minimum_release_age) より新しいリリースをスキップします。この値は [`minimum_release_age`（原文）](https://mise.jdx.dev/security.html#minimum-release-age) にフォールバックします。`mise self-update 2026.10.4` は、この待機なしで指定したリリースをインストールします。バイナリを置き換える前に、mise はリリースの署名を検証します。何を確認するかについては [packslip による検証（原文）](https://mise.jdx.dev/dev-tools/packslip-verification.html#self-update) を参照してください。

組織は、[`self_update.repository`（原文）](https://mise.jdx.dev/configuration/settings.html#self_update.repository) と [`self_update.api_url`（原文）](https://mise.jdx.dev/configuration/settings.html#self_update.api_url) を使って、承認済みリリースのミラーから更新を配信できます。ミラーは公式のリリースのファイル名と署名を維持する必要があり、`api_url` は HTTPS を使用する必要があります。プライベートリポジトリと GitHub Enterprise では、mise の [GitHub トークン（原文）](https://mise.jdx.dev/dev-tools/github-tokens.html) の解決方法が使われます。これらはグローバル設定またはシステム設定で設定してください。プロジェクトの設定では mise はこれらを無視します。

```toml [~/.config/mise/config.toml]
[settings.self_update]
repository = "myorg/mise-mirror"
api_url = "https://github.example.com/api/v3"
```

mise は時間とともに変化するレジストリやリリース API とやり取りするため、最新の状態に保ってください。プロジェクトで新しい mise が必要な場合は、全員を1つの mise バージョンに固定するのではなく、[`min_version`](/configuration.html#minimum-mise-version) を設定してください。ディストリビューションのパッケージ作成者は、`mise self-update` を無効にして利用者をパッケージマネージャーに誘導できます。[mise のパッケージング（原文）](https://mise.jdx.dev/packaging.html) を参照してください。

## アンインストール {#uninstalling}

パッケージマネージャーで管理されている CLI は、mise をインストールしたパッケージマネージャーで削除してください。スタンドアロンのインストールの場合は、まず削除内容をプレビューします。

```sh
mise implode --dry-run
```

`mise implode` は、CLI、インストール済みのツール、キャッシュ、状態を削除します。システムのデータディレクトリがある場合はそれも含みます。`--config` を渡さない限り、ユーザーの設定ディレクトリは残します。`--dry-run` なしで実行する前に、表示されたパスを確認してください。環境変数によってパスが変わることがあります。

その後、シェルの起動ファイルから有効化の行を削除し、インストールした自動補完のファイルがあれば削除してください。プロジェクトの `mise.toml` ファイルと、bootstrap でインストールされたホストのパッケージは mise のデータには含まれず、そのまま残ります。保存先のパスについては [ディレクトリ（原文）](https://mise.jdx.dev/directories.html) を参照してください。
