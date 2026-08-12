# mise Documentation, Japanese Translation (Unofficial)

[日本語](./README.md) | English

An **unofficial** Japanese translation of the [mise](https://github.com/jdx/mise) (mise-en-place) documentation. This project is not affiliated with mise or its maintainers.

The translation is LLM-assisted. Every generated file is committed so that it can be reviewed as a diff — nothing is translated at build time.

See [NOTICE.md](./NOTICE.md) for the full statement on the unofficial status, the LLM-assisted process, and the disclaimer.

## Designed not to burden upstream

- Every page sets `canonical` to the original URL. This site is not meant to displace the original in search results.
- No sitemap is generated.
- No mise logo, favicon, or brand assets are used.
- No ads or affiliate links.
- No pull requests are sent to the upstream repository. The maintenance cost stays on our side.

## Layout

```
upstream/docs/   Snapshot of the original at the time of translation (committed)
src/             Translations and the VitePress sources
scripts/         Syncing and verification
  scope.ts       Single source of truth for the translation scope
```

Committing `upstream/` is the keystone of the sync design. Because the original is pinned at the moment it was translated, the next round only needs a diff against the latest upstream to know exactly what changed — and only that diff has to be re-translated.

## Tasks

```
mise run install        Install dependencies (bun)
mise run dev            Dev server
mise run build          Production build
mise run check          All pre-publish checks (runs the six below)

mise run fmt            Format with oxfmt (Markdown excluded)
mise run fmt:check      Verify formatting
mise run lint           oxlint
mise run typecheck      TypeScript type check
mise run verify         Machine-check that translations map 1:1 to the original
mise run check:links    Broken links and anchors
mise run check:build    Inspect build output (banner, canonical, brand leakage)

mise run anchors        Emit the anchors a translation must use, from the original headings
mise run sync           Fetch upstream and show the diff (does not translate)
mise run sync:apply     Advance upstream/ and .upstream-ref
mise run stale          List pages that have fallen behind
```

The toolchain is bun / node / oxlint / oxfmt, with versions pinned in `mise.toml`. bun runs TypeScript directly, so `scripts/` needs no transpile step.

**`oxfmt` does not format Markdown** (excluded in `.oxfmtrc.json`). Reformatting a translation would change line wrapping and table padding, breaking the 1:1 correspondence with the original — which is what makes incremental syncing work at all.

## Repository conventions

Language use is fixed. Commit history and PR titles are the machine-readable surface that GitHub and tooling read across the project; PR bodies and documentation are the surface humans read.

| Subject | Language | Format |
|---|---|---|
| Commit messages | **English** | [Conventional Commits](https://www.conventionalcommits.org/) |
| PR titles | **English** | Conventional Commits |
| PR bodies | **Japanese** | Follow `.github/pull_request_template.md` |
| Translations, docs, code comments | **Japanese** | |

Example commit messages:

```
feat(sync): report pages that upstream deleted
fix(verify): resolve relative links against the page directory
docs(tasks): translate toml-tasks.md
chore(deps): bump vitepress to 1.6.4
```

Allowed types: `feat` / `fix` / `docs` / `refactor` / `test` / `chore` / `ci` / `build` / `perf` / `style` / `revert`. Use `docs` for commits that add or update translations.

**These rules are enforced in CI** (`.github/workflows/conventions.yml`). The workflow checks the PR title and every commit message in the PR, and fails if they are not English or not Conventional Commits.

## Translating

Read `CLAUDE.md` and `glossary.md` first. Two mistakes in particular are easy to make and expensive:

- **Never invent anchors — copy the output of `mise run anchors`.** A wrong anchor silently breaks deep links from the original site.
- **Never change a single character inside a code block.** Readers copy and paste broken commands.

When a page is done, run `mise run verify -- <file>` and fix everything until it reports zero errors. Do not count headings or code blocks by hand.

## Syncing with upstream

```
mise run sync
```

This writes a unified diff of the original into `.sync/`. Re-translate only the blocks that changed and leave unrelated paragraphs alone. If the change is just a typo fix or a link swap, it is fine to decide that the translation needs no update.

**`upstream/` and the translation must be updated in the same commit.** If only one of them moves, the next diff is broken.

## License

The original is [jdx/mise](https://github.com/jdx/mise), MIT licensed. Upstream carries two copyright notices, and [LICENSE](./LICENSE) reproduces both verbatim.

The translations are available under the same MIT terms as the original.
