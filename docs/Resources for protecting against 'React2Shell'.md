---
title: "Resources for protecting against 'React2Shell'"
source: "https://vercel.com/blog/resources-for-protecting-against-react2shell?inf_ver&inf_ctx=i7zKbu_WYrLN6XZB3-E7bnDCPNRVj9sZGrEBao_UH6KOrPzkXxU8-jz8iPsobpfz0a5goNCO4wG8yn3EQ7zMZDnT6w0JgljlX_z5GN-BdFrgrL_-tg4nsHnObMfyZydb1pu9rAYo6uHDBSsL3N0PuLFp9iuvdTiH6wuOIDJYWH3ym9B_oNywrFoP6GBrKKC-n64FHm1-o8Y8Nnnga4VnQdTto196UqKT6SUjc4w0jw9ifyspHTFj1MI1Es3Yl2pXOr22Cx2LwXcrIT03B_JoPuhNpqg6vOSNVtccO87JLNwWngaW5WCPZIshvaNw9nFZwg-JeP-GvNypahMOXce8YQ"
author:
  - "[[Talha Tariq]]"
  - "[[Jimmy Lai]]"
published: 2025-12-05
created: 2025-12-07
description: "Active exploits exist for CVE-2025-55182 (React2Shell). Vercel WAF protections are in place, but upgrading is the only complete fix. Detection and mitigation steps for Next.js and React Server Components."
tags:
  - "clippings"
