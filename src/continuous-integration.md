---
title: 継続的インテグレーション
description: "Use the same mise.toml in CI and development so both environments select the same tools."
upstreamPath: docs/continuous-integration.md
upstreamUrl: https://mise.jdx.dev/continuous-integration.html
upstreamRef: 5749c813
upstreamDate: "2026-10-13"
---

# 継続的インテグレーション {#continuous-integration}

CI と開発で同じ `mise.toml` を使い、両方の環境で同じツールが選ばれるようにします。
コマンドは `mise exec` または [`mise run`](/tasks/) で実行し、それらのツールとプロジェクトの
[環境変数](/environments/) を読み込みます。CI ではシェルの有効化は必要ありません。

再現性のあるインストールのためには、[ロックファイル（原文）](https://mise.jdx.dev/dev-tools/mise-lock.html) をコミットし、
`mise install --locked` でインストールします。これは、そのプラットフォーム向けのダウンロードが記録されていないツールがあると失敗します。
[厳格なロックファイルモード（原文）](https://mise.jdx.dev/dev-tools/mise-lock.html#strict-lockfile-mode) を参照してください。
パイプラインで mise 自体の更新も制御する必要がある場合は、mise のバージョンを別途固定してください。

## GitHub Actions {#github-actions}

[mise-action](https://github.com/jdx/mise-action) は、mise と、チェックアウトしたリポジトリで宣言されたツールを
インストールします。デフォルトでは、ツールのキャッシュ、shim ディレクトリの `PATH` への追加、
プロジェクトの環境変数の後続ステップへのエクスポートも行います:

```yaml
name: test
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: jdx/mise-action@v5
      - run: mise run test
```

::: warning
復元されたツールキャッシュはそのまま信頼されます。mise はインストール済みのファイルを
`mise.lock` と照合しません。代わりに、mise が検証するダウンロードをキャッシュするには、
[インストールではなくダウンロードをキャッシュする](#trusted-cache) を参照してください。
:::

この例は、`mise.toml` の `[tasks]` に `test = "npm ci && npm test"` のような `test` タスクが
あることを前提としています。`mise exec -- npm test` でも同様に動作します。

リポジトリに `mise.lock` がある場合、アクションは自動的に `mise install --locked` を実行します。
mise を固定するには `version` 入力を、サブプロジェクトを選択するには `working_directory` を使います。
ツールのバージョンはリポジトリの設定に置いてください。`mise_toml` と `tool_versions` の入力は、
独自の設定を渡すワークフロー向けです。キャッシュとトークンのオプションについては、[アクションの入力](https://github.com/jdx/mise-action/blob/v5/action.yml)
を参照してください。

アクションは、ツールのインストール中はワークフローの GitHub トークンを mise に渡しますが、
後続のステップにはエクスポートしません。後続のステップでツールをインストールする場合や GitHub
API のレート制限に達する場合は、[GitHub トークン（原文）](https://mise.jdx.dev/dev-tools/github-tokens.html#ci-github-actions) に示すようにトークンを渡してください。

### インストールではなくダウンロードをキャッシュする {#trusted-cache}

`mise.lock` がある場合は、ツールではなくダウンロードストアをキャッシュします。mise は保存された各ファイルを
使う前に、ロックファイルのチェックサムと照合してハッシュを検証します。そのため、汚染された、あるいは古いキャッシュによって
インストールされる内容が変わることはありません。また、アクション自身のツールキャッシュは無効にします:

```yaml
steps:
  - uses: actions/checkout@v7
  - uses: actions/cache@v6
    with:
      path: ~/.cache/mise/downloads-cas
      key: mise-downloads-${{ runner.os }}-${{ hashFiles('mise.lock') }}
  - uses: jdx/mise-action@v5
    with:
      cache: false
```

インストールでは `mise install --locked` が実行され、照合できるチェックサムがあるダウンロードだけが再利用されます。
ツールは毎回展開されるため、インストールを復元するより遅くなり、ソースからコンパイルするツールは引き続きコンパイルされます。ストアは最大で
[`download_cache_max_size`（原文）](https://mise.jdx.dev/configuration/settings.html#download_cache_max_size)
（デフォルトでは 2 GiB）まで保持します。
[`download_cache`（原文）](https://mise.jdx.dev/configuration/settings.html#download_cache) と
[復元されたキャッシュとインストール済みのツール（原文）](https://mise.jdx.dev/dev-tools/mise-lock.html#restored-caches) を参照してください。

ワークフローを始めるには、[`mise generate github-action`（原文）](https://mise.jdx.dev/cli/generate/github-action.html)
を使います。これは、プルリクエスト、タグ、現在のブランチへのプッシュで `mise run ci` を実行するワークフローを出力します。
`--write` を付けると `.github/workflows/ci.yml` として保存されます。コミットする前に、トリガーとアクションのバージョンを
確認してください:

```sh
mise generate github-action --write --task=ci
```

## GitLab CI {#gitlab-ci}

どちらの例も、amd64 のランナー（arm64 の場合はキャッシュのプレフィックスを変更してください）、`package.json` に
`build` スクリプトがある Node.js プロジェクト、コミット済みの `mise.lock` を前提としています。
ロックファイルがない場合は、キャッシュキーから `mise.lock` を、インストールから `--locked` を外してください。GitLab はデフォルトで
`cache:key:files` に最大 2 つのパスしか受け付けません。ツールが必要とする OS パッケージは
`before_script` に追加するか、それらを含む CI イメージをビルドしてください。

### コミットしたラッパーを使う {#use-a-committed-wrapper}

このジョブは、Debian イメージ上で [コミットしたラッパー](#bootstrapping) を実行します。
ローカライズしたラッパーは mise のディレクトリを `.mise/` 以下に置き、ジョブはそれを
キャッシュします:

```yaml
build-job:
  stage: build
  image: debian:13-slim
  cache:
    key:
      prefix: mise-debian13-amd64
      files: [mise.toml, mise.lock]
    paths:
      - .mise/installs/
      - .mise/cache/
  before_script:
    - apt-get update && apt-get install -y --no-install-recommends curl ca-certificates tar
  script:
    - ./bin/mise install --locked
    - ./bin/mise exec -- npm ci
    - ./bin/mise exec -- npm run build
```

新しい mise 向けにラッパーを再生成したときに新しいキャッシュを始めるには、
プレフィックスを変更します。例えば `mise-debian13-amd64-2026.10.4` のようにします。

### 公式イメージを使う {#use-the-official-image}

[公式の `-debian` イメージ（原文）](https://mise.jdx.dev/mise-cookbook/docker.html#official-images)
には mise、`curl`、`git`、CA 証明書がすでに含まれているため、ラッパーや `ENTRYPOINT` の上書きなしに
ジョブで直接使えます。GitLab がキャッシュできるように、mise のデータディレクトリと
キャッシュディレクトリをプロジェクト内に設定します:

```yaml
build-job:
  stage: build
  image: ghcr.io/jdx/mise:2026.10.4-debian
  variables:
    MISE_DATA_DIR: $CI_PROJECT_DIR/.mise
    MISE_CACHE_DIR: $CI_PROJECT_DIR/.mise/cache
  cache:
    key:
      prefix: mise-image-amd64
      files: [mise.toml, mise.lock]
    paths:
      - .mise/installs/
      - .mise/cache/
  script:
    - mise install --locked
    - mise exec -- npm ci
    - mise exec -- npm run build
```

イメージのバージョンは、固定したい mise のリリースに置き換えてください。

## その他の CI プロバイダー {#any-ci-provider}

その他のプロバイダーでは、初回使用時に固定した mise のリリースをダウンロードするラッパースクリプトをコミットし、
mise のすべてのコマンドでそれを呼び出します。mise のダウンロード、検証、展開のために、ランナーには `bash`、
`curl`、CA 証明書、`tar`、そして `sha256sum` または `shasum` のいずれかが必要です。

### ラッパーの生成 {#bootstrapping}

ローカルで
[`mise generate install-script`（原文）](https://mise.jdx.dev/cli/generate/install-script.html) を使って生成します:

```sh
mise generate install-script --localize --write
```

これにより `bin/mise` が書き出されます。これをコミットし、`.mise/` を `.gitignore` に追加します。
ローカライズしたラッパーは、mise のバイナリ、インストール済みのツール、キャッシュ、状態を
`.mise/` 以下に置き、プロジェクトの設定ファイルを信頼し、ユーザーのグローバル設定を無視します。
`--windows` を付けると、Windows のランナーやコントリビューター向けに `bin/mise.cmd` も書き出します。
これには `--write` が必要です。

インストールと実行の両方でラッパーを使い、どちらもそれらのディレクトリを使うようにします。
この例は、`package-lock.json` がコミットされ、`test` スクリプトがある Node.js プロジェクトを前提としています:

```sh
set -eu
./bin/mise install
./bin/mise exec -- npm ci
./bin/mise exec -- npm test
```

リポジトリにロックファイルがある場合は `./bin/mise install --locked` を使います。
Windows のランナーでは、代わりに `.\bin\mise.cmd` を実行します。

ラッパーは、生成時に `mise self-update` が選択する mise のリリース（
[`self_update.minimum_release_age`（原文）](https://mise.jdx.dev/configuration/settings.html#self_update.minimum_release_age)
（デフォルトでは 24h）より古い最新の安定版リリース）、または `--version` で渡したリリースに固定されます。
新しいリリースに移行するには、ラッパーを再生成してコミットするか、実行時に `MISE_VERSION` を設定します。
`MISE_INSTALL_PATH` は、バイナリを置く場所を上書きします。`--localize` を付けない場合、
ラッパーは通常の mise のディレクトリを使い、バイナリをデータディレクトリの `bootstrap/` サブディレクトリに置きます。

古いバージョンの mise で生成されたラッパーは、バイナリをキャッシュディレクトリに置くため、
`mise cache clear` やキャッシュの整理によって削除されます。それらは再生成してください。
再生成したラッパーは、キャッシュディレクトリに同じバージョンのバイナリがあれば、再度ダウンロードせずにそれを再利用します。

ジョブがプライベートな GitHub リポジトリからツールをインストールする場合や API のレート制限に達する場合は、
mise にトークンを渡してください。[GitHub トークン（原文）](https://mise.jdx.dev/dev-tools/github-tokens.html) を参照してください。

## Xcode Cloud {#xcode-cloud}

Xcode Cloud の
[post-clone スクリプト](https://developer.apple.com/documentation/xcode/writing-custom-build-scripts)
を `ci_scripts/ci_post_clone.sh` に置き、ビルドの前にツールをインストールして実行します。
[生成したラッパー](#bootstrapping) を `bin/mise` にコミットしてください。この例は、
リポジトリの `mise.toml` で SwiftLint が宣言されていることを前提としています:

```sh
#!/bin/sh
set -eu
cd "$CI_PRIMARY_REPOSITORY_PATH"
./bin/mise install
./bin/mise exec -- swiftlint lint
```

コミットする前に、スクリプトを実行可能にしてください。このスクリプト内での環境の変更は
後続のビルドフェーズには反映されないため、mise のツールが必要な他のフェーズでは `mise exec` を使います。
ローカルでの Xcode ビルドについては、[エディターと IDE](/ide-integration.html#xcode) を参照してください。

## キャッシュ {#caching}

インストール済みのツールをキャッシュすると、ジョブごとにダウンロードせずに済みます。
`$MISE_DATA_DIR/installs`（デフォルトでは `~/.local/share/mise/installs`）と
`$MISE_CACHE_DIR` をキャッシュします。ローカライズしたラッパーの場合、これらは `.mise/installs` と
`.mise/cache` です。キャッシュキーにはランナーの OS とアーキテクチャ、`mise.toml`、
ロックファイルを含め、異なる [設定環境](/configuration/environments.html) やインストールオプションを使うジョブには
別々のキャッシュを使ってください。

キャッシュを復元した後も `mise install` を実行してください。不足しているものをインストールするためであり、
またジョブは空のキャッシュでも成功する必要があるためです。mise がインストールとメタデータを置く場所については、
[ディレクトリ（原文）](https://mise.jdx.dev/directories.html) を参照してください。

## 信頼と未信頼のブランチ {#safe-mode}

mise は CI 環境を検知すると、[パラノイドモード（原文）](https://mise.jdx.dev/paranoid.html) が有効でない限り、
確認なしにすべての設定ファイルを信頼します。そのため、チェックアウトしたブランチのタスク、フック、
`[env]` は通常どおり実行されます。シークレットを保持したまま自分が書いていないブランチを読み込むジョブ
（プルリクエストからバージョンを解決するボットなど）では、`MISE_SAFE=1` を設定して、
プロジェクトの設定がコードを実行したり環境変数を注入したりできないようにしてください:

```sh
MISE_SAFE=1 mise lock --bump --dry-run --json
```

ボットに `mise.lock` を更新させる場合は `--dry-run` を外します。セーフモードでは、
タスク、テンプレートの `exec()`、プラグインのインストールを拒否し、プロジェクトの環境変数と設定項目を無視し、
フックをスキップします。一部のバックエンドはコードの実行を必要とするため、このモードではバージョンを解決できません。
運用者が所有するグローバル設定は引き続き適用されます。完全な一覧とバックエンドの制限については、
[セーフモード（原文）](https://mise.jdx.dev/security.html#safe-mode) を参照してください。
