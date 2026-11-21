# BOOTSTRAP — paste the block below into Claude Code on pifive, then on tom-pi

Tom pastes it once per Pi. Everything after that is the AIs' job.

```text
You are Claude Code on this Raspberry Pi (check with `hostname`). Tom has authorized the crewmesh
install described in https://github.com/BustaBustaCompression/BustaClaw/tree/main/crewmesh
(branch claude/peaceful-bell-i6dj1z until PR #2 merges). Work through this without asking Tom
unless a step is outside the scope at the bottom.

1. Get the code: `git clone -b claude/peaceful-bell-i6dj1z https://github.com/BustaBustaCompression/BustaClaw ~/BustaClaw`
   (or `git -C ~/BustaClaw pull`). Read crewmesh/README.md, HANDOFF.md, FORUM.md.
2. Check the agents run headless and note exact working flags:
   `claude -p "reply ok"` and `codex exec --help` then a one-line `codex exec` test.
   If `codex` is missing: `npm i -g @openai/codex` (or the current official method) and tell Tom
   in the forum that `codex login` is still needed on this box.
3. Install: `crewmesh/deploy/install.sh $(hostname)`. Then edit ~/crewmesh/crewmesh.json:
   - node = this hostname; bind = `tailscale ip -4`
   - peers + trusted_ips = the other two of pifive, tom-pi, nyuknyuk (`tailscale ip -4 <name>`);
     use the 100.x IPs in peers, not names, if MagicDNS doesn't resolve
   - agents.local.url = http://<nyuknyuk's 100.x IP>:11434
   - agents.codex.argv / agents.claude.argv = the flags that worked in step 2
   - checks.http: on pifive keep jellyfin; on tom-pi use Home Assistant http://127.0.0.1:8123/ instead
   Then `sudo cp ~/BustaClaw/crewmesh/deploy/crewmesh.service /etc/systemd/system/ && sudo systemctl enable --now crewmesh`.
4. Verify: `python3 ~/crewmesh/crewmesh.py status` and `... status <each peer>` (a peer that isn't
   installed yet will show refused: fine). Then a real cross-wake:
   `python3 ~/crewmesh/crewmesh.py send $(hostname) codex "reply: codex alive on $(hostname)" --wake`
   and read `~/crewmesh/state/outbox.jsonl`.
5. pifive only — forum check-in. If `gh auth status` works, add one cron line for user tom:
   `17 7,19 * * * cd ~/BustaClaw && git pull -q && claude -p "Crew forum check-in: read GitHub issue #3 in BustaBustaCompression/BustaClaw with gh, follow crewmesh/FORUM.md, answer anything addressed to Claude, check crewmesh status on all three boxes, post one Status/Need/Next comment, end with the Claude Code footer." >> ~/crewmesh/state/forum-checkin.log 2>&1`
   If gh isn't logged in, skip this and say so in step 6.
6. Report: on pifive `gh issue comment 3 -R BustaBustaCompression/BustaClaw` with Status/Need/Next
   (no IPs, no tailnet name: the repo is public). On tom-pi: `crewmesh.py send pifive claude "<report>"`.
7. Crew Knowledge note in Crew Knowledge/Claude/ ("crewmesh install <hostname> (YYYY-MM-DD).md"),
   three-line header, via the box's existing Drive path (pifive: ~/gdrive rclone mount).

SCOPE Tom approved: install/configure crewmesh, its systemd unit, the codex CLI, one cron line,
notes in Claude/. NOT approved (ask in the forum and stop): reboots; restarting or changing
Jellyfin, Docker, Home Assistant, Tailscale or Nate's monitor; deletes; new phone alerts; anything
that costs money.
```
