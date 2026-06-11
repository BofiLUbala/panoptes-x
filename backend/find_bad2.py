# Read file and check specific strings for corruption
with open('authentication/views.py', 'rb') as f:
    raw = f.read()

# Check specific patterns
checks = [b'inscrit', b'quipe', b'Simulation', b'remplacer', b'OTP', b'WhatsApp', b'envoy']
for c in checks:
    idx = raw.find(c)
    if idx >= 0:
        start = max(0, idx-6)
        end = min(len(raw), idx+len(c)+6)
        print(f'Found {c.decode()} at {idx}: {raw[start:end].hex()} = {raw[start:end]}')
