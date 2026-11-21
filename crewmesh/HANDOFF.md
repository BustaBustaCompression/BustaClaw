# Handoff: crewmesh — for Claude and ChatGPT (Codex)

Source: Claude Code cloud session, 2026-11-21, from Crew Knowledge notes (pifive daily checks to
2026-11-20, pifive audit 2026-11-15, pifive-to-nuc-cutover 2026-10-24) and this repo.
Date checked: 2026-11-21
Unverified: NUC hardware specs; tom-pi RAM; exact `codex exec` flags on ARM64; whether Codex CLI
runs on Raspberry Pi OS arm64; xAI model name; whether the Grok app can be triggered externally
(believed no).

## Goal (Tom's words, condensed)

pifive, tom-pi and the NUC check on each other. On each box Claude can wake ChatGPT and ChatGPT can
wake Claude, and both can wake AI on the other boxes. Prefer local AI so it doesn't eat Claude /
ChatGPT usage. Grok is also available. Claude and ChatGPT finish this with as little of Tom as
possible and decide how to talk to each other.

## What exists now

`crewmesh/` in this repo: working code + 6 passing tests (simulated 3 nodes). **Not deployed
anywhere.** Read `crewmesh/README.md` first.

## How Claude and ChatGPT talk to each other

0. **Crew forum: GitHub issue #3 (label `crew-forum`).** Rules in `crewmesh/FORUM.md`. Check in there
   first, every time. Each AI gets **2 prompts to Tom for the whole project**; draft them in the forum first.
1. **GitHub, this repo (durable, async).** Both Claude Code and Codex work natively with it.
   - Claude works on `claude/*` branches, ChatGPT/Codex on `codex/*` branches. Never push to the
     other's branch. Draft PRs; the other AI reviews with a PR comment.
   - The task board is the table below. Claim a task by putting your name in **Owner** in your PR.
     One owner per task.
2. **crewmesh inbox (live, on the boxes)** once deployed:
   `crewmesh.py send <box> codex|claude "<text>" [--wake]`. Replies come back to the sender's inbox.
3. **Crew Knowledge (notes for Tom).** Each AI writes only its own folder, three-line header,
   no secrets. ChatGPT needs its own folder (doesn't exist yet: gap).

## Blockers — need Tom (cannot be done by an AI)

| # | Blocker | Why it matters | Tom does |
| --- | --- | --- | --- |
| B1 | **pifive Claude sign-in expires by 2026-11-22** (warning in the 2026-11-20 pifive note) | `claude` agent and the daily crew report die | On pifive: `claude setup-token` (browser login once) |
| B2 | **tom-pi Claude has failed auth every day since at least 2026-10-27** (every daily tom-pi note is "OAuth session expired") | tom-pi has had no working Claude for ~4 weeks | Same: `claude setup-token` on tom-pi |
| B3 | NUC (nyuknyuk) offline on Tailscale since ~2026-11-18; still Windows 11 | It's the planned Ollama host and third watcher | Power it on, set sleep = never. Decide: stay Windows for now or do the Ubuntu cutover first |
| B4 | ChatGPT has no wake API | `codex` agent needs the Codex CLI signed in to Tom's ChatGPT account on each box | `codex login` once per box (device code) |
| B5 | Grok wake = xAI API, billed separately | Off by default | Say yes/no and provide an API key via env file if yes |
| B6 | House rule: installs / systemd / firewall need Tom's OK | Deployment steps below | One "go" for the whole install list below |

## Task board

| # | Task | Owner | Status |
| --- | --- | --- | --- |
| T1 | Code + tests for mesh, adapters, budgets, one-escalator rule | Claude | done (this PR) |
| T2 | Review T1; check `codex exec` flags and arm64 support; fix the codex agent `argv` | ChatGPT | open |
| T3 | NUC: install Ollama, pull a model sized to its RAM (start `qwen2.5:3b`), confirm `/api/generate` from both Pis | — | blocked B3 |
| T4 | Deploy crewmesh on pifive and tom-pi: each box's Claude runs `BOOTSTRAP.md` | Claude (on each Pi) | waiting on Tom's prompt-1 steps |
| T5 | Deploy on NUC (Windows task) via Desktop Commander from the cloud session | Claude (cloud) | waiting on NUC power-on |
| T6 | Live test: stop crewmesh on one box for 20 min; confirm exactly one escalation and the local summary | — | after T4/T5 |
| T7 | Cross-wake test on every box: claude→codex and codex→claude, local and remote | — | after B1, B2, B4 |
| T8 | Decide with Tom whether Nate's monitor should include crewmesh incidents (keep one alerter) | — | later |
| T9 | Crew Knowledge notes: Claude folder + a ChatGPT folder | each AI | ongoing |

## Rules for both AIs

- Read-only on the boxes unless Tom says go for that step. No reboots, restarts, deletes.
- No reboot 21:00–06:00 ET.
- No secrets in git or Drive. This repo is public: no tailnet names, IP maps or keys in commits or the forum.
- Don't add a second phone alerter.
- When unsure, write "gap", don't guess.
