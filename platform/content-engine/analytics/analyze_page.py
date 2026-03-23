#!/usr/bin/env python3
"""
Marketing Page Analyzer — full-page marketing analysis
Scores SEO, CRO, trust signals, and tracking implementation.
Accepts a URL argument; returns structured JSON.
"""

import sys
import json
import re
import urllib.request
import urllib.error
import ssl
from html.parser import HTMLParser
from urllib.parse import urlparse, urljoin


class MarketingPageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.meta_description = ""
        self.meta_viewport = ""
        self.canonical = ""
        self.og_title = ""
        self.og_description = ""
        self.og_image = ""
        self.h1_tags = []
        self.h2_tags = []
        self.h3_tags = []
        self.links = []
        self.images = []
        self.forms = []
        self.cta_buttons = []
        self.scripts = []
        self.schema_types = []
        self.social_links = []
        self.word_count = 0

        self._in_title = False
        self._in_h1 = False
        self._in_h2 = False
        self._in_h3 = False
        self._in_script = False
        self._in_form = False
        self._in_a = False
        self._in_button = False
        self._current_text = ""
        self._current_script = ""
        self._all_text = []
        self._current_form_fields = 0

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag == "title":
            self._in_title = True
            self._current_text = ""

        elif tag == "meta":
            name = attrs_dict.get("name", "").lower()
            prop = attrs_dict.get("property", "").lower()
            content = attrs_dict.get("content", "")
            http_equiv = attrs_dict.get("http-equiv", "").lower()
            if name == "description":
                self.meta_description = content
            elif name == "viewport":
                self.meta_viewport = content
            elif prop == "og:title":
                self.og_title = content
            elif prop == "og:description":
                self.og_description = content
            elif prop == "og:image":
                self.og_image = content

        elif tag == "link":
            rel = attrs_dict.get("rel", "").lower()
            if rel == "canonical":
                self.canonical = attrs_dict.get("href", "")

        elif tag == "h1":
            self._in_h1 = True
            self._current_text = ""
        elif tag == "h2":
            self._in_h2 = True
            self._current_text = ""
        elif tag == "h3":
            self._in_h3 = True
            self._current_text = ""

        elif tag == "a":
            self._in_a = True
            self._current_text = ""
            href = attrs_dict.get("href", "")
            self.links.append({"href": href, "text": ""})
            social_platforms = {
                "twitter.com": "Twitter", "x.com": "Twitter",
                "facebook.com": "Facebook", "linkedin.com": "LinkedIn",
                "instagram.com": "Instagram", "youtube.com": "YouTube",
                "tiktok.com": "TikTok", "github.com": "GitHub"
            }
            for domain, platform in social_platforms.items():
                if domain in href:
                    self.social_links.append(platform)

        elif tag == "button":
            self._in_button = True
            self._current_text = ""

        elif tag == "img":
            alt = attrs_dict.get("alt", "")
            src = attrs_dict.get("src", "")
            self.images.append({"src": src, "alt": alt, "has_alt": bool(alt.strip())})

        elif tag == "form":
            self._in_form = True
            self._current_form_fields = 0

        elif tag in ["input", "select", "textarea"] and self._in_form:
            input_type = attrs_dict.get("type", "text").lower()
            if input_type not in ["hidden", "submit", "button", "reset"]:
                self._current_form_fields += 1

        elif tag == "script":
            self._in_script = True
            self._current_script = ""
            src = attrs_dict.get("src", "")
            if src:
                self.scripts.append({"src": src, "inline": False})

        elif tag == "script" and attrs_dict.get("type") == "application/ld+json":
            self._in_script = True
            self._current_script = ""

    def handle_endtag(self, tag):
        if tag == "title" and self._in_title:
            self._in_title = False
            self.title = self._current_text.strip()
        elif tag == "h1" and self._in_h1:
            self._in_h1 = False
            text = self._current_text.strip()
            if text:
                self.h1_tags.append(text)
        elif tag == "h2" and self._in_h2:
            self._in_h2 = False
            text = self._current_text.strip()
            if text:
                self.h2_tags.append(text)
        elif tag == "h3" and self._in_h3:
            self._in_h3 = False
            text = self._current_text.strip()
            if text:
                self.h3_tags.append(text)
        elif tag == "form" and self._in_form:
            self._in_form = False
            self.forms.append({"fields": self._current_form_fields})
        elif tag == "a" and self._in_a:
            self._in_a = False
            text = self._current_text.strip()
            if self.links:
                self.links[-1]["text"] = text
            cta_words = ["sign up", "get started", "try free", "start free", "buy", "subscribe",
                         "join now", "register", "download", "book a demo", "request demo",
                         "get demo", "contact", "get quote", "free trial"]
            if any(w in text.lower() for w in cta_words):
                self.cta_buttons.append(text)
        elif tag == "button" and self._in_button:
            self._in_button = False
            text = self._current_text.strip()
            if text:
                cta_words = ["sign up", "get started", "try", "buy", "subscribe", "join",
                             "register", "download", "demo", "contact", "free"]
                if any(w in text.lower() for w in cta_words):
                    self.cta_buttons.append(text)
        elif tag == "script" and self._in_script:
            self._in_script = False
            script_content = self._current_script
            # Check for tracking tools
            if "googletagmanager.com" in script_content or "ga(" in script_content or "gtag(" in script_content:
                self.scripts.append({"src": "google_analytics", "inline": True})
            if "fbevents.js" in script_content or "fbq(" in script_content:
                self.scripts.append({"src": "meta_pixel", "inline": True})
            if "hubspot" in script_content.lower():
                self.scripts.append({"src": "hubspot", "inline": True})
            if "hotjar" in script_content.lower():
                self.scripts.append({"src": "hotjar", "inline": True})
            if "intercom" in script_content.lower():
                self.scripts.append({"src": "intercom", "inline": True})
            # Schema detection
            if '"@type"' in script_content:
                type_matches = re.findall(r'"@type"\s*:\s*"([^"]+)"', script_content)
                self.schema_types.extend(type_matches)
            self._current_script = ""

    def handle_data(self, data):
        if self._in_title or self._in_h1 or self._in_h2 or self._in_h3 or self._in_a or self._in_button:
            self._current_text += data
        if self._in_script:
            self._current_script += data
        text = data.strip()
        if text:
            self._all_text.append(text)

    def get_full_text(self):
        return " ".join(self._all_text)


