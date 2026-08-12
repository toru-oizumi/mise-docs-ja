# mise ドキュメント日本語訳（非公式）

日本語 | [English](./README.en.md)

[mise](https://github.com/jdx/mise)（mise-en-place）公式ドキュメントの**非公式**日本語訳です。mise の開発元とは関係ありません。

翻訳は LLM をベースに行い、生成物はすべてコミットして差分でレビューできる形にしています。ビルド時の動的翻訳はしていません。

非公式である旨・LLM 翻訳である旨・免責は [NOTICE.md](./NOTICE.md) を参照してください。

## 上流に迷惑をかけないための設計

- 全ページの `canonical` を原文の URL に向けている。検索結果で原文を置き換えることは意図していない
- sitemap は生成していない
- mise のロゴ・favicon・ブランド表現は使っていない
- 広告・アフィリエイトは入れていない
- 本家リポジトリに PR は出さず、維持コストをこちら側に閉じ込めている

## 構成

```
upstream/docs/   翻訳した時点の原文スナップショット（コミットする）
src/             訳文と VitePress のソース
scripts/         同期と検証
  scope.ts       翻訳スコープの単一の情報源
```

`upstream/` をコミットしているのが同期設計の要です。翻訳した時点の原文が固定されているので、次回は本家の最新との diff を取るだけで「原文の何が変わったか」が正確に分かり、その差分だけを再翻訳できます。

## タスク

```
mise run install        依存をインストール（bun）
mise run dev            開発サーバー
mise run build          本番ビルド
mise run check          公開前の全チェック（下の6つをまとめて実行）

mise run fmt            oxfmt で整形（Markdown は対象外）
mise run fmt:check      整形されているかの確認
mise run lint           oxlint
mise run typecheck      TypeScript の型検査
mise run verify         原文と訳の構造が 1:1 対応しているかを機械照合
mise run check:links    リンク切れとアンカー切れ
mise run check:build    ビルド成果物の検査（バナー・canonical・ブランドの混入）

mise run anchors        原文の見出しから、訳文で付けるべきアンカーを出力
mise run sync           本家の最新を取得して差分を表示（翻訳はしない）
mise run sync:apply     upstream/ と .upstream-ref を進める
mise run stale          追従できていないページの一覧
```

ツールチェーンは bun / node / oxlint / oxfmt で、バージョンは `mise.toml` に固定しています。bun が TypeScript を直接実行するので `scripts/` に変換ステップは要りません。

**`oxfmt` は Markdown を整形しません**（`.oxfmtrc.json` で除外）。訳文を再整形すると行の折り返しやテーブルの桁が変わり、原文との 1:1 対応が壊れて差分同期が成立しなくなるためです。


## このリポジトリのルール

言語の使い分けを固定しています。理由は、コミット履歴と PR タイトルは GitHub や
ツールが横断的に読む機械可読な面であり、PR 本文とドキュメントは人間が読む面だからです。

| 対象 | 言語 | 形式 |
|---|---|---|
| コミットメッセージ | **英語** | [Conventional Commits](https://www.conventionalcommits.org/) |
| PR のタイトル | **英語** | Conventional Commits |
| PR の本文 | **日本語** | `.github/pull_request_template.md` に従う |
| 訳文・ドキュメント・コード内コメント | **日本語** | |

コミットメッセージの例。

```
feat(sync): report pages that upstream deleted
fix(verify): resolve relative links against the page directory
docs(tasks): translate toml-tasks.md
chore(deps): bump vitepress to 1.6.4
```

使う type は `feat` / `fix` / `docs` / `refactor` / `test` / `chore` / `ci` / `build` / `perf` / `style` / `revert`。訳文を追加・更新するコミットは `docs` を使います。

**これらは CI で強制しています**（`.github/workflows/conventions.yml`）。PR のタイトルと、その PR に含まれるコミットのメッセージを検査し、英語でない場合や Conventional Commits でない場合は落ちます。

## 翻訳するとき

`CLAUDE.md` と `glossary.md` を必ず読んでください。特に次の2点は事故が起きやすい箇所です。

- **アンカーは自分で考えず `mise run anchors` の出力を写す。** 原文サイトからの deep link が切れる
- **コードブロックの中身は1文字も変えない。** 読者が壊れたコマンドをコピペする

訳し終えたら `mise run verify -- <ファイル>` を実行し、error 0 になるまで直します。目視で数を数えないでください。

## 差分同期

```
mise run sync
```

`.sync/` に原文の unified diff が出ます。変更のあったブロックだけを訳し直し、無関係な段落には手を触れません。typo 修正やリンク差し替えだけなら訳の更新は不要と判断してよいことになっています。

**`upstream/` の更新と訳の更新は必ず同一コミットに含めてください。** 片方だけ進むと次回の diff が壊れます。

## ライセンス

原文は [jdx/mise](https://github.com/jdx/mise)（MIT License）です。本家には著作権表示が2つあるため、[LICENSE](./LICENSE) に両方をそのまま同梱しています。

訳文は原文と同じ MIT License の条件で利用できます。
