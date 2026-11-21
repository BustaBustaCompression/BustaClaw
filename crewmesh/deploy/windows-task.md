# NUC while it is still Windows 11

The NUC is planned to move to Ubuntu Server (Regulator's cutover note). Until then:

1. Install Python 3.11+ from python.org (tick "Add to PATH").
2. Copy `crewmesh.py` and `crewmesh.json` to `C:\crewmesh\`. Token in `C:\crewmesh\token` (`token_file`).
3. In `crewmesh.json`: `"node": "nyuknyuk"`, `"bind"`: the NUC's `tailscale ip -4`, `"checks": {"disk_path": "C:\\"}`.
   `local` agent: `"url": "http://127.0.0.1:11434"`.
4. Task Scheduler → Create Task: "Run whether user is logged on or not", trigger "At startup",
   action `pythonw.exe C:\crewmesh\crewmesh.py --config C:\crewmesh\crewmesh.json serve`,
   Settings → "If the task fails, restart every 1 minute".
5. Windows Firewall: allow inbound TCP 8765 and 11434 on the Tailscale interface only.
6. Ollama: set user env var `OLLAMA_HOST=0.0.0.0:11434` so the Pis can reach it, then restart Ollama.
   The firewall rule above is what keeps it off the home LAN.
7. Power settings: sleep = Never. A sleeping NUC looks "down" to the Pis.
