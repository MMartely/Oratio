# Oratio — Prise de parole en public

Application web installable (PWA) pour vaincre le trac et parler avec confiance, avec un coach IA.
Inspirée de Yoodli, Orai, Poised (analyse vocale), Speeko et Duolingo (leçons, séries, badges),
VirtualSpeech (simulations), Toastmasters (improvisation), BigVu (téléprompteur) et Calm (respiration).

## Démarrer

```bash
npm install
npm run dev            # serveur de développement
npm run build          # PWA installable dans dist/
npm run build:preview  # aperçu en un seul fichier HTML dans dist-preview/
npm test               # tests automatiques (analyse vocale, tics, notes, coach)
```

## Architecture

| Dossier | Rôle |
|---|---|
| `src/screens/` | Écrans (bienvenue, onboarding, connexion, accueil, parcours, entraînement, progrès, profil) |
| `src/components/` | Composants réutilisables (boutons, cartes, avatar du coach, navigation) |
| `src/i18n/` | Textes en français (`fr.ts`, référence) et en anglais (`en.ts`) |
| `src/store/useApp.ts` | État de l'application : session, réponses d'onboarding, progression, séries |
| `src/services/backend.ts` | Interface comptes + données. Implémentation actuelle : **mode démo** (stockage local). Supabase viendra la remplacer sans toucher aux écrans. |
| `src/data/` | Coachs, fonctionnalités, parcours de 30 jours, badges |
| `src/audio/` | Micro, enregistrement, transcription (reconnaissance vocale du navigateur), analyse du son |
| `src/analysis/` | Mots parasites, débit, pauses, notes sur 100, assemblage du bilan |
| `src/services/coach/` | Le coach qui commente le discours : règles locales en mode démo, Claude ensuite |

## Analyse vocale : comment ça marche

Tout est calculé sur l'appareil, en direct :

- **Volume** : niveau sonore pendant la parole (dBFS, gain automatique du micro désactivé).
- **Pauses** : silences de plus de 0,5 s entre deux phrases ; au-delà de 3 s, « long silence ».
- **Intonation** : hauteur de la voix (méthode de McLeod), variation en demi-tons ; moins de 1,3 = voix monotone.
- **Hésitations (« euh »)** : un son voisé tenu au moins 0,4 s avec une hauteur, un volume et un timbre presque constants. La reconnaissance vocale des navigateurs supprime souvent les « euh » de la transcription : cette détection dans le son les rattrape.
- **Mots parasites** : « du coup », « en fait », « genre », « voilà »… (et « like », « you know », « basically »… en anglais) repérés dans la transcription, avec les répétitions (« je je ») et les mots trop répétés.
- **Débit** : mots par minute grâce à la transcription ; sans transcription, estimé à partir des syllabes.
- **Note sur 100** : clarté 30 %, rythme 25 %, voix 20 %, contenu 25 % (contenu évalué par le coach).

Limites connues, à vérifier sur de vrais téléphones : Firefox ne propose pas la reconnaissance vocale (mesures de la voix uniquement) ; sur certains Android, la reconnaissance vocale peut refuser de fonctionner pendant que le micro enregistre ; les seuils de détection des « euh » devront être affinés avec de vraies voix.

## Avancement

- [x] Étape 1 — Fondations : design calme et doux, FR/EN, thème clair/sombre, onboarding, choix du coach (Léa, Malik, Sofia), comptes (mode démo), accueil, parcours, progrès, profil, page Premium
- [x] Étape 2 — Analyse vocale : écoute en direct avec signaux discrets, transcription, « euh », débit, pauses, volume, intonation, note sur 100, bilan du coach (simulé), réécoute, import d'enregistrement, historique, courbe de progression, badges
- [ ] Leçons du parcours de 30 jours
- [ ] Situations : entretien, exposé, pitch, discours d'événement
- [ ] Improvisation et respiration anti-trac
- [ ] Téléprompteur + vidéo
- [ ] Branchement Supabase (comptes e-mail + Google) et API Claude
- [ ] Paiement Premium et mise en ligne
