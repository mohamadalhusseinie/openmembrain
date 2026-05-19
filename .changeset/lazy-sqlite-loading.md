---
"openmembrain": patch
---

Fix startup crash ("Dynamic require of fs is not supported") by lazy-loading the SQLite storage backend. The better-sqlite3 native module is now only imported when OPENMEMBRAIN_STORAGE_BACKEND=sqlite is explicitly set, and is marked as an external optional dependency.
