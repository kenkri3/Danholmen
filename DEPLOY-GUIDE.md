# Deploy-guide for Danholmen Badstuer

## Steg 1: Opprett Firebase-prosjekt
1. Ga til https://console.firebase.google.com/
2. Klikk "Add project" -> "danholmen-badstuer"
3. Aktiver Firebase Hosting

## Steg 2: Installer Firebase CLI
```bash
npm install -g firebase-tools
```

## Steg 3: Logg inn
```bash
firebase login
```

## Steg 4: Initialiser (kun forste gang)
```bash
firebase init hosting
```
Velg eksisterende prosjekt "danholmen-badstuer"
Public directory: dist
SPA: Yes

## Steg 5: Bygg og deploy
```bash
npm run build
firebase deploy
```

## Steg 6: Koble til egne domener
1. I Firebase Console -> Hosting -> Add custom domain
2. Legg til: danholmen.no, badstuatjome.no, araasbadstue.no
3. Følg DNS-instruksjonene fra Firebase

## Steg 7: GitHub Actions (valgfritt)
1. I GitHub repo -> Settings -> Secrets
2. Legg til FIREBASE_SERVICE_ACCOUNT (fra Firebase Service Accounts)
3. Push til main branch trigger automatisk deploy
