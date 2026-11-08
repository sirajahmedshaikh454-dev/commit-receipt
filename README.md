# Commit Receipt

One command scans every git repo in a folder and prints your coding week as a **shop receipt**, in the terminal and as a printable thermal-paper page.

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

## Run it

```bash
npm start                      # scans your Desktop, last 7 days
node cli.js --open             # same, and opens the printable receipt
node cli.js D:\code --days 30  # any folder, any period
node cli.js --author "Siraj"   # only your commits
```

No dependencies: just Node 18+ and git. `npm test` runs the checks.

Press **Ctrl+P** on the HTML receipt and it prints at real receipt size (80 mm).

## What's on the receipt

| Line | Meaning |
|---|---|
| QTY / item | commits per repo, lines added and deleted |
| Refactor discount | lines you deleted |
| Night-owl surcharge | commits made between midnight and 5 AM |
| VS previous N days | change in commit count vs the period before |
| Busiest hour / day, favourite word | from commit times and subject lines (file names are ignored) |
| Barcode | made from your commit hashes, so every week's is unique |

It's read-only: it only runs `git log` and never changes your repos. Nothing leaves your machine except the font request when you open the HTML page.

---

<details>
<summary>Spoiler: the easter egg</summary>

If any commit's 7-character short hash contains hex-speak (`c0ffee`, `decade`, `facade`, `beef`, `cafe`, `dead`, `face`, `bad`, `ace`), the receipt prints a **COUPON** for one free coffee, naming the commit that earned it.

</details>
