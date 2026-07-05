# Lock Crack Game

A combination-lock puzzle game controlled by a physical 100-stop CNC
rotary encoder. The player turns the real dial to set numbers on a
virtual lock, using hints scattered in the scene, math problems, and
other clues — under a timer — to find the combo.

There are two builds of this game in the repo:
- The **web version** (`web/` + `firmware/`, on `dev`/`main`) — an
  Adafruit ItsyBitsy M4 streams the encoder over WebSerial to a React app
  with a Supabase-backed leaderboard. Documented in most of this file.
- The **standalone hardware version** (`standalone/`, on the
  `standalone-hardware` branch) — no browser or computer at all; an
  Adafruit RP2040 Prop-Maker Feather runs the entire game, with an OLED,
  speaker, buttons, LEDs, and a local on-device leaderboard. See its own
  `standalone/README.md` and the section below.

## Architecture

```
CNC rotary encoder (Adafruit #5734, 100 detents, no button)
        |  quadrature A/B
Adafruit ItsyBitsy M4 (CircuitPython, firmware/code.py)
        |  USB serial, line protocol: POS:<0-99>\n
Browser (WebSerial API, web/src/hardware/encoderSerial.ts)
        |
React game state (web/src/game/useLockGame.ts)
        |
Virtual lock UI (web/src/components/Dial.tsx + HintPanel.tsx)
```

WebSerial only works in Chromium browsers (Chrome/Edge), which is
acceptable since this targets desktop play with the physical peripheral
attached. A keyboard fallback (←/→ turns the dial, Enter forces an instant
confirm) works in any browser for development/testing without hardware.

This encoder has no physical confirm button, so "confirm" is a dwell-time
timeout (`DWELL_MS` in `web/src/game/combo.ts`): once the dial sits still
for ~1s, whatever value it's resting on is attempted against the current
stage's target.

## Repo layout

- `web/` — Vite + React + TypeScript game client.
  - `src/hardware/encoderSerial.ts` — WebSerial bridge, owns the line
    protocol contract with the firmware.
  - `src/game/` — combo generation (`combo.ts`), hint generation
    (`hints.ts`), game state machine (`useLockGame.ts`), types (`types.ts`).
  - `src/components/` — `Dial.tsx` (SVG virtual lock), `HintPanel.tsx`,
    `ConnectPanel.tsx` (WebSerial connect/disconnect), `DifficultySelect.tsx`,
    `InitialsEntry.tsx` (arcade-style win screen), `Leaderboard.tsx`
    (per-difficulty scores + history with per-question detail).
  - `src/leaderboard/` — Supabase client, types, and API calls
    (`submitScore`, `fetchScores`) for the shared leaderboard.
- `firmware/` — CircuitPython firmware for the ItsyBitsy (`code.py`) plus
  wiring/setup notes (`README.md`).
- `standalone/` — CircuitPython for the standalone hardware version (see
  below), on the `standalone-hardware` branch.
- `.github/workflows/` — `ci.yml` (typecheck+build on PRs, plus a
  `standalone/` syntax check), `deploy.yml` (builds and publishes `web/`
  to GitHub Pages on push to `main`).

## Game design

Each round is `STAGE_COUNT` (3) stages; each stage has a target number
0-99 and a hint of kind `math` (an arithmetic problem that evaluates to the
target) or `clue` (a text riddle solving to the target). The player dials
in the number and holds it (dwell-time auto-confirm) or presses Enter; a
correct digit advances to the next stage, all three within `ROUND_SECONDS`
(180s) wins.

A `scene` hint kind (visual/interactive clues placed in a game
environment, e.g. counting objects or reading a prop) is planned but not
yet built — it needs its own UI/interaction model beyond a text prompt.
See `web/src/game/types.ts`'s `HintKind` as the extension point.

### Difficulty

`Difficulty` (`easy | medium | hard`, `web/src/game/types.ts`) changes
which hint templates `generateHint` (`hints.ts`) draws from — easy is
addition/subtraction only, medium is today's original mix (unchanged
baseline), hard adds division and multi-step templates. Round length and
stage count are the same across difficulties; only problem complexity
changes. Each difficulty has its own leaderboard.

### Scoring & anti-guess-check penalty

Score = `timeLeft` at the moment of winning (shown as m:ss). A wrong
dwell-confirm immediately docks `PENALTY_SECONDS` (`combo.ts`, currently
15s) from the live timer — visible in real time, not just at the end — to
make spinning through every number a losing strategy. Hitting 0 this way
ends the round as a loss, same as the countdown running out. Both the
dwell-confirm interval and the penalty use the same 1s dwell (a deliberate
choice — no separate longer dwell for wrong guesses — so expect occasional
accidental penalties from mid-search pauses).

## Leaderboard backend (Supabase)

The site is static (GitHub Pages), so the shared, cross-device leaderboard
lives in a Supabase Postgres project instead of a custom server:

- Single `scores` table: `difficulty`, `initials` (3 chars), `time_left`
  (the score), `wrong_guesses`, and a `stages` JSONB column holding
  `{ prompt, kind, answer, wrongAttempts }` per stage — this is what
  powers "click a leaderboard row to see the questions used in that run"
  without a second table/join.
- Row-level security: public `select` and `insert` policies, no
  `update`/`delete` policy (rows are immutable once written).
- `web/src/leaderboard/supabaseClient.ts` reads `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY` from the environment and exports `null` if
  unset, so the app degrades gracefully instead of crashing when the
  leaderboard isn't configured.
- **Known limitation:** the anon key is necessarily public (that's normal
  for Supabase — RLS is the actual security boundary, not key secrecy),
  which means a technically motivated person could POST fabricated scores
  directly to the API, bypassing the game. Accepted for a casual/home
  leaderboard; closing it fully would need a Supabase Edge Function to
  validate submissions server-side — worth doing if this ever gets a wider
  audience, not done yet.
- Local dev: copy `web/.env.example` to `web/.env.local` (gitignored) with
  real values. Production: the same two values are set as GitHub Actions
  **repository variables** (`SUPABASE_URL`, `SUPABASE_ANON_KEY` — plain
  variables, not secrets, since the anon key is meant to be public) and
  wired into `.github/workflows/deploy.yml`'s build step.

## Standalone hardware version (`standalone/` branch)

Fully self-contained: no web client, no cloud. Runs on an Adafruit RP2040
Prop-Maker Feather (built-in MAX98357 I2S amp, STEMMA QT I2C, 21 GPIO)
with the same rotary encoder, plus a 128x64 SSD1306 OLED, a speaker, two
buttons (Confirm, Back/Menu), and two indicator LEDs.

- `standalone/game/` is a **direct port** of `web/src/game/{types,hints,
  combo}.ts` — same formulas, same per-difficulty template pools, same
  `PENALTY_SECONDS`. Keep both in sync if either changes.
- Real buttons replace the web version's dwell-timeout confirm — no
  `DWELL_MS` equivalent, and no accidental-penalty tradeoff as a result.
- **Calibration**: the encoder has no absolute position reference, so
  every power-on starts with a `calibrate` state (turn to the knob's top
  notch, press Confirm) before the menu — see `hardware/encoder.py`'s
  `calibrate()`/`offset`.
- Menu/difficulty select and arcade-style 3-character initials entry are
  both dial-driven (turn to cycle options/letters, Confirm to pick) —
  no separate controls needed.
- Leaderboard is **local**: `leaderboard.py` keeps a top-10-per-difficulty
  JSON file on the board's flash (no WiFi hardware, no cloud). Deliberately
  no per-question detail drill-down like the web version — kept minimal
  for the small screen and "compact like an old arcade" ask.
- `boot.py` remounts storage so the running game can write the leaderboard
  file — holding Back/Menu at power-on skips that and restores normal
  computer write-access for editing code. See `standalone/README.md`.
- `pins.py` centralizes every GPIO assignment — nothing else references
  `board.*` directly.
- Game logic (`game/`) and `leaderboard.py` have no hardware imports, so
  they can be exercised directly with plain `python3` (no CircuitPython
  needed) — the fastest way to verify a logic change before flashing.

## Branch & deploy pipeline

- `dev` is the default branch and where day-to-day work happens.
- `main` is production, deployed automatically. Land changes via PR:
  `dev` → `main`. Merging (the approval step) triggers
  `.github/workflows/deploy.yml`, which builds `web/` and publishes it to
  GitHub Pages.
- `.github/workflows/ci.yml` gates PRs into `main`/`dev` and pushes to
  `dev` with a typecheck + build.
- Repo: **public** (required for GitHub Pages on the free plan — private
  repos need GitHub Pro for Pages), under the `saddeus` GitHub account
  (`gh` CLI is authenticated in this environment).

## Agent delegation routing

This project defines scoped subagents in `.claude/agents/` so work routes
to the right specialist automatically based on task description:

| Task type | Agent | Scope |
|---|---|---|
| CircuitPython/hardware work on either build — encoder, buttons, LEDs, OLED, sound, serial protocol | `firmware-engineer` | `firmware/`, `standalone/` |
| React UI, dial rendering, WebSerial integration | `web-engineer` | `web/src/components/`, `web/src/hardware/` |
| Hint/combo/puzzle design and balancing | `game-designer` | `web/src/game/` |
| Git branching, GitHub Actions, Pages deploy, repo admin | `devops` | `.github/`, repo settings |

Fall back to the built-in agents for anything cross-cutting:
- `Explore` — locating code/patterns across `web/` and `firmware/` before a
  change, when the relevant files aren't already known.
- `Plan` — architecture decisions that affect more than one of the areas
  above (e.g. changing the serial protocol touches both firmware-engineer
  and web-engineer's territory).
- `general-purpose` — multi-step tasks spanning several of the scoped
  areas at once.

## Default model

Use **Sonnet 5** as the default model for this project (set via `/config`,
or the `"model"` field in `.claude/settings.json`). It's the right
cost/capability balance for the day-to-day mix of frontend, embedded, and
CI work here. Manually switch to Opus for harder one-offs — puzzle/game
design tradeoffs, gnarly hardware-protocol bugs, or non-trivial
architecture changes — rather than leaving it as the project default.

## Dev commands

```
cd web
npm run dev            # dev server with HMR
npx tsc -b --noEmit     # typecheck
npm run build           # production build (matches CI/deploy)
```

Firmware install steps: see `firmware/README.md`.

Standalone version: `find standalone -name '*.py' -print0 | xargs -0
python3 -m py_compile` (syntax check, matches CI) — flashing steps in
`standalone/README.md`.
