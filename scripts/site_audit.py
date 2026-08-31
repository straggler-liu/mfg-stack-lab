#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import argparse, json, re, sys, urllib.request

ROOT = Path(__file__).resolve().parents[1]
PLACEHOLDERS = ('YOUR-DOMAIN', 'Replace this paragraph', 'operating company name', 'company email and jurisdiction')
VERIFICATION_FILE = 'googlea4b5334b8d3b78e4.html'
VERIFICATION_TOKEN = 'google-site-verification: googlea4b5334b8d3b78e4.html'
REQUIRED_PUBLISH_PATHS = (
    'decision-engine.html',
    'fit-check.html',
    'vendor-partners.html',
    'services/software-fit-diagnostic.html',
    'data/fit-model-v1.json',
)

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.title=''; self.h1=0; self.desc=False; self._in_title=False
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag in ('a','link') and attrs.get('href'): self.links.append(attrs['href'])
        if tag in ('script','img') and attrs.get('src'): self.links.append(attrs['src'])
        if tag=='title': self._in_title=True
        if tag=='h1': self.h1 += 1
        if tag=='meta' and attrs.get('name')=='description' and attrs.get('content'): self.desc=True
    def handle_endtag(self, tag):
        if tag=='title': self._in_title=False
    def handle_data(self, data):
        if self._in_title: self.title += data.strip()

def local_target(source: Path, href: str) -> Path | None:
    if not href or href.startswith(('#','mailto:','tel:','javascript:')): return None
    p=urlparse(href)
    if p.scheme or p.netloc: return None
    clean=p.path
    if not clean: return None
    return (source.parent / clean).resolve()

def publish_html_pages():
    pages=[]
    for path in ROOT.rglob('*.html'):
        rel=path.relative_to(ROOT)
        if rel.parts and rel.parts[0] in ('.git','public'):
            continue
        if path.name == VERIFICATION_FILE:
            continue
        pages.append(path)
    return sorted(pages)

def audit_local():
    errors=[]; pages=[]
    for required in REQUIRED_PUBLISH_PATHS:
        if not (ROOT / required).exists(): errors.append(f'{required}: required publish asset missing')
    for path in publish_html_pages():
        rel=path.relative_to(ROOT).as_posix()
        text=path.read_text(encoding='utf-8')
        p=Parser(); p.feed(text)
        if not p.title: errors.append(f'{rel}: missing title')
        if not p.desc: errors.append(f'{rel}: missing meta description')
        if p.h1 != 1: errors.append(f'{rel}: expected one h1, found {p.h1}')
        for placeholder in PLACEHOLDERS:
            if placeholder.lower() in text.lower(): errors.append(f'{rel}: unresolved placeholder: {placeholder}')
        for href in p.links:
            target=local_target(path, href)
            if target and not target.exists(): errors.append(f'{rel}: missing local target {href}')
        pages.append({'page':rel,'title':p.title,'h1':p.h1,'links':len(p.links)})
    verification = ROOT / VERIFICATION_FILE
    if not verification.exists():
        errors.append(f'{VERIFICATION_FILE}: missing Google verification file')
    elif verification.read_text(encoding='utf-8').strip() != VERIFICATION_TOKEN:
        errors.append(f'{VERIFICATION_FILE}: verification token mismatch')
    if 'YOUR-DOMAIN' in (ROOT/'robots.txt').read_text(encoding='utf-8'): errors.append('robots.txt: unresolved domain')
    if 'YOUR-DOMAIN' in (ROOT/'sitemap.xml').read_text(encoding='utf-8'): errors.append('sitemap.xml: unresolved domain')
    return {'ok':not errors,'errors':errors,'pages':pages}

def audit_live(base: str):
    errors=[]; results=[]
    checks=(
        ('','Map the software boundary before vendor demos shape the answer.'),
        ('decision-engine.html','Start with your operating constraint, not a software catalog.'),
        ('fit-check.html','Manufacturing Software Fit Check'),
        ('vendor-partners.html','Qualified manufacturing software opportunities'),
        ('services/software-fit-diagnostic.html','Manufacturing Software Fit Diagnostic'),
        ('methodology.html','MFGFIT/1'),
        ('data/fit-model-v1.json','MFGFIT/1'),
        (VERIFICATION_FILE,VERIFICATION_TOKEN),
    )
    for rel,marker in checks:
        url=base.rstrip('/')+'/'+rel
        req=urllib.request.Request(url,headers={'User-Agent':'MFGStackLab-Monitor/1.2'})
        try:
            with urllib.request.urlopen(req,timeout=20) as r:
                code=r.status; body=r.read(500000).decode('utf-8','ignore')
            if code != 200: errors.append(f'{url}: HTTP {code}')
            if marker not in body: errors.append(f'{url}: required marker missing: {marker}')
            results.append({'url':url,'status':code,'bytes':len(body)})
        except Exception as exc:
            errors.append(f'{url}: {type(exc).__name__}: {exc}')
    return {'ok':not errors,'errors':errors,'results':results}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--live-url'); ap.add_argument('--report',default=str(ROOT/'reports/site-audit-latest.json')); args=ap.parse_args()
    report={'local':audit_local()}
    if args.live_url: report['live']=audit_live(args.live_url)
    Path(args.report).parent.mkdir(parents=True,exist_ok=True); Path(args.report).write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    errors=report['local']['errors'] + report.get('live',{}).get('errors',[])
    if errors:
        print('\n'.join(errors)); return 1
    print(f"Site audit passed: {len(report['local']['pages'])} HTML pages plus required nested assets and Google verification file")
    return 0
if __name__=='__main__': raise SystemExit(main())