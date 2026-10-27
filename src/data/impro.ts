// Improvisation : sujets surprises et feux de chronométrage, comme les « Table Topics » de Toastmasters.
import type { ImproLight, Lang } from '../types';

export type { ImproLight };
export type ImproCategory = 'daily' | 'work' | 'society' | 'imagine';
export type ImproLevel = 'express' | 'classic' | 'long';

export const IMPRO_CATEGORIES: ImproCategory[] = ['daily', 'work', 'society', 'imagine'];

/** Feux en secondes de parole : vert = minimum, orange = pense à conclure, rouge = maximum. */
export const IMPRO_LEVELS: Record<ImproLevel, { green: number; orange: number; red: number }> = {
  express: { green: 30, orange: 45, red: 60 },
  classic: { green: 60, orange: 90, red: 120 },
  long: { green: 120, orange: 150, red: 180 },
};

/** Temps de réflexion avant de parler. */
export const THINK_SECONDS = 10;
/** Au-delà du rouge, on laisse 30 s avant d'arrêter (règle Toastmasters). */
export const OVERTIME_SECONDS = 30;

export function lightAt(seconds: number, level: ImproLevel): ImproLight {
  const l = IMPRO_LEVELS[level];
  if (seconds >= l.red + OVERTIME_SECONDS) return 'over';
  if (seconds >= l.red) return 'red';
  if (seconds >= l.orange) return 'orange';
  return seconds >= l.green ? 'green' : 'none';
}

/** Respect du temps : entre le vert et le rouge (+30 s de tolérance). */
export const timingOfLight = (light: ImproLight): 'short' | 'ok' | 'long' => (light === 'none' ? 'short' : light === 'over' ? 'long' : 'ok');

