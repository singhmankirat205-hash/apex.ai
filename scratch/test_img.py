import requests, urllib.parse

p = 'textile fabric broken pick defect'
params = [
    ('pure prompt', ''),
    ('width 512', '?width=512&height=512'),
    ('width 800', '?width=800&height=533'),
    ('model flux', '?model=flux'),
    ('model turbo', '?model=turbo'),
    ('seed only', '?seed=42'),
]

for label, q in params:
    u = f'https://image.pollinations.ai/prompt/{urllib.parse.quote(p)}{q}'
    try:
        r = requests.get(u, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        print(f"{label}: status={r.status_code}, len={len(r.content)}")
    except Exception as e:
        print(f"{label}: err -> {e}")
