# Journal readiness gate

Current mode: fixed public fictional preview; no free-text health collection or live journal API.

Prepared schema: supabase/migrations/202610110002_journal.sql. Tested only in local PGlite PostgreSQL; do not apply to cloud as evidence of completed readiness. This migration creates no journal writer or operator permissions. Applying it does not enable health collection.

Encryption: Node AES-256-GCM helper with owner/entry/schema authenticated context. Clinical fields including visit date belong inside the encrypted payload. Mock KMS is test-only and has no production adapter. No plaintext fallback. Envelope encryption requires separate managed KMS with tightly scoped identity, audited use, versioned keys, rotation and recovery procedures. The helper needs deployment-specific cryptographic review before real use.

Required before enabling a journal API:
1. Managed email delivery, verified authentication and session revocation/recent-auth behavior.
2. Managed KMS adapter with real encrypt/decrypt/denial tests and no database-side plaintext keys.
3. Server ownership enforcement, explicit journal consent and atomic audited writes; no broad operator or browser writes.
4. Authenticated edit/export/delete; recent auth for export/delete; no private caching or logging.
5. Two-user cloud tests, tamper rejection, encrypted backup restore/deletion drill.
6. Reviewed hosting/cross-border arrangements, lawful basis, institutions, vendor agreements, retention, incident contacts and bilingual legal text before real patient data.

Founder action when ready: identify an existing managed KMS account/provider and region. Do not paste cloud credentials into chat. Creating paid cloud resources requires explicit authorization. Domain/SMTP verification is independent; no automated monitoring was set up.

Local sessions currently expire after 15 minutes and disappear on restart. They are not yet used to authorize journal operations. Public synthetic previews and signed-in status are not proof of clinical access control.
