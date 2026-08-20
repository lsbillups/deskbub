# Vercel + Google indexing release standard

Use this runbook for DeskBub and as the baseline for any future website hosted on
Vercel. Its purpose is to prevent Google from seeing a Vercel-generated
`X-Robots-Tag: noindex` response during a release.

## What happened to DeskBub

DeskBub had two separate Search Console reports in July and August 2026 where
Googlebot successfully fetched a public URL but received
`X-Robots-Tag: noindex` in the HTTP response.

Verified facts:

- Vercel automatically adds `X-Robots-Tag: noindex` to Preview deployments and
  outdated Production deployments. This header is produced by Vercel, not by a
  robots meta tag in DeskBub's public pages.
- The July Search Console report said Google discovered the URL from DeskBub's
  `/download` page and MerchantGenius. A later July crawl followed another
  indexing request. There is no evidence that Vercel privately notified Google
  about a Preview URL.
- On August 19, a Preview deployment completed at 09:50 +08 and the Production
  deployment of the same commit completed at 10:09 +08. Search Console reports a
  crawl at 10:00:49, inside that release window.
- The sitemap previously set every static page's `lastmod` to the build time.
  Thus every deployment falsely announced that every page had just changed.
- Before this incident fix, the Clerk middleware ran on every public document.
  A full Googlebot mobile `GET` was redirected to a Clerk development-instance
  handshake (`*.clerk.accounts.dev`) because of `dev-browser-missing`. Public
  routes now bypass authentication middleware; only `/dashboard`, `/upload`, and
  `/api` run it.
- DeskBub's apex domain still uses Vercel's older generic `76.76.21.21` DNS
  target. Vercel previously recommended a project-specific DNS target. This is a
  routing risk to remove, but it does not by itself prove which edge served the
  two historical responses.

Best-supported causal chain:

1. Links, sitemap changes, and manual Search Console indexing requests cluster
   around releases and give Google reasons to recrawl.
2. Vercel deliberately marks Preview and outdated Production deployments
   `noindex`.
3. During the release transition Googlebot received one of those protected
   responses through the custom domain.

Step 3 is an inference. The exact request-to-deployment routing cannot be proved
without Vercel request logs or a Vercel support investigation. The recurring
pattern is nevertheless preventable by removing false crawl signals and refusing
to request indexing until the custom domain has passed a post-deployment check.

## Permanent engineering controls

- Preview deployments must remain `noindex`; never add a rule that makes them
  indexable.
- Production explicitly sends `X-Robots-Tag: index, follow` for public routes.
- Private routes (`/api`, `/dashboard`, `/upload`, `/sign-in`, `/sign-up`) remain
  `noindex, nofollow` in Production.
- Sitemap `lastmod` values must be the page's real meaningful-update date. Never
  use `new Date()` or deployment time for unchanged pages.
- Authentication middleware must not wrap crawlable public pages unless there is
  a verified need. Test with a real `GET` and the complete Googlebot mobile user
  agent; a `HEAD` request did not reproduce DeskBub's Clerk redirect.
- `.github/workflows/verify-production-indexability.yml` runs after a successful
  Vercel Production deployment. It retries the custom domain with Googlebot's
  mobile user agent and fails if a public page returns a non-2xx status, an HTTP
  `noindex`, an HTML meta `noindex`, or redirects off the custom domain.
- Run the same check manually with `npm run check:indexability`.

## Release procedure

1. Merge or push the finished commit to the Vercel Production branch (`main`).
   A Preview is for review only and must never be submitted to Search Console.
2. Wait until Vercel marks the Production deployment Ready. Do not request
   indexing while a Preview is ready but Production is still building.
3. Wait for the `Verify production indexability` GitHub Actions job to pass.
4. Confirm `https://deskbub.com/robots.txt` and
   `https://deskbub.com/sitemap.xml` load from the custom domain.
5. Only after steps 2–4 pass, use Search Console's **Test live URL**. Request
   indexing only if that live test says indexing is allowed.
6. Submit the sitemap once. Repeated sitemap submissions do not accelerate
   crawling.

If the automated check fails, do not request indexing. Inspect Vercel's domain
assignment and deployment target, then run:

```powershell
$env:INDEXABILITY_BASE_URL='https://deskbub.com'
npm run check:indexability
```

## DNS check

In Vercel **Project → Settings → Domains**, copy the current recommended DNS
record for `deskbub.com`. In Cloudflare, replace the legacy generic apex record
with that exact project-specific record and keep Cloudflare proxying disabled
until Vercel verifies it. Do not reuse a target copied from an old screenshot;
Vercel's current dashboard is authoritative.

After DNS changes, verify from at least two resolvers and rerun the indexability
check. DNS is an owner-controlled dashboard change and is not performed as part
of an ordinary code deployment.

## Incident response

When Search Console reports an HTTP-header `noindex`:

1. Save the affected URL, crawl timestamp, user agent, referrer/sitemap evidence,
   and a screenshot.
2. Record the Vercel Preview and Production deployment timestamps and commit
   hashes around the crawl.
3. Check the live custom domain with normal and Googlebot mobile user agents.
4. If live is clean, use **Test live URL** before requesting another crawl.
5. If live is not clean, stop release activity and open a Vercel support case
   with the timestamps and deployment IDs; request routing/CDN logs for the
   custom domain.

## Primary references

- Vercel response headers:
  https://vercel.com/docs/headers/response-headers
- Vercel Preview indexing behavior:
  https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines
- Vercel deployment environments:
  https://vercel.com/docs/deployments/environments
- Google: how Google discovers pages and SEO basics:
  https://developers.google.com/search/docs/fundamentals/get-started-developers
- Google: request a recrawl and sitemap limitations:
  https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- Google: crawling troubleshooting:
  https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors
