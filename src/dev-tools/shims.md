---
title: shim
upstreamPath: docs/dev-tools/shims.md
upstreamUrl: https://mise.jdx.dev/dev-tools/shims.html
upstreamRef: 1c7db9f9
upstreamDate: "2026-08-12"
---

# shim {#shims}

`mise` のコンテキスト（開発ツール、環境変数）をシェルに読み込む方法はいくつかあります。

- `mise activate`（["mise PATH 有効化"](#path-activation) とも呼ばれる）は、プロンプトが表示されるたびに `mise` が `PATH` や他の環境変数を更新する方法です。
- [`mise activate --shims`](#mise-activate-shims) は、shim を使って開発ツールを読み込みます。
- 単発のコマンドやタスクには [`mise x|exec`（原文）](https://mise.jdx.dev/cli/exec.html) や [`mise r|run`（原文）](https://mise.jdx.dev/cli/run.html) を使う方法があります（["shim でも PATH でもない方法"](#neither-shims-nor-path) を参照）。

このページでは、これらの方法の違いと使い方を理解できるようにします。特に、シェルで shim を使うべきか `mise activate` を使うべきかを判断する際に役立ちます。

## `mise` の有効化方法の概要 {#overview}

### PATH 有効化 {#path-activation}

mise の「PATH」有効化方式は、プロンプトが表示されるたびに環境変数を更新します。特に、シェルが実行可能なプログラムを検索するために使う `PATH` 環境変数を更新します。

::: info
これは、シェルの rc ファイルに `echo 'eval "$(mise activate bash)"' >> ~/.bashrc` の行を追加した場合（この例では bash）に使われる方式です。
:::

例えば、デフォルトでは `PATH` 変数は次のようになっています。

```sh
echo $PATH
/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
```

[`mise activate`（原文）](https://mise.jdx.dev/cli/activate.html) を使用している場合、`mise` は必要なツールを自動的に `PATH` に追加します。

```sh
PATH="$HOME/.local/share/mise/installs/python/3.15.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
```

この例では、python の `bin` ディレクトリが `PATH` の先頭に追加され、現在のシェルセッションで使用できるようになっています。
`python = "3.15"` や `node = "26"` のような fuzzy バージョンが有効な場合、このパスは完全に解決されたパッチバージョンではなく、`~/.local/share/mise/installs/python/3.15/bin` のような要求バージョンのシンボリックリンクを使うことがあります。

`mise` の `PATH` 方式はほとんどの場合うまく機能しますが、`shims` の方が適した状況もあります。これは、インタラクティブシェルを使用していない場合です（例えば、IDE やスクリプトで `mise` を使う場合）。

### shim {#mise-activate-shims}

::: warning
`mise activate --shims` は `mise activate` の全機能をサポートしていません。<br>
詳しくは [shim と PATH の比較](/dev-tools/shims.html#shims-vs-path) を参照してください。
:::

shim を使う場合、`mise` は `PATH` に含まれるディレクトリに小さな実行可能ファイル（`shims`）を配置します。`shims` は、コマンドを横取りして適切なコンテキストを読み込む、mise バイナリへのシンボリックリンクと考えられます。

```sh
ls -l ~/.local/share/mise/shims/node
# [...] ~/.local/share/mise/shims/node -> ~/.local/bin/mise
```

デフォルトでは、shim ディレクトリは `~/.local/share/mise/shims`（Windows では `%LOCALAPPDATA%\mise\shims`）にあります。ツール（例えば `node`）をインストールすると、`mise` はそのツールが提供するバイナリごとに `shims` ディレクトリにエントリを追加します（例えば `~/.local/share/mise/shims/node`）。

```sh
mise use -g node@20
npm install -g prettier@3.1.0

~/.local/share/mise/shims/node -v
# v20.0.0
~/.local/share/mise/shims/prettier -v
# 3.1.0
```

`~/.local/share/mise/shims/node` を毎回呼び出さずに済むように、`shims` ディレクトリを `PATH` に追加できます。

```sh
export PATH="$HOME/.local/share/mise/shims:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
```

これにより、すべての開発ツールが現在のシェルセッションだけでなく、非インタラクティブな環境でも実質的に利用できるようになります。

::: tip
[`mise activate --shims`（原文）](https://mise.jdx.dev/cli/activate.html#shims) は、shim ディレクトリを PATH に追加するための省略形です。
:::

## mise の shim を PATH に追加する方法 {#how-to-add-mise-shims-to-path}

推奨される `shims` を `PATH` に追加する方法は、シェルの初期化ファイルの1つで [`mise activate --shims`（原文）](https://mise.jdx.dev/cli/activate.html#shims) を呼び出すことです。例えば、次のようにします。

::: code-group

```sh [bash]
# note that bash will read from ~/.profile or ~/.bash_profile if the latter exists
# ergo, you may want to check to see which is defined on your system and only append to the existing file
echo 'eval "$(mise activate bash --shims)"' >> ~/.bash_profile # this sets up non-interactive sessions
echo 'eval "$(mise activate bash)"' >> ~/.bashrc       # this sets up interactive sessions
```

```sh [zsh]
echo 'eval "$(mise activate zsh --shims)"' >> ~/.zprofile # this sets up non-interactive sessions
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc    # this sets up interactive sessions
```

```sh [fish]
echo 'mise activate fish --shims | source' >> ~/.config/fish/config.fish
echo 'mise activate fish | source' >> ~/.config/fish/config.fish
```

:::

この例では、非インタラクティブなシェル設定ファイル（`.bash_profile` や `.zprofile` など）で [`mise activate --shims`（原文）](https://mise.jdx.dev/cli/activate.html#shims) を使い、インタラクティブなシェル設定ファイル（`.bashrc` や `.zshrc` など）で `mise activate` を使っています

::: info
シェルのプロファイルファイルで [`mise activate --shims`（原文）](https://mise.jdx.dev/cli/activate.html#shims) を呼び出し、その後インタラクティブなセッションで [`mise activate`（原文）](https://mise.jdx.dev/cli/activate.html) を呼び出しても問題ありません — shim ディレクトリがどうなるかは [`not_found_auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#not_found_auto_install) によって決まります。

- **有効（デフォルト）**: `mise activate` は shim ディレクトリを、管理するツールのパスの後ろに置いた状態で `PATH` に残します。現在のツールセットで解決されたツールが優先され、shim はフォールバックとして残るため、すでに shim があるツールのバージョンが欠けている場合に自動インストールを発生させられます。`mise doctor` はこの組み合わせを問題として報告しません。
- **無効**: `mise activate` は shim ディレクトリを `PATH` から削除します。`PATH` の残りの部分はそのままです。

:::

::: info
shim が mise 管理のツールを解決できない場合（例えば、`mise.toml` で固定されているがインストールされていないバージョンで、[`not_found_auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#not_found_auto_install) が無効になっている場合）、エラーにする代わりに `PATH` 上の他の場所で見つかった同名の最初の実行可能ファイルにフォールバックします。
これは mise の外でも使いたいツールにとっては便利ですが、OS も提供しているツール（例えば Debian/Ubuntu の `python3`）の場合、shim が大きく失敗する代わりに、まったく別の無関係なバイナリを黙って実行してしまうことがあるということです。

解決できない shim をはっきり失敗させたい場合は、[`not_found_system_fallback`（原文）](https://mise.jdx.dev/configuration/settings.html#not_found_system_fallback) を `false` に設定し、`not_found_auto_install = false` と併用してください。
:::

- 好みに応じて `shims` のみを使うこともできますが、これには [制限事項](/dev-tools/shims.html#shims-vs-path) がいくつかあります。
- [`mise activate --shims`（原文）](https://mise.jdx.dev/cli/activate.html#shims) の代わりに `export PATH="$HOME/.local/share/mise/shims:$PATH"` を使う方法もあります。これは、その時点で `mise` がまだ利用できない場合に役立ちます。

### mise reshim {#mise-reshim}

`shims` ディレクトリの内容を強制的に更新するには、手動で `mise reshim` を呼び出せます。

`mise` はツールがインストール・更新・削除されるたびにすでに reshim を実行している点に注意してください。そのため、そうした場面でこれを使う必要はありません。また、`npm` のようなほとんどのツールを使う際にはデフォルトで実行されます。

`mise reshim` は shim の作成・削除のみを行います。一部のユーザーはこれを「直す」ボタンとして使うこともありますが、`~/.local/share/mise/shims` に本来あるべきものが含まれていない場合にのみ必要です。

`mise` ディレクトリに実行可能ファイルを追加しないでください。次の reshim で `mise` がそれらを削除します。

## shim と PATH の比較 {#shims-vs-path}

[PATH 有効化](#path-activation) の代わりに shim を使うと、次の機能に影響があります。

- mise で定義された [環境変数](/environments/) は mise のツールでのみ利用できます
- ほとんどの [フック（原文）](https://mise.jdx.dev/hooks.html) は発火しません
- unix の `which` コマンドは shim を指すため、実際の実行ファイルの場所が分かりにくくなります

一般的に、_インタラクティブ_ な状況では shim ではなく PATH（`mise activate`）を使うことを推奨します。

`activate` の仕組みは、プロンプトが表示されるたびに mise-en-place が PATH や他の環境変数がどうあるべきかを決定してエクスポートするというものです。そのため、スクリプトのような非インタラクティブな状況ではうまく機能しません。プロンプトが表示されないため、`mise hook-env` を手動で呼び出して mise に環境変数を更新させる必要があります（[`cd` へのフック](#hook-on-cd) のような例外もあります）。

### 環境変数と shim {#env-vars-and-shims}

shim の欠点は、環境変数が shim が呼び出されたときにしか読み込まれないことです。つまり、`mise.toml` で [環境変数](/environments/) を設定しても、それは shim が呼び出されたときにのみ使われます。

次の例は `mise activate` の下でのみ動作します。

```sh
$ mise set NODE_ENV=production
$ echo $NODE_ENV
production
```

しかし、これはどちらでも動作します。

```sh
$ mise set NODE_ENV=production
$ node -p process.env.NODE_ENV
production
```

また、mise のツールが不要な場合でも、環境を取得するために [`mise x|exec`（原文）](https://mise.jdx.dev/cli/exec.html) と [`mise r|run`（原文）](https://mise.jdx.dev/cli/run.html) を使うこともできます。

```sh
$ mise set NODE_ENV=production
$ mise x -- bash -c "echo \$NODE_ENV"
production
$ mise r some_task_that_uses_NODE_ENV
production
```

::: tip
一般的に、[タスク](/tasks/) は mise の環境を常に読み込ませるためのよい方法です。
:::

### フックと shim {#hooks-and-shims}

[フック（原文）](https://mise.jdx.dev/hooks.html) の `cd`、`enter`、`leave` は `mise activate` でのみ発火します。別の [`watch_files`（原文）](https://mise.jdx.dev/hooks.html#watch-files-hook) 設定も `mise activate` を必要とします。しかし `preinstall` と `postinstall` はシェル統合を必要としないため、shim でも動作します。

### `which` {#which}

`which` は多くのユーザーが大いに役立てているコマンドです。shim を使うと実質的に `which` が「壊れ」、shim の場所を表示するようになります。回避策として `mise which` を使うと、実際の場所を表示できます。一部のユーザーは `which node` を実行してバージョン番号入りの実際のパスが返ってくる「きれいさ」を好みます。例:

```sh
$ which node
~/.mise/installs/node/20/bin/node
```

### パフォーマンス {#performance}

実際のところ、shim を使う場合と `mise activate` を使う場合とで、パフォーマンスの違いに気づくことはほとんどないでしょう。

- `mise activate` ではプロンプトが表示されるたびに mise が実行されるため、プロンプトが表示されるたびに数 ms のコストがかかります。mise のツールを実際に使っているかどうかに関わらず、コマンドを実行するたびにそのペナルティを払うことになります。変更がない場合に高速化するための短絡ロジックもありますが、非常に複雑な構成でない限りあまり効果はありません。
- shim も基本的には同じパフォーマンス特性ですが、shim が呼び出されたときに実行されます。これは状況によってはより良く、状況によってはより悪くなります。

次のように bash スクリプト内から shim を呼び出している場合、

```sh
for i in {1..500}; do
    node script.js
done
```

ループ内で呼び出すたびに mise のペナルティを払うことになります。しかし、同じことをしても shim の中からサブプロセスを呼び出す場合（例えば node が node のサブプロセスを作る場合）は、新たなペナルティは _発生しません_。これは、shim が呼び出されたときに mise が全ツール分の PATH を含む環境をセットアップし、それらの PATH エントリが shim ディレクトリより前に置かれるためです。

つまり、パフォーマンスの観点でどちらが良いかは mise をどのように呼び出すかによって決まります。とはいえ、ほとんどのユーザーは `mise activate` によるターミナルの数 ms の遅延には気づかないでしょう。
パフォーマンスの問題を診断する方法については [トラブルシューティング: シェルプロンプトが遅い](/troubleshooting.html#slow-shell-prompts) を参照してください。

これらの唯一の違いは、`hook-env` を使う場合はディレクトリを変更するたびに再度呼び出す必要があるのに対し、shim ではそれが不要という点です。両方を使う場合、`mise activate` が shim ディレクトリの面倒を見てくれます。すなわち、自動インストールのフォールバックとしてツールのパスの後ろに保たれるか、[`not_found_auto_install`（原文）](https://mise.jdx.dev/configuration/settings.html#not_found_auto_install) が無効になっている場合は `PATH` から完全に削除されます。

## shim でも PATH でもない方法 {#neither-shims-nor-path}

どちらも必要としない mise の環境を読み込む方法は数多くあり、主なものは次の通りです。
[`mise x|exec`（原文）](https://mise.jdx.dev/cli/exec.html)、[`mise r|run`（原文）](https://mise.jdx.dev/cli/run.html)、[`mise en`（原文）](https://mise.jdx.dev/cli/en.html) です。

これらはいずれも、何かを実行する前にすべてのツールと環境変数を読み込みます。シェルの rc ファイルを一切変更する必要がなく、環境が常に明示的に読み込まれるという点で理想的かもしれません。これを「クリーンな」作業方法と感じる人もいるでしょう。

明らかな欠点は、`mise` を使いたいときには必ず `mise exec|run` を前に付ける必要があるということです。とはいえ、`mx|mr` に簡単にエイリアスできます。

- 「簡単さ」よりも精密さを好む場合は、この方法が好まれます。
- あるいは、チームが使っているという理由で単一のプロジェクトで mise を使いたいだけで、システム上の他のものを管理するために使いたくない場合です。そのような用途にシェル拡張を使うのはやり過ぎでしょう。

## `cd` へのフック {#hook-on-cd}

一部のシェル（`bash`、`zsh`、`fish`、`xonsh`）では `mise` は `cd` コマンドにフックしますが、それ以外ではプロンプトが表示されたときのみ実行されます。これは `zsh` の `chpwd`、`bash` の `PROMPT_COMMAND`、`fish` の `fish_prompt`、`xonsh` の `on_chdir` に依存しています。

利点は頻繁には実行されないことですが、mise は Rust で書かれているため mise を実行するコストは無視できるほど小さい（数 ms）です。

::: details 複数のコマンドを1行で実行する

次のように、1行でまとめてコマンドを実行するとします。

```sh
cd ~
cd ~/src/proj1 && node -v && cd ~/src/proj2 && node -v
```

`cd` へのフックがないシェルで `mise activate` を使っている場合、ディレクトリが変わった後でも `~/src/proj1` や `~/src/proj2` からではなく `~` からのツールが使われます。

これは、これらのシェルでは `mise` がプロンプトが表示される直前に実行されるのに対し、他のシェルでは `cd` にフックするためです。上のインラインの例では、shim は_常に_動作する点に注意してください。

:::

## rc ファイルでの mise の利用 {#using-mise-in-rc-files}

`.zshrc` のような rc ファイルは特殊です。スクリプトでありながら、インタラクティブなセッションでのみ実行されます。rc ファイルの中で mise が提供するツールにアクセスする必要がある場合、2つの選択肢があります。

::: code-group

```sh [hook-env]
eval "$(mise activate zsh)"
eval "$(mise hook-env -s zsh)"
node some_script.js
```

```sh [shims]
eval "$(mise activate zsh --shims)" # should be first
eval "$(mise activate zsh)"
node some_script.js
```

:::
