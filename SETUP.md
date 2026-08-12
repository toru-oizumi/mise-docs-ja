# mise ドキュメント日本語訳（非公式）— リポジトリ設計

Claude Code に渡す設計メモ。実装前にこれを読ませる。

## 前提

- 本家: `jdx/mise`（MIT, Copyright (c) 2025 Jeff Dickey）。ドキュメントは本体リポジトリの `docs/` 配下。
- 本家に PR は出さない。**独立した非公式サイトとして運用し、維持コストを自分側に閉じ込める。**
- 翻訳は LLM で行うが、生成物は必ずコミットして diff でレビュー可能にする（ビルド時翻訳は禁止）。

## 1. リポジトリ構成

本家の fork ではなく**独立リポジトリ**を作る。fork にすると本家の巨大な Rust ツリーを引きずり、GitHub 上でも「本家の派生」に見えて誤解を招く。

```
mise-docs-ja/
├── .upstream-ref            # 取り込み済み upstream の commit hash（1行）
├── upstream/                # 原文スナップショット（★コミットする）
│   └── docs/**/*.md
├── src/                     # 翻訳後の Markdown（VitePress のソース）
│   ├── .vitepress/
│   │   ├── config.ts
│   │   └── theme/           # 非公式バナー・原文リンクの表示
│   └── **/*.md
├── scripts/
│   ├── sync-upstream.ts     # 本家を取得 → upstream/ との diff を出す
│   └── report-stale.ts      # 未追従ページの一覧を出す
├── glossary.md              # 用語集（翻訳時に必ず読ませる）
├── CLAUDE.md                # 翻訳ルール
├── mise.toml                # タスクランナー（mise 自身を使う）
├── LICENSE                  # 本家 MIT 全文 + 著作権表示をそのまま同梱
└── NOTICE.md                # 非公式である旨・翻訳部分の扱い・免責
```

### `upstream/` を必ずコミットする理由

これが同期設計の肝。**翻訳した時点の原文が固定されている**ので、次回は

```
diff(upstream/docs/foo.md, 本家最新の docs/foo.md)
```

で「原文の何が変わったか」が正確に取れる。この差分だけを Claude Code に渡して部分再翻訳する。全文を毎回再生成すると、訳語が揺れる・差分が汚れる・トークンを浪費する、の三重苦になる。

## 2. VitePress 構成

本家の `docs/.vitepress/config.ts` を**丸ごと流用しない**。本家の設定は Rust 側から自動生成される CLI ドキュメントやカスタムプラグインに依存している可能性が高く、追従コストが跳ね上がる。

方針:

1. まず本家の `docs/.vitepress/` を実際に読み、依存の重さを確認する（← Claude Code の最初の調査タスク）
2. サイドバー定義など**データとして流用できる部分だけ**を移植し、ビルドパイプラインは自前の最小構成にする
3. i18n 機能（`locales`）は使わない。日本語単言語サイトとして構築する方がシンプル

### 必須の実装項目

**canonical を原文に向ける。** 非公式訳が検索結果で本家を食うのが上流にとって最悪の迷惑。`transformHead` で全ページに入れる。

```ts
transformHead({ pageData }) {
  const upstream = pageData.frontmatter.upstreamUrl
  return upstream ? [['link', { rel: 'canonical', href: upstream }]] : []
}
```

**全ページ共通の非公式バナー。** 各 Markdown に手で書くと必ず漏れるので、テーマの Layout で `doc-before` スロットに差し込む。内容:

- 非公式・有志による翻訳であること
- LLM による機械翻訳をベースにしていること
- 正確な情報は原文を参照すること（原文への直リンク）
- 翻訳時点の原文バージョン（`upstreamRef` の短縮 hash と日付）

**frontmatter にメタを持たせる。** 翻訳スクリプトが自動付与する。

```yaml
---
title: タスクの実行
upstreamPath: docs/tasks/running-tasks.md
upstreamUrl: https://mise.jdx.dev/tasks/running-tasks.html
upstreamRef: a1b2c3d
upstreamDate: 2026-08-12
---
```

## 3. スコープ（第1弾）

