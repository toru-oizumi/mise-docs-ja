---
title: 継続的インテグレーション
upstreamPath: docs/continuous-integration.md
upstreamUrl: https://mise.jdx.dev/continuous-integration.html
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

# 継続的インテグレーション {#continuous-integration}

継続的インテグレーション環境で mise を使うことで、プロジェクトが必要とするツールを環境にプロビジョニングできます。
環境の再現性を保つため、プロジェクトではツールを特定のバージョンに固定することを推奨します。

## 任意の CI プロバイダー {#any-ci-provider}

継続的インテグレーションのパイプラインでは任意のコマンドを実行できます。これを利用して mise をインストールし、`mise install` を実行してツールをインストールできます:

```yaml
script: |
  curl https://mise.run | sh
  mise install
```

mise がインストールしたバージョンのツールを確実に実行するには、必ず `mise x` コマンド経由で実行するようにしてください:

```yaml
script: |
  mise x -- npm test
```

あるいは、CI プロバイダーが許可していれば、[shim](/dev-tools/shims.md) ディレクトリを `PATH` に追加することもできます。

### ブートストラップ {#bootstrapping}

`curl https://mise.run | sh` を呼び出す代わりに、[`mise generate bootstrap`（原文）](https://mise.jdx.dev/cli/generate/bootstrap.html) を使って `mise` を実行・インストールするスクリプトを生成する方法もあります。

```shell
mise generate bootstrap -l -w
```

`.mise/` を `.gitignore` に追加し、生成された `./bin/mise` ファイルをコミットします。これで `./bin/mise` を使って、CI 内で直接 `mise` をインストール・実行できるようになります。

```yaml
script: |
  ./bin/mise install
  ./bin/mise x -- npm test
```

生成されたスクリプトはデフォルトでは生成時のバージョンをインストールしますが、[インストールスクリプト](/installing-mise.html) と同じ
`MISE_VERSION` と `MISE_INSTALL_PATH` の環境変数に従います。
明示的な `MISE_INSTALL_PATH` は常にそのまま使用されますが、それ以外の場合は `MISE_VERSION` によってデフォルトの
キャッシュパスも決まるため、CI 内でこれを変更すると、最初にキャッシュされたバージョンを再利用するのではなく、
指定したバージョンがインストールされます。

## 未信頼の設定に対して実行する（セーフモード） {#running-against-untrusted-config-safe-mode}

ジョブが自身の管理下にない設定からツールのバージョンを解決する場合 — よくあるのは、プルリクエストの
ブランチ上で `mise.lock` を更新するボットです — `MISE_SAFE=1` を設定することで、プロジェクトの設定が
コードを実行できないようにします。セーフモードでは、mise はテンプレートの `exec()`/`read_file()`、
`_.source` スクリプト、フック、タスク、asdf プラグインのスクリプト、プラグインのインストールの実行を
（エラーを出して、サイレントなフォールバックにはせずに）拒否します。一方、HTTP ベースのバックエンドに
よるバージョン解決は引き続き機能します。

```yaml
script: |
  MISE_SAFE=1 mise lock --bump --json
```

許可される操作と許可されない操作の完全な一覧については、[セーフモード（原文）](https://mise.jdx.dev/security.html#safe-mode) を参照してください。

## GitHub Actions {#github-actions}

GitHub Actions を使用している場合、mise とツールのインストールをラップした [mise-action](https://github.com/jdx/mise-action) を提供しています。ワークフローにこのアクションを追加するだけで利用できます:

```yaml
name: test
on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: jdx/mise-action@v3
        with:
          version: 2024.12.14 # [default: latest] mise version to install
          install: true # [default: true] run `mise install`
          cache: true # [default: true] cache mise using GitHub's cache
          experimental: true # [default: false] enable experimental features
          # automatically write this mise.toml file
          mise_toml: |
            [tools]
            shellcheck = "0.9.0"
          # or, if you prefer .tool-versions:
          tool_versions: |
            shellcheck 0.9.0
      - run: shellcheck scripts/*.sh
```

## GitLab CI {#gitlab-ci}

`mise` がインストールされた任意の docker イメージを使って CI ジョブを実行できます。
`debian-slim` をベースイメージとして使った例を示します:
::: details Dockerfile の例

```dockerfile
FROM debian:12-slim

RUN apt-get update  \
    && apt-get -y --no-install-recommends install  \
      # install any tools you need
      sudo curl git ca-certificates build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN curl https://mise.run | MISE_VERSION=v... MISE_INSTALL_PATH=/usr/local/bin/mise sh
```

:::

ジョブを設定する際、[mise のディレクトリ（原文）](https://mise.jdx.dev/directories.html) の一部をキャッシュできます。

```yaml
build-job:
  stage: build
  image: mise-debian-slim # Use the image you created
  variables:
    MISE_DATA_DIR: $CI_PROJECT_DIR/.mise/mise-data
  cache:
    - key:
        prefix: mise-
        files: ["mise.toml", "mise.lock"] # mise.lock is optional, only if using `lockfile = true`
      paths:
        - $MISE_DATA_DIR
  script:
    - mise install
    - mise exec --command 'npm build'
```

### ブートストラップスクリプトを使った例 {#example-with-the-bootstrap-script}

GitLab CI で `mise` を簡単に [ブートストラップ](#bootstrapping) するために、[`mise generate bootstrap`（原文）](https://mise.jdx.dev/cli/generate/bootstrap.html) を使う方法もあります。

```
mise generate bootstrap -l -w
```

これで、次のような汎用的な docker イメージを使って、CI 内で `mise` を実行・インストールできます。

::: details Dockerfile の例

```dockerfile
FROM debian:12-slim

RUN apt-get update  \
    && apt-get -y --no-install-recommends install sudo curl git ca-certificates build-essential \
    && rm -rf /var/lib/apt/lists/*
```

:::

`.gitlab-ci.yml` ファイルの例を示します:

```yaml
.mise-cache: &mise-cache
  key:
    prefix: mise-
    files: ["mise.toml", "./bin/mise"]
  paths:
    - .mise/installs
    - .mise/mise-2025.1.3

build-job:
  stage: build
  image: my-debian-slim-image # Use the image you created
  cache:
    - <<: *mise-cache
      policy: pull-push
  script:
    - ./bin/mise install
    - ./bin/mise exec --command 'npm build'
```

## Xcode Cloud {#xcode-cloud}

Xcode Cloud を使用している場合、カスタムの `ci_post_clone.sh` [ビルドスクリプト](https://developer.apple.com/documentation/xcode/writing-custom-build-scripts) を使って mise をインストールできます。例を示します:

```bash
#!/bin/sh
curl https://mise.run | sh
export PATH="$HOME/.local/bin:$PATH"

mise install # Installs the tools in mise.toml
eval "$(mise activate bash --shims)" # Adds the activated tools to $PATH

swiftlint {args}
```
