# Panoptes-X

Plateforme SaaS de comptabilité Mobile Money et vente de recharges pour agents.

## Architecture

```
helios-x/
├── backend/          # Django REST API (Python)
│   ├── authentication/   # Inscription, connexion, JWT, OTP
│   ├── ledger/           # Moteur comptable (soldes par SIM)
│   ├── transactions/     # Transactions Mobile Money / recharges
│   ├── reconciliation/   # Rapprochement des transactions
│   ├── analytics/        # Tableau de bord BI
│   ├── notifications/    # Notifications push (FCM)
│   ├── monitoring/       # Gestion des appareils, heartbeat, SMS
│   ├── subscriptions/    # Abonnements (plans, renouvellement)
│   ├── audit/            # Journal d'audit financier
│   └── agenttrack/       # Configuration Django
├── mobile/           # Application React Native / Expo
│   ├── src/
│   │   ├── screens/      # Écrans de l'application
│   │   ├── components/   # Composants réutilisables
│   │   ├── services/     # API, WebSocket, stockage local
│   │   ├── contexts/     # Contexte (theme, drawer)
│   │   ├── navigation/   # Navigation et menu latéral
│   │   ├── hooks/        # Hooks personnalisés
│   │   └── constants/    # Thème, couleurs
│   └── plugins/          # Plugins Expo natifs (SMS Receiver)
└── README.md
```

## Prérequis

- **Node.js** >= 18
- **Python** >= 3.10
- **Expo CLI** `npm install -g expo-cli`
- **Android Studio** (pour le build natif)

## Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Linux/Mac
.\venv\Scripts\activate    # Windows
pip install -r requirements.txt
cp .env.example .env       # Configurer les variables
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Application mobile

```bash
cd mobile
npm install
npx expo start
```

Scanner le QR code avec **Expo Go** (développement) ou build natif :

```bash
# Build natif (recommandé pour les SMS)
npx expo prebuild
npx expo run:android
```

## Fonctionnalités

### Backend (Django REST API)

| Module | Endpoints | Description |
|---|---|---|
| **Authentification** | `/api/auth/*` | Inscription, login JWT, refresh token, OTP WhatsApp, activation email |
| **Transactions** | `/api/transactions/*` | Synchronisation des transactions Mobile Money |
| **Monitoring** | `/api/monitoring/*` | Appareils, heartbeat, relations watcher, SMS forward |
| **Grand Livre** | `/api/ledger/*` | Soldes par SIM, écritures comptables |
| **Abonnements** | `/api/subscriptions/*` | Plans, souscription, renouvellement, expiration |
| **Réconciliation** | `/api/reconciliation/*` | Rapprochement des transactions |
| **Notifications** | `/api/notifications/*` | Push FCM, historique des notifications |
| **Analytique** | `/api/analytics/*` | Dashboard BI, revenus, statistiques SIM |
| **Audit** | `/api/audit/*` | Journal de toutes les actions financières |

### Application mobile (React Native / Expo)

| Écran | Description |
|---|---|
| **Accueil** | Dashboard avec résumé global, statut système, abonnement |
| **Mes SIM** | Gestion des cartes SIM (services, soldes) |
| **Surveillance** | Flux SMS en temps réel (nécessite build natif) |
| **Historique** | Transactions filtrées par type / opérateur |
| **Abonnement** | Souscription et gestion des abonnements |
| **Analyses** | KPIs, revenu mensuel, répartition par opérateur, taux de parsing |
| **Grand Livre** | Soldes par SIM, mouvements crédit/débit |
| **Notifications** | Centre de notifications (push et système) |
| **Réconciliation** | Lancement et suivi des rapprochements |
| **Journal d'audit** | Toutes les actions tracées |

## Configuration

### Variables d'environnement (`.env`)

```
DJANGO_SECRET_KEY=<clé secrète>
DJANGO_DEBUG=True
DB_ENGINE=django.db.backends.sqlite3

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=votre.email@gmail.com
EMAIL_HOST_PASSWORD=<mot de passe d'application>

FCM_ENABLED=False
FCM_SERVER_KEY=<clé Firebase>
```

### Application mobile

L'URL de l'API est configurée via :
- Variables d'environnement : `EXPO_PUBLIC_API_HOST`, `EXPO_PUBLIC_API_PORT`
- Config Expo : `extra.apiHost` dans `app.json`

## SMS et module natif

La capture SMS utilise un module natif Android (`SmsModule`) qui nécessite un **build natif** :

```bash
cd mobile
npx expo prebuild
npx expo run:android
```

Le plugin `plugins/withSmsReceiver.js` ajoute automatiquement :
- `SmsReceiver.java` — BroadcastReceiver pour les SMS entrants
- `SmsModule.java` — Module React Native exposé au JS
- `SmsPackage.java` — Package React Native
- Permissions `RECEIVE_SMS` / `READ_SMS`
- `network_security_config.xml` pour le trafic clair

## Technologies

- **Backend** : Django 4.2, DRF, SimpleJWT, Celery, Redis, PostgreSQL
- **Mobile** : React Native 0.81, Expo SDK 54, React Navigation, Reanimated, Axios
- **Temps réel** : Django Channels, WebSocket
- **Paiement** : Intégration Mobile Money (M-Pesa, Orange Money, Airtel Money)
- **Notifications** : Firebase Cloud Messaging (FCM)

## Licence

Propriétaire — Tous droits réservés.
