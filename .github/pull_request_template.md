<!--
タイトルは英語の Conventional Commits で書いてください（CI が検査します）。
  例: docs(tasks): translate task-configuration.md
      fix(verify): resolve relative links against the page directory

本文は日本語で書いてください。以下の見出しは削らないでください。
-->

## 何をしたか

<!-- 変更の内容を簡潔に。翻訳なら対象ページと原文の commit hash を書く -->

## なぜ

<!-- この変更が必要な理由。チケットや issue があればリンクする -->

## 確認したこと

<!--
翻訳を含む場合は必須。`mise run check` の結果を貼る。
翻訳ページごとの verify の結果（error 0 であること）も書く。
-->

```
$ mise run check
```

- [ ] `mise run check` が通っている
- [ ] 翻訳を含む場合、`upstream/` の更新と訳の更新を同一コミットに入れた
- [ ] 翻訳を含む場合、アンカーは `mise run anchors` の出力を写した（自分で考えていない）
- [ ] コードブロックの中身を1文字も変えていない

## 補足

<!-- レビュアーに見てほしい点、判断に迷った箇所、既知の制約など。無ければ削る -->