コアのみ。**まず回して、運用が続くか確かめる**のが目的。全ページ訳して半年で腐るのが一番まずい。

対象の選定基準:

- 初見のユーザーが最初に読む導線（Getting Started / Installing / Walkthrough）
- 設定ファイルの説明（Configuration, Settings）
- 主要機能（Dev Tools, Environments, Tasks）
- FAQ / Troubleshooting

除外:

- `cli/` 配下のコマンドリファレンス（自動生成で量が多く、更新頻度も高い。原文の方が信頼できる）
- CHANGELOG、コントリビューションガイド

実際のファイル一覧は本家リポジトリを clone して確認し、上記基準で確定させる。

**未翻訳ページへのフォールバック**を必ず用意する。サイドバーには載せるが、リンク先は原文サイトの絶対 URL にして「（原文）」と付ける。404 や空ページを出さない。

## 4. 同期フロー

`mise.toml` にタスクとして定義する（mise のドキュメントサイトなので mise を使うのが筋）。

```toml
[tasks.sync]
description = "本家の最新を取得して差分を表示"
run = "tsx scripts/sync-upstream.ts"

[tasks.stale]
description = "追従できていないページを一覧表示"
run = "tsx scripts/report-stale.ts"

[tasks.dev]
run = "vitepress dev src"

[tasks.build]
run = "vitepress build src"
```

### `sync-upstream.ts` の挙動

1. 本家を shallow clone（または既存の clone を fetch）して最新 main の hash を取得
2. `.upstream-ref` の hash と比較し、`docs/` 配下の変更ファイル一覧を取得
3. 各ファイルについて old→new の unified diff を `.sync/` 配下に書き出す
4. サマリを標準出力に出す（新規 / 変更 / 削除 / リネーム）
5. **ここでは翻訳しない。** 翻訳は Claude Code が `.sync/` を読んで実行する

### 再翻訳の単位

- **新規ファイル** → 全文翻訳
- **既存ファイルの変更** → diff を渡して該当箇所だけ差し替え。無関係な段落は絶対に触らせない
- **削除** → 訳も削除、サイドバーから外す
- 変更が typo 修正やリンク差し替えだけなら翻訳不要と判断してよい

同期後、`upstream/` を最新に更新し `.upstream-ref` を書き換えて、翻訳と同じコミットに含める。**原文更新と訳更新を必ず同一コミットにする**（片方だけ進むと次回の diff が壊れる）。

### 自動化の温度感

GitHub Actions で「週1で `sync` を回し、差分があれば issue を立てる」までは自動化してよい。**翻訳の自動 PR 生成まで自動化しない** — レビューなしの訳が積み上がると、それこそ slop になる。人間が着手のトリガーを引く形を保つ。

## 5. 公開設定

- GitHub Pages。リポジトリ名は `mise-docs-ja` など、公式と誤認しないもの
- 独自ドメインを取るなら `mise-ja.*` 系は避ける。`unofficial` を含めるか、個人のサブドメイン配下に置く
- サイトタイトル: `mise ドキュメント日本語訳（非公式）`
- mise のロゴは使わない。favicon も別のものにする
- 広告・アフィリエイトは入れない
- `LICENSE` に本家の MIT 全文と `Copyright (c) 2025 Jeff Dickey` をそのまま同梱（MIT の唯一の義務）
- `NOTICE.md` に、翻訳部分の権利の扱いと免責を記載

## 6. 上流への連絡

サイトを立てて数週間運用してから、[Discussions](https://github.com/jdx/mise/discussions) に一報を入れる。**許可を求める**のではなく（MIT なので不要）、**存在の告知と、迷惑をかけない設計になっていることの説明**として書く。

盛り込む内容:

- 非公式の日本語訳を公開した旨と URL
- canonical を本家に向けているので検索順位を奪わない設計であること
- 維持は自分が行い、本家に一切の負担をかけないこと
- 問題があれば取り下げる用意があること

「取り込みませんか」を最初から提案しない。本家が日本語をレビューできない以上、それは相手にコストを渡す提案になる。向こうから聞かれたら答えればよい。
