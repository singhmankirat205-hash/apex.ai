import urllib.parse, urllib.request, xml.etree.ElementTree as ET, json, concurrent.futures, re

def fetch_google_news(q):
    try:
        url = f'https://news.google.com/rss/search?q={urllib.parse.quote(q)}&hl=en-US&gl=US&ceid=US:en'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=4) as resp:
            root = ET.fromstring(resp.read())
            items = root.findall('.//item')[:3]
            res = []
            for it in items:
                title = it.find('title').text if it.find('title') is not None else ''
                pub = it.find('pubDate').text[:16] if it.find('pubDate') is not None else ''
                res.append(f"- {title} ({pub})")
            return '\n'.join(res)
    except Exception as e:
        return f"News error: {e}"

def fetch_wiki(q):
    try:
        url = f'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(q)}&format=json&srlimit=2'
        req = urllib.request.Request(url, headers={'User-Agent': 'APEX-AI/1.0'})
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode())
            items = data.get('query', {}).get('search', [])
            res = []
            for it in items:
                clean_snippet = re.sub(r'<[^>]+>', '', it.get('snippet', ''))
                res.append(f"- {it['title']}: {clean_snippet}")
            return '\n'.join(res)
    except Exception as e:
        return f"Wiki error: {e}"

def fetch_arxiv(q):
    try:
        url = f'http://export.arxiv.org/api/query?search_query=all:{urllib.parse.quote(q)}&start=0&max_results=2'
        req = urllib.request.Request(url, headers={'User-Agent': 'APEX-AI/1.0'})
        with urllib.request.urlopen(req, timeout=4) as resp:
            root = ET.fromstring(resp.read())
            ns = {'atom': 'http://www.w3.org/2005/Atom'}
            entries = root.findall('atom:entry', ns)[:2]
            res = []
            for e in entries:
                t = e.find('atom:title', ns)
                title = t.text.strip().replace('\n', ' ') if t is not None else ''
                s = e.find('atom:summary', ns)
                summary = s.text.strip().replace('\n', ' ')[:150] if s is not None else ''
                res.append(f"- Research: {title} | {summary}...")
            return '\n'.join(res)
    except Exception as e:
        return f"ArXiv error: {e}"

if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        f_news = executor.submit(fetch_google_news, 'textile manufacturing automation 2026')
        f_wiki = executor.submit(fetch_wiki, 'textile manufacturing')
        f_arxiv = executor.submit(fetch_arxiv, 'textile defect detection')
        print("=== GOOGLE NEWS ===")
        print(f_news.result(timeout=6))
        print("=== WIKIPEDIA ===")
        print(f_wiki.result(timeout=6))
        print("=== ARXIV ===")
        print(f_arxiv.result(timeout=6))
