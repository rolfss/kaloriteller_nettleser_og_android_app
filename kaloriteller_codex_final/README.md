# Kaloriteller

En mobiltilpasset, lokal kaloriteller for Chrome/PWA og Android. Appen lærer bare kaloriregler som brukeren oppgir eksplisitt. Den har ingen konto, backend, analyse, reklame, ekstern matdatabase eller automatisk kalorigjetting.

## Funksjoner

- Gram, desiliter og vilkårlige custom-/telleenheter med eksplisitte aliaser.
- Én aktiv dag som bare avsluttes etter brukerens bekreftelse, også over midnatt.
- Redigering og sletting av innlegg på aktive og avsluttede dager.
- Sju avsluttede dager i lokal historikk, med transaksjonell retensjon.
- Redigering/sletting av definisjoner uten stille omskriving av historiske innlegg.
- Lokal PDF for én dag eller alle beholdte dager.
- Installerbar og forhåndslagret PWA som fungerer offline.
- Capacitor Android-wrapper med lokal fil-/deleflyt ved PDF-eksport.

## Krav

- Node.js 20.19+, 22.12+ eller nyere kompatibel versjon.
- pnpm 11.16 (`corepack enable` og `corepack prepare pnpm@11.16.0 --activate` om nødvendig).
- For Android: JDK 21, Android Studio/SDK 36 og et konfigurert `JAVA_HOME`/Android SDK.

## Utvikling og kvalitet

```bash
pnpm install
pnpm dev
```

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm preview
```

Produksjonsbygget ligger i `dist/`. `pnpm build` genererer også PWA-manifest og service worker.

## PWA-ikoner

Kildeikonet ligger i `public/app-icon.svg`. Regenerer nettikonene med:

```bash
pnpm pwa:icons
```

## Android

Bygg webappen og synkroniser den inn i Android-prosjektet:

```bash
pnpm build
pnpm cap:sync
pnpm android:assets
pnpm android
```

Eller bygg debug-APK direkte etter at Java og Android SDK er konfigurert:

```powershell
cd android
.\gradlew.bat assembleDebug
```

Android-prosjektet ber ikke om nettverks- eller lagringstillatelser. PDF-data skrives først til appens private cache når brukeren trykker eksporter, og sendes deretter til Androids native dele-/lagringsvalg.

## Data og personvern

IndexedDB er eneste vedvarende sannhetskilde. Matinnlegg, kaloridefinisjoner og historikk blir på enheten. Appens normale logging-, redigerings- og historikkflyt har ingen nettverkskall. Service workeren henter bare versjonerte appressurser fra samme opprinnelse ved installasjon/oppdatering.

Se `ACCEPTANCE_TESTS.md` for produktkrav og `docs/ACCEPTANCE_RESULTS.md` for siste verifiseringsresultat.
