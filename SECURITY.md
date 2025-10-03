Repository maintenance: backups and lockfiles

What changed

- Removed tracked `backups/` artifacts that contained third-party lockfiles and
  produced vulnerable findings in dependency scanners (Trivy).

Why

- Historical backups and exported lockfiles may include known-vulnerable package
  versions or sensitive metadata. They should not be tracked in version control.

Guidance

- Do not commit `backups/` or exported lockfiles into source control. Use
  `.gitignore` (already present) or a secure artifact store.
- If you need to keep backups, store them in an external secure location (S3,
  Azure Blob, etc.) and reference them by ID only.

If you find a new vulnerability in a dependency:

- Prefer patching/upgrading the dependency using `pnpm up <pkg>` or adding a
  safe override in `package.json`.
- If the vulnerable package only appears in backup artifacts, remove those
  backups from the repo and rotate any secrets if exposed.
