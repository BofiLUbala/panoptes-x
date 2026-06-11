import re

with open('authentication/views.py', 'rb') as f:
    data = f.read()

replacements = [
    (b'\xc3\x83\xc2\xaa',      'ê'.encode('utf-8')),
    (b'\xc3\x83\xc2\xa9',      'é'.encode('utf-8')),
    (b'\xc3\x83\xc2\xa8',      'è'.encode('utf-8')),
    (b'\xc3\x83\xc2\xa0\xc2\xa0', 'à '.encode('utf-8')),
    (b'\xc3\x83\xc2\xa0',      'à'.encode('utf-8')),
    (b'\xc3\x83\xe2\x80\xb0', 'É'.encode('utf-8')),
    (b'\xc3\xa2\xe2\x82\xac\xe2\x80\x9c', '—'.encode('utf-8')),
]

fixed = data
counts = {}
for old, new in replacements:
    c = fixed.count(old)
    if c > 0:
        fixed = fixed.replace(old, new)
        counts[old.hex()] = c
        print(f'  {old.hex()} -> {new.hex()} : {c} fois')

with open('authentication/views.py', 'wb') as f:
    f.write(fixed)

print(f'\nTotal: {sum(counts.values())} remplacements')

with open('authentication/views.py', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if 'inscrit' in line or 'quipe' in line or 'OTP' in line or 'vrifiez' in line.lower() or 'envoy' in line:
            print(f'L{i}: {line.rstrip()}')
