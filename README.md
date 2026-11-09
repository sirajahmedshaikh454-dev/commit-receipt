# Commit Receipt

> Your week of coding, itemised like groceries.

Commit Receipt is a zero-dependency command-line tool. It finds every git repository in a folder, reads their recent history, and prints the period as a **shop receipt**: commits per repo, lines added, a "refactor discount" for lines deleted, a "night-owl surcharge" for after-midnight commits, a price change against the previous period, and a barcode built from your real commit hashes. Add `--html` and you get a printable thermal-paper version that prints at true receipt size (80 mm).

```
          *  COMMIT RECEIPT  *
          DESKTOP CODE MARKET
   08 NOV 2026, 13:27 · LAST 30 DAYS
----------------------------------------
QTY ITEM                           LINES
  5 Commit Receipt                  +317
                                     -25
  2 mutation-domino - 2          +22,862
                                      -1
----------------------------------------
SUBTOTAL (lines added)           +23,179
REFACTOR DISCOUNT                    -26
----------------------------------------
TOTAL NET LINES                   23,153
7 COMMITS · 3 ACTIVE DAYS
VS PREVIOUS 30 DAYS (0)              NEW
----------------------------------------
BUSIEST HOUR                   13:00 (5)
BUSIEST DAY                       Sunday
FAVOURITE WORD              "receipt" x3
LONGEST MESSAGE                103 chars
----------------------------------------
█       ███  ███   █  █    ██  █     █ █
            80e7121905d78839

         THANK YOU FOR SHIPPING
Small commits, big changes. Keep going.
```

---

## Contents

