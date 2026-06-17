import urllib.request
import json

SECRET_B = 'fa189b48-b521-49a7-b46a-3dfe8c2f76cc'
BASE_URL = 'http://127.0.0.1:8000/api/monitoring/forward-sms/'

messages = [
    {
        'sender': '+243811234567',
        'message': 'Salut! Virement de 50.000 CDF recu de Jean Pierre. Solde: 150.000 CDF'
    },
    {
        'sender': '+243820000001',
        'message': 'AIRTEL: Votre forfait data de 2GB a ete active. Valable 30 jours.'
    },
    {
        'sender': '+243890000099',
        'message': 'Code OTP: 847291. Valable 5 minutes. Ne partagez pas ce code.'
    },
    {
        'sender': '+243811111111',
        'message': 'Maman: Est-ce que tu rentres ce soir? On t attend pour diner.'
    },
    {
        'sender': 'VODACOM',
        'message': 'VODACOM: Vous avez consomme 80% de votre forfait. Rechargez maintenant.'
    },
]

print('Envoi des SMS de test en cours...')
print()

for msg in messages:
    try:
        body = json.dumps(msg).encode('utf-8')
        req = urllib.request.Request(
            BASE_URL,
            data=body,
            headers={
                'Content-Type': 'application/json',
                'X-Device-Secret': SECRET_B
            }
        )
        res = urllib.request.urlopen(req, timeout=10)
        data = json.loads(res.read().decode())
        sms_id = data.get('id', '?')
        preview = msg['message'][:45]
        print(f"[OK] SMS id={sms_id} | De: {msg['sender']} | {preview}...")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"[ERREUR HTTP {e.code}] {body}")
    except Exception as e:
        print(f"[ERREUR] {e}")

print()
print('Termine !')
print()
print('Sur le telephone A, va dans:')
print('  Onglet Surveillance > icone bulle (chat) sur +243987654321')
print('  OU')
print('  Menu lateral > Get History > selectionne un SIM > Messages generaux')