---
[Blog](https://vercel.com/blog)[Talha Tariq CTO, Security](https://twitter.com/0xtbt)

[

Jimmy Lai Head of Next.js

](https://twitter.com/feedthejim)

4 min read

**December 05, 10:29 PM PST**: Vercel has released an `npm` package to update your affected Next.js app. Use `npx fix-react2shell-next` or visit the [GitHub page](https://github.com/vercel-labs/fix-react2shell-next) to learn more.

**December 05, 3:44 PM PST:** Vercel has partnered with HackerOne for responsible disclosure of critical Vercel Platform Protection workarounds. Valid reports that demonstrate a successful bypass of Vercel protections will be rewarded for this CVE only.

Bounties: **$25,000 for high, $50,000 for critical.** Visit the [HackerOne page](https://hackerone.com/vercel_platform_protection) to participate.*As of December 4 at 21:04 UTC, various proof-of-concept (POC) exploits for* [*CVE-2025-55182*](https://vercel.com/changelog/cve-2025-55182) *are confirmed to be publicly available. This common vulnerabilities and exposures report (CVE) also impacted* [*all Next.js apps*](https://nextjs.org/blog/CVE-2025-66478) *between 15.0.0 and 16.0.6.*

Please note: We will update this blog post as new information becomes available. We will also post on [X](https://x.com/vercel_dev) each time there is an update. We recommend following Vercel on X and checking back here frequently for the latest.

We are actively monitoring traffic across our platform, and our initial data suggests threat actors are actively probing for vulnerable applications and trying to exploit them.

![Spikes in Vercel WAF validation traffic as unconfirmed POCs began to appear](https://vercel.com/vc-ap-vercel-marketing/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fcontentful%2Fimage%2Fe5382hct74si%2F5jNH8Df1AIIzuNapXyER9F%2F380ace9f32afd7c48a2b5f4a7e06b171%2FLight.png&w=1920&q=75) ![Spikes in Vercel WAF validation traffic as unconfirmed POCs began to appear](https://vercel.com/vc-ap-vercel-marketing/_next/image?url=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Fcontentful%2Fimage%2Fe5382hct74si%2F10TnN9q0rhaJaaTij95T6h%2F9e46adbff6f8aeabd0e1aa06ef98a3c5%2FDark.png&w=1920&q=75)

Spikes in Vercel WAF validation traffic as unconfirmed POCs began to appear

If your application is hosted on Vercel, our WAF is already filtering and blocking known exploit patterns. **However, upgrading to a** [**patched version**](https://nextjs.org/blog/CVE-2025-66478) **is strongly recommended and the only complete fix.** All users of React Server Components, whether through Next.js or any other framework, should update immediately.

Vercel has taken a defense-in-depth approach to ensure customers and the broader community are protected. [Prior to the CVE announcement](https://vercel.com/changelog/cve-2025-55182), we worked with the React Team to design WAF rules to block exploitation and globally delivered protection to all Vercel users at no cost. We also shared these mitigations with major CDN and WAF providers so they could prepare before this CVE was announced. We are constantly learning and improving our detections.

Today, we also [shipped a change to block new deployments](https://vercel.com/changelog/new-deployments-of-vulnerable-next-js-applications-are-now-blocked-by) of projects using vulnerable versions of Next.js.

This post aims to provide clarity on the next steps for detection and mitigation for Vercel customers, and to broadly share answers to their most common questions.

Compare your version of Next.js against the table below. You can find your Next.js version through either of the following methods:

- Load a page from your app and run `next.version` in the browser console to see the current version
- Inspect your project’s `package.json` and look for `next` in your project dependencies

| **Vulnerable version** | **Patched release** |
| --- | --- |
| Next.js 15.0.x | 15.0.5 |
| Next.js 15.1.x | 15.1.9 |
| Next.js 15.2.x | 15.2.6 |
| Next.js 15.3.x | 15.3.6 |
| Next.js 15.4.x | 15.4.8 |
| Next.js 15.5.x | 15.5.7 |
| Next.js 16.0.x | 16.0.7 |
| Next.js 14 canaries **after** 14.3.0-canary.76 | Downgrade to 14.3.0-canary.76 (not vulnerable) |
| Next.js 15 canaries **before** 15.6.0-canary.58 | 15.6.0-canary.58 |
| Next.js 16 canaries **before** 16.1.0-canary.12 | 16.1.0-canary.12 and after |

If you are using a vulnerable version of Next.js you should update to a non-vulnerable version immediately.

If you use another framework that implements React Server Components, consult the [React Security Advisory](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) posted on the [react.dev](http://react.dev/) blog. If you are running a vulnerable version of the affected software, you should update to a patched version immediately.

The most definitive way to understand your exposure is to check the version of React/Next that you have deployed against the CVE. See the [Vulnerability detection and mitigation steps above](https://vercel.com/blog/?inf_ver&inf_ctx=i7zKbu_WYrLN6XZB3-E7bnDCPNRVj9sZGrEBao_UH6KOrPzkXxU8-jz8iPsobpfz0a5goNCO4wG8yn3EQ7zMZDnT6w0JgljlX_z5GN-BdFrgrL_-tg4nsHnObMfyZydb1pu9rAYo6uHDBSsL3N0PuLFp9iuvdTiH6wuOIDJYWH3ym9B_oNywrFoP6GBrKKC-n64FHm1-o8Y8Nnnga4VnQdTto196UqKT6SUjc4w0jw9ifyspHTFj1MI1Es3Yl2pXOr22Cx2LwXcrIT03B_JoPuhNpqg6vOSNVtccO87JLNwWngaW5WCPZIshvaNw9nFZwg-JeP-GvNypahMOXce8YQ#vulnerability-detection-and-mitigation-steps) for information on how to check this.

We have enabled a banner on [vercel.com](http://vercel.com/) for our customers that informs you if the production deployment of a project contains a vulnerable version of `next`, `react-server-dom-webpack`, `react-server-dom-parcel`, or `react-server-dom-turbopack`.

Please consider this an extra layer of defense and not a replacement for checking if you are running vulnerable versions directly.

Vercel deployed WAF mitigations prior to the CVE announcement. As new exploit variants have emerged, we have identified and patched bypasses to our WAF rules. WAF rules are one layer of defense but can never guarantee 100% coverage. Upgrading to a patched version remains the only way to fully secure your application.

For additional assurance, we recommend reviewing your application logs and activity for unexpected behavior. This could include unusual POST requests or spikes in function timeouts. However, function timeouts do not reliably indicate compromise because attackers can craft payloads that complete successfully, and timeouts could simply indicate scanning or probing activity rather than successful exploitation.

Upgrading to a patched version is the only complete fix. Vercel WAF rules provide an additional layer of defense by filtering known exploit patterns, but WAF rules cannot guarantee protection against all possible variants of an attack.

You can ensure other deployments besides your production domain are protected by reviewing [your deployment protection settings](https://vercel.com/docs/deployment-protection#understanding-deployment-protection-by-environment).

We are closely monitoring for new exploit variants and iterating on our WAF rules as new information emerges. As of this morning, December 5, we’ve deployed additional rules to cover newly identified attack patterns. Our team will continue to add further layers of protections and share updates as they become available.

If you are currently using canary-only features in Next.js you should still prioritize updating to a patched version. See the [Required Action section](https://nextjs.org/blog/CVE-2025-66478#required-action) of the [Next.js Security Advisory](https://nextjs.org/blog/CVE-2025-66478) for instructions on how to update to a patched Next.js version without having to disable canary-only features.

We caution against using publicly available exploits against your production environment. Instead, we recommend following the above procedures to ensure all public deployments are using the latest versions of React Server Components and Next.js.

If you have a complex deployment that requires additional verification, we recommend testing in a sandboxed environment with synthetic data to avoid unintended consequences on your production services and data.

For additional questions, contact us at [security@vercel.com](https://vercel.com/blog/).