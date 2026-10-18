import type { LessonContent } from './types';

export const lessonsEn: LessonContent[] = [
  // ——— Week 1 — Tame stage fright ———
  {
    intro: 'Stage fright comes with short, fast breathing. Slowing your breath tells your body that everything is fine.',
    points: ['Breathe in through your nose, filling your belly, not your chest.', 'Breathe out longer than you breathe in: that’s what calms you.', 'Three cycles are enough before you speak.'],
    quiz: [
      { q: 'Which breathing calms you fastest?', options: ['Long inhale, quick exhale', 'Exhaling longer than inhaling', 'Holding your breath as long as possible'], answer: 1, why: 'A long exhale slows the heart and settles the body.' },
      { q: 'Where should the air go when you breathe in?', options: ['Into your belly', 'Into your shoulders', 'Into your throat'], answer: 0, why: 'Belly breathing is deeper and calmer.' },
    ],
    demo: ['I breathe in… gently.', 'I hold for a moment.', 'And I breathe out… slowly.', 'Hello, my name is Léa, and today I’m starting my journey.'],
    demoNote: 'Listen to the steady pace of the last sentence: calm breath makes a steady voice.',
    prompt: 'After the guided breathing, introduce yourself calmly in one or two sentences: your name and why you’re starting this path.',
  },
  {
    intro: 'Introducing yourself is the most common kind of public speaking. Thirty well-prepared seconds give you confidence everywhere.',
    points: ['Who you are: your name and what you do.', 'What drives or excites you.', 'A closing line that opens the conversation.'],
    quiz: [
      { q: 'How long should a quick introduction last?', options: ['About 30 seconds', 'At least 3 minutes', 'Under 5 seconds'], answer: 0, why: 'Thirty seconds is enough to stand out without dragging.' },
      { q: 'How should you end your introduction?', options: ['With “so, yeah, that’s it”', 'With a line that opens the conversation', 'By apologising for speaking'], answer: 1, why: 'An opening invites the other person to keep talking.' },
    ],
    demo: ['Hi, I’m Malik.', 'I work in logistics, and I love organising events with my friends.', 'Right now, I’m learning to speak in public so I can present my projects with confidence.', 'What brought you here?'],
    demoNote: 'Three simple ideas, then a question to hand over the conversation.',
    prompt: 'Introduce yourself in about 30 seconds: who you are, what drives you, and a closing line that opens the conversation.',
  },
  {
    intro: 'The pause is great speakers’ secret weapon. It lets you breathe, gives weight to your words and replaces your “um”s.',
    points: ['Pause after every important idea.', 'One second of silence feels long to you, but natural to your audience.', 'During the pause, look at your audience and breathe.'],
    quiz: [
      { q: 'What does the audience think of a one-second pause?', options: ['That you forgot your text', 'That you’re confident', 'That you’re in a hurry'], answer: 1, why: 'A controlled pause comes across as calm and assured.' },
      { q: 'Where should you pause?', options: ['In the middle of a word', 'After an important idea', 'Never, keep going'], answer: 1, why: 'It gives your idea time to land.' },
    ],
    demo: ['Today…', 'I want to talk to you about something simple.', 'Silence.', 'It gives weight to every word you say.'],
    demoNote: 'Notice the silences between sentences: they make the message stronger.',
    prompt: 'Talk about a place you love. Make at least three real pauses, one after each idea.',
  },
  {
    intro: 'Your posture changes your voice. Grounded, with relaxed shoulders, you breathe better and your voice carries naturally.',
    points: ['Feet hip-width apart, weight evenly spread.', 'Shoulders down, chin level with the floor.', 'Speak as if to the back of the room.'],
    quiz: [
      { q: 'Which posture helps your voice carry?', options: ['Raised shoulders, crossed arms', 'Grounded feet, relaxed shoulders', 'Leaning against a wall'], answer: 1, why: 'A stable posture frees your breathing, and so your voice.' },
      { q: 'Who should you speak to in order to be heard?', options: ['Only the front row', 'The person at the back of the room', 'Your notes'], answer: 1, why: 'Aiming at the back naturally raises your volume.' },
    ],
    demo: ['I stand tall, feet firmly grounded.', 'My shoulders are relaxed.', 'And my voice carries, without shouting, to the back of the room.'],
    demoNote: 'A steady, strong voice, without tension.',
    prompt: 'Standing and grounded, describe your ideal day as if someone were listening at the back of the room.',
  },
  {
    intro: 'Talking to a crowd is scary; talking to a friend much less so. Picture a kind person in front of you and your tone becomes natural.',
    points: ['Choose a real person who enjoys listening to you.', 'Tell it like a conversation, in your own words.', 'Accept small imperfections: they make you human.'],
    quiz: [
      { q: 'Why imagine a friend in front of you?', options: ['To talk faster', 'To find a natural tone', 'To avoid looking at the audience'], answer: 1, why: 'Your brain relaxes when it thinks of a familiar conversation.' },
      { q: 'A small mistake while speaking is…', options: ['A disaster', 'Normal and often unnoticed', 'A reason to stop'], answer: 1, why: 'Audiences rarely notice the small slips you hear.' },
    ],
    demo: ['You know, last weekend I finally tried my grandmother’s recipe.', 'Of course, I messed it up the first time!', 'But the second time… it tasted exactly like my childhood.'],
    demoNote: 'A friendly tone, like with a friend, and a little story.',
    prompt: 'Picture a kind friend in front of you and tell them about a happy recent memory for at least 45 seconds.',
  },
  {
    intro: 'Stress and excitement feel the same in the body. Instead of fighting it, tell yourself “I’m excited”: the energy flows into your voice.',
    points: ['Welcome your racing heart: it’s energy you can use.', 'Put that energy in your voice: rise on the key words.', 'Smile as you speak: people can hear it.'],
    quiz: [
      { q: 'What should you tell yourself just before speaking?', options: ['“Calm down”', '“I’m excited”', '“This will go badly”'], answer: 1, why: 'Reframing stress as excitement improves performance.' },
      { q: 'How do you give your voice energy?', options: ['Speak in a flat tone', 'Vary your pitch and stress key words', 'Whisper'], answer: 1, why: 'A voice that rises and falls holds attention.' },
    ],
    demo: ['I have some fantastic news!', 'Our little project has gone beyond all our hopes.', 'And this is only the beginning.'],
    demoNote: 'The voice rises on “fantastic news” and “all our hopes”.',
    prompt: 'Announce some good news, real or imagined, with enthusiasm. Let your voice rise on the important words.',
  },
  {
    intro: 'First week done! Today you’ll hold a full minute. Use everything you’ve learned: breath, pause, posture, energy.',
    points: ['Breathe before you start.', 'Pause between your ideas.', 'End with a clear sentence, then stop.'],
    quiz: [
      { q: 'What should you do just before you start?', options: ['Breathe calmly', 'Talk as fast as possible', 'Look at your feet'], answer: 0, why: 'A calm breath launches a calm talk.' },
      { q: 'How do you end well?', options: ['Trail off mid-sentence', 'A clear sentence followed by silence', 'With “um, so yeah”'], answer: 1, why: 'The final silence shows you’ve finished, with confidence.' },
    ],
    demo: ['A week ago, speaking in front of others scared me.', 'Today, I breathe, I take my time…', 'and I’m discovering that my voice matters.', 'Thank you for listening.'],
    demoNote: 'A minute is short: a few ideas, some pauses, a real ending.',
    prompt: 'Speak for one minute about what this first week taught you, or about a topic you care about.',
  },
  // ——— Week 2 — Find your voice ———
  {
    intro: 'Good articulation means opening your mouth and pronouncing every syllable, without strain. Tongue twisters are how actors warm up.',
    points: ['Open your mouth wider than usual.', 'Slow down: speed comes with practice.', 'Finish the ends of your words.'],
    quiz: [
      { q: 'What are tongue twisters for?', options: ['Training your diction', 'Speaking louder', 'Memorising a text'], answer: 0, why: 'They train your lips and tongue to be precise.' },
      { q: 'To articulate better, you should first…', options: ['Speed up', 'Slow down and open your mouth', 'Clench your teeth'], answer: 1, why: 'Precision comes before speed.' },
    ],
    demo: ['She sells seashells by the seashore.', 'Red lorry, yellow lorry.', 'Peter Piper picked a peck of pickled peppers.'],
    demoNote: 'Every syllable is clear, the pace is steady.',
    prompt: 'Read these tongue twisters slowly, articulating every syllable, then again a little faster.',
    read: 'She sells seashells by the seashore. Red lorry, yellow lorry, red lorry, yellow lorry. Peter Piper picked a peck of pickled peppers. How much wood would a woodchuck chuck if a woodchuck could chuck wood?',
  },
  {
    intro: '“Um”s fill the silence while your brain looks for what comes next. The cure is simple: replace them with a pause.',
    points: ['Spot your favourite filler: “um”, “like”, “you know”…', 'When you feel it coming, close your mouth for a second.', 'Prepare your transitions: “next”, “for example”.'],
    quiz: [
      { q: 'What should replace an “um”?', options: ['“Like”', 'A short silence', 'Clearing your throat'], answer: 1, why: 'Silence is invisible to the audience; “um” isn’t.' },
      { q: 'Why do we say “um”?', options: ['To buy time while we think', 'To be polite', 'To speak louder'], answer: 0, why: 'It’s a reflex to keep the floor while thinking.' },
    ],
    demo: ['My favourite dish is my mum’s lasagne.', 'Why?', 'Because it reminds me of Sunday lunches with the whole family…', 'and that smell of tomato and basil filling the house.'],
    demoNote: 'No “um”s: short pauses instead.',
    prompt: 'Talk about your favourite dish for a minute. Whenever you feel an “um” coming, pause instead.',
  },
  {
    intro: 'A good pace is between 120 and 165 words per minute. Too fast and you lose people; too slow and they drift. The ideal: vary it.',
    points: ['Slow down for key ideas and numbers.', 'Speed up slightly for anecdotes.', 'If you feel yourself racing, pause.'],
    quiz: [
      { q: 'Which pace is comfortable to listen to?', options: ['About 80 words per minute', 'Between 120 and 165 words per minute', 'Over 220 words per minute'], answer: 1, why: 'That’s the range people follow effortlessly.' },
      { q: 'When should you slow down?', options: ['On key ideas and numbers', 'On unimportant words', 'Never'], answer: 0, why: 'Slowing down highlights what matters.' },
    ],
    demo: ['Every day, we spend on average… three hours on our phones.', 'Three hours!', 'Imagine everything we could do with that time: read, run, call the people we love.'],
    demoNote: 'The pace slows on the number, then picks up again.',
    prompt: 'Explain how you organise a busy day. Aim for a steady pace: not too fast, not too slow.',
  },
  {
    intro: 'A monotone voice puts people to sleep. Let your voice rise on important words and fall at the end of sentences: your talk comes alive.',
    points: ['Find the two or three key words in each sentence.', 'Rise slightly on those words.', 'Drop clearly at the end of statements.'],
    quiz: [
      { q: 'What does a monotone voice do?', options: ['It reassures', 'It puts the audience to sleep', 'It impresses'], answer: 1, why: 'Without variation, attention drops within seconds.' },
      { q: 'At the end of a statement, your voice…', options: ['Rises', 'Falls', 'Stops midway'], answer: 1, why: 'A falling voice states; a rising voice asks.' },
    ],
    demo: ['This is the story of a little boy who dreamed of flying.', 'Everyone laughed at him.', 'And yet, years later… he became a pilot.'],
    demoNote: 'The voice plays with the story: surprise, suspense, payoff.',
    prompt: 'Read this short text, exaggerating the changes in your voice, as if telling it to children.',
    read: 'This is the story of a little boy who dreamed of flying. Everyone laughed at him. He built cardboard wings, jumped off the sofa, fell, and tried again. And yet, years later, he became a pilot. Today, he’s the one who makes children dream.',
  },
  {
    intro: 'Projecting your voice isn’t shouting: it’s using your breath so your voice carries far, without strain.',
    points: ['Support your voice with a belly exhale.', 'Aim at a point at the back of the room.', 'Keep your throat relaxed: if it tightens, you’re shouting.'],
    quiz: [
      { q: 'Projecting your voice means…', options: ['Shouting', 'Carrying your voice with your breath', 'Speaking higher'], answer: 1, why: 'Breath carries the voice without hurting your throat.' },
      { q: 'If your throat tightens when you speak loudly…', options: ['You’re shouting: relax and breathe', 'That’s perfect', 'Push harder'], answer: 0, why: 'Throat tension signals poor breath support.' },
    ],
    demo: ['Good evening, everyone!', 'Thank you all for coming tonight.', 'Please take your seats, we’re about to begin.'],
    demoNote: 'A full, confident voice that fills the room without shouting.',
    prompt: 'Welcome an imaginary audience in a large hall: greet them and present the programme, with a voice that carries.',
  },
  {
    intro: 'A well-placed silence grabs attention better than any word. Before a reveal or after a question, let silence do the work.',
    points: ['Silence before key information builds anticipation.', 'Silence after a question makes people think.', 'Count “one, two” in your head.'],
    quiz: [
      { q: 'Where does silence create suspense?', options: ['Just before a reveal', 'In the middle of a word', 'After “hello”'], answer: 0, why: 'The audience leans in to find out what’s next.' },
      { q: 'After asking the audience a question, you should…', options: ['Answer immediately', 'Leave a silence', 'Change the subject'], answer: 1, why: 'Silence gives people time to think.' },
    ],
    demo: ['Do you know how many times a day we say “I don’t have time”?', 'Neither do I.', 'But I do know one thing…', 'we find time for what truly matters.'],
    demoNote: 'A silence after the question, another before the conclusion.',
    prompt: 'Ask your imaginary audience a question, leave a silence, then develop your answer. Make at least four pauses.',
  },
  {
    intro: 'Week review: read a text aloud using everything you’ve practised. Diction, pace, intonation, pauses: it’s your moment.',
    points: ['Read it once in your head to spot the key words.', 'Pause at full stops and commas.', 'Bring the text to life with your voice.'],
    quiz: [
      { q: 'Before reading aloud, it helps to…', options: ['Read it once in your head', 'Read it as fast as possible', 'Not look at it'], answer: 0, why: 'You spot the key words and the tricky bits.' },
      { q: 'Commas and full stops tell you…', options: ['Where to breathe and pause', 'Where to speed up', 'Nothing in particular'], answer: 0, why: 'Punctuation is the score of your reading.' },
    ],
    demo: ['Once upon a time, there was a town where nobody dared to speak in public.', 'One day, a young woman took the microphone.', 'Her voice was shaking… but she kept going.'],
    demoNote: 'The reading breathes, changing pace and tone.',
    prompt: 'Read this text aloud, as if telling it to an audience.',
    read: 'Once upon a time, there was a town where nobody dared to speak in public. Meetings were silent, and ideas stayed in people’s heads. One day, a young woman took the microphone. Her voice was shaking, and so were her hands. But she kept going, sentence after sentence. When she finished, the whole room stood up to applaud. That day, the town understood that a shaking voice is still a voice that matters.',
  },
  // ——— Week 3 — Structure your message ———
  {
    intro: 'A good talk fits in one sentence. If your audience remembered only one thing, what would it be? Find it, then build around it.',
    points: ['Phrase your key message in one simple sentence.', 'Say it at the start and repeat it at the end.', 'Cut whatever doesn’t serve it.'],
    quiz: [
      { q: 'How many main messages in a short talk?', options: ['Just one', 'At least five', 'As many as possible'], answer: 0, why: 'A single message is a remembered message.' },
      { q: 'Where should your key message go?', options: ['Only in the middle', 'At the start and at the end', 'Nowhere, let them guess'], answer: 1, why: 'Repeating it at both ends anchors the idea.' },
    ],
    demo: ['My message is simple: walking twenty minutes a day changes your life.', 'More energy, better sleep, a clearer mind.', 'Twenty minutes. That’s all it takes.'],
    demoNote: 'The message is announced, illustrated, then repeated.',
    prompt: 'Pick an idea you care about and defend it in 30 seconds with one clear message, repeated at the end.',
  },
  {
    intro: 'The three-part outline is the easiest to follow: an introduction that announces, a body in steps, and a conclusion that sums up.',
    points: ['Announce your plan: “first… then… finally…”.', 'One idea per part, with an illustration.', 'Conclude by summing up and opening up.'],
    quiz: [
      { q: 'Why announce your plan?', options: ['So the audience knows where it’s going', 'To save time', 'It’s pointless'], answer: 0, why: 'An audience that knows the route follows more easily.' },
      { q: 'Which words help structure a talk?', options: ['“Um”, “anyway”', '“First”, “then”, “finally”', '“Like”, “whatever”'], answer: 1, why: 'Connectors act as signposts.' },
    ],
    demo: ['Today, I’m going to talk to you about sleep.', 'First, why it’s essential. Then, what disrupts it. Finally, three habits for better sleep.', 'To conclude: sleep well, live well.'],
    demoNote: 'You can clearly hear the introduction, the steps and the conclusion.',
    prompt: 'Present a topic of your choice with an announced plan: introduction, “first”, “then”, “finally”, and a conclusion.',
  },
  {
    intro: 'The first seconds decide whether people listen. A good hook surprises: a question, a striking number, a vivid image.',
    points: ['Start with a question that concerns your audience.', 'Or with a surprising number.', 'Or with “Imagine…” to paint a picture.'],
    quiz: [
      { q: 'Which opening grabs attention best?', options: ['“Hello, I’m going to talk about…”', '“Imagine that tomorrow, the internet disappeared.”', '“Um, so, yeah”'], answer: 1, why: 'A vivid image instantly sparks curiosity.' },
      { q: 'How long do you have to grab attention?', options: ['A few seconds', 'Ten minutes', 'The whole talk'], answer: 0, why: 'Audiences decide very quickly whether to listen.' },
    ],
    demo: ['Imagine that tomorrow morning, the internet disappeared.', 'No more messages, no more maps, no more videos.', 'What would you do with your day?'],
    demoNote: 'A vivid image and a question that involves everyone.',
    prompt: 'Open with a strong hook: a question, a number or “Imagine…”, then develop it in a few sentences.',
  },
  {
    intro: 'The ending is what your audience remembers best. A strong conclusion sums up your message and leaves a final image or a call to action.',
    points: ['Signal that you’re concluding: “to conclude”.', 'Restate your key message in one sentence.', 'End with a call to action or an image, then silence.'],
    quiz: [
      { q: 'Which ending is strongest?', options: ['“So, yeah, that’s it.”', '“Now it’s your turn: start tonight.”', '“I think I’m done.”'], answer: 1, why: 'A call to action gives your message a concrete next step.' },
      { q: 'After your last sentence…', options: ['You add “thanks, so, yeah”', 'You leave a silence', 'You run off'], answer: 1, why: 'Silence lets your conclusion resonate.' },
    ],
    demo: ['To conclude, remember one thing:', 'every great journey starts with a first step.', 'So take that first step… today.'],
    demoNote: 'Signal the end, restate the message, call to action.',
    prompt: 'Sum up a topic in a few sentences, then finish with a real conclusion: “to conclude”, your message, and a call to action.',
  },
  {
    intro: 'Stories stick far better than arguments. A good story has a character, an obstacle and a transformation.',
    points: ['Set the scene: “one day”, “I remember”.', 'Describe the obstacle and how you felt.', 'End with what you learned.'],
    quiz: [
      { q: 'What makes a story gripping?', options: ['An obstacle to overcome', 'Lots of numbers', 'No characters'], answer: 0, why: 'The obstacle creates the tension that holds attention.' },
      { q: 'How should a story end in a talk?', options: ['With the lesson you drew from it', 'Abruptly', 'With another story'], answer: 0, why: 'The lesson ties the story to your message.' },
    ],
    demo: ['I remember my first presentation.', 'My hands were shaking so much that my notes fell on the floor.', 'The whole class laughed… and then I laughed too.', 'That day, I learned you can fail and keep going.'],
    demoNote: 'A specific moment, an obstacle, an emotion, a lesson.',
    prompt: 'Tell about a time you overcame a difficulty: “I remember…”, the obstacle, how you felt, the lesson.',
  },
  {
    intro: 'To explain a complicated idea, compare it to something familiar. Images and examples make everything clearer.',
    points: ['Use “it’s like…” to compare.', 'Give a concrete everyday example.', 'Avoid jargon, or explain it.'],
    quiz: [
      { q: 'How do you explain a complex topic?', options: ['With technical jargon', 'With a familiar comparison', 'By talking faster'], answer: 1, why: 'A familiar image gives the mind something to hold on to.' },
      { q: 'Which phrase introduces an analogy?', options: ['“It’s like…”', '“In conclusion…”', '“Um…”'], answer: 0, why: '“It’s like” links the unknown to the known.' },
    ],
    demo: ['The internet is like a huge network of roads.', 'Your messages are little cars', 'looking for the fastest route to their destination.'],
    demoNote: 'A technical idea becomes a simple image.',
    prompt: 'Explain something complicated (your job, a technology, a rule) to a 10-year-old, using “it’s like” and an example.',
  },
  {
    intro: 'Week review: a complete two-minute talk. Hook, announced plan, examples, strong conclusion: you have all the keys.',
    points: ['A hook and an announced plan.', 'Two or three parts, each with an example.', 'A conclusion that sums up and opens up.'],
    quiz: [
      { q: 'A good talk starts with…', options: ['A hook and the plan', 'Apologies', 'The conclusion'], answer: 0, why: 'You grab attention, then show the route.' },
      { q: 'Each part should contain…', options: ['A concrete example', 'As many numbers as possible', 'A mandatory joke'], answer: 0, why: 'Examples make ideas vivid and memorable.' },
    ],
    demo: ['Did you know we forget half of what we learn within an hour?', 'I’ll show you first why, then how to avoid it, and finally an example.', 'To conclude: repeat to remember.'],
    demoNote: 'A complete structure, from start to finish.',
    prompt: 'Give a two-minute talk on a topic of your choice: hook, announced plan, examples and conclusion.',
  },
  // ——— Week 4 — Captivate your audience ———
  {
    intro: 'Eye contact builds connection. Look at one person for one idea, then move to another. On camera, look at the lens, not the screen.',
    points: ['One idea, one person: about three seconds.', 'Sweep the whole room, not just the front row.', 'On video calls, look at the camera lens.'],
    quiz: [
      { q: 'How long should you look at one person?', options: ['For one idea, a few seconds', 'The whole talk', 'Never, it’s awkward'], answer: 0, why: 'Long enough to connect, not long enough to make them uneasy.' },
      { q: 'On a video call, you look at…', options: ['Your own face', 'The camera lens', 'Your keyboard'], answer: 1, why: 'Looking at the lens feels like eye contact to others.' },
    ],
    demo: ['I look at you, in the front row…', 'then at you, by the window…', 'and everyone feels that what I’m saying is for them.'],
    demoNote: 'Each sentence is addressed to someone.',
    prompt: 'Place your phone at eye level and speak for 45 seconds looking at the lens, as if talking to one person.',
  },
  {
    intro: 'Gestures reinforce your words and free your voice. Open hands at waist height make your talk more lively.',
    points: ['Hands visible, at waist height.', 'A gesture to illustrate: big, small, this side, that side.', 'Avoid hands in pockets or crossed arms.'],
    quiz: [
      { q: 'Where should your hands be?', options: ['In your pockets', 'Visible, at waist height', 'Behind your back'], answer: 1, why: 'Visible hands inspire trust.' },
      { q: 'Why use gestures?', options: ['To illustrate and animate your voice', 'To keep your hands busy', 'They always distract'], answer: 0, why: 'Gestures pull your voice along: it becomes more expressive.' },
    ],
    demo: ['This project started very small…', 'then it grew, and grew…', 'until it reached thousands of people!'],
    demoNote: 'You can hear the voice following the gestures.',
    prompt: 'Describe an object or a place, illustrating it with your hands. Let your gestures animate your voice.',
  },
  {
    intro: 'Audience questions aren’t traps; they’re signs of interest. Listen, thank, answer simply, then check.',
    points: ['Listen to the whole question, then breathe.', 'Rephrase or thank: “Good question.”', 'Answer in a few sentences, then check: “Does that answer your question?”'],
    quiz: [
      { q: 'Before answering a question, you should…', options: ['Interrupt', 'Listen to the end and breathe', 'Answer as fast as possible'], answer: 1, why: 'You understand it better and gain composure.' },
      { q: 'If you don’t know the answer…', options: ['Make something up', 'Say so and offer to follow up', 'Change the subject'], answer: 1, why: 'Honesty strengthens your credibility.' },
    ],
    demo: ['Thank you for that question.', 'If I understand correctly, you’d like to know how long it takes to improve.', 'Usually, three weeks of regular practice is enough to feel the difference.', 'Does that answer your question?'],
    demoNote: 'Thanks, rephrasing, short answer, check.',
    prompt: 'Listen to the coach’s question, then answer as you would in front of an audience: thank, rephrase, answer simply, check.',
    question: 'In your opinion, what is the biggest obstacle when speaking in public, and how can it be overcome?',
  },
  {
    intro: 'Improvising can be learned. A simple method: give your opinion, a reason, an example, then come back to your opinion.',
    points: ['Opinion: “I think that…”', 'Reason and example: “because… for example…”', 'Back to your opinion to conclude.'],
    quiz: [
      { q: 'Which structure helps you improvise?', options: ['Opinion, reason, example, opinion', 'Talk until someone stops you', 'Recite a memorised text'], answer: 0, why: 'This simple structure prevents a blank mind.' },
      { q: 'If you lose your thread while improvising…', options: ['Pause and return to your opinion', 'Apologise at length', 'Give up'], answer: 0, why: 'Returning to your opinion puts you back on track.' },
    ],
    demo: ['I think everyone should learn to cook.', 'Because it’s a real moment of freedom.', 'For example, cooking for friends means giving them time and attention.', 'Yes, really: cooking is a way of caring for others.'],
    demoNote: 'Opinion, reason, example, then back to the opinion.',
    prompt: 'A surprise topic will appear. Improvise for one minute: your opinion, a reason, an example, then your opinion again.',
  },
  {
    intro: 'Persuading isn’t forcing: it’s showing your audience what’s in it for them. Talk about them and their needs, then suggest a simple action.',
    points: ['Start from their need: “you want…”.', 'Give a strong reason: “because…”.', 'Suggest a simple action: “I suggest…”.'],
    quiz: [
      { q: 'To convince, it’s better to talk…', options: ['About what your audience gains', 'Only about yourself', 'As loudly as possible'], answer: 0, why: 'People commit when they see their own interest.' },
      { q: 'A good persuasive ending is…', options: ['A simple action to take', 'A threat', 'A list of 20 arguments'], answer: 0, why: 'A simple action turns interest into a decision.' },
    ],
    demo: ['Do you want more energy in the morning?', 'Then try this: put your phone down an hour before bed.', 'Because your sleep will be deeper.', 'I suggest you try it tonight.'],
    demoNote: 'The audience’s need, a reason, a suggested action.',
    prompt: 'Convince your audience to adopt a good habit: start from their need, give a reason, suggest a concrete action.',
  },
  {
    intro: 'A memory blank, a noise, an unexpected question: the unexpected happens to everyone. The secret: pause, breathe, rephrase.',
    points: ['Pause and breathe: nobody notices.', 'Rephrase your last idea to find your thread.', 'A touch of humour defuses many situations.'],
    quiz: [
      { q: 'If your mind goes blank…', options: ['Pause and rephrase your last idea', 'Leave the stage', 'Apologise for a minute'], answer: 0, why: 'Rephrasing naturally restarts your memory.' },
      { q: 'A phone rings in the room:', options: ['You get annoyed', 'You pause, smile, and continue', 'You shout louder'], answer: 1, why: 'Calm and a smile reassure everyone.' },
    ],
    demo: ['And the third reason is…', 'Sorry, let me start again.', 'I was saying that good sleep improves focus…', 'and that’s exactly the third reason: a better mood!'],
    demoNote: 'A pause, a rephrase, and the thread comes back.',
    prompt: 'Talk about a topic of your choice. At some point, pretend to lose your thread: pause, breathe, rephrase, then continue.',
  },
  {
    intro: 'Week review: your big three-minute speech. Hook, plan, story, eye contact, gestures, conclusion: show everything you can do.',
    points: ['A hook and an announced plan.', 'A story or example in each part.', 'A strong conclusion, then silence.'],
    quiz: [
      { q: 'In a three-minute speech, how many parts?', options: ['Two or three', 'Ten', 'None'], answer: 0, why: 'Two or three parts stay easy to follow.' },
      { q: 'What does the audience remember best?', options: ['Stories', 'Lists of numbers', 'Apologies'], answer: 0, why: 'Stories create images and emotions.' },
    ],
    demo: ['A month ago, I didn’t dare raise my hand in meetings.', 'Today, I’ll tell you first what held me back, then what changed everything, and finally what I recommend.', 'To conclude: your voice deserves to be heard.'],
    demoNote: 'All the techniques together in one speech.',
    prompt: 'Give your big three-minute speech on a topic you care about: hook, plan, examples or stories, conclusion.',
  },
  {
    intro: 'You’ve come a long way. Recognising your progress builds your confidence for what comes next.',
    points: ['Compare yourself to yourself, not to others.', 'Name three things you do better than at the start.', 'Thank yourself for your effort.'],
    quiz: [
      { q: 'Who should you compare yourself to?', options: ['Yourself at the start', 'The world’s best speakers', 'Nobody, it’s useless'], answer: 0, why: 'Your own progress is the only fair measure.' },
      { q: 'Celebrating progress helps you…', options: ['Stay motivated', 'Waste time', 'Show off'], answer: 0, why: 'Recognising your effort makes you want to continue.' },
    ],
    demo: ['At the start, I spoke too fast and said “um” every other sentence.', 'Today, I take my time, I pause…', 'and above all, I dare.'],
    demoNote: 'A kind, concrete look at how far you’ve come.',
    prompt: 'Speak for a minute about your progress: what was hard at the start and three things you do better today.',
  },
  {
    intro: 'The path ends, but your adventure begins. Set yourself a concrete next challenge to keep improving.',
    points: ['Choose a real speaking opportunity: a meeting, a talk, a party.', 'Set a date.', 'Keep practising a few minutes a week.'],
    quiz: [
      { q: 'What’s the best next challenge?', options: ['A real opportunity, with a date', 'Wait until you’re no longer nervous', 'Stop practising'], answer: 0, why: 'A dated challenge turns intention into action.' },
      { q: 'To keep your progress…', options: ['Practise regularly, even a little', 'Stop thinking about it', 'Wait for the next panic'], answer: 0, why: 'Consistency maintains confidence.' },
    ],
    demo: ['My next challenge is clear:', 'in two weeks, I’ll present my project to my whole team.', 'I’ll practise three times a week.', 'And I know I can do it.'],
    demoNote: 'A concrete goal, a date, a plan.',
    prompt: 'Announce your next speaking challenge: what, when, and how you’ll prepare. Start with “My goal…”.',
  },
];
