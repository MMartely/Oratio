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
```

## Architecture

| Dossier | Rôle |
|---|---|
| `src/screens/` | Écrans (bienvenue, onboarding, connexion, accueil, parcours, entraînement, progrès, profil) |
| `src/components/` | Composants réutilisables (boutons, cartes, avatar du coach, navigation) |
| `src/i18n/` | Textes en français (`fr.ts`, référence) et en anglais (`en.ts`) |
| `src/store/useApp.ts` | État de l'application : session, réponses d'onboarding, progression, séries |
| `src/services/backend.ts` | Interface comptes + données. Implémentation actuelle : **mode démo** (stockage local). Supabase viendra la remplacer sans toucher aux écrans. |
| `src/data/` | Coachs, fonctionnalités, parcours de 30 jours |

## Avancement

- [x] Étape 1 — Fondations : design calme et doux, FR/EN, thème clair/sombre, onboarding, choix du coach (Léa, Malik, Sofia), comptes (mode démo), accueil, parcours, progrès, profil, page Premium
- [ ] Analyse IA de la voix (transcription, « euh », débit, pauses, score + conseils Claude)
- [ ] Leçons du parcours de 30 jours
- [ ] Situations : entretien, exposé, pitch, discours d'événement
- [ ] Improvisation et respiration anti-trac
- [ ] Téléprompteur + vidéo
- [ ] Branchement Supabase (comptes e-mail + Google) et API Claude
- [ ] Paiement Premium et mise en ligne
