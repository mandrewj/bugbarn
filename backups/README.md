# Data backups

Weekly snapshots of the live Bug Barn dataset (`bugbarn.json`), committed
automatically by [`.github/workflows/weekly-backup.yml`](../.github/workflows/weekly-backup.yml).

- `bugbarn-YYYY-MM-DD.json` — dated snapshot from each weekly run.
- `latest.json` — always the most recent snapshot.

These are the same JSON shape the app exports. To restore one, download it and
use **Settings → Import backup** in the portal (Merge or Replace).

The workflow runs every Monday at 08:00 UTC and can also be triggered manually
from the repo's **Actions** tab. It requires one repository secret,
`BLOB_DATA_URL` — see the workflow file header for setup.