def fetch_page(url):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        response = urllib.request.urlopen(req, timeout=20, context=ctx)
        return response.read().decode("utf-8", errors="replace"), response.geturl()
    except Exception as e:
        return None, str(e)


def check_url(url):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        req = urllib.request.Request(url, method="HEAD",
            headers={"User-Agent": "Mozilla/5.0"})
        urllib.request.urlopen(req, timeout=10, context=ctx)
        return True
    except:
        return False


def analyze_page(url):
    if not url.startswith("http"):
        url = "https://" + url

    parsed = urlparse(url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"

    html, final_url = fetch_page(url)
    if not html:
        return {"error": f"Could not fetch page: {final_url}"}

    parser = MarketingPageParser()
    try:
        parser.feed(html)
    except Exception as e:
        return {"error": f"Parse error: {str(e)}"}

    full_text = parser.get_full_text()
    word_count = len(full_text.split())

    # Categorize links
    internal_links = [l for l in parser.links if parsed.netloc in l.get("href", "") or l.get("href", "").startswith("/")]
    external_links = [l for l in parser.links if l.get("href", "").startswith("http") and parsed.netloc not in l.get("href", "")]

    # Detect tracking tools
    script_srcs = " ".join([s.get("src", "") for s in parser.scripts])
    tracking_tools = []
    if "google_analytics" in script_srcs or "googletagmanager" in script_srcs or "gtag" in html:
        tracking_tools.append("Google Analytics / GTM")
    if "meta_pixel" in script_srcs or "connect.facebook.net" in html or "fbq" in html:
        tracking_tools.append("Meta Pixel")
    if "hubspot" in script_srcs or "hs-scripts.com" in html:
        tracking_tools.append("HubSpot")
    if "hotjar" in script_srcs or "hotjar.com" in html:
        tracking_tools.append("Hotjar")
    if "intercom" in script_srcs or "intercomcdn.com" in html:
        tracking_tools.append("Intercom")
    if "segment.com" in html or "analytics.js" in html:
        tracking_tools.append("Segment")

    # Check robots.txt and sitemap
    robots_ok = check_url(f"{base_url}/robots.txt")
    sitemap_ok = check_url(f"{base_url}/sitemap.xml")

    # Images without alt text
    images_without_alt = [img for img in parser.images if not img["has_alt"]]
    alt_text_coverage = (len(parser.images) - len(images_without_alt)) / max(len(parser.images), 1) * 100

    # ── SCORING ──────────────────────────────────────────────────────────────

    # SEO Score (0-10)
    seo_score = 0
    title_len = len(parser.title)
    if 30 <= title_len <= 60:
        seo_score += 2
    elif title_len > 0:
        seo_score += 1
    desc_len = len(parser.meta_description)
    if 120 <= desc_len <= 160:
        seo_score += 2
    elif desc_len > 0:
        seo_score += 1
    if parser.h1_tags:
        seo_score += 2
    if parser.h2_tags:
        seo_score += 1
    if parser.meta_viewport:
        seo_score += 1
    if parser.canonical:
        seo_score += 1
    if alt_text_coverage >= 80:
        seo_score += 1

    # CTA Score (0-10)
    cta_score = 0
    cta_count = len(set(parser.cta_buttons))
    if cta_count >= 3:
        cta_score += 3
    elif cta_count >= 1:
        cta_score += 2
    if parser.forms:
        form_fields = parser.forms[0]["fields"] if parser.forms else 0
        if 1 <= form_fields <= 3:
            cta_score += 3
        elif form_fields <= 6:
            cta_score += 2
        else:
            cta_score += 1
    if parser.og_image:
        cta_score += 1
    if word_count >= 300:
        cta_score += 2
    if word_count >= 800:
        cta_score += 1

    # Trust Score (0-10)
    trust_score = 0
    if len(parser.social_links) >= 3:
        trust_score += 3
    elif len(parser.social_links) >= 1:
        trust_score += 2
    if parser.schema_types:
        trust_score += 2
    if parser.og_title and parser.og_description:
        trust_score += 2
    if parser.og_image:
        trust_score += 1
    if robots_ok:
        trust_score += 1
    if sitemap_ok:
        trust_score += 1

    # Tracking Score (0-10)
    tracking_score = min(len(tracking_tools) * 2, 8)
    if robots_ok:
        tracking_score = min(tracking_score + 1, 10)
    if sitemap_ok:
        tracking_score = min(tracking_score + 1, 10)

    overall_score = (seo_score + cta_score + trust_score + tracking_score) / 4

    return {
        "url": url,
        "seo": {
            "title": parser.title,
            "title_length": title_len,
            "title_optimal": 30 <= title_len <= 60,
            "meta_description": parser.meta_description,
            "meta_description_length": desc_len,
            "meta_description_optimal": 120 <= desc_len <= 160,
            "h1_count": len(parser.h1_tags),
            "h1_tags": parser.h1_tags[:3],
            "h2_count": len(parser.h2_tags),
            "h2_tags": parser.h2_tags[:5],
            "has_viewport": bool(parser.meta_viewport),
            "has_canonical": bool(parser.canonical),
            "images_total": len(parser.images),
            "images_without_alt": len(images_without_alt),
            "alt_text_coverage_pct": round(alt_text_coverage, 1),
            "has_robots_txt": robots_ok,
            "has_sitemap": sitemap_ok,
            "score": seo_score,
            "score_max": 10
        },
        "cta": {
            "cta_buttons": list(set(parser.cta_buttons))[:10],
            "cta_count": len(set(parser.cta_buttons)),
            "forms": parser.forms,
            "form_count": len(parser.forms),
            "word_count": word_count,
            "score": cta_score,
            "score_max": 10
        },
        "trust": {
            "social_platforms": list(set(parser.social_links)),
            "schema_types": list(set(parser.schema_types)),
            "has_og_tags": bool(parser.og_title),
            "has_og_image": bool(parser.og_image),
            "score": trust_score,
            "score_max": 10
        },
        "tracking": {
            "tools_detected": tracking_tools,
            "tool_count": len(tracking_tools),
            "score": tracking_score,
            "score_max": 10
        },
        "links": {
            "internal_count": len(internal_links),
            "external_count": len(external_links)
        },
        "overall_score": round(overall_score, 1),
        "overall_score_max": 10
    }


def main():
    if len(sys.argv) < 2:
        # Demo mode
        demo = {
            "url": "https://example.com",
            "seo": {"score": 7, "score_max": 10, "title": "Example Domain", "h1_count": 1},
            "cta": {"score": 5, "score_max": 10, "cta_count": 2},
            "trust": {"score": 6, "score_max": 10},
            "tracking": {"score": 4, "score_max": 10, "tools_detected": ["Google Analytics"]},
            "overall_score": 5.5,
            "overall_score_max": 10
        }
        print(json.dumps(demo, indent=2))
        return

    url = sys.argv[1]
    result = analyze_page(url)
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
