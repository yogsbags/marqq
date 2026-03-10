import json
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
HOOKS_CONFIG_PATH = REPO_ROOT / "platform" / "content-engine" / "hooks.json"
SCHEDULER_PATH = REPO_ROOT / "platform" / "crewai" / "autonomous_scheduler.py"


class HooksSchedulerTests(unittest.TestCase):
    def setUp(self):
        self.hooks_config = json.loads(HOOKS_CONFIG_PATH.read_text(encoding="utf-8"))
        self.scheduler_source = SCHEDULER_PATH.read_text(encoding="utf-8")

    def test_loads_enabled_scheduled_hooks(self):
        hooks = [hook for hook in self.hooks_config.get("scheduled", []) if hook.get("enabled")]
        self.assertGreaterEqual(len(hooks), 6)
        self.assertTrue(any(hook["id"] == "veena-weekly-refresh" for hook in hooks))

    def test_cron_translation_preserves_fields(self):
        hook = next(
            hook
            for hook in self.hooks_config.get("scheduled", [])
            if hook["id"] == "veena-weekly-refresh"
        )
        minute, hour, _day, _month, dow = hook["cron"].split()
        self.assertEqual(minute, "0")
        self.assertEqual(hour, "6")
        self.assertEqual(dow, "mon")

    def test_scheduler_registers_jobs_from_hooks_config(self):
        self.assertIn("load_hooks_config()", self.scheduler_source)
        self.assertIn("iter_enabled_scheduled_hooks", self.scheduler_source)
        self.assertIn("cron_trigger_from_hook", self.scheduler_source)
        self.assertIn("hook['id']", self.scheduler_source)


if __name__ == "__main__":
    unittest.main()
