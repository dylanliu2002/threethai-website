#!/usr/bin/env python3
"""Audit meta description lengths across the live sitemap (EN <loc> + zh alternates).

Bing SEO analyzer rule: description should be 25-160 characters.
Flags pages whose <meta name="description"> is out of range.
"""

import re
import sys
import urllib.request

SITEMAP = "https://www.threethai.com/sitemap.xml"
UA = {"user-agent": "meta-audit/1.0"}

def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", "replace")

def desc_of(html: str) -> str | None:
    m = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', html)
    if not m:
        m = re.search(r'<meta\s+content="([^"]*)"\s+name="description"', html)
    return m.group(1) if m else None

def main() -> None:
    xml = fetch(SITEMAP)
    en_urls = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", xml)
    # zh core journey URLs from the homepage hreflang alternates
    home = fetch(en_urls[0])
    zh_urls = sorted(set(re.findall(r'hrefLang="zh-CN"\s+href="([^"]+)"', home)))
    urls = en_urls + zh_urls

    offenders, missing = [], []
    for i, url in enumerate(urls):
        try:
            html = fetch(url)
        except Exception as e:  # noqa: BLE001
            print(f"FETCH-FAIL {url}: {e}")
            continue
        d = desc_of(html)
        if d is None:
            missing.append(url)
            continue
        n = len(d)
        if n < 25 or n > 160:
            offenders.append((url, n, d))
        if (i + 1) % 20 == 0:
            print(f"...{i + 1}/{len(urls)} audited", file=sys.stderr)

    print(f"\nAudited {len(urls)} URLs ({len(en_urls)} EN + {len(zh_urls)} zh)")
    print(f"Out-of-range descriptions: {len(offenders)}")
    for url, n, d in offenders:
        print(f"\n[{n} chars] {url}\n  {d}")
    if missing:
        print(f"\nMissing description entirely: {len(missing)}")
        for url in missing:
            print(f"  {url}")

if __name__ == "__main__":
    main()
