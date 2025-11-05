# Agent Instructions

These instructions apply to the Express server located in this directory and its subdirectories.

## Mailing list email delivery (Nodemailer v7)

The mailing list routes rely on Nodemailer v7 transports. When making changes to `server/services/mailingListService.ts`,
`server/index.ts`, or related tests:

- **Keep Nodemailer v7 semantics** – create transports with `nodemailer.createTransport`. Connection strings from
  `MAILING_LIST_SMTP_URL` must be passed directly to `createTransport`; avoid deprecated helper factories from earlier Nodemailer
  releases.
- **Preserve the JSON transport fallback** – when `MAILING_LIST_SMTP_URL` is missing we intentionally fall back to
  `{ jsonTransport: true }` so development builds do not try to reach a live SMTP server. Do not remove this unless you replace it
  with another safe local-only transport.
- **Expect `sendMail` to resolve to `SentMessageInfo`** – Nodemailer v7 returns the structured info object. Callers should continue
  to use the resolved value rather than relying on callbacks or legacy return shapes. See <https://nodemailer.com/usage/> for the
  latest API contract.
- **Verify before sending in production** – if you introduce new transports, call `await transporter.verify()` during setup and
  surface friendly errors that hint at misconfigured SMTP credentials.

## Admin API contract

Routes in `server/routes/mailingListRoutes.ts` back the `services/mailingListAdminClient.ts` fetch helpers. If you add or adjust
fields:

- Continue requiring the `x-api-key` header. Responses should return 401/403 for missing or invalid keys and match the error
  wording already used in the client helpers.
- Preserve the response envelope (`{ subscribers: Subscriber[] }`, `{ recipientCount, messageId }`, etc.) to keep the React admin
  tools working.
