# Email registration readiness / 邮箱注册上线检查

Prepared bilingual template: supabase/templates/email-otp.html. Copy only its HTML into the relevant Supabase OTP email template after reviewing settings. Subject: First TCM Experience — Email verification code / 邮箱验证码.

Current status: no configured mail provider in the application; all sends disabled. DNS and SMTP verification are not implied by passing code tests.

Founder configuration once Resend sending is verified:
- Supabase custom SMTP sender: a verified address such as noreply@hellotcm.world; sender name First TCM Experience.
- Copy host/port/username directly from Resend's current SMTP settings. Enter the API key as SMTP password privately in Supabase; never paste it into chat, source, client env or screenshots.
- Configure both signup/confirmation and magic-link templates as needed so the email contains the numeric {{ .Token }}. Keep email confirmation enabled.
- Use exact local/hosted URL allowlists rather than wildcard redirects; current local origin is http://127.0.0.1:4173. Do not assume a domain is deployed simply because DNS is registered.
- Disable link/open tracking for authentication emails. The prepared template contains no tracking image or external URL.

Application activation work still required:
- Bind reviewed mail provider and explicit managed account-creation setting to the backend. Do not bypass managed verification.
- Add auth-specific CAPTCHA/challenge verification and test email/IP limits under provider failures.
- Run actual code request/verification with the founder-controlled inbox without logging the address/code/tokens.
- Verify signed-in/out UI, cookie expiry, failed code and account isolation on actual managed Auth.
- Verify account revocation behavior and recent authentication before any sensitive operation.
- Complete bilingual account privacy/terms before allowing public registration.

Registration is separate from health journals and Devnet wallets. A successful email session enables neither journal storage nor a payment claim. Demo booking remains synthetic-only until its separate privacy/operational prerequisites are ready.

During DNS pending, do not repeatedly change records or initiate competing domain verification configurations. No email is sent by preparing this document.
