---
layout: home
title: mise ドキュメント日本語訳（非公式）
# トップページは title 自体がサイト名なので、titleTemplate で
# サイト名を後置すると同じ文字列が2回並ぶ
titleTemplate: false

hero:
  name: mise ドキュメント
  text: 日本語訳（非公式）
  tagline: 開発ツール・環境変数・タスクを1つの CLI で扱う mise のドキュメントを、有志が日本語に訳したものです。
  actions:
    - theme: brand
      text: はじめに
      link: /getting-started
    - theme: alt
      text: mise.toml の設定
      link: /configuration
    - theme: alt
      text: 公式ドキュメント（原文）
      link: https://mise.jdx.dev/

features:
  - title: はじめに
    details: mise のインストールから、ツールのインストール・シェルの有効化・タスクの実行までを一通り試します。
    link: /getting-started
  - title: mise.toml
    details: 設定ファイルの書き方。tools・env・tasks の各セクションと、設定ファイルが読まれる順序。
    link: /configuration
  - title: 開発ツール
    details: 言語やツールのバージョンを固定して切り替える仕組みと、shim の使い分け。
    link: /dev-tools/
  - title: 環境変数
    details: ディレクトリに入ったときに読み込まれる環境変数と、ファイルからの読み込み。
    link: /environments/
  - title: タスク
    details: mise.toml に書くタスクと、ファイルとして置くタスク。依存関係と並列実行。
    link: /tasks/
  - title: よくある質問
    details: つまずきやすい点と、トラブルシューティング。
    link: /faq
---

## この翻訳について {#about-this-translation}

このサイトは **[mise](https://github.com/jdx/mise) の公式ドキュメントを有志が日本語訳した非公式サイト**です。mise の開発元および開発者とは一切関係がありません。

- 翻訳は **LLM による機械翻訳をベース**にしており、誤訳・訳し漏れ・原文の更新に追いついていない箇所が含まれることがあります
- **正確な情報が必要な場合は必ず[原文](https://mise.jdx.dev/)を参照してください。** 各ページの冒頭に、そのページの原文への直リンクと、翻訳時点の原文のバージョンを表示しています
- すべての翻訳ページは `canonical` を原文に向けています。このサイトが検索結果で原文を置き換えることは意図していません
- 翻訳対象は現時点でコアのドキュメントに限られています。未翻訳のページはサイドバーに「（原文）」付きで並んでおり、リンク先は原文サイトです

原文は [jdx/mise](https://github.com/jdx/mise)（MIT License）です。ライセンス全文は同梱の `LICENSE` に、訳文の権利の扱いと免責は `NOTICE.md` に記載しています。

誤訳を見つけた場合は、このサイトのリポジトリに報告してください。**原文の内容そのものに関する問題は、本家のリポジトリに報告してください**（訳の問題と原文の問題を混ぜると、本家に余計な負担がかかります）。
