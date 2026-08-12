# 用語集 — mise ドキュメント日本語訳

翻訳時は必ずこの表に従う。表にない用語で判断に迷ったものは、訳語を決めてこのファイルに追記してから使うこと。**その場限りの訳語を作らない。**

## 中核概念

| 原語 | 訳語 | 備考 |
|---|---|---|
| tool | ツール | mise が管理する対象。「道具」と訳さない |
| toolset | ツールセット | |
| backend | バックエンド | ツールの取得方式（`asdf`, `core`, `npm` 等） |
| task | タスク | mise のタスクランナー機能。「作業」と訳さない |
| environment | 環境 | `env var` とは別概念。混同しない |
| environment variable / env var | 環境変数 | |
| config file | 設定ファイル | `mise.toml` 等 |
| settings | 設定項目 | 個々の設定値。設定ファイル全般と区別する |
| registry | レジストリ | |
| plugin | プラグイン | |
| runtime | ランタイム | |
| shim | shim | 訳さない。初出時のみ「shim（シム）」と読みを添えてよい |
| lockfile | ロックファイル | `mise.lock` |
| profile | プロファイル | |
| hook | フック | |
| alias | エイリアス | |

## 動作・状態

| 原語 | 訳語 | 備考 |
|---|---|---|
| trust / trusted | 信頼する / 信頼済み | `mise trust` はコマンド名なので原語のまま |
| untrusted | 未信頼 | |
| activate | 有効化する | `mise activate` はコマンド名なので原語のまま |
| install | インストールする | |
| uninstall | アンインストールする | |
| resolve | 解決する | バージョンの解決 |
| pin | 固定する | バージョンの固定 |
| prune | 削除する / 整理する | 文脈に応じて |
| deprecated | 非推奨 | |
| experimental | 実験的 | 「試験的」と揺らさない |
| stable | 安定版 | |
| legacy | 旧来の / レガシー | 文脈に応じて |

## スコープ

| 原語 | 訳語 | 備考 |
|---|---|---|
| global | グローバル | |
| local | ローカル | |
| project | プロジェクト | |
| directory | ディレクトリ | 「フォルダ」と訳さない |
| working directory | 作業ディレクトリ | |
| parent directory | 親ディレクトリ | |

## 一般

| 原語 | 訳語 | 備考 |
|---|---|---|
| dependency | 依存関係 | |
| version | バージョン | |
| release | リリース | |
| prefix | プレフィックス | |
| suffix | サフィックス | |
| offline | オフライン | |
| cache | キャッシュ | |
| shell | シェル | |
| flag / option | オプション | CLI の `--foo`。「フラグ」と揺らさない |
| argument | 引数 | |
| subcommand | サブコマンド | |
| output | 出力 | |
| idiomatic version file | idiomatic バージョンファイル | `.node-version` 等。初出時に「idiomatic バージョンファイル（idiomatic version file）」と併記 |
| interactive shell | インタラクティブシェル | 「対話的シェル」と揺らさない |
| autocompletion / completion | 自動補完 | 「オートコンプリート」としない |
| walkthrough | ウォークスルー | |
| intercept | 横取りする | shim の説明で出る。「インターセプトする」としない |
| one-off (command) | 単発の（コマンド） | 「ワンオフ」としない |
| symlink | シンボリックリンク | |
| rc file | rc ファイル | `~/.zshrc` 等。訳さない |
| approach | アプローチ | |
| safe mode | セーフモード | `MISE_SAFE` はコード識別子なので原語のまま |
| modern plugins | モダンプラグイン | `asdf plugins` との対比で使われる固定カテゴリ名 |
| shorthand | 省略形 | |
| cookbook | クックブック | |
| formula | フォーミュラ | Homebrew の用語 |
| manifest | マニフェスト | Scoop / winget の用語 |
| community repository | コミュニティリポジトリ | |
| bit rot | 陳腐化 | 原語併記はしない |
| usage | usage | `https://usage.jdx.dev` のツール名。訳さない |

## 訳さないもの（原語のまま）

- コマンド名・サブコマンド名: `mise use`, `mise exec`, `mise trust`, `mise activate` …
- 設定キー: `tools`, `env`, `tasks`, `settings`, `idiomatic_version_file` …
- 環境変数名: `MISE_ENV`, `MISE_DATA_DIR` …
- ファイル名・パス: `mise.toml`, `~/.config/mise/`, `.tool-versions` …
- 固有名詞: asdf, direnv, Homebrew, Node.js, Rust, Cargo, npm, pipx, GitHub Actions …
- バックエンド名: `core`, `asdf`, `vfox`, `ubi`, `aqua`, `npm`, `cargo`, `go`, `pipx`, `spm` …

## 定型フレーズ

| 原文 | 訳 |
|---|---|
| Note that ... | 〜である点に注意してください |
| You can ... | 〜できます（「〜することができます」としない） |
| See also | 関連項目 |
| For example | 例えば |
| By default, ... | デフォルトでは〜 |
| If you want to ... | 〜したい場合は |
| This is useful when ... | 〜する場合に便利です |
| Make sure to ... | 必ず〜してください |
| We recommend ... | 〜を推奨します |
| Coming soon | 近日対応予定 |
| you'll probably want to ... | 〜しておくとよいでしょう（「〜する必要があります」は誤り。任意の推奨を必須に変えてしまう） |
| Yes / No（テーブルの対応表） | はい / いいえ |
| Feature（テーブルのヘッダ） | 機能 |
| Something else? | その他のシェルは？（文脈に応じて「その他は？」） |
| ::: details Example X | ::: details X の例（ラベル `details` は訳さず、タイトルだけ訳す） |

## 見出しの定型

| 原文 | 訳 |
|---|---|
| Getting Started | はじめに |
| Installation / Installing | インストール |
| Usage | 使い方 |
| Configuration | 設定 |
| Examples | 例 |
| Options | オプション |
| Troubleshooting | トラブルシューティング |
| FAQ | よくある質問 |
| Requirements | 要件 |
| Limitations | 制限事項 |
| See Also | 関連項目 |
