---
title: 設定環境
upstreamPath: docs/configuration/environments.md
upstreamUrl: https://mise.jdx.dev/configuration/environments.html
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

# 設定環境 {#config-environments}

同じディレクトリ内に、`development` や `production` のような異なる環境向けの別々の `mise.toml` ファイルを持てます。これを有効にするには、次のいずれかの方法で `MISE_ENV` を `development` や `production` のような環境に設定します。

- CLI オプション: `-E development` または `--env development`
- 環境変数: `MISE_ENV=development`
- `.miserc.toml` ファイル: `env = ["development"]`

mise はその後、現在のディレクトリ、親ディレクトリ、および `MISE_CONFIG_DIR` ディレクトリ内で `mise.{MISE_ENV}.toml` ファイルを探します。

## .miserc.toml で MISE_ENV を設定する {#setting-mise-env-in-miserc-toml}

`.miserc.toml` ファイルで `MISE_ENV` を設定できます。このファイルは、他の設定ファイルが検出されるよりもかなり早い段階で読み込まれます。これにより、環境の設定をバージョン管理にコミットできます。

```toml
# .miserc.toml
env = ["development"]
```

### .miserc.toml でのテンプレート {#templates-in-miserc-toml}

`.miserc.toml` は [Tera テンプレート（原文）](https://mise.jdx.dev/templates.html#miserc-template-support) をサポートしています。これは、ホームディレクトリや XDG ディレクトリを参照する `ceiling_paths` のような設定項目で便利です。

<div v-pre>

```toml
# .miserc.toml

# Stop config search at $HOME
ceiling_paths = ["{{ env.HOME }}"]

# Or use the XDG config home variable
ignored_config_paths = ["{{ xdg_config_home }}/mise/shared.toml"]
```

</div>

OS レベルのコンテキスト（環境変数、`cwd`、`arch()`、`os()` など）のみが利用可能である点に注意してください。この時点では `mise.toml` からの設定項目はまだ読み込まれていません。

検索されるファイルの場所（優先順位順）:

1. `.miserc.toml` および `.config/miserc.toml`（現在のディレクトリと親ディレクトリ内）
2. `~/.config/mise/miserc.toml`（グローバル）
3. `/etc/mise/miserc.toml`（システム）

注: `MISE_ENV` は、そもそもどの設定ファイルを読み込むかを決定するものなので、`mise.toml` 内で設定することはできません。

mise は、現在のディレクトリと親ディレクトリ内で `mise.local.toml` や `mise.{MISE_ENV}.local.toml` のような「ローカル」ファイルも探します。
これらはバージョン管理にコミットしないことを意図したものです。
（`mise.local.toml` と `mise.*.local.toml` を `.gitignore` ファイルに追加してください。）

これらのファイルの優先順位は次の順序になります（上が下を上書きします）:

- `mise.{MISE_ENV}.local.toml`
- `mise.local.toml`
- `mise.{MISE_ENV}.toml`
- `mise.toml`

`MISE_OVERRIDE_CONFIG_FILENAMES` が設定されている場合、これらすべての代わりにそちらが使用されます。

`mise/config.{MISE_ENV}.toml` や `.config/mise.{MISE_ENV}.toml` のようなパスも使用できます。それらの規則は [設定](/configuration) の順序に従います。

どのファイルが使用されているかを確認するには `mise config` を使います。

どのファイルに書き込まれるかについての規則は異なります。最終的には1つを選ぶ必要があるためです。詳細は [`mise use`（原文）](https://mise.jdx.dev/cli/use.html) のドキュメントを参照してください。

複数の環境を指定することもできます。例えば `MISE_ENV=ci,test` のように指定すると、最後のものが優先されます。

## プラットフォーム環境 {#platform-environments}

[`auto_env` 設定項目（原文）](https://mise.jdx.dev/configuration/settings.html#auto_env) を有効にすると、mise は現在のプラットフォームに基づいて、以下を自動的にアクティブな設定環境として扱います。

| Environment   | Values                                         |
| ------------- | ---------------------------------------------- |
| `{os_family}` | `unix`（Windows では未定義 — `windows` を使用） |
| `{os}`        | `linux`, `macos`, `windows`                    |
| `{os}-{arch}` | 例: `linux-x64`, `macos-arm64`, `windows-x64`  |

アーキテクチャには mise が再マッピングした名前が使われます: `x86_64` → `x64`、`aarch64` → `arm64`。

これにより、`mise.windows.toml`、`mise.macos-arm64.toml`、`mise.unix.toml` のような設定ファイルが自動的に読み込まれ、`mise.windows.lock` のような対応するロックファイルが選択されます。通常のすべての設定ファイルの場所と `.local.toml` のバリエーションが機能します。

プラットフォーム環境は、明示的な `MISE_ENV` エントリよりも優先順位が低くなります。完全な順序は次のとおりです（後にあるものが前を上書きします）: `unix` < `{os}` < `{os}-{arch}` < 明示的な `MISE_ENV` エントリ

プラットフォーム環境は、設定ファイルの検出とロックファイルの選択にのみ影響します。`MISE_ENV` 自体に追加されるわけではありません。`{{ mise_env }}` テンプレート変数、およびサブプロセスやタスクに渡される `MISE_ENV` 変数は、明示的な環境のみを反映します。

### ロールアウト {#rollout}

`auto_env` は現在 **デフォルトで無効** になっています。mise `2027.6.0` からはデフォルトで有効になります。それまでの `2026.12.0` からは、新たに読み込まれることになるプラットフォーム固有の設定ファイルが見つかった場合、mise が警告を表示します。動作を明示的に制御するには:

```toml
# .miserc.toml
auto_env = true # adopt the new behavior now
# or
auto_env = false # keep the old behavior and silence the warning
```

または `MISE_AUTO_ENV=true` / `MISE_AUTO_ENV=false` を設定します。`MISE_ENV` と同様、これは早期初期化される設定項目です。`.miserc.toml` 内か環境変数経由で設定する必要があります — `mise.toml` 内で設定しても効果はありません。`mise.toml` が読み込まれる時点では、設定ファイルの検出はすでに完了しているためです。