export const IMPRO_TOPICS: Record<Lang, Record<ImproCategory, string[]>> = {
  fr: {
    daily: [
      'Quel plat de ton enfance aimerais-tu faire goûter au monde entier ?',
      'Le meilleur conseil qu’on t’ait jamais donné.',
      'Raconte un voyage, même court, qui t’a marqué.',
      'Plutôt lever tôt ou coucher tard ? Défends ton camp.',
      'Une personne de ta famille que tu admires, et pourquoi.',
      'Ce que tu ferais d’une journée entière sans téléphone.',
      'La musique qui te met de bonne humeur.',
      'Un objet de ta maison qui a une histoire.',
      'Ce que ton quartier a de plus précieux.',
      'Une petite habitude qui a changé ta vie.',
      'Le marché, le supermarché ou en ligne : où préfères-tu faire tes courses ?',
      'Une fête ou une tradition que tu aimes particulièrement.',
    ],
    work: [
      'Présente ton métier, ou celui dont tu rêves, à un enfant de 10 ans.',
      'Ta plus grande fierté professionnelle ou scolaire.',
      'Télétravail ou bureau : qu’est-ce qui te convient le mieux ?',
      'Le meilleur chef ou professeur que tu aies eu.',
      'Comment réagis-tu quand tu fais une erreur au travail ?',
      'Convaincs ton équipe d’essayer une nouvelle idée.',
      'Une compétence que tu aimerais apprendre cette année.',
      'Comment bien accueillir un nouveau collègue ?',
      'La réunion idéale, selon toi.',
      'Raconte un échec qui t’a fait grandir.',
      'Pourquoi devrait-on t’embaucher ? Réponds en une minute.',
      'Quel conseil donnerais-tu à quelqu’un qui commence son premier emploi ?',
    ],
    society: [
      'Faut-il apprendre plusieurs langues dès l’école primaire ?',
      'Les réseaux sociaux rapprochent-ils ou éloignent-ils les gens ?',
      'Que peut-on faire, chacun, pour sa ville ?',
      'Le français que l’on parle à Dakar, Montréal ou Bruxelles : une richesse ?',
      'Faut-il interdire les téléphones à table ?',
      'Les jeunes devraient-ils tous faire du bénévolat ?',
      'Vaut-il mieux vivre en ville ou à la campagne ?',
      'L’intelligence artificielle va-t-elle changer ton quotidien ?',
      'Qu’est-ce qui fait un bon leader ?',
      'Faut-il garder les traditions ou les réinventer ?',
      'Le sport doit-il être obligatoire à tout âge ?',
      'L’école devrait-elle apprendre à parler en public ?',
    ],
    imagine: [
      'Tu peux dîner avec une personne célèbre, vivante ou non. Qui, et pourquoi ?',
      'Tu te réveilles avec un super-pouvoir pour une journée.',
      'Tu deviens maire de ta ville pendant une semaine.',
      'Invente une fête nationale nouvelle et explique-la.',
      'Si les animaux pouvaient parler, lequel aurait le plus de choses à dire ?',
      'Tu reçois un billet pour vivre une journée en 2080.',
      'Tu dois vendre un parapluie dans le désert.',
      'Tu peux ajouter une matière à l’école. Laquelle ?',
      'Décris la maison de tes rêves.',
      'Tu présentes la météo d’une planète inventée.',
      'Ton chat (ou ton chien) écrit ses mémoires. Lis-en le début.',
      'Tu as dix secondes à la radio pour parler à tout le pays.',
    ],
  },
  en: {
    daily: [
      'Which dish from your childhood would you like the whole world to taste?',
      'The best advice anyone ever gave you.',
      'Tell us about a trip, even a short one, that stayed with you.',
      'Early bird or night owl? Defend your side.',
      'A family member you admire, and why.',
      'What you would do with a whole day without your phone.',
      'The music that always puts you in a good mood.',
      'An object in your home that has a story.',
      'The most precious thing about your neighbourhood.',
      'A small habit that changed your life.',
      'Market, supermarket or online: where do you prefer to shop?',
      'A celebration or tradition you particularly love.',
    ],
    work: [
      'Explain your job, or your dream job, to a 10-year-old.',
      'Your proudest achievement at work or school.',
      'Remote work or the office: which suits you best?',
      'The best manager or teacher you ever had.',
      'How do you react when you make a mistake at work?',
      'Convince your team to try a new idea.',
      'A skill you would like to learn this year.',
      'How should we welcome a new colleague?',
      'Your idea of the perfect meeting.',
      'Tell us about a failure that helped you grow.',
      'Why should we hire you? Answer in one minute.',
      'What advice would you give someone starting their first job?',
    ],
    society: [
      'Should children learn several languages from primary school?',
      'Do social networks bring people together or push them apart?',
      'What can each of us do for our city?',
      'Should phones be banned at the dinner table?',
      'Should all young people volunteer?',
      'Is it better to live in the city or the countryside?',
      'Will artificial intelligence change your daily life?',
      'What makes a good leader?',
      'Should we keep traditions or reinvent them?',
      'Should sport be compulsory at every age?',
      'Should schools teach public speaking?',
      'Is speaking several languages a superpower?',
    ],
    imagine: [
      'You can have dinner with any famous person, living or not. Who, and why?',
      'You wake up with a superpower for one day.',
      'You become mayor of your city for a week.',
      'Invent a brand-new national holiday and explain it.',
      'If animals could talk, which one would have the most to say?',
      'You get a ticket to spend one day in 2080.',
      'You have to sell an umbrella in the desert.',
      'You can add one subject to the school timetable. Which one?',
      'Describe your dream house.',
      'You are presenting the weather forecast for an imaginary planet.',
      'Your cat (or dog) is writing its memoirs. Read us the opening.',
      'You have ten seconds on national radio to speak to the whole country.',
    ],
  },
};

/** Tire un sujet au hasard, différent de celui qu'on écarte. */
export function drawTopic(lang: Lang, category: ImproCategory | 'all', avoid?: string, random = Math.random) {
  const pool = (category === 'all' ? IMPRO_CATEGORIES.flatMap((c) => IMPRO_TOPICS[lang][c]) : IMPRO_TOPICS[lang][category]).filter((t) => t !== avoid);
  return pool[Math.floor(random() * pool.length)];
}
