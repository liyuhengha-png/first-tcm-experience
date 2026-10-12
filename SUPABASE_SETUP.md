# Supabase test setup · 测试项目配置

Only synthetic test data. Do not use this test region/project as evidence that real Chinese patient-data hosting or transfers are compliant.

## Founder steps
1. Open https://supabase.com/dashboard and create/sign in to your own account. Complete login, any CAPTCHA and terms yourself.
2. Create a Free-plan organization/project named first-tcm-demo. If the dashboard requires a paid upgrade or payment, stop and tell the agent; no paid resources authorized.
3. Create and save a strong database password in your password manager. Never send it in chat.
4. Choose an available nearby region for synthetic testing only (e.g. Singapore if available); production location must undergo a separate review.
5. Wait for the project to become ready. Tell the agent “测试项目已创建” and the region. Do not paste keys or passwords.
6. The agent will then guide server-only local configuration and reviewed migration on this newly created EMPTY project. The SQL file is supabase/migrations/202610100001_booking.sql. Do not run it on an existing populated project.

## Keys and local configuration
The adapter supports modern sb_secret_ keys in SUPABASE_SECRET_KEY (preferred) and legacy JWT service_role keys in SUPABASE_SERVICE_ROLE_KEY. Both are privileged server credentials, never anon/publishable, never VITE_ and never put in browser or chat. Modern keys are sent in the apikey header, not as a Bearer JWT. User JWT authentication remains separate.

Use .env.example as a reference. The actual ignored .env belongs in the project root. The agent can open the editor; enter secrets yourself. Do not expose them through screenshots or command output.

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET_KEY
APP_ORIGIN=http://127.0.0.1:4173
PORT=4173
SYNTHETIC_LOCAL_DB=false
```

Do not enable ALLOW_REAL_BOOKING_DATA. Local synthetic preview uses a different explicit mode; to test configured Supabase start pnpm preview after migration, not pnpm preview:synthetic.

## Agent verification after configuration
- Verify configuration presence without printing values.
- Apply the reviewed schema only to the confirmed empty test project; no broad operator/journal access.
- Exercise synthetic booking through the actual server and verify transactional booking/consent/audit persistence and safe receipt.
- Create/use two distinct synthetic managed-auth test users and prove actual Supabase RLS isolation. No real email/password data in fixtures or logs.
- Keep real clinical input disabled; KMS/privacy/hosting review remains mandatory before health-data collection.

Sources: https://supabase.com/docs/guides/getting-started/api-keys and https://supabase.com/docs/guides/platform/billing-on-supabase. Free-plan terms and dashboard UI can change; confirm the plan shown before creation.
