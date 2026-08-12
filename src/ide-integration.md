---
title: IDE との連携
upstreamPath: docs/ide-integration.md
upstreamUrl: https://mise.jdx.dev/ide-integration.html
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

# IDE との連携 {#ide-integration}

コードエディタや IDE はインタラクティブシェルとは異なる動作をします。

多くの場合、現在のシェルから環境を引き継ぐ（`nvim .` や `code .` のようにターミナルから起動した場合はこれに該当します）か、[独自の方法](https://github.com/microsoft/vscode-docs/blob/906acccd6180d8425577f8297ed29e221ad3daca/docs/supporting/faq.md?plain=1#L238)で環境をセットアップします。

一度 IDE を起動すると、mise の設定ファイルを更新しても、`mise` が提供する環境変数や `PATH` は再読み込みされません。そのため、エディタを自動的にセットアップするために、デフォルトの `mise activate` の方法に頼ることはできません。

`mise` をエディタで動作させるにはいくつかの方法があります。

- 一部のエディタや IDE プラグインは `mise` を直接サポートしており、IDE の設定からツール／SDK のパスを選択できます。これによりツールのバイナリにアクセスできますが、環境変数は読み込まれません。
- 多くのエディタ（および言語プラグイン）は `PATH` 上のツールを探し、プロジェクトのコンテキストでそれらを実行します。そのため、mise の shim を `PATH` に追加するだけで十分な場合があります（[下記](#adding-shims-to-path-default-shell)を参照）。これにより mise が提供するツールが実行され、環境変数も読み込まれます。
- それ以外の場合は、`mise` が提供するツールへのパスを IDE の設定に手動で指定する必要があるかもしれません。これは [`mise which <tool>`（原文）](https://mise.jdx.dev/cli/which.html) や [`mise where`（原文）](https://mise.jdx.dev/cli/where.html) を使うことで行えます。プラグインが対応していれば、ツールの shim へのパス（例: `~/.local/share/mise/shims/node`）を指定することもできます。これによりツール実行時に環境変数も読み込まれます。
- 最後に、`mise` と連携するためにいくつかのカスタムプラグインが開発されています。[IDE プラグイン](#ide-plugins) の節で確認できます。

## デフォルトシェルのプロファイルに shim を PATH に追加する {#adding-shims-to-path-default-shell}

IDE は環境変数の変更よりも [shim](/dev-tools/shims) の方がうまく機能します。最も簡単な方法は、mise の shim ディレクトリを `PATH` に追加することです。

IntelliJ や VSCode など、そしておそらく他のエディタでも、デフォルトシェルのログイン（いわゆる「プロファイル」）スクリプトを変更できます。デフォルトシェルは次のようにして確認できます。

::: code-group

```shell [macos]
dscl . -read /Users/$USER UserShell
```

```shell [linux]
getent passwd $USER | cut -d: -f7
```

:::

`chsh -s /path/to/shell` でデフォルトシェルを変更できますが、その前に `/etc/shells` に追加する必要があるかもしれません。正しいシェルが分かったら、該当するファイルを変更します。

::: code-group

```zsh
# ~/.zprofile
eval "$(mise activate zsh --shims)"
```

```bash
# ~/.bash_profile or ~/.bash_login or ~/.profile
eval "$(mise activate bash --shims)"
```

```fish
# ~/.config/fish/config.fish
if status is-interactive
  mise activate fish | source
else
  mise activate fish --shims | source
end
```

:::

::: warning
macOS では /bin/bash や /usr/bin/bash を使わないでください。bash は複雑で何十年も前からあるもので、mise はそれほど多くの機能を使うことができません。
bash の専門家で、なぜ私（そして Apple も）が bash の使用を戒めているのか理解しているのでない限り、macOS では zsh を使ってください。
:::

Linux ではこれはマシンにログインしたときに読み込まれるため、変更するにはログアウトして再度ログインする必要があります。VSCode にログインファイルを読み込ませる方法については、下記の [VSCode](#vscode) を参照してください。

これは `mise` が `PATH` 上にあることを前提としています。そうでない場合は、絶対パスを使う必要があります
（例: `eval "$($HOME/.local/bin/mise activate zsh --shims)"`）。

VSCode が `mise` が提供する `node` を使用している例を示します。

::: tabs
=== VSCode

![shim を使う VSCode](./shims-vscode.png)

=== IntelliJ
![shim を使う IntelliJ](./shims-intellij.png)
:::

前述の通り、`shims` を使ってもすべての mise の機能が動作するわけではありません。例えば、`[env]` 内の任意の [env var](/environments/) は shim が実行されたときのみ設定されます。このためには、IDE とのより密な連携やカスタムプラグインが必要です。

## IDE プラグイン {#ide-plugins}

`mise` と連携するために開発されたコミュニティのプラグインをいくつか紹介します。

- Emacs: [mise.el](https://github.com/liuyinz/mise.el)
- IntelliJ: [intellij-mise](https://github.com/134130/intellij-mise)
- VSCode: [mise-vscode](https://github.com/hverlin/mise-vscode)

## Vim {#vim}

```vim
" Prepend mise shims to PATH
let $PATH = $HOME . '/.local/share/mise/shims:' . $PATH
```

## Neovim {#neovim}

```lua
-- Prepend mise shims to PATH
vim.env.PATH = vim.env.HOME .. "/.local/share/mise/shims:" .. vim.env.PATH
```

より良い Treesitter や LSP との連携については、[neovim cookbook（原文）](https://mise.jdx.dev/mise-cookbook/neovim.html) を参照してください。

## emacs {#emacs}

### 従来の shim の方法 {#traditional-shims-way}

```lisp
;; CLI tools installed by Mise
;; See: https://www.emacswiki.org/emacs/ExecPath
(setenv "PATH" (concat (getenv "PATH") ":/home/user/.local/share/mise/shims"))
(setq exec-path (append exec-path '("/home/user/.local/share/mise/shims")))
```

### パッケージ [mise.el](https://github.com/eki3z/mise.el) を使う方法 {#use-with-package-mise-el}

<https://github.com/eki3z/mise.el>

> ディレクトリ／プロジェクトごとの環境変数を mise ツールを使って判定し、それらの環境変数をバッファごとに設定する GNU Emacs ライブラリ。

```lisp
(require 'mise)
(add-hook 'after-init-hook #'global-mise-mode)
```

## JetBrains 系エディタ（IntelliJ, RustRover, PyCharm, WebStorm, RubyMine, GoLand など） {#jetbrains-editors-intellij-rustrover-pycharm-webstorm-rubymine-goland-etc}

### IntelliJ プラグイン {#intellij-plugin}

<https://github.com/134130/intellij-mise>

このプラグインは、mise が提供するツールを使うように IDE を自動的に設定できます。mise のタスクを実行したり、実行構成で環境変数を読み込んだりすることにもある程度対応しています。

### SDK を直接選択する {#direct-sdk-selection}

一部の JetBrains IDE（や言語プラグイン）は `mise` を直接サポートしています。これにより、IDE の設定から SDK のバージョンを選択できます。
Java の場合の例です。

![SDK の設定](./intellij-sdk-selection.png)

### asdf レイアウトを使った SDK 選択 {#sdk-selection-using-asdf-layout}

一部のプラグインは `mise` がインストールした SDK をまだ見つけられませんが、asdf には対応している場合があります。
その場合の回避策は、asdf と同じレイアウトを持つ mise のツールディレクトリをシンボリックリンクすることです。

```sh
ln -s ~/.local/share/mise ~/.asdf
```

そうすると、Project Settings に表示されるはずです。

![プロジェクトの設定](https://github.com/jdx/mise-docs/assets/216188/b34a0e3f-7af8-45c9-85b8-2c72bd1dc226)

node の場合（おそらく他の言語も）は、「Languages & Frameworks」の下にあります。

![Languages & Frameworks](https://github.com/jdx/mise-docs/assets/216188/9926be1c-ab88-451a-8ace-edf2dac564b5)

## VSCode {#vscode}

### macOS 向け VSCode Automation Profile {#vscode-automation-profile-for-macos}

Linux とは異なり、macOS はマシンへのログイン時にログインシェルのプロファイル（`~/.profile` や `~/.zprofile`）を読み込みません。shim を読み込ませるには、次の設定を VSCode の設定に追加しておくとよいでしょう。

```json
    "terminal.integrated.automationProfile.osx": {
        "path": "/usr/bin/zsh",
        "args": ["--login"]
    }
```

:::tip
`~/.zshrc` も含めたい場合は、`["--login", "--interactive"]` を使うこともできます。
:::

### VSCode プラグイン {#vscode-plugin}

[VSCode プラグイン](https://marketplace.visualstudio.com/items?itemName=hverlin.mise-vscode) があり、shim を `PATH` に追加するためにシェルのプロファイルを変更しなくても、他の拡張機能を設定できます。

加えて、次のような追加機能も提供します。

- `mise` が提供するツールを使うように他の拡張機能を自動設定
- VSCode から直接 `mise` のタスク、ツール、環境変数を管理
- VSCode で `mise.toml` ファイルから環境変数を読み込み
- `mise.toml` ファイルの自動補完とスニペットに対応
- VSCode のタスクとの連携

<https://github.com/hverlin/mise-vscode/>（[ドキュメント](https://hverlin.github.io/mise-vscode/)）

### launch Configuration で [`mise exec`（原文）](https://mise.jdx.dev/cli/exec.html) を使う {#use-mise-exec-in-launch-configuration}

デフォルトのシェルプロファイルを変更するのが恐らく最も簡単な方法ですが、`launch.json` でツールを設定することもできます。

::: details mise exec launch.json の例

```json
{
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "${file}",
      "args": [],
      "osx": {
        "runtimeExecutable": "mise"
      },
      "linux": {
        "runtimeExecutable": "mise"
      },
      "runtimeArgs": ["exec", "--", "node"]
    }
  ]
}
```

:::

## Xcode {#xcode}

Xcode のプロジェクトは、スクリプトビルドフェーズやスキームからシステムコマンドを実行できます。Xcode はツール `/usr/bin/sandbox-exec` を使ってスクリプトの実行をサンドボックス化するため、Mise や自動的に有効化されるツールがそのままでは動作しないと想定してください。まず、**Input files** のリストに `$(SRCROOT)/mise.toml` を追加する必要があります。これは Xcode がそのファイルへの読み取りを許可するために必要です。次に、`mise activate` を使って必要なツールを有効化できます。

```bash
# -C ensures that Mise loads the configuration from the Mise configuration
# file in the project's root directory.
eval "$($HOME/.local/bin/mise activate -C $SRCROOT bash --shims)"

swiftlint
```
