with open('authentication/views.py', 'rb') as f:
    data = f.read()

# Find non-ASCII bytes that might be corrupted
i = 0
while i < len(data) - 2:
    if data[i] > 127:
        # Check for specific known corrupted patterns
        chunk = data[i:i+8]
        # Check if it matches known good UTF-8 first
        if data[i] & 0xe0 == 0xc0:
            expected_len = 2
        elif data[i] & 0xf0 == 0xe0:
            expected_len = 3
        elif data[i] & 0xf8 == 0xf0:
            expected_len = 4
        else:
            expected_len = 1
        
        # If this doesn't look like valid UTF-8 continuation, it's corrupted
        if expected_len > 1:
            ok = True
            for j in range(1, expected_len):
                if i+j >= len(data) or (data[i+j] & 0xc0) != 0x80:
                    ok = False
                    break
            if ok:
                i += expected_len
                continue
        
        print(f'Pos {i}: {data[i:i+8].hex()} = {data[i:i+8]}')
        i += 1
    else:
        i += 1
