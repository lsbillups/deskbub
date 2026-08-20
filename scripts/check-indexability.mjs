const baseUrl = (process.env.INDEXABILITY_BASE_URL || process.argv[2] || 'https://deskbub.com').replace(/\/$/, '');
const paths = (process.env.INDEXABILITY_PATHS || '/,/download,/blog,/blog/how-to-make-a-desktop-pet')
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean);
const attempts = Number(process.env.INDEXABILITY_ATTEMPTS || 12);
const delayMs = Number(process.env.INDEXABILITY_DELAY_MS || 15_000);
const googlebotMobile =
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 ' +
  '(compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function describeError(error) {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause instanceof Error ? ` (${error.cause.message})` : '';
  return `${error.message}${cause}`;
}

function hasNoindex(value = '') {
  return value
    .split(',')
    .map((directive) => directive.trim().toLowerCase())
    .includes('noindex');
}

function metaRobotsHasNoindex(html) {
  const tags = html.match(/<meta\s+[^>]*>/gi) || [];
  return tags.some((tag) => {
    const namesRobots = /name\s*=\s*["'](?:robots|googlebot)["']/i.test(tag);
    const noindex = /content\s*=\s*["'][^"']*\bnoindex\b[^"']*["']/i.test(tag);
    return namesRobots && noindex;
  });
}

async function inspect(path) {
  const url = new URL(path, `${baseUrl}/`).toString();
  const response = await fetch(url, {
    headers: {
      'user-agent': googlebotMobile,
      accept: 'text/html,application/xhtml+xml',
      'cache-control': 'no-cache',
    },
    redirect: 'follow',
  });
  const html = await response.text();
  const xRobotsTag = response.headers.get('x-robots-tag') || '';
  const failures = [];

  if (!response.ok) failures.push(`HTTP ${response.status}`);
  if (hasNoindex(xRobotsTag)) failures.push(`X-Robots-Tag=${JSON.stringify(xRobotsTag)}`);
  if (metaRobotsHasNoindex(html)) failures.push('HTML contains a robots/googlebot noindex meta tag');
  if (new URL(response.url).hostname !== new URL(baseUrl).hostname) {
    failures.push(`redirected off the custom domain to ${response.url}`);
  }

  return { url, status: response.status, xRobotsTag: xRobotsTag || '(absent)', failures };
}

let passed = false;

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const results = await Promise.all(paths.map((path) => inspect(path).catch((error) => ({
    url: new URL(path, `${baseUrl}/`).toString(),
    status: 'request failed',
    xRobotsTag: '(unknown)',
    failures: [describeError(error)],
  }))));
  const failed = results.filter((result) => result.failures.length > 0);

  for (const result of results) {
    const verdict = result.failures.length === 0 ? 'PASS' : 'FAIL';
    console.log(`${verdict} ${result.url} status=${result.status} x-robots-tag=${result.xRobotsTag}`);
    for (const failure of result.failures) console.log(`  - ${failure}`);
  }

  if (failed.length === 0) {
    console.log(`Production indexability check passed for ${results.length} public pages.`);
    passed = true;
    break;
  }

  if (attempt < attempts) {
    console.log(`Attempt ${attempt}/${attempts} failed; retrying in ${delayMs / 1000}s.`);
    await sleep(delayMs);
  }
}

if (!passed) {
  console.error(`Production indexability check failed after ${attempts} attempts.`);
  process.exitCode = 1;
}
