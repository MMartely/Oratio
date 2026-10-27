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
| `src/data/` | Coachs, fonctionnalités, badges, sujets d'improvisation et feux |
| `src/data/lessons/` | Les 30 leçons : programme et objectifs, textes FR/EN, calcul des étoiles, déblocage quotidien |
| `supabase/functions/reminders/` | Rappels par notification (leçon du jour, série en danger, bravo) |
| `src/audio/` | Micro et caméra, enregistrement, transcription, voix de synthèse du recruteur, analyse du son |
| `src/screens/scenario/` | Situations : entretien d'embauche, exposé, pitch, discours d'événement |
| `src/screens/practice/` | Improvisation, SOS trac, prompteur |
| `src/teleprompter/` | Suivi de la lecture : retrouver dans le texte les derniers mots entendus |
| `src/analysis/` | Mots parasites, débit, pauses, notes sur 100, assemblage du bilan |
| `src/services/coach/` | Le coach qui commente le discours : règles locales en mode démo, Claude une fois Supabase branché |
| `supabase/migrations/` | Tables, règles de sécurité (chacun ne voit que ses données), quota d'analyses IA, stockage audio Premium |
| `supabase/functions/coach/` | Fonction serveur qui appelle Claude (la clé ne quitte jamais le serveur) et vérifie le quota |
| `.github/workflows/deploy.yml` | Mise en ligne automatique : Supabase puis GitHub Pages |

## Mode démo et mode en ligne

Sans configuration, l'application tourne en **mode démo** : comptes et données sur l'appareil, coach simulé.
Dès que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont fournis (voir `.env.example`), elle utilise
les vrais comptes (e-mail avec confirmation, Google), synchronise la progression et fait appel au coach Claude.
Le guide pas à pas est dans [`docs/MISE-EN-LIGNE.md`](docs/MISE-EN-LIGNE.md).

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
- [x] Étape 3 — Branchement : comptes Supabase (e-mail confirmé + Google), progression synchronisée, coach Claude Opus 5.5 côté serveur avec quota de 3 analyses par jour, audio conservé en Premium, mise en ligne automatique sur GitHub Pages
- [x] Étape 4 — Situations : entretien d'embauche (recruteur à voix haute, questions et relances adaptées par Claude, bilan question par question), exposé, pitch et discours d'événement devant un public virtuel qui réagit à la voix ou en caméra miroir, liste des incontournables, respect du temps ; pitch et discours en Premium (essai possible en mode démo)
- [x] Étape 5 — Leçons du parcours de 30 jours (FR/EN) : explication, mini-quiz, démonstration lue à voix haute, exercice parlé avec objectif mesuré et 1 à 3 étoiles, une leçon par jour avec rattrapage, respiration guidée ; rappel quotidien par notification (clés créées automatiquement, envoi toutes les 30 min, seulement si la leçon n'est pas faite)
  - Révision : leçons d'environ 4 minutes (démonstration brève, 1 question, « Aller plus loin » facultatif avec exemple, astuce et 2 questions), respiration de 30 s à chaque leçon, deux essais guidés avec un conseil du coach entre les deux, exemples de toute la francophonie et du monde professionnel, objectifs progressifs ; rappels avec le titre de la leçon, alerte « série en danger », « bravo » du lendemain et choix des jours
- [x] Étape 6 — Improvisation (sujet surprise dans 4 thèmes, 10 s de réflexion, feux vert / orange / rouge comme au Toastmasters, bilan avec avis, raison, exemple et conclusion ; 3 sujets par jour en gratuit), « SOS trac » d'une minute accessible avant chaque prise de parole, prompteur qui suit la voix (reconnaissance des mots, ou vitesse réglable pendant que l'on parle)
- [ ] Paiement Premium
