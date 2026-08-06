#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import html, json, re, sys, urllib.request, urllib.error

ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/'data/source-watch.json'
REPORT=ROOT/'reports/source-watch-latest.json'

def visible_text(raw: str) -> str:
    raw=re.sub(r'(?is)<script.*?</script>|<style.*?</style>',' ',raw)
    raw=re.sub(r'(?s)<[^>]+>',' ',raw)
    return re.sub(r'\s+',' ',html.unescape(raw)).strip()

def fetch(url: str):
    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; MFGStackLab-SourceMonitor/1.0; +https://straggler-liu.github.io/mfg-stack-lab/)'})
    with urllib.request.urlopen(req,timeout=30) as r:
        return r.status, r.read(2_500_000).decode('utf-8','ignore')

def main():
    cfg=json.loads(CONFIG.read_text(encoding='utf-8')); rows=[]; failures=[]; inconclusive=[]
    for item in cfg['sources']:
        row={'name':item['name'],'url':item['url'],'patterns':item['patterns']}
        try:
            status, raw=fetch(item['url']); text=visible_text(raw); missing=[]
            for pattern in item['patterns']:
                if not re.search(re.escape(pattern), text, flags=re.I): missing.append(pattern)
            row.update({'http_status':status,'missing_patterns':missing,'result':'fail' if missing else 'pass'})
            if status in (404,410) or missing: failures.append(row)
        except urllib.error.HTTPError as exc:
            row.update({'http_status':exc.code,'result':'inconclusive' if exc.code in (403,429) else 'fail','error':str(exc)})
            (inconclusive if exc.code in (403,429) else failures).append(row)
        except Exception as exc:
            row.update({'result':'inconclusive','error':f'{type(exc).__name__}: {exc}'})
            inconclusive.append(row)
        rows.append(row)
    report={'ok':not failures,'failures':failures,'inconclusive':inconclusive,'sources':rows}
    REPORT.parent.mkdir(exist_ok=True); REPORT.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,indent=2))
    return 1 if failures else 0
if __name__=='__main__': raise SystemExit(main())
