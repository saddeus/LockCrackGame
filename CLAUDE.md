# Lock Crack Game

A web-based combination-lock puzzle game controlled by a physical 100-stop
CNC rotary encoder wired to an Adafruit ItsyBitsy (CircuitPython). The
player turns the real dial to set numbers on a virtual lock on screen,
using hints scattered in the scene, math problems, and other clues — under
a timer — to find the combo.

## Architecture

```
CNC rotary encoder (100 detents + push button)
        |  quadrature A/B + button pin
Adafruit ItsyBitsy (CircuitPython, firmware/code.py)
        |  USB serial, line protocol: POS:<0-99>\n  BTN:1\n
Browser (WebSerial API, web/src/hardware/encoderSerial.ts)
        |
React game state (web/src/game/useLockGame.ts)
        |
Virtual lock UI (web/src/components/Dial.tsx + HintPanel.tsx)
```

WebSerial only works in Chromium browsers (Chrome/Edge), which is
acceptable since this targets desktop play with the physical peripheral
attached. A keyboard fallback (←/→ turns the dial, Enter confirms) works in
any browser for development/testing without hardware.

## Repo layout

- `web/` — Vite + React + TypeScript game client.
  - `src/hardware/encoderSerial.ts` — WebSerial bridge, owns the line
    protocol contract with the firmware.
  - `src/game/` — combo generation (`combo.ts`), hint generation
    (`hints.ts`), game state machine (`useLockGame.ts`), types (`types.ts`).
  - `src/components/` — `Dial.tsx` (SVG virtual lock), `HintPanel.tsx`,
    `ConnectPanel.tsx` (WebSerial connect/disconnect).
- `firmware/` — CircuitPython firmware for the ItsyBitsy (`code.py`) plus
  wiring/setup notes (`README.md`).
- `.github/workflows/` — `ci.yml` (typecheck+build on PRs), `deploy.yml`
  (builds and publishes `web/` to GitHub Pages on push to `main`).

## Game design

Each round is `STAGE_COUNT` (3) stages; each stage has a target number
0-99 and a hint of kind `math` (an arithmetic problem that evaluates to the
target) or `clue` (a text riddle solving to the target). The player dials
in the number and presses confirm (physical button or Enter); a correct
digit advances to the next stage, all three within `ROUND_SECONDS` (180s)
wins.

A `scene` hint kind (visual/interactive clues placed in a game
environment, e.g. counting objects or reading a prop) is planned but not
yet built — it needs its own UI/interaction model beyond a text prompt.
See `web/src/game/types.ts`'s `HintKind` as the extension point.

## Branch & deploy pipeline

- `dev` is the default branch and where day-to-day work happens.
- `main` is production, deployed automatically. Land changes via PR:
  `dev` → `main`. Merging (the approval step) triggers
  `.github/workflows/deploy.yml`, which builds `web/` and publishes it to
  GitHub Pages.
- `.github/workflows/ci.yml` gates PRs into `main`/`dev` and pushes to
  `dev` with a typecheck + build.
- Repo: private, under the `saddeus` GitHub account (`gh` CLI is
  authenticated in this environment).

## Agent delegation routing

This project defines scoped subagents in `.claude/agents/` so work routes
to the right specialist automatically based on task description:

| Task type | Agent | Scope |
|---|---|---|
| Encoder wiring, CircuitPython, serial protocol on the firmware side | `firmware-engineer` | `firmware/` |
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
