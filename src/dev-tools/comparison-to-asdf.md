---
title: asdf からの移行
description: "Move projects and personal defaults from asdf to mise, with command equivalents and the differences to expect."
upstreamPath: docs/dev-tools/comparison-to-asdf.md
upstreamUrl: https://mise.jdx.dev/dev-tools/comparison-to-asdf.html
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# asdf からの移行 {#migrating-from-asdf}

mise は `.tool-versions` ファイルを読み込み、[asdf プラグイン（原文）](https://mise.jdx.dev/dev-tools/backends/asdf.html) を実行できるので、チームメイトが asdf を使い続けている間も、プロジェクトを1つずつ移行できます。mise には独自のコマンド、インストールディレクトリ、バックエンドがあるため、切り替えた後は各プロジェクトを確認してください。

## プロジェクトの移行 {#migrate-from-asdf-to-mise}

シェルの設定を変更する前に、まず1つのプロジェクトで始めます。

1. [mise をインストールします](/installing-mise.html)。
2. プロジェクトのディレクトリで `mise config ls` と `mise ls --current` を実行し、mise が既存の `.tool-versions` をどう読み込むかを確認します。
3. `mise install` を実行し、mise 経由でツールを確認します。

   ```sh
   mise exec -- node --version
   ```

   `node --version` の代わりに、プロジェクトのツールのコマンドを使ってください。mise は各ツールを独自にインストールします。asdf のインストールディレクトリは再利用せず、2つのマネージャーで1つのディレクトリを共有してはいけません。

4. プロジェクトが動作したら、asdf の有効化処理と shim ディレクトリをシェルの起動ファイルから削除し、[mise を有効化します（原文）](https://mise.jdx.dev/shell-setup.html)。新しいシェルを起動し、`mise doctor` と `command -v node` を確認します。

プロジェクトを `mise.toml` に移行するには、変換結果をプレビューしてから書き出します。

```sh
mise generate config --tool-versions .tool-versions --dry-run
mise generate config --tool-versions .tool-versions
```

asdf ユーザーがまだ必要としていなければ、その後 `.tool-versions` を削除してください。すべてのプロジェクトが動作したら、[asdf をアンインストール](https://asdf-vm.com/manage/core.html#uninstall)できます。

## コマンドの対応表 {#command-compatibility}

| 操作                         | asdf                                                     | mise                                                                             |
| ---------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| バージョンをインストールする | `asdf install nodejs 24.0.0`                             | `mise install node@24.0.0`                                                       |
| プロジェクトのバージョンを選択する | `asdf set nodejs 24.0.0`（0.16 より前: `asdf local`） | `mise use node@24.0.0`（インストールも行う）                                     |
| 個人のデフォルトを選択する   | `asdf set -u nodejs 24.0.0`（0.16 より前: `asdf global`） | `mise use -g node@24.0.0`                                                        |
| プラグインを追加する         | `asdf plugin add nodejs`                                 | レジストリのツールでは不要。それ以外は `mise plugins install <name> <git-url>` |
| インストール済みのバージョンを一覧表示する | `asdf list nodejs`                         | `mise ls node`                                                                   |
| 利用可能なバージョンを一覧表示する | `asdf list all nodejs`                             | `mise ls-remote node`                                                            |
| 最新バージョンを表示する     | `asdf latest nodejs`                                     | `mise latest node`                                                               |
| 選択されているバージョンを確認する | `asdf current`                                     | `mise ls --current`                                                              |
| 選択されている実行ファイルを探す | `asdf which node`                                    | `mise which node`                                                                |
| インストールディレクトリを表示する | `asdf where nodejs`                                | `mise where node`                                                                |
| 選択されているバージョンで実行する | `asdf exec node -v`                                | `mise exec -- node -v`                                                           |
| バージョンをアンインストールする | `asdf uninstall nodejs 24.0.0`                       | `mise uninstall node@24.0.0`                                                     |
| shim を再構築する            | `asdf reshim`                                            | `mise reshim`                                                                    |

asdf 0.16 では asdf が Go で書き直され、`asdf local` と `asdf global` は [`asdf set`](https://asdf-vm.com/manage/versions.html) に置き換えられました。`mise set` はこれとは無関係で、環境変数を設定するコマンドです。ツールのバージョンには `mise use` を使ってください。

mise は `mise install node 24.0.0` や、ツール名 `nodejs`・`golang` など、asdf の一部の書き方を受け付けますが、asdf を完全に再現するわけではありません。スクリプトでは mise 独自の構文を、`mise.toml` では `node` と `go` という名前を使ってください。

## asdf ユーザーと `.tool-versions` を共有する {#share-tool-versions}

チームメイトがまだ asdf を使っている間は、共有の `.tool-versions` を残しておきます。mise でこれを更新するには、ファイルを指定し、asdf が受け付ける具体的なバージョンに固定します。

```sh
mise use --path .tool-versions --pin node@24
```

`prefix:`、`sub-`、`aqua:jqlang/jq` のようなバックエンド名など、[mise 専用のリクエスト（原文）](https://mise.jdx.dev/dev-tools/versions.html#request-syntax) は、asdf が読み込むファイルに入れないでください。同じディレクトリにある `mise.toml` は、そこで宣言されたツールについて優先されるため、両方のファイルを残す前に宣言が競合していないか確認してください。`.tool-versions` にだけ記載されたツールは [`mise.lock`（原文）](https://mise.jdx.dev/dev-tools/mise-lock.html) に書き込まれず、`--locked` でも検査されません。

## 個人のデフォルト {#personal-defaults}

mise は個人のデフォルトを `~/.config/mise/config.toml` に保持します。使いたいバージョンを選び、`mise use -g` で設定します。

```sh
mise use -g node@24 python@3.14
```

mise はすべての親ディレクトリで `.tool-versions` を探すため、`~/.tool-versions` も読み込みます。そのため、asdf のグローバルなバージョンは、それを `~/.config/mise/config.toml` に移してそのファイルを削除または整理するまで、ホームディレクトリ配下のプロジェクトに適用され続けます。両方のファイルを確認するには、ホームディレクトリで `mise config ls` を実行します。

ファイルを丸ごと変換するのではなく、バージョンを1つずつコピーしてください。複数のバージョンを列挙しているエントリーやエイリアスを使っているエントリーは確認し、すべてのツールが動作するまで古いファイルは残しておきます。

## 動作の違い {#what-works-differently}

### バージョンが選択されるタイミング {#performance}

`mise activate` を使うと、mise はシェルのプロンプト表示時とディレクトリ移動時に `PATH` と環境変数を更新し、その後のコマンドはツールの実行ファイルを直接実行します。asdf は、ツールを呼び出すたびに shim を通してツールを解決します。mise にも、安定した実行ファイルのパスを必要とするプログラム向けに [shim](/dev-tools/shims.html#overview) があり、asdf の shim と同様に呼び出しのたびにバージョンを解決します。

### プラグインとセキュリティ {#security}

asdf プラグインは、ツールをインストールするたびにマシン上で実行されるシェルスクリプトであるため、ツールの提供元だけでなくプラグインのメンテナーも信頼することになります。mise は、レジストリのツールのほとんどを、プラグインを使わずに組み込みのバックエンドでインストールします。ダウンロードしたものを検証するバックエンドもあります。packslip は署名付きのリリースマニフェストを検査し、aqua はレジストリが宣言しているチェックサム、cosign、SLSA、attestation の検査を適用します。検証の有無はツールによって異なるため、`mise tool <name>` で確認してください。[セキュリティ（原文）](https://mise.jdx.dev/security.html) を参照してください。

### Windows {#windows-support}

mise は、Windows 用ビルドを公開しているツールとバックエンドについて、Windows 上でネイティブに動作します。asdf プラグインはシェルスクリプトであり、Unix 環境を必要とします。mise はこれらを Windows 上でネイティブに動作させるわけではありません。Windows でのセットアップについては [mise のインストール](/installing-mise.html) を参照してください。

### asdf プラグインのないツール {#extra-backends}

レジストリ名があればそれを使い、なければパッケージの取得元を明示的に選びます。

```toml [mise.toml]
[tools]
node = "24"
ripgrep = "latest"
"npm:prettier" = "3"
```

Prettier は実行時に Node.js を必要とするため、両方を宣言しています。その他の [バックエンド（原文）](https://mise.jdx.dev/dev-tools/backends/) では、リリースバイナリ、Python 製 CLI、Rust のクレート、プライベートなツールをインストールできます。
