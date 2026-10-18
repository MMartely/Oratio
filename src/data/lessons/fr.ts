import type { LessonContent } from './types';

export const lessonsFr: LessonContent[] = [
  // ——— Semaine 1 — Apprivoiser le trac ———
  {
    intro: 'Le trac vient d’une respiration courte et rapide. En ralentissant ton souffle, tu envoies à ton corps le message que tout va bien.',
    points: ['Inspire par le nez en gonflant le ventre, pas la poitrine.', 'Expire plus longtemps que tu n’inspires : c’est ce qui calme.', 'Trois cycles suffisent avant de prendre la parole.'],
    quiz: [
      { q: 'Quelle respiration calme le plus vite ?', options: ['Inspirer longtemps, expirer vite', 'Expirer plus longtemps qu’on inspire', 'Retenir son souffle le plus possible'], answer: 1, why: 'Une expiration longue ralentit le cœur et apaise le corps.' },
      { q: 'Où doit aller l’air quand tu inspires ?', options: ['Dans le ventre', 'Dans les épaules', 'Dans la gorge'], answer: 0, why: 'La respiration ventrale est plus profonde et plus calme.' },
    ],
    demo: ['J’inspire… doucement.', 'Je bloque un instant.', 'Et j’expire… longuement.', 'Bonjour, je m’appelle Léa, et aujourd’hui je commence mon parcours.'],
    demoNote: 'Écoute le rythme posé de la dernière phrase : le souffle calme rend la voix plus stable.',
    prompt: 'Après la respiration guidée, présente-toi en une ou deux phrases, calmement : ton prénom et pourquoi tu commences ce parcours.',
  },
  {
    intro: 'Te présenter est la prise de parole la plus fréquente. Trente secondes bien préparées te donnent confiance dans toutes les situations.',
    points: ['Qui tu es : ton prénom et ce que tu fais.', 'Ce qui te passionne ou te motive.', 'Une phrase de fin qui ouvre la conversation.'],
    quiz: [
      { q: 'Combien de temps doit durer une présentation éclair ?', options: ['Environ 30 secondes', 'Au moins 3 minutes', 'Moins de 5 secondes'], answer: 0, why: 'Trente secondes suffisent pour marquer sans lasser.' },
      { q: 'Comment terminer sa présentation ?', options: ['Par « voilà, c’est tout »', 'Par une phrase qui ouvre la discussion', 'En s’excusant d’avoir parlé'], answer: 1, why: 'Une ouverture invite l’autre à poursuivre l’échange.' },
    ],
    demo: ['Bonjour, je suis Malik.', 'Je travaille dans la logistique, et j’adore organiser des événements avec mes amis.', 'En ce moment, j’apprends à parler en public pour présenter mes projets avec confiance.', 'Et vous, qu’est-ce qui vous a amené ici ?'],
    demoNote: 'Trois idées simples, puis une question pour rendre la parole.',
    prompt: 'Présente-toi en 30 secondes environ : qui tu es, ce qui te motive, et une phrase de fin qui ouvre la conversation.',
  },
  {
    intro: 'La pause est l’arme secrète des grands orateurs. Elle te laisse respirer, donne du poids à tes mots et remplace les « euh ».',
    points: ['Fais une pause après chaque idée importante.', 'Une seconde de silence paraît longue pour toi, mais naturelle pour ton public.', 'Pendant la pause, regarde ton public et respire.'],
    quiz: [
      { q: 'Que pense le public d’une pause d’une seconde ?', options: ['Que tu as oublié ton texte', 'Que tu es sûr de toi', 'Que tu es pressé'], answer: 1, why: 'Une pause maîtrisée donne une image de calme et d’assurance.' },
      { q: 'Où placer une pause ?', options: ['Au milieu d’un mot', 'Après une idée importante', 'Jamais, il faut enchaîner'], answer: 1, why: 'Elle laisse le temps à ton idée de s’installer.' },
    ],
    demo: ['Aujourd’hui…', 'je veux vous parler d’une chose simple.', 'Le silence.', 'Il donne du poids à chacun de vos mots.'],
    demoNote: 'Remarque les silences entre les phrases : ils rendent le message plus fort.',
    prompt: 'Parle d’un endroit que tu aimes. Marque au moins trois vraies pauses, après chaque idée.',
  },
  {
    intro: 'Ta posture change ta voix. Bien ancré, les épaules relâchées, tu respires mieux et ta voix porte naturellement.',
    points: ['Pieds écartés à la largeur des hanches, poids bien réparti.', 'Épaules basses, menton parallèle au sol.', 'Parle comme si tu t’adressais au fond de la pièce.'],
    quiz: [
      { q: 'Quelle posture aide la voix à porter ?', options: ['Épaules hautes et bras croisés', 'Pieds ancrés et épaules relâchées', 'Appuyé contre un mur'], answer: 1, why: 'Une posture stable libère la respiration, donc la voix.' },
      { q: 'À qui parler pour être bien entendu ?', options: ['Au premier rang seulement', 'À la personne au fond de la salle', 'À ses notes'], answer: 1, why: 'Viser le fond de la salle fait monter le volume naturellement.' },
    ],
    demo: ['Je me tiens droit, les pieds bien ancrés.', 'Mes épaules sont relâchées.', 'Et ma voix porte, sans crier, jusqu’au fond de la salle.'],
    demoNote: 'Une voix posée et assez forte, sans tension.',
    prompt: 'Debout, bien ancré, décris ta journée idéale en parlant comme si quelqu’un t’écoutait au fond de la pièce.',
  },
  {
    intro: 'Parler à une foule fait peur, parler à un ami beaucoup moins. Imagine une personne bienveillante en face de toi : ton ton devient naturel.',
    points: ['Choisis une personne réelle qui t’écoute avec plaisir.', 'Raconte comme dans une conversation, avec tes mots.', 'Accepte les petites imperfections : elles te rendent humain.'],
    quiz: [
      { q: 'Pourquoi imaginer un ami en face de soi ?', options: ['Pour parler plus vite', 'Pour retrouver un ton naturel', 'Pour éviter de regarder le public'], answer: 1, why: 'Le cerveau se détend quand il pense à une conversation familière.' },
      { q: 'Une petite erreur en parlant, c’est…', options: ['Une catastrophe', 'Normal et souvent invisible', 'Une raison d’arrêter'], answer: 1, why: 'Le public remarque rarement les petites erreurs que tu entends.' },
    ],
    demo: ['Tu sais, ce week-end, j’ai enfin essayé la recette de ma grand-mère.', 'Évidemment, j’ai raté la première fois !', 'Mais la deuxième… c’était exactement le goût de mon enfance.'],
    demoNote: 'Un ton complice, comme avec un ami, et une petite histoire.',
    prompt: 'Imagine un ami bienveillant en face de toi et raconte-lui un bon souvenir récent pendant au moins 45 secondes.',
  },
  {
    intro: 'Le stress et l’enthousiasme provoquent les mêmes sensations dans le corps. Au lieu de lutter, dis-toi « je suis enthousiaste » : l’énergie passe dans ta voix.',
    points: ['Accueille le cœur qui bat : c’est de l’énergie disponible.', 'Mets cette énergie dans ta voix : monte sur les mots importants.', 'Souris en parlant : ça s’entend.'],
    quiz: [
      { q: 'Que se dire juste avant de parler ?', options: ['« Calme-toi »', '« Je suis enthousiaste »', '« Ça va mal se passer »'], answer: 1, why: 'Requalifier le stress en enthousiasme améliore la performance.' },
      { q: 'Comment donner de l’énergie à sa voix ?', options: ['Parler sur un ton plat', 'Varier la hauteur et accentuer les mots clés', 'Chuchoter'], answer: 1, why: 'Une voix qui monte et descend capte l’attention.' },
    ],
    demo: ['Je vais vous annoncer une excellente nouvelle !', 'Notre petit projet a dépassé tous nos espoirs.', 'Et ce n’est que le début.'],
    demoNote: 'La voix monte sur « excellente nouvelle » et « tous nos espoirs ».',
    prompt: 'Annonce une bonne nouvelle, vraie ou imaginaire, avec enthousiasme. Fais monter ta voix sur les mots importants.',
  },
  {
    intro: 'Première semaine terminée ! Aujourd’hui, tu tiens une minute entière. Utilise tout ce que tu as appris : souffle, pause, posture, énergie.',
    points: ['Respire avant de commencer.', 'Marque des pauses entre tes idées.', 'Termine par une phrase claire, puis tais-toi.'],
    quiz: [
      { q: 'Que faire juste avant de commencer ?', options: ['Respirer calmement', 'Parler le plus vite possible', 'Regarder ses pieds'], answer: 0, why: 'Une respiration posée lance un discours posé.' },
      { q: 'Comment bien finir ?', options: ['En laissant la phrase en suspens', 'Par une phrase claire suivie d’un silence', 'Par « euh voilà »'], answer: 1, why: 'Le silence final montre que tu as terminé, avec assurance.' },
    ],
    demo: ['Il y a une semaine, parler devant les autres me faisait peur.', 'Aujourd’hui, je respire, je prends mon temps…', 'et je découvre que ma voix a de la valeur.', 'Merci de m’avoir écoutée.'],
    demoNote: 'Une minute, c’est court : quelques idées, des pauses, une vraie fin.',
    prompt: 'Parle pendant une minute de ce que cette première semaine t’a appris, ou d’un sujet qui te tient à cœur.',
  },
  // ——— Semaine 2 — Trouver ta voix ———
  {
    intro: 'Bien articuler, c’est ouvrir la bouche et prononcer chaque syllabe, sans forcer. Les virelangues sont l’échauffement des comédiens.',
    points: ['Ouvre davantage la bouche que d’habitude.', 'Ralentis : la vitesse viendra avec l’entraînement.', 'Prononce bien les fins de mots.'],
    quiz: [
      { q: 'À quoi servent les virelangues ?', options: ['À muscler la diction', 'À parler plus fort', 'À mémoriser un texte'], answer: 0, why: 'Ils entraînent les lèvres et la langue à être précises.' },
      { q: 'Pour mieux articuler, il faut d’abord…', options: ['Accélérer', 'Ralentir et ouvrir la bouche', 'Serrer les dents'], answer: 1, why: 'La précision vient avant la vitesse.' },
    ],
    demo: ['Les chaussettes de l’archiduchesse sont-elles sèches ?', 'Archi-sèches !', 'Un chasseur sachant chasser doit savoir chasser sans son chien.'],
    demoNote: 'Chaque syllabe est claire, le rythme est posé.',
    prompt: 'Lis ces virelangues lentement, en articulant chaque syllabe, puis recommence un peu plus vite.',
    read: 'Les chaussettes de l’archiduchesse sont-elles sèches ? Archi-sèches ! Un chasseur sachant chasser doit savoir chasser sans son chien. Si six scies scient six cyprès, six cents scies scient six cents cyprès.',
  },
  {
    intro: 'Les « euh » remplissent le silence quand ton cerveau cherche la suite. Le remède est simple : remplace-les par une pause.',
    points: ['Repère ton tic préféré : « euh », « du coup », « en fait »…', 'Quand tu sens qu’il arrive, ferme la bouche une seconde.', 'Prépare tes transitions : « ensuite », « par exemple ».'],
    quiz: [
      { q: 'Par quoi remplacer un « euh » ?', options: ['Par « du coup »', 'Par un court silence', 'Par un raclement de gorge'], answer: 1, why: 'Le silence est invisible pour le public, le « euh » non.' },
      { q: 'Pourquoi dit-on « euh » ?', options: ['Pour gagner du temps en cherchant la suite', 'Par politesse', 'Pour parler plus fort'], answer: 0, why: 'C’est un réflexe pour garder la parole pendant qu’on réfléchit.' },
    ],
    demo: ['Mon plat préféré, c’est le poulet yassa.', 'Pourquoi ?', 'Parce qu’il me rappelle les dimanches en famille…', 'et cette odeur de citron et d’oignons qui remplissait la maison.'],
    demoNote: 'Aucun « euh » : à la place, de petites pauses.',
    prompt: 'Parle de ton plat préféré pendant une minute. Chaque fois que tu sens un « euh » arriver, fais plutôt une pause.',
  },
  {
    intro: 'Un bon débit se situe entre 120 et 165 mots par minute. Trop vite, on te perd ; trop lentement, on décroche. L’idéal : varier.',
    points: ['Ralentis pour les idées importantes et les chiffres.', 'Accélère légèrement pour les anecdotes.', 'Si tu sens que tu t’emballes, fais une pause.'],
    quiz: [
      { q: 'Quel débit est confortable à écouter ?', options: ['Environ 80 mots par minute', 'Entre 120 et 165 mots par minute', 'Plus de 220 mots par minute'], answer: 1, why: 'C’est la plage où l’on comprend sans effort.' },
      { q: 'Quand ralentir ?', options: ['Sur les idées clés et les chiffres', 'Sur les mots sans importance', 'Jamais'], answer: 0, why: 'Ralentir souligne ce qui compte.' },
    ],
    demo: ['Chaque jour, nous passons en moyenne… trois heures sur notre téléphone.', 'Trois heures !', 'Imaginez tout ce qu’on pourrait faire avec ce temps : lire, courir, appeler ceux qu’on aime.'],
    demoNote: 'Le rythme ralentit sur le chiffre, puis repart.',
    prompt: 'Explique comment tu organises une journée chargée. Vise un rythme posé : ni trop vite, ni trop lentement.',
  },
  {
    intro: 'Une voix monotone endort. Fais monter ta voix sur les mots importants et descendre en fin de phrase : ton discours prend vie.',
    points: ['Repère les deux ou trois mots clés de chaque phrase.', 'Monte légèrement sur ces mots.', 'Descends franchement à la fin des affirmations.'],
    quiz: [
      { q: 'Que fait une voix monotone ?', options: ['Elle rassure', 'Elle endort le public', 'Elle impressionne'], answer: 1, why: 'Sans variation, l’attention baisse en quelques secondes.' },
      { q: 'En fin d’affirmation, la voix…', options: ['Monte', 'Descend', 'S’arrête au milieu'], answer: 1, why: 'Une voix qui descend affirme ; une voix qui monte questionne.' },
    ],
    demo: ['C’est l’histoire d’un petit garçon qui rêvait de voler.', 'Tout le monde riait de lui.', 'Pourtant, des années plus tard… il est devenu pilote.'],
    demoNote: 'La voix joue avec l’histoire : surprise, suspense, chute.',
    prompt: 'Lis ce petit texte en exagérant les variations de ta voix, comme si tu le racontais à des enfants.',
    read: 'C’est l’histoire d’un petit garçon qui rêvait de voler. Tout le monde riait de lui. Il construisait des ailes en carton, sautait du canapé, tombait, et recommençait. Pourtant, des années plus tard, il est devenu pilote. Et aujourd’hui, c’est lui qui fait rêver les enfants.',
  },
  {
    intro: 'Projeter sa voix, ce n’est pas crier : c’est utiliser son souffle pour que la voix porte loin, sans fatigue.',
    points: ['Appuie ta voix sur une expiration ventrale.', 'Vise un point au fond de la pièce.', 'Garde la gorge relâchée : si elle serre, tu cries.'],
    quiz: [
      { q: 'Projeter sa voix, c’est…', options: ['Crier', 'Faire porter sa voix grâce au souffle', 'Parler plus aigu'], answer: 1, why: 'Le souffle porte la voix sans abîmer la gorge.' },
      { q: 'Si ta gorge serre en parlant fort…', options: ['Tu cries : relâche et respire', 'C’est parfait', 'Il faut forcer davantage'], answer: 0, why: 'La tension dans la gorge signale un mauvais appui.' },
    ],
    demo: ['Bonjour à toutes et à tous !', 'Merci d’être venus si nombreux ce soir.', 'Installez-vous, nous allons commencer.'],
    demoNote: 'Une voix pleine et assurée, qui remplit la salle sans crier.',
    prompt: 'Accueille un public imaginaire dans une grande salle : souhaite la bienvenue et présente le programme, d’une voix qui porte.',
  },
  {
    intro: 'Un silence bien placé capte l’attention mieux que n’importe quel mot. Avant une révélation ou après une question, laisse le silence travailler.',
    points: ['Silence avant une information importante : il crée l’attente.', 'Silence après une question : il fait réfléchir.', 'Compte « un, deux » dans ta tête.'],
    quiz: [
      { q: 'Où un silence crée-t-il du suspense ?', options: ['Juste avant une révélation', 'Au milieu d’un mot', 'Après « bonjour »'], answer: 0, why: 'Le public se penche en avant pour savoir la suite.' },
      { q: 'Après une question au public, il faut…', options: ['Répondre tout de suite', 'Laisser un silence', 'Changer de sujet'], answer: 1, why: 'Le silence laisse le temps de réfléchir à la question.' },
    ],
    demo: ['Savez-vous combien de fois par jour nous disons « je n’ai pas le temps » ?', 'Moi non plus.', 'Mais je sais une chose…', 'le temps, on le trouve pour ce qui compte vraiment.'],
    demoNote: 'Un silence après la question, un autre avant la conclusion.',
    prompt: 'Pose une question à ton public imaginaire, laisse un silence, puis développe ta réponse. Marque au moins quatre pauses.',
  },
  {
    intro: 'Bilan de la semaine : lire un texte à voix haute en mettant tout en pratique. Diction, débit, intonation, pauses : c’est ton moment.',
    points: ['Lis une première fois dans ta tête pour repérer les mots clés.', 'Marque les pauses aux points et aux virgules.', 'Fais vivre le texte avec ta voix.'],
    quiz: [
      { q: 'Avant de lire à voix haute, il est utile de…', options: ['Le lire une fois dans sa tête', 'Le lire le plus vite possible', 'Ne pas le regarder'], answer: 0, why: 'Tu repères les mots clés et les pièges.' },
      { q: 'Les virgules et les points indiquent…', options: ['Où respirer et faire une pause', 'Où parler plus vite', 'Rien de particulier'], answer: 0, why: 'La ponctuation est la partition de ta lecture.' },
    ],
    demo: ['Il était une fois une ville où personne n’osait parler en public.', 'Un jour, une jeune femme prit le micro.', 'Sa voix tremblait… mais elle continua.'],
    demoNote: 'La lecture respire, change de rythme et de ton.',
    prompt: 'Lis ce texte à voix haute, comme si tu le racontais à un public.',
    read: 'Il était une fois une ville où personne n’osait parler en public. Les réunions étaient silencieuses, les idées restaient dans les têtes. Un jour, une jeune femme prit le micro. Sa voix tremblait, ses mains aussi. Mais elle continua, phrase après phrase. Quand elle eut fini, la salle se leva pour l’applaudir. Ce jour-là, toute la ville comprit qu’une voix qui tremble reste une voix qui compte.',
  },
  // ——— Semaine 3 — Structurer ton message ———
  {
    intro: 'Un bon discours tient en une phrase. Si ton public ne devait retenir qu’une chose, laquelle ? Trouve-la, puis construis autour.',
    points: ['Formule ton message clé en une phrase simple.', 'Dis-le au début et répète-le à la fin.', 'Supprime ce qui ne le sert pas.'],
    quiz: [
      { q: 'Combien de messages principaux dans une courte intervention ?', options: ['Un seul', 'Au moins cinq', 'Autant que possible'], answer: 0, why: 'Un message unique est un message retenu.' },
      { q: 'Où placer son message clé ?', options: ['Seulement au milieu', 'Au début et à la fin', 'Nulle part, il doit se deviner'], answer: 1, why: 'La répétition au début et à la fin ancre l’idée.' },
    ],
    demo: ['Mon message est simple : marcher vingt minutes par jour change une vie.', 'Plus d’énergie, un meilleur sommeil, un esprit plus clair.', 'Vingt minutes. C’est tout ce qu’il faut.'],
    demoNote: 'Le message est annoncé, illustré, puis répété.',
    prompt: 'Choisis une idée qui te tient à cœur et défends-la en 30 secondes avec un seul message clair, répété à la fin.',
  },
  {
    intro: 'Le plan en trois parties est le plus facile à suivre : une introduction qui annonce, un développement en étapes, une conclusion qui résume.',
    points: ['Annonce ton plan : « d’abord… ensuite… enfin… ».', 'Une idée par partie, illustrée.', 'Conclus en résumant et en ouvrant.'],
    quiz: [
      { q: 'Pourquoi annoncer son plan ?', options: ['Pour que le public sache où il va', 'Pour gagner du temps', 'Ça ne sert à rien'], answer: 0, why: 'Un public qui connaît le chemin suit plus facilement.' },
      { q: 'Quels mots aident à structurer ?', options: ['« Euh », « bref »', '« D’abord », « ensuite », « enfin »', '« Voilà », « quoi »'], answer: 1, why: 'Les connecteurs servent de panneaux indicateurs.' },
    ],
    demo: ['Aujourd’hui, je vais vous parler du sommeil.', 'D’abord, pourquoi il est essentiel. Ensuite, ce qui le perturbe. Enfin, trois gestes pour mieux dormir.', 'Pour conclure : bien dormir, c’est bien vivre.'],
    demoNote: 'On entend clairement l’introduction, les étapes et la conclusion.',
    prompt: 'Présente un sujet de ton choix avec un plan annoncé : introduction, « d’abord », « ensuite », « enfin », puis une conclusion.',
  },
  {
    intro: 'Les premières secondes décident de l’attention. Une accroche réussie surprend : une question, un chiffre étonnant, une image forte.',
    points: ['Commence par une question qui concerne ton public.', 'Ou par un chiffre surprenant.', 'Ou par « Imaginez… » pour créer une image.'],
    quiz: [
      { q: 'Quelle accroche capte le mieux l’attention ?', options: ['« Bonjour, je vais vous parler de… »', '« Imaginez que demain, Internet disparaisse. »', '« Euh, alors, voilà »'], answer: 1, why: 'Une image forte réveille immédiatement la curiosité.' },
      { q: 'Combien de temps a-t-on pour capter l’attention ?', options: ['Quelques secondes', 'Dix minutes', 'Toute la durée du discours'], answer: 0, why: 'Le public décide très vite s’il va écouter.' },
    ],
    demo: ['Imaginez que demain matin, Internet disparaisse.', 'Plus de messages, plus de cartes, plus de vidéos.', 'Que feriez-vous de votre journée ?'],
    demoNote: 'Une image forte et une question qui implique chacun.',
    prompt: 'Commence ton intervention par une accroche forte : une question, un chiffre ou « Imaginez… », puis développe en quelques phrases.',
  },
  {
    intro: 'La fin est ce que ton public retient le mieux. Une conclusion forte résume ton message et laisse une dernière image ou un appel à agir.',
    points: ['Annonce que tu conclus : « pour conclure ».', 'Rappelle ton message clé en une phrase.', 'Termine par un appel à agir ou une image, puis silence.'],
    quiz: [
      { q: 'Quelle fin est la plus forte ?', options: ['« Voilà, c’est tout. »', '« Alors, à vous de jouer : commencez dès ce soir. »', '« Je crois que j’ai fini. »'], answer: 1, why: 'Un appel à agir donne une suite concrète à ton message.' },
      { q: 'Après ta dernière phrase…', options: ['Tu ajoutes « merci, voilà, bref »', 'Tu marques un silence', 'Tu pars en courant'], answer: 1, why: 'Le silence laisse ta conclusion résonner.' },
    ],
    demo: ['Pour conclure, souvenez-vous d’une chose :', 'chaque grand voyage commence par un premier pas.', 'Alors, ce premier pas… faites-le aujourd’hui.'],
    demoNote: 'Annonce de la fin, message rappelé, appel à agir.',
    prompt: 'Résume un sujet en quelques phrases, puis termine par une vraie conclusion : « pour conclure », ton message, et un appel à agir.',
  },
  {
    intro: 'Les histoires se retiennent bien mieux que les arguments. Une bonne histoire a un personnage, un obstacle et une transformation.',
    points: ['Situe : « un jour », « je me souviens ».', 'Raconte l’obstacle et ce que tu as ressenti.', 'Termine par ce que tu en as appris.'],
    quiz: [
      { q: 'Qu’est-ce qui rend une histoire captivante ?', options: ['Un obstacle à surmonter', 'Beaucoup de chiffres', 'Aucun personnage'], answer: 0, why: 'L’obstacle crée la tension qui tient l’attention.' },
      { q: 'Comment finir une histoire dans un discours ?', options: ['Par la leçon que tu en tires', 'Brutalement, sans fin', 'Par une autre histoire'], answer: 0, why: 'La leçon relie l’histoire à ton message.' },
    ],
    demo: ['Je me souviens de mon premier exposé.', 'Mes mains tremblaient tellement que mes feuilles sont tombées par terre.', 'Toute la classe a ri… puis j’ai ri aussi.', 'Ce jour-là, j’ai compris qu’on peut rater et continuer.'],
    demoNote: 'Un moment précis, un obstacle, une émotion, une leçon.',
    prompt: 'Raconte un souvenir où tu as surmonté une difficulté : « je me souviens… », l’obstacle, ce que tu as ressenti, la leçon.',
  },
  {
    intro: 'Pour expliquer une idée compliquée, compare-la à quelque chose de connu. Les images et les exemples rendent tout plus clair.',
    points: ['Utilise « c’est comme… » pour comparer.', 'Donne un exemple concret de la vie quotidienne.', 'Évite le jargon, ou explique-le.'],
    quiz: [
      { q: 'Comment expliquer un sujet complexe ?', options: ['Avec du jargon technique', 'Avec une comparaison familière', 'En parlant plus vite'], answer: 1, why: 'Une image connue donne une prise immédiate à l’esprit.' },
      { q: 'Quelle phrase introduit une analogie ?', options: ['« C’est comme… »', '« En conclusion… »', '« Euh… »'], answer: 0, why: '« C’est comme » relie l’inconnu au connu.' },
    ],
    demo: ['Internet, c’est comme un immense réseau de routes.', 'Tes messages sont des petites voitures', 'qui cherchent le chemin le plus rapide pour arriver à destination.'],
    demoNote: 'Une idée technique devient une image simple.',
    prompt: 'Explique un sujet compliqué (ton métier, une technologie, une règle) à un enfant de 10 ans, avec « c’est comme » et un exemple.',
  },
  {
    intro: 'Bilan de la semaine : un exposé complet de deux minutes. Accroche, plan annoncé, exemples, conclusion forte : tu as toutes les clés.',
    points: ['Accroche et annonce de ton plan.', 'Deux ou trois parties avec un exemple chacune.', 'Conclusion qui résume et ouvre.'],
    quiz: [
      { q: 'Un exposé réussi commence par…', options: ['Une accroche et l’annonce du plan', 'Des excuses', 'La conclusion'], answer: 0, why: 'Tu captes l’attention puis tu donnes le chemin.' },
      { q: 'Chaque partie doit contenir…', options: ['Un exemple concret', 'Le plus de chiffres possible', 'Une blague obligatoire'], answer: 0, why: 'L’exemple rend l’idée vivante et mémorable.' },
    ],
    demo: ['Saviez-vous qu’on oublie la moitié de ce qu’on apprend en une heure ?', 'Je vais vous montrer d’abord pourquoi, ensuite comment l’éviter, et enfin un exemple.', 'Pour conclure : répéter, c’est retenir.'],
    demoNote: 'Une structure complète, du début à la fin.',
    prompt: 'Fais un exposé de deux minutes sur le sujet de ton choix : accroche, plan annoncé, exemples et conclusion.',
  },
  // ——— Semaine 4 — Captiver ton public ———
  {
    intro: 'Le regard crée le lien. Regarde une personne le temps d’une idée, puis passe à une autre. Face caméra, regarde l’objectif, pas l’écran.',
    points: ['Une idée, une personne : environ trois secondes.', 'Balaye toute la salle, pas seulement le premier rang.', 'En visio, regarde l’objectif de la caméra.'],
    quiz: [
      { q: 'Combien de temps regarder une personne ?', options: ['Le temps d’une idée, quelques secondes', 'Tout le discours', 'Jamais, c’est gênant'], answer: 0, why: 'Assez pour créer un lien, pas assez pour mettre mal à l’aise.' },
      { q: 'En visioconférence, on regarde…', options: ['Son propre visage', 'L’objectif de la caméra', 'Le clavier'], answer: 1, why: 'Regarder l’objectif donne l’impression de regarder les gens dans les yeux.' },
    ],
    demo: ['Je vous regarde, vous, au premier rang…', 'puis vous, près de la fenêtre…', 'et chacun se sent concerné par ce que je dis.'],
    demoNote: 'Chaque phrase est adressée à quelqu’un.',
    prompt: 'Place ton téléphone à hauteur des yeux et parle 45 secondes en regardant l’objectif, comme si tu parlais à une personne.',
  },
  {
    intro: 'Les gestes renforcent ta parole et libèrent ta voix. Des mains ouvertes, à hauteur de la taille, rendent ton discours plus vivant.',
    points: ['Mains visibles, à hauteur de la taille.', 'Un geste pour illustrer : grand, petit, d’un côté, de l’autre.', 'Évite les mains dans les poches ou les bras croisés.'],
    quiz: [
      { q: 'Où placer ses mains ?', options: ['Dans les poches', 'Visibles, à hauteur de la taille', 'Derrière le dos'], answer: 1, why: 'Des mains visibles inspirent confiance.' },
      { q: 'Pourquoi faire des gestes ?', options: ['Pour illustrer et animer sa voix', 'Pour occuper ses mains', 'Ça distrait toujours le public'], answer: 0, why: 'Le geste entraîne la voix : elle devient plus expressive.' },
    ],
    demo: ['Ce projet a commencé tout petit…', 'puis il a grandi, grandi…', 'jusqu’à toucher des milliers de personnes !'],
    demoNote: 'On entend que la voix suit les gestes.',
    prompt: 'Décris un objet ou un lieu en l’illustrant avec tes mains. Laisse tes gestes animer ta voix.',
  },
  {
    intro: 'Les questions du public ne sont pas des pièges, mais des marques d’intérêt. Écoute, remercie, réponds simplement, et vérifie.',
    points: ['Écoute la question jusqu’au bout, puis respire.', 'Reformule ou remercie : « Bonne question ».', 'Réponds en quelques phrases, puis vérifie : « Ça répond à votre question ? »'],
    quiz: [
      { q: 'Avant de répondre à une question, il faut…', options: ['Couper la parole', 'Écouter jusqu’au bout et respirer', 'Répondre le plus vite possible'], answer: 1, why: 'Tu comprends mieux la question et tu gagnes du calme.' },
      { q: 'Si tu ne connais pas la réponse…', options: ['Tu inventes', 'Tu le dis et tu proposes de revenir vers la personne', 'Tu changes de sujet'], answer: 1, why: 'L’honnêteté renforce ta crédibilité.' },
    ],
    demo: ['Merci pour cette question.', 'Si je comprends bien, vous voulez savoir combien de temps il faut pour progresser.', 'En général, trois semaines de pratique régulière suffisent pour sentir la différence.', 'Est-ce que cela répond à votre question ?'],
    demoNote: 'Remerciement, reformulation, réponse courte, vérification.',
    prompt: 'Écoute la question du coach, puis réponds comme devant un public : remercie, reformule, réponds simplement, vérifie.',
    question: 'Selon vous, quel est le plus grand obstacle quand on doit parler en public, et comment le dépasser ?',
  },
  {
    intro: 'Improviser s’apprend. Une méthode simple : donne ton avis, une raison, un exemple, puis reviens à ton avis.',
    points: ['Avis : « Je pense que… »', 'Raison et exemple : « parce que… par exemple… »', 'Retour à l’avis pour conclure.'],
    quiz: [
      { q: 'Quelle structure aide à improviser ?', options: ['Avis, raison, exemple, avis', 'Parler jusqu’à ce qu’on vous arrête', 'Réciter un texte appris'], answer: 0, why: 'Cette structure simple évite la page blanche.' },
      { q: 'Si tu perds le fil en improvisant…', options: ['Tu fais une pause et tu reviens à ton avis', 'Tu t’excuses longuement', 'Tu abandonnes'], answer: 0, why: 'Revenir à ton avis te remet sur les rails.' },
    ],
    demo: ['Je pense que tout le monde devrait apprendre à cuisiner.', 'Parce que c’est un vrai moment de liberté.', 'Par exemple, préparer un plat pour ses amis, c’est offrir du temps et de l’attention.', 'Oui, vraiment : cuisiner, c’est prendre soin des autres.'],
    demoNote: 'Avis, raison, exemple, puis retour à l’avis.',
    prompt: 'Un sujet surprise va s’afficher. Improvise pendant une minute : ton avis, une raison, un exemple, puis ton avis à nouveau.',
  },
  {
    intro: 'Persuader, ce n’est pas forcer : c’est montrer à ton public ce qu’il y gagne. Parle de lui, de ses besoins, puis propose une action simple.',
    points: ['Pars du besoin de ton public : « vous voulez… ».', 'Donne une raison forte : « parce que… ».', 'Propose une action simple : « je vous propose… ».'],
    quiz: [
      { q: 'Pour convaincre, il vaut mieux parler…', options: ['De ce que ton public y gagne', 'Uniquement de toi', 'Le plus fort possible'], answer: 0, why: 'On adhère quand on voit son propre intérêt.' },
      { q: 'Une bonne fin persuasive est…', options: ['Une action simple à faire', 'Une menace', 'Une liste de 20 arguments'], answer: 0, why: 'Une action simple transforme l’intérêt en décision.' },
    ],
    demo: ['Vous voulez avoir plus d’énergie le matin ?', 'Alors essayez ceci : posez votre téléphone une heure avant de dormir.', 'Parce que votre sommeil sera plus profond.', 'Je vous propose de tester dès ce soir.'],
    demoNote: 'Besoin du public, raison, action proposée.',
    prompt: 'Convaincs ton public d’adopter une bonne habitude : pars de son besoin, donne une raison, propose une action concrète.',
  },
  {
    intro: 'Un trou de mémoire, un bruit, une question inattendue : l’imprévu arrive à tout le monde. Le secret est de faire une pause, respirer, et reformuler.',
    points: ['Pause et respiration : personne ne s’en rend compte.', 'Reformule ta dernière idée pour retrouver le fil.', 'Un peu d’humour désamorce beaucoup de situations.'],
    quiz: [
      { q: 'En cas de trou de mémoire…', options: ['Tu fais une pause et tu reformules ta dernière idée', 'Tu quittes la scène', 'Tu t’excuses pendant une minute'], answer: 0, why: 'Reformuler relance naturellement la mémoire.' },
      { q: 'Un téléphone sonne dans la salle :', options: ['Tu t’énerves', 'Tu fais une pause, souris, et reprends', 'Tu cries plus fort'], answer: 1, why: 'Le calme et le sourire rassurent tout le monde.' },
    ],
    demo: ['Et la troisième raison, c’est…', 'Pardon, je reprends.', 'Je disais que bien dormir améliore la concentration…', 'et justement, la troisième raison, c’est la bonne humeur !'],
    demoNote: 'Une pause, une reformulation, et le fil revient.',
    prompt: 'Parle d’un sujet de ton choix. À un moment, fais semblant de perdre le fil : pause, respiration, reformulation, puis reprends.',
  },
  {
    intro: 'Bilan de la semaine : ton grand discours de trois minutes. Accroche, plan, histoire, regard, gestes, conclusion : montre tout ce que tu sais faire.',
    points: ['Une accroche et un plan annoncé.', 'Une histoire ou un exemple par partie.', 'Une conclusion forte, puis un silence.'],
    quiz: [
      { q: 'Dans un discours de trois minutes, combien de parties ?', options: ['Deux ou trois', 'Dix', 'Aucune'], answer: 0, why: 'Deux ou trois parties restent faciles à suivre.' },
      { q: 'Ce que le public retient le mieux, c’est…', options: ['Les histoires', 'Les listes de chiffres', 'Les excuses'], answer: 0, why: 'Les histoires créent des images et des émotions.' },
    ],
    demo: ['Il y a un mois, je n’osais pas lever la main en réunion.', 'Aujourd’hui, je vais vous raconter d’abord ce qui m’en empêchait, ensuite ce qui a tout changé, et enfin ce que je vous conseille.', 'Pour conclure : votre voix mérite d’être entendue.'],
    demoNote: 'Toutes les techniques réunies dans un seul discours.',
    prompt: 'Fais ton grand discours de trois minutes sur un sujet qui te tient à cœur : accroche, plan, exemples ou histoires, conclusion.',
  },
  {
    intro: 'Tu as parcouru un long chemin. Prendre conscience de tes progrès renforce ta confiance pour la suite.',
    points: ['Compare-toi à toi-même, pas aux autres.', 'Nomme trois choses que tu fais mieux qu’au début.', 'Remercie-toi pour tes efforts.'],
    quiz: [
      { q: 'À qui se comparer pour mesurer ses progrès ?', options: ['À soi-même au début', 'Aux meilleurs orateurs du monde', 'À personne, c’est inutile'], answer: 0, why: 'Ta progression personnelle est la seule mesure juste.' },
      { q: 'Célébrer ses progrès sert à…', options: ['Renforcer la motivation', 'Perdre du temps', 'Se vanter'], answer: 0, why: 'Reconnaître ses efforts donne envie de continuer.' },
    ],
    demo: ['Au début, je parlais trop vite et je disais « euh » toutes les deux phrases.', 'Aujourd’hui, je prends mon temps, je fais des pauses…', 'et surtout, j’ose.'],
    demoNote: 'Un regard bienveillant et concret sur le chemin parcouru.',
    prompt: 'Parle pendant une minute de tes progrès : ce qui était difficile au début et trois choses que tu fais mieux aujourd’hui.',
  },
  {
    intro: 'Le parcours se termine, mais ton aventure commence. Fixe-toi un prochain défi concret pour continuer à progresser.',
    points: ['Choisis une vraie occasion de parler : réunion, exposé, fête.', 'Fixe une date.', 'Continue à t’entraîner quelques minutes par semaine.'],
    quiz: [
      { q: 'Quel est le meilleur prochain défi ?', options: ['Une vraie occasion, avec une date', 'Attendre de ne plus avoir le trac', 'Arrêter de s’entraîner'], answer: 0, why: 'Un défi daté transforme l’envie en action.' },
      { q: 'Pour garder ses progrès…', options: ['On s’entraîne régulièrement, même un peu', 'On n’y pense plus', 'On attend la prochaine panique'], answer: 0, why: 'La régularité entretient la confiance.' },
    ],
    demo: ['Mon prochain défi est clair :', 'dans deux semaines, je présenterai mon projet devant toute mon équipe.', 'Je vais m’entraîner trois fois par semaine.', 'Et je sais que j’en suis capable.'],
    demoNote: 'Un objectif concret, une date, un plan.',
    prompt: 'Annonce ton prochain défi de prise de parole : quoi, quand, et comment tu vas t’y préparer. Commence par « Mon objectif… ».',
  },
];