- [Features](#features)
- [Quick start](#quick-start)
- [Usage](#usage)
- [Reading the receipt](#reading-the-receipt)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Testing](#testing)
- [Security & privacy](#security--privacy)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Skills & methodology](#skills--methodology)
- [License](#license)

---

## Features

- **Finds repos for you:** scans a folder up to two levels deep, skipping `node_modules` and dot-folders.
- **Exactly 40 columns:** standard thermal-printer width, enforced by tests.
- **Printable HTML receipt:** cream thermal paper, torn edges, an SVG barcode, a red **SHIPPED** stamp, a "printing" reveal animation, and `@page { size: 80mm auto }` for real receipt printers.
- **Period comparison:** commit count against the previous period of the same length (`+20%`, `-50%`, `NEW`).
- **Stats from your habits:** busiest hour and weekday, favourite commit word (ignoring file names), longest message, and active days.
- **A closing line that depends on your week:** late nights, deletion-heavy weeks, consistency streaks.
- **No dependencies:** only Node.js and git.

## Quick start

**Requirements:** Node.js 18+ and `git` on your PATH.

```bash
git clone https://github.com/sirajahmedshaikh454-dev/commit-receipt.git
cd commit-receipt
npm start
```

With no folder given, it scans your **Desktop** (or the current folder if there's no Desktop).

## Usage

```bash
node cli.js [folder] [--days N] [--author NAME] [--html] [--open]
```

| Option | Default | Description |
|---|---|---|
| `folder` | `~/Desktop` | Where to look for git repos (root, one or two levels deep) |
| `--days N` | `7` | Length of the period (1–3650) |
| `--author NAME` | everyone | Passed to `git log --author` |
| `--html` | off | Also write `receipt.html` in the current folder |
| `--open` | off | Write the HTML and open it in your default browser |

Examples:

```bash
node cli.js                        # this week, every repo on the Desktop
node cli.js D:\code --days 30      # last 30 days in another folder
node cli.js --author "Siraj" --open
```

## Reading the receipt

| Line | Meaning |
|---|---|
| `QTY ITEM` / `LINES` | Commits per repo; lines added (`+`) and deleted (`-`) from `--numstat` |
| `REFACTOR DISCOUNT` | Total lines deleted |
| `NIGHT-OWL SURCHARGE xN` | Commits made between 00:00 and 04:59 local time |
| `VS PREVIOUS N DAYS (p)` | Change in commit count against the previous period (`p` = commits then) |
| `FAVOURITE WORD` | Most frequent word in commit subjects; stop words and file names/paths are ignored |
| Barcode | Bits from your commit hashes, so every period is unique |

## How it works

```
findRepos(root)                       # depth ≤ 2, skips node_modules and dot-folders
   │
   ▼  for each repo (execFileSync, no shell)
git log --since=<2×days>.days --numstat --format=@@%H|%at|%an|%s
   │
   ▼
parseLog()  ──►  splitPeriod(cutoff)  ──►  summarize()  ──►  renderText() / renderHtml()
                 this period + count                         40-col text / thermal page
                 of the one before
```

- History is fetched for **twice** the period in one call per repo, then split at the cutoff, so the comparison costs nothing extra.
- `parseLog` handles binary files (`-` in numstat) and `|` characters inside commit subjects.
- `renderHtml` reuses the text receipt line for line and swaps only the text barcode for an SVG, so the terminal and paper versions can't drift apart. Both barcodes come from one shared `bits()` helper.

## Project structure

```
commit-receipt/
├── cli.js        # argument parsing, repo discovery, git calls, output files
├── lib.js        # pure logic: parse, split, summarize, render text/HTML, barcode, coupon
├── test.js       # node:test checks
├── package.json  # npm start / npm test, no dependencies
└── README.md
```

## Testing

```bash
npm test
```

Six tests cover:

- **Parsing:** numstat, binary files, pipes in subjects, empty input.
- **Totals:** every receipt line stays **≤ 40 columns**, including long repo names.
- **Empty periods:** still print a valid receipt.
- **HTML escaping:** a repo named `<script>` comes out escaped; the SVG barcode replaces the text one.
- **Price change and the coupon rule.**
- **Every closing message fits the paper, and the period split is correct.**

It was also run against real repositories, and the HTML was checked in a browser at desktop and phone width (no clipping, no horizontal scroll, zero console errors).

## Security & privacy

- **Read-only:** it only runs `git log`. It never writes to, fetches or pushes your repos.
- Git is called with `execFileSync` and an argument list, with **no shell**, so folder names and `--author` values can't inject commands.
- Repo names and commit text are **HTML-escaped** in the printable page.
- Nothing leaves your machine. The only network request is the Google Fonts stylesheet when you open the HTML (it falls back to a system monospace font offline).
- `receipt.html` is in `.gitignore`, so your stats aren't committed by accident.

## Known limitations

- `git --since` filters by *committer* date while the stats use *author* date, so a rebased commit can land in the wrong period.
- It scans at most two folder levels deep.
- `--open` was tested on Windows only; macOS (`open`) and Linux (`xdg-open`) are implemented but untested.
- Not tested on a physical receipt printer.

## Roadmap

- [ ] A monthly "statement" view with a bar for each day.
- [ ] Direct printing to USB thermal printers (ESC/POS).
- [ ] A team mode that compares several authors' receipts.

## Skills & methodology

**How it was built**

1. **Pitch three, build one.** The chosen concept (a git history receipt) was picked because it's useful every week, unlike anything built before, and uses real personal data without being invasive.
2. **Working version first.** The text receipt was built end to end and checked against real Desktop repos before any extras.
3. **Pure core, thin CLI.** Everything testable lives in `lib.js`; `cli.js` only does I/O.
4. **One commit per change**, each pushed straight away.
5. **Design skill:** the **ui-ux-pro-max** plugin recommended a single monospace family (JetBrains Mono) for the receipt. It found no palette match, so the colours are a custom thermal-paper set.
6. **Repo audit:** the **ponytail-audit** plugin reviewed the whole repo and found 4 issues, all fixed: two closing lines wider than the paper, a duplicated hex-to-bits conversion, dead stop words, and untested period-split logic.
7. **Self-review before shipping** caught an argument bug where `--open` without `--html` would have silently dropped the folder argument.

**Tools and skills used:** Claude Code (Opus), the in-app browser for layout checks, Node's `child_process`, `node:test`, git plumbing (`--numstat`, custom `--format`), CSS masks and `@page` print rules, the ui-ux-pro-max design plugin and the ponytail-audit review plugin.

## License

MIT

---

<details>
<summary>Spoiler: the easter egg</summary>

If any commit's 7-character short hash contains hex-speak (`c0ffee`, `decade`, `facade`, `beef`, `cafe`, `dead`, `face`, `bad`, `ace`), the receipt prints a **COUPON** for one free coffee, naming the commit that earned it.

</details>
