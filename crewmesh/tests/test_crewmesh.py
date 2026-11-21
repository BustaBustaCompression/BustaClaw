"""Three simulated nodes on localhost. Run: python3 -m unittest discover -s crewmesh/tests"""
import json
import sys
import tempfile
import threading
import time
import unittest
import urllib.error
from http.server import ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import crewmesh as cm  # noqa: E402

TOKEN = "test-token-0123456789"
PY = sys.executable
FAKE = [PY, "-c", "import sys; d=sys.stdin.read(); print('FAKE:' + sys.argv[1] + ':' + str(len(d)))"]


def make_cfg(name, port, peers, tmp):
    return {
        "node": name, "bind": "127.0.0.1", "port": port, "_token": TOKEN,
        "poll_seconds": 0.2, "down_after_seconds": 0.5, "escalate_after_seconds": 0.5,
        "state_dir": str(Path(tmp) / name), "peers": peers,
        "checks": {"disk_path": "/", "disk_warn_pct": 101, "mem_warn_mb": 0},
        "escalation_order": ["claude", "codex"],
        "agents": {
            "local": {"kind": "cmd", "argv": FAKE + ["local"]},
            "claude": {"kind": "cmd", "argv": FAKE + ["claude"], "daily_budget": 1},
            "codex": {"kind": "cmd", "argv": FAKE + ["codex"], "daily_budget": 1},
        },
    }


BASE = [18800]


class Mesh(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        BASE[0] += 3
        b = BASE[0]
        names = {"nyuknyuk": b, "pifive": b + 1, "tom-pi": b + 2}
        self.nodes, self.servers = {}, {}
        for n, port in names.items():
            peers = {p: f"http://127.0.0.1:{pp}" for p, pp in names.items() if p != n}
            cfg = make_cfg(n, port, peers, self.tmp)
            Path(cfg["state_dir"]).mkdir(parents=True)
            node = cm.Node(cfg)
            srv = ThreadingHTTPServer(("127.0.0.1", port), cm.make_handler(node))
            threading.Thread(target=srv.serve_forever, daemon=True).start()
            self.nodes[n], self.servers[n] = node, srv

    def tearDown(self):
        for n, s in self.servers.items():
            if n in self.nodes:
                self.nodes[n].stop.set()
            try:
                s.shutdown(); s.server_close()
            except OSError:
                pass

    def url(self, n):
        return f"http://127.0.0.1:{self.nodes[n].cfg['port']}"

    def wait(self, fn, t=8):
        end = time.time() + t
        while time.time() < end:
            v = fn()
            if v:
                return v
            time.sleep(0.1)
        self.fail("timeout")

    def test_bad_token_rejected(self):
        with self.assertRaises(urllib.error.HTTPError) as e:
            cm.call(self.url("pifive"), "wrong-token-xxxxxxxx", "/status")
        self.assertEqual(e.exception.code, 401)

    def test_everyone_sees_everyone(self):
        for n in self.nodes.values():
            n.poll_once()
        for name, n in self.nodes.items():
            st = cm.call(self.url(name), TOKEN, "/status")
            self.assertTrue(all(p["ok"] for p in st["peers"].values()), st["peers"])

    def test_wake_and_reply_crosses_nodes(self):
        r = cm.call(self.url("tom-pi"), TOKEN, "/msg",
                    {"from": "pifive", "from_agent": "claude", "agent": "codex",
                     "text": "check zigbee", "wake": True, "reply_to": "pifive"})
        self.assertEqual(r["queued"], "wake")
        out = self.wait(lambda: self.nodes["tom-pi"].store.tail("outbox", 5))
        self.assertTrue(out[-1]["ok"]); self.assertIn("FAKE:codex", out[-1]["reply"])
        back = self.wait(lambda: self.nodes["pifive"].store.tail("inbox", 5))
        self.assertEqual(back[-1]["agent"], "claude"); self.assertIn("FAKE:codex", back[-1]["text"])

    def test_unknown_agent_rejected(self):
        with self.assertRaises(urllib.error.HTTPError) as e:
            cm.call(self.url("pifive"), TOKEN, "/msg", {"agent": "gemini", "text": "x", "wake": True})
        self.assertEqual(e.exception.code, 400)

    def test_peer_down_one_escalation_and_budget(self):
        for n in self.nodes.values():
            n.poll_once()
        self.servers["nyuknyuk"].shutdown(); self.servers["nyuknyuk"].server_close()
        del self.nodes["nyuknyuk"]
        for _ in range(12):
            for n in self.nodes.values():
                n.poll_once()
            time.sleep(0.15)
        # Leader among survivors is pifive (alphabetical); only it escalates.
        pi = self.wait(lambda: [r for r in self.nodes["pifive"].store.tail("outbox", 20)
                                if r.get("key") == "down:nyuknyuk"])
        self.assertEqual(pi[0]["agent"], "claude"); self.assertTrue(pi[0]["ok"])
        time.sleep(0.5)
        self.assertFalse([r for r in self.nodes["tom-pi"].store.tail("outbox", 20)
                          if r.get("key") == "down:nyuknyuk"])
        self.assertEqual(self.nodes["pifive"].agents.budget_left("claude"), 0)
        ev = self.nodes["pifive"].store.tail("events", 50)
        self.assertTrue(any(e["event"] == "local_summary" and "FAKE:local" in (e["summary"] or "") for e in ev))

    def test_budget_blocks_second_call(self):
        a = self.nodes["pifive"].agents
        self.assertTrue(a.run("claude", "one")["ok"])
        self.assertIn("budget", a.run("claude", "two")["error"])
        self.assertTrue(a.run("local", "free")["ok"])


if __name__ == "__main__":
    unittest.main()
