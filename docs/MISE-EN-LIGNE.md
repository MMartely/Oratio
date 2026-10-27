# Mettre Oratio en ligne

Ce guide branche les vrais comptes (Supabase), le coach Claude et publie l'application sur GitHub Pages.
Comptez environ 45 minutes la première fois. Tout est gratuit sauf l'API Claude, payée à l'usage.

> **Règle d'or : ne collez jamais une clé ou un mot de passe dans une conversation.** Les clés se rangent
> uniquement dans les réglages de GitHub, de Supabase ou de Google, comme décrit ci-dessous.

## Ce qu'il vous faut

| Compte | Pour quoi | Prix |
|---|---|---|
| GitHub | Héberger le code et le site | Gratuit (dépôt public) |
| Supabase | Comptes, données, fonction du coach | Gratuit pour démarrer |
| Anthropic (platform.claude.com, anciennement console.anthropic.com) | Clé de l'API Claude | Environ 3 centimes par analyse avec Claude Opus 5.5 |
| Google Cloud | Bouton « Continuer avec Google » | Gratuit |

## 1. GitHub

1. Reliez votre compte GitHub à Claude sur https://claude.ai/connect-github.
2. Créez un dépôt vide nommé `oratio` (sans README). Il doit être **public** pour que GitHub Pages soit gratuit.
3. Donnez le nom du dépôt à Claude : il y enverra le code.
4. Dans le dépôt : **Settings → Pages → Build and deployment → Source : GitHub Actions**.

L'adresse de l'application sera `https://VOTRE-PSEUDO.github.io/oratio/`.

## 2. Supabase

1. Créez un projet sur https://supabase.com (région conseillée : Europe). **Notez le mot de passe de la base de données.**
2. Relevez deux informations :
   - l'**URL du projet** (`https://xxxx.supabase.co`), sur la page d'accueil du projet ou dans **Project Settings → Data API** ;
     `xxxx` est la **référence du projet** ;
   - la **clé publique** dans **Project Settings → API Keys** : la *Publishable key* (`sb_publishable_…`), ou l'ancienne
     clé *anon* si votre projet en a une. Elle peut être publique : la sécurité repose sur les règles de la base.
   - Ne copiez pas la *Secret key* (`sb_secret_…`) : le serveur la reçoit automatiquement, elle ne va nulle part ailleurs.
3. Créez un **jeton d'accès** sur https://supabase.com/dashboard/account/tokens.
4. **Authentication → URL Configuration** :
   - *Site URL* : `https://VOTRE-PSEUDO.github.io/oratio/`
   - *Redirect URLs* : ajoutez la même adresse.
5. **Authentication → Providers → Email** : vérifiez que *Confirm email* est activé.
6. Les e-mails de confirmation envoyés par Supabase sont limités à quelques-uns par heure. Avant d'ouvrir l'application
   au public, branchez un service d'envoi d'e-mails (Brevo, Resend…) dans **Authentication → Emails → SMTP**.

## 3. Connexion avec Google

1. Sur https://console.cloud.google.com, créez un projet, puis configurez l'**écran de consentement OAuth** (type « Externe »).
2. **Identifiants → Créer des identifiants → ID client OAuth → Application Web.**
3. Dans *URI de redirection autorisés*, ajoutez : `https://xxxx.supabase.co/auth/v1/callback` (avec votre référence).
4. Copiez l'**ID client** et le **code secret**, puis collez-les dans Supabase : **Authentication → Sign In / Providers → Google**.

## 4. Clé de l'API Claude

1. Sur https://platform.claude.com : **Settings → API Keys → Create Key**.
2. Ajoutez du crédit dans **Billing**, et fixez une **limite de dépense mensuelle** dans **Limits** pour garder le contrôle.

## 5. Ranger les clés dans GitHub

Dans le dépôt : **Settings → Secrets and variables → Actions**.

Onglet **Secrets** (valeurs cachées) :

| Nom | Valeur |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | le jeton d'accès Supabase (étape 2.3) |
| `SUPABASE_DB_PASSWORD` | le mot de passe de la base (étape 2.1) |
| `ANTHROPIC_API_KEY` | la clé de l'API Claude (étape 4) |

Onglet **Variables** :

| Nom | Valeur |
|---|---|
| `SUPABASE_PROJECT_REF` | la référence du projet (`xxxx`) |
| `VITE_SUPABASE_URL` | l'URL du projet |
| `VITE_SUPABASE_ANON_KEY` | la clé publique : *Publishable key* (`sb_publishable_…`) ou ancienne clé *anon* |
| `COACH_MODEL` | facultatif : `claude-opus-5-5` par défaut |

## 6. Lancer la mise en ligne

Onglet **Actions → Mise en ligne → Run workflow**. En trois minutes environ, le processus :

1. crée les tables et les règles de sécurité dans Supabase ;
2. transmet la clé Claude à la fonction du coach et la déploie ;
3. lance les tests, construit le site et le publie sur GitHub Pages.

Ensuite, chaque modification envoyée sur la branche `main` est mise en ligne automatiquement.

## 7. Installer l'application sur un téléphone

- **Android (Chrome)** : ouvrez l'adresse, menu ⋮ → *Ajouter à l'écran d'accueil*.
- **iPhone (Safari)** : ouvrez l'adresse, bouton Partager → *Sur l'écran d'accueil*.

## Rappels quotidiens

Rien à configurer : les clés des notifications sont créées automatiquement par le serveur au premier usage,
et le processus **Rappels quotidiens** (onglet Actions) se déclenche toutes les 30 minutes.
Chaque utilisateur active son rappel dans **Profil → Rappel quotidien** et choisit l'heure et les jours.

- **Rappel du jour** : à l'heure choisie, avec le titre de la leçon, seulement si l'utilisateur n'a pas encore pratiqué.
- **Série en danger** (activable) : vers 21 h 30, si la série risque d'être perdue ; pour un rappel réglé après 20 h,
  c'est le rappel lui-même qui le signale.
- **Bravo** (activable) : le lendemain d'une leçon, vers 9 h avec les étoiles obtenues ; pour un rappel du matin,
  le bravo ouvre le rappel.
- Chaque type de message part au plus une fois par jour, et rien n'est envoyé les jours non choisis.
- GitHub peut retarder les tâches planifiées de quelques minutes : le rappel arrive « autour » de l'heure choisie.
- Sur iPhone, les notifications demandent iOS 16.4 ou plus récent et l'application installée sur l'écran d'accueil.

## Gérer l'application au quotidien

- **Passer un compte en Premium** (en attendant le paiement en ligne) : Supabase → **Table Editor → profiles** → colonne `plan` = `premium`.
- **Changer de modèle** : variable `COACH_MODEL` (`claude-sonnet-5-5` pour environ 1,5 centime par analyse,
  `claude-haiku-5-5` pour environ 0,1 centime), puis relancez la mise en ligne.
- **Suivre les coûts** : console Anthropic → **Usage**.
- **Comptes gratuits** : 3 analyses IA par jour, vérifiées côté serveur. Une analyse que le coach n'a pas pu
  produire n'est pas décomptée.
