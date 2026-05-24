/* ============================================
   CONSISTIUM — Atomic Habit Tracker
   Application Logic
   ============================================ */

(function () {
  'use strict';

  // ── Constants ──
  const STORAGE_KEY = 'consistium_data';
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const QUOTES = [
  {
    "text": "Your heart is the size of an ocean. Go find yourself in its hidden depths.",
    "author": "Rumi"
  },
  {
    "text": "The Bay of Bengal is hit frequently by cyclones. The months of November and May, in particular, are dangerous in this regard.",
    "author": "Abdul Kalam"
  },
  {
    "text": "Thinking is the capital, Enterprise is the way, Hard Work is the solution.",
    "author": "Abdul Kalam"
  },
  {
    "text": "If You Can'T Make It Good, At Least Make It Look Good.",
    "author": "Bill Gates"
  },
  {
    "text": "Heart be brave. If you cannot be brave, just go. Love's glory is not a small thing.",
    "author": "Rumi"
  },
  {
    "text": "It is bad for a young man to sin; but it is worse for an old man to sin.",
    "author": "Abu Bakr (R.A)"
  },
  {
    "text": "If You Are Out To Describe The Truth, Leave Elegance To The Tailor.",
    "author": "Albert Einstein"
  },
  {
    "text": "O man you are busy working for the world, and the world is busy trying to turn you out.",
    "author": "Abu Bakr (R.A)"
  },
  {
    "text": "While children are struggling to be unique, the world around them is trying all means to make them look like everybody else.",
    "author": "Abdul Kalam"
  },
  {
    "text": "These Capitalists Generally Act Harmoniously And In Concert, To Fleece The People.",
    "author": "Abraham Lincoln"
  },
  {
    "text": "I Don'T Believe In Failure. It Is Not Failure If You Enjoyed The Process.",
    "author": "Oprah Winfrey"
  },
  {
    "text": "Do not get elated at any victory, for all such victory is subject to the will of God.",
    "author": "Abu Bakr (R.A)"
  },
  {
    "text": "Wear gratitude like a cloak and it will feed every corner of your life.",
    "author": "Rumi"
  },
  {
    "text": "If you even dream of beating me you'd better wake up and apologize.",
    "author": "Muhammad Ali"
  },
  {
    "text": "I Will Praise Any Man That Will Praise Me.",
    "author": "William Shakespeare"
  },
  {
    "text": "One Of The Greatest Diseases Is To Be Nobody To Anybody.",
    "author": "Mother Teresa"
  },
  {
    "text": "I'm so fast that last night I turned off the light switch in my hotel room and was in bed before the room was dark.",
    "author": "Muhammad Ali"
  },
  {
    "text": "People Must Learn To Hate And If They Can Learn To Hate, They Can Be Taught To Love.",
    "author": "Nelson Mandela"
  },
  {
    "text": "Everyone has been made for some particular work, and the desire for that work has been put in every heart.",
    "author": "Rumi"
  },
  {
    "text": "The less of the World, the freer you live.",
    "author": "Umar ibn Al-Khattāb (R.A)"
  },
  {
    "text": "Respond to every call that excites your spirit.",
    "author": "Rumi"
  },
  {
    "text": "The Way To Get Started Is To Quit Talking And Begin Doing.",
    "author": "Walt Disney"
  },
  {
    "text": "God Doesn'T Require Us To Succeed, He Only Requires That You Try.",
    "author": "Mother Teresa"
  },
  {
    "text": "Speak any language, Turkish, Greek, Persian, Arabic, but always speak with love.",
    "author": "Rumi"
  },
  {
    "text": "Happiness comes towards those which believe in him.",
    "author": "Ali ibn Abi Talib (R.A)"
  },
  {
    "text": "Knowledge is of two kinds: that which is absorbed and that which is heard. And that which is heard does not profit if it is not absorbed.",
    "author": "Ali ibn Abi Talib (R.A)"
  },
  {
    "text": "When I am silent, I have thunder hidden inside.",
    "author": "Rumi"
  },
  {
    "text": "Technological Progress Is Like An Axe In The Hands Of A Pathological Criminal.",
    "author": "Albert Einstein"
  },
  {
    "text": "No One Would Choose A Friendless Existence On Condition Of Having All The Other Things In The World.",
    "author": "Aristotle"
  },
  {
    "text": "Life is a gamble. You can get hurt, but people die in plane crashes, lose their arms and legs in car accidents; people die every day. Same with fighters: some die, some get hurt, some go on. You just don't let yourself believe it will happen to you.",
    "author": "Muhammad Ali"
  },
  {
    "text": "The End Of Life Is To Be Like God, And The Soul Following God Will Be Like Him.",
    "author": "Socrates"
  },
  {
    "text": "Let us sacrifice our today so that our children can have a better tomorrow.",
    "author": "Abdul Kalam"
  },
  {
    "text": "Your task is not to seek for love, but merely to seek and find all the barriers within yourself that you have built against it.",
    "author": "Rumi"
  },
  {
    "text": "In every religion there is love, yet love has no religion.",
    "author": "Rumi"
  },
  {
    "text": "Everything in the universe is within you. Ask all from yourself.",
    "author": "Rumi"
  },
  {
    "text": "I'm not a handsome guy, but I can give my hand to someone who needs help. Beauty is in the heart, not in the face.",
    "author": "Abdul Kalam"
  },
  {
    "text": "What Do I Wear In Bed? Why, Chanel No. 5, Of Course.",
    "author": "Marilyn Monroe"
  },
  {
    "text": "A Good Head And A Good Heart Are Always A Formidable Combination.",
    "author": "Nelson Mandela"
  },
  {
    "text": "The Soul Never Thinks Without A Picture.",
    "author": "Aristotle"
  },
  {
    "text": "In your light I learn how to love. In your beauty, how to make poems. You dance inside my chest where no-one sees you, but sometimes I do, and that sight becomes this art.",
    "author": "Rumi"
  },
  {
    "text": "Let the beauty we love be what we do. There are hundreds of ways to kneel and kiss the ground.",
    "author": "Rumi"
  },
  {
    "text": "If You Like Your Brother And He'S Prospering, You'Ll Be Pleased For Him.",
    "author": "Hamad Bin Isa Al Khalifa"
  },
  {
    "text": "Success Is Dependent Upon The Glands - Sweat Glands.",
    "author": "Zig Ziglar"
  },
  {
    "text": "Champions are not generated from the championship. Champion is generated from something they have in them, desires, dreams, and visions.",
    "author": "Muhammad Ali"
  },
  {
    "text": "No matter what is the environment around you, it is always possible to maintain your brand of integrity.",
    "author": "Abdul Kalam"
  },
  {
    "text": "Applause Waits On Success.",
    "author": "Benjamin Franklin"
  },
  {
    "text": "Just As Courage Imperils Life, Fear Protects It.",
    "author": "Leonardo Da Vinci"
  },
  {
    "text": "It'S Better To Be A Lion For A Day Than A Sheep All Your Life.",
    "author": "Elizabeth Kenny"
  },
  {
    "text": "The Devil'S Voice Is Sweet To Hear.",
    "author": "Stephen King"
  },
  {
    "text": "Sometimes the people with the worst past, create the best future.",
    "author": "Umar ibn Al-Khattāb (R.A)"
  },
  {
    "text": "Every day, nay every moment, try to do some good deed.",
    "author": "Abu Bakr (R.A)"
  },
  {
    "text": "No Matter What People Tell You, Words And Ideas Can Change The World.",
    "author": "Robin Williams"
  },
  {
    "text": "Champions have to have the skill and the will. But the will must be stronger than the skill.",
    "author": "Muhammad Ali"
  },
  {
    "text": "Men Occasionally Stumble Over The Truth, But Most Of Them Pick Themselves Up And Hurry Off As If Nothing Had Happened.",
    "author": "Winston Churchill"
  },
  {
    "text": "Goodbyes are only for those who love with their eyes. Because for those who love with heart and soul there is no such thing as separation.",
    "author": "Rumi"
  },
  {
    "text": "The best revenge is to improve yourself.",
    "author": "Ali ibn Abi Talib (R.A)"
  },
  {
    "text": "God gave me this illness to remind me that I'm not Number One; He is.",
    "author": "Muhammad Ali"
  },
  {
    "text": "Success Is A Personal Standard, Reaching For The Highest That Is In Us, Becoming All That We Can Be.",
    "author": "Zig Ziglar"
  },
  {
    "text": "When You Have Really Exhausted An Experience You Always Reverence And Love It.",
    "author": "Albert Camus"
  },
  {
    "text": "Now you see me, now you don't. George thinks he will, but I know he won't!",
    "author": "Muhammad Ali"
  },
  {
    "text": "Elegance Does Not Consist In Putting On A New Dress.",
    "author": "Coco Chanel"
  },
  {
    "text": "It Is Always Consoling To Think Of Suicide: In That Way One Gets Through Many A Bad Night.",
    "author": "Friedrich Nietzsche"
  },
  {
    "text": "Eating Words Has Never Given Me Indigestion.",
    "author": "Winston Churchill"
  },
  {
    "text": "India has to be transformed into a developed nation, a prosperous nation and a healthy nation, with a value system.",
    "author": "Abdul Kalam"
  },
  {
    "text": "It's not bragging if you can back it up.",
    "author": "Muhammad Ali"
  },
  {
    "text": "I Wish People Would Love Everybody Else The Way They Love Me. It Would Be A Better World.",
    "author": "Muhammad Ali"
  },
  {
    "text": "Why do I want my wife to show off her panties when the wind blows? Horses show their behinds, and cows and mules, not humans.",
    "author": "Muhammad Ali"
  },
  {
    "text": "Words Are Only Painted Fire; A Look Is The Fire Itself.",
    "author": "Mark Twain"
  },
  {
    "text": "Words, Without Power, Is Mere Philosophy.",
    "author": "Muhammad Iqbal"
  },
  {
    "text": "The cure for pain is in the pain.",
    "author": "Rumi"
  },
  {
    "text": "Whatever happens, just keep smiling and lose yourself in Love.",
    "author": "Rumi"
  },
  {
    "text": "Do The Right Thing. It Will Gratify Some People And Astonish The Rest.",
    "author": "Mark Twain"
  },
  {
    "text": "Only the soul knows what love is.",
    "author": "Rumi"
  },
  {
    "text": "Earning of livelihood by following some profession is better than living on charity.",
    "author": "Umar ibn Al-Khattāb (R.A)"
  },
  {
    "text": "Burdens are the foundations of ease and bitter things the forerunners of pleasure.",
    "author": "Rumi"
  },
  {
    "text": "Too Many Have Dispensed With Generosity In Order To Practice Charity.",
    "author": "Albert Camus"
  },
  {
    "text": "Even the greatest was once a beginner. Don't be afraid to take that first step.",
    "author": "Muhammad Ali"
  },
  {
    "text": "No Great Intellectual Thing Was Ever Done By Great Effort.",
    "author": "Theodore Roosevelt"
  },
  {
    "text": "To fight against one's desires is the greatest of all fights.",
    "author": "Ali ibn Abi Talib (R.A)"
  },
  {
    "text": "Innovation Distinguishes Between A Leader And A Follower.",
    "author": "Steve Jobs"
  },
  {
    "text": "We Enjoy The Process Far More Than The Proceeds.",
    "author": "Warren Buffett"
  },
  {
    "text": "When I Started Counting My Blessings, My Whole Life Turned Around.",
    "author": "Willie Nelson"
  },
  {
    "text": "This being human is a guest house. Every morning a new arrival. Welcome and entertain them all!",
    "author": "Rumi"
  },
  {
    "text": "All My Life I'Ve Looked At Words As Though I Were Seeing Them For The First Time.",
    "author": "Ernest Hemingway"
  },
  {
    "text": "Waiting Is Painful. Forgetting Is Painful. But Not Knowing Which To Do Is The Worse Kind Of Suffering.",
    "author": "Paulo Coelho"
  },
  {
    "text": "Never Allow Someone To Be Your Priority While Allowing Yourself To Be Their Option.",
    "author": "Mark Twain"
  },
  {
    "text": "To Jaw-Jaw Is Always Better Than To War-War.",
    "author": "Winston Churchill"
  },
  {
    "text": "That'S The Real Trouble With The World, Too Many People Grow Up",
    "author": "Walt Disney"
  },
  {
    "text": "It Is Easier To Stay Out Than Get Out.",
    "author": "Mark Twain"
  },
  {
    "text": "The worst man is the one who sees himself as the best.",
    "author": "Muhammad Ali"
  },
  {
    "text": "The World Breaks Everyone, And Afterward, Some Are Strong At The Broken Places.",
    "author": "Ernest Hemingway"
  },
  {
    "text": "Rule No.1: Never Lose Money. Rule No.2: Never Forget Rule No.1.",
    "author": "Warren Buffett"
  },
  {
    "text": "Convergence of our views on global trade issues under the WTO and our common resolve to combat terrorism provide a valuable base for mutual understanding.",
    "author": "Abdul Kalam"
  },
  {
    "text": "Whenever You Find Yourself On The Side Of The Majority, It Is Time To Pause And Reflect.",
    "author": "Mark Twain"
  },
  {
    "text": "Whatever Is Done For Love Always Occurs Beyond Good And Evil.",
    "author": "Friedrich Nietzsche"
  },
  {
    "text": "Things Should Be Made As Simple As Possible, But Not Any Simpler.",
    "author": "Albert Einstein"
  },
  {
    "text": "Stop acting so small. You are the universe in ecstatic motion.",
    "author": "Rumi"
  },
  {
    "text": "All Truth Is Simple... Is That Not Doubly A Lie?",
    "author": "Friedrich Nietzsche"
  },
  {
    "text": "Money Is Only A Tool. It Will Take You Wherever You Wish, But It Will Not Replace You As The Driver.",
    "author": "Ayn Rand"
  },
  {
    "text": "The fight is won or lost far away from witnesses - behind the lines, in the gym, and out there on the road, long before I dance under those lights.",
    "author": "Muhammad Ali"
  },
  {
    "text": "He who avoids complaint invites happiness.",
    "author": "Abu Bakr (R.A)"
  },
  {
    "text": "We are the mirror - As well as the face in it.",
    "author": "Rumi"
  },
  {
    "text": "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.",
    "author": "Rumi"
  },
  {
    "text": "For 2,500 years, India has never invaded anybody.",
    "author": "Abdul Kalam"
  },
  {
    "text": "If Past History Was All There Was To The Game, The Richest People Would Be Librarians.",
    "author": "Warren Buffett"
  },
  {
    "text": "Your souls are precious and can only be equal to the price of Paradise, therefore sell them only at that price.",
    "author": "Ali ibn Abi Talib (R.A)"
  },
  {
    "text": "A Wise Man Can Learn More From A Foolish Question Than A Fool Can Learn From A Wise Answer.",
    "author": "Bruce Lee"
  },
  {
    "text": "If Allah wants for a people ill, he gives them debates and takes away from them actions.",
    "author": "Umar ibn Al-Khattāb (R.A)"
  },
  {
    "text": "He who builds a masjid in the way of Allah, God will build a house for him in the paradise.",
    "author": "Abu Bakr (R.A)"
  },
  {
    "text": "Love Is Blind; Friendship Closes Its Eyes.",
    "author": "Friedrich Nietzsche"
  },
  {
    "text": "Don'T Go Around Saying The World Owes You A Living. The World Owes You Nothing. It Was Here First.",
    "author": "Mark Twain"
  },
  {
    "text": "An alert and learned man will take advice from any event.",
    "author": "Ali ibn Abi Talib (R.A)"
  },
  {
    "text": "I don't count my sit-ups. I only start counting when it starts hurting. When I feel pain, that's when I start counting, because that's when it really counts.",
    "author": "Muhammad Ali"
  },
  {
    "text": "The wound is the place where the Light enters you.",
    "author": "Rumi"
  },
  {
    "text": "Luxury is an obstacle, and so is the fatness of the body.",
    "author": "Umar ibn Al-Khattāb (R.A)"
  },
  {
    "text": "Come, come, whoever you are. Wanderer, worshiper, lover of leaving. It doesn't matter. Ours is not a caravan of despair. come, even if you have broken your vows a thousand times. Come, yet again, come, come.",
    "author": "Rumi"
  },
  {
    "text": "The Golden Age Is Before Us, Not Behind Us.",
    "author": "William Shakespeare"
  },
  {
    "text": "Fiction Is The Truth Inside The Lie.",
    "author": "Stephen King"
  },
  {
    "text": "Believe You Can And You'Re Halfway There.",
    "author": "Theodore Roosevelt"
  },
  {
    "text": "All The Great Things Are Simple, And Many Can Be Expressed In A Single Word: Freedom, Justice, Honor, Duty, Mercy, Hope.",
    "author": "Winston Churchill"
  },
  {
    "text": "Allah's the Arabic term for God. Stand up for God, fight for God, work for God and do the right thing, and go the right way, things will end up in your corner.",
    "author": "Muhammad Ali"
  },
  {
    "text": "Anger Is Never Without A Reason, But Seldom With A Good One.",
    "author": "Benjamin Franklin"
  },
  {
    "text": "Good Actions Are A Guard Against The Blows Of Adversity.",
    "author": "Abu Bakr"
  },
  {
    "text": "Use the same measure for selling that you use for purchasing.",
    "author": "Abu Bakr (R.A)"
  },
  {
    "text": "The Secret Of Getting Ahead Is Getting Started",
    "author": "Mark Twain"
  },
  {
    "text": "I Don'T Know The Key To Success, But The Key To Failure Is Trying To Please Everybody.",
    "author": "Bill Cosby"
  },
  {
    "text": "Real Loss Is Only Possible When You Love Something More Than You Love Yourself.",
    "author": "Robin Williams"
  },
  {
    "text": "This Is The First Convention Of The Space Age - Where A Candidate Can Promise The Moon And Mean It.",
    "author": "David Brinkley"
  },
  {
    "text": "I Don'T Like That Man. I Must Get To Know Him Better.",
    "author": "Abraham Lincoln"
  },
  {
    "text": "To Shipbrokers, Coal Was Black Gold.",
    "author": "Roald Dahl"
  },
  {
    "text": "History, Despite Its Wrenching Pain, Cannot Be Unlived, But If Faced With Courage, Need Not Be Lived Again.",
    "author": "Maya Angelou"
  },
  {
    "text": "Everyone who is taken by death asks for more time, while everyone who still has time makes excuses for procrastination.",
    "author": "Ali ibn Abi Talib (R.A)"
  },
  {
    "text": "I wonder at a man who loses hope of salvation when the door of repentance is open for him.",
    "author": "Ali ibn Abi Talib (R.A)"
  },
  {
    "text": "Don't count the days, make the days count.",
    "author": "Muhammad Ali"
  },
  {
    "text": "Close your eyes, fall in Love, stay there.",
    "author": "Rumi"
  },
  {
    "text": "I Guess I Don'T So Much Mind Being Old, As I Mind Being Fat And Old.",
    "author": "Benjamin Franklin"
  },
  {
    "text": "It will be a killer, and a chiller, and a thriller, when I get the gorilla in Manila.",
    "author": "Muhammad Ali"
  },
  {
    "text": "I Dream Of An Africa Which Is In Peace With Itself.",
    "author": "Nelson Mandela"
  },
  {
    "text": "The Difference Between A Mountain And A Molehill Is Your Perspective.",
    "author": "Al Neuharth"
  },
  {
    "text": "I Am Certainly Not One Of Those Who Need To Be Prodded. In Fact, If Anything, I Am The Prod.",
    "author": "Winston Churchill"
  },
  {
    "text": "To the people that have said I'm too small, I'm not fast enough, I don't have what it takes, I'm not strong enough. THANK YOU.",
    "author": "Muhammad Ali"
  },
  {
    "text": "There is a King Who is aware of every Mask you put on.",
    "author": "Rumi"
  },
  {
    "text": "Be patient; patience is a pillar of faith.",
    "author": "Umar ibn Al-Khattāb (R.A)"
  },
  {
    "text": "The Very Ink With Which History Is Written Is Merely Fluid Prejudice.",
    "author": "Mark Twain"
  },
  {
    "text": "I was the first one in the gym, and the last one to leave.",
    "author": "Muhammad Ali"
  },
  {
    "text": "Art Is The Proper Task Of Life.",
    "author": "Friedrich Nietzsche"
  },
  {
    "text": "The Roots Of Education Are Bitter, But The Fruit Is Sweet.",
    "author": "Aristotle"
  },
  {
    "text": "Run away from greatness and greatness will follow you.",
    "author": "Abu Bakr (R.A)"
  },
  {
    "text": "You may learn to imitate a birdcall, but do you experience what the nightingale feels for the rose?",
    "author": "Rumi"
  },
  {
    "text": "Bad Men Are Full Of Repentance.",
    "author": "Aristotle"
  }
];

  const DEFAULT_HABITS = [
    { id: genId(), emoji: '📚', name: 'Read 10 pages', isNew: false, type: 'good' },
    { id: genId(), emoji: '💪', name: 'Gym workout', isNew: false, type: 'good' },
    { id: genId(), emoji: '🗣️', name: 'Table topic speech', isNew: false, type: 'good' },
    { id: genId(), emoji: '💻', name: 'DevOps tutorials × 2', isNew: false, type: 'good' },
    { id: genId(), emoji: '📝', name: '12 job applications', isNew: false, type: 'good' },
    { id: genId(), emoji: '💼', name: 'Message 5 LinkedIn recruiters & comment on 2 posts', isNew: true, type: 'good' },
  ];

  // ── State ──
  let state = loadState();
  let currentDate = new Date();
  resetToMidnight(currentDate);
  let currentQuoteIdx = -1;

  // ── DOM Elements ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    dateWeekday: $('#dateWeekday'),
    dateFull: $('#dateFull'),
    prevDay: $('#prevDay'),
    nextDay: $('#nextDay'),
    scorePercent: $('#scorePercent'),
    scoreRingFill: $('#scoreRingFill'),
    habitsTracked: $('#habitsTracked'),
    habitsCompleted: $('#habitsCompleted'),
    statusText: $('#statusText'),
    motivationBanner: $('#motivationBanner'),
    confettiContainer: $('#confettiContainer'),
    goodHabitList: $('#goodHabitList'),
    badHabitList: $('#badHabitList'),
    goodHabitCount: $('#goodHabitCount'),
    badHabitCount: $('#badHabitCount'),
    specialTaskCount: $('#specialTaskCount'),
    goodHabitsHeader: $('#goodHabitsHeader'),
    badHabitsHeader: $('#badHabitsHeader'),
    specialTasksHeader: $('#specialTasksHeader'),
    specialTaskList: $('#specialTaskList'),
    habitHint: $('#habitHint'),
    weeklyHeatmap: $('#weeklyHeatmap'),
    quoteText: $('#quoteText'),
    prevQuote: $('#prevQuote'),
    nextQuote: $('#nextQuote'),
    streakCount: $('#streakCount'),
    addHabitBtn: $('#addHabitBtn'),
    habitModal: $('#habitModal'),
    modalTitle: $('#modalTitle'),
    modalCloseBtn: $('#modalCloseBtn'),
    habitForm: $('#habitForm'),
    habitEmoji: $('#habitEmoji'),
    habitName: $('#habitName'),
    habitIsNew: $('#habitIsNew'),
    habitType: $('#habitType'),
    habitTypeToggle: $('#habitTypeToggle'),
    habitEditId: $('#habitEditId'),
    saveHabitBtn: $('#saveHabitBtn'),
    deleteHabitBtn: $('#deleteHabitBtn'),
    emojiPicker: $('#emojiPicker'),
    settingsBtn: $('#settingsBtn'),
    settingsModal: $('#settingsModal'),
    settingsCloseBtn: $('#settingsCloseBtn'),
    exportBtn: $('#exportBtn'),
    importBtn: $('#importBtn'),
    importFile: $('#importFile'),
    resetBtn: $('#resetBtn'),
    scoreRing: $('#scoreRing'),
  };

  // ── Helpers ──
  function genId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  }

  function resetToMidnight(d) {
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function dateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function isToday(d) {
    const t = new Date();
    resetToMidnight(t);
    return dateKey(d) === dateKey(t);
  }

  function isFuture(d) {
    const t = new Date();
    resetToMidnight(t);
    return d > t;
  }

  // ── Persistence ──
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Validate structure
        if (parsed.habits && parsed.completions) {
          parsed.tasks = parsed.tasks || {};
          return parsed;
        }
      }
    } catch (e) { /* ignore */ }
    return {
      habits: DEFAULT_HABITS,
      completions: {}, // { "2026-05-12": { habitId: true } }
      tasks: {} // { "2026-05-12": [{ id, name, emoji, isCompleted }] }
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // ── SVG Gradient (inject into score ring) ──
  function injectGradient() {
    const svg = dom.scoreRing;
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', 'scoreGradient');
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', '#a78bfa');
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', '#22c55e');

    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.insertBefore(defs, svg.firstChild);
  }

  // ── Render Functions ──
  function renderDate() {
    dom.dateWeekday.textContent = FULL_DAYS[currentDate.getDay()];
    dom.dateFull.textContent = `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  }

  function getHabitScore(habit, completions) {
    // Good habits: done when checked. Bad habits: done when NOT checked (resisted).
    if (habit.type === 'bad') return !completions[habit.id];
    return !!completions[habit.id];
  }

  function renderScore() {
    const key = dateKey(currentDate);
    const completions = state.completions[key] || {};
    const todayTasks = state.tasks[key] || [];
    
    const total = state.habits.length + todayTasks.length;
    let done = state.habits.filter(h => getHabitScore(h, completions)).length;
    done += todayTasks.filter(t => t.isCompleted).length;
    
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    animateValue(dom.scorePercent, pct, '%');

    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (pct / 100) * circumference;
    dom.scoreRingFill.style.strokeDashoffset = offset;

    dom.habitsTracked.textContent = total;
    dom.habitsCompleted.textContent = `${done}/${total}`;

    if (done === 0) {
      dom.statusText.textContent = 'Pending';
      dom.statusText.style.color = 'var(--text-muted)';
    } else if (done < total) {
      dom.statusText.textContent = 'In progress';
      dom.statusText.style.color = 'var(--warning)';
    } else {
      dom.statusText.textContent = 'On a streak 🔥';
      dom.statusText.style.color = 'var(--success)';
    }

    if (done === total && total > 0) {
      dom.motivationBanner.style.display = 'flex';
      spawnConfetti();
    } else {
      dom.motivationBanner.style.display = 'none';
    }

    if (done === total && total > 0) {
      dom.habitHint.textContent = 'All habits on track! Perfect day 🏆';
    } else if (isFuture(currentDate)) {
      dom.habitHint.textContent = 'Future date — habits will unlock on that day';
    } else {
      dom.habitHint.textContent = 'Tap a habit to update its status';
    }
  }

  function animateValue(el, target, suffix) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) { el.textContent = target + suffix; return; }
    const diff = target - current;
    const steps = Math.min(Math.abs(diff), 20);
    const stepTime = 400 / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const val = Math.round(current + (diff * (step / steps)));
      el.textContent = val + suffix;
      if (step >= steps) clearInterval(timer);
    }, stepTime);
  }

  function buildHabitCard(habit, completions, index) {
    const isChecked = !!completions[habit.id];
    const isBad = habit.type === 'bad';
    let statusLabel, cardClass;

    if (isBad) {
      statusLabel = isChecked ? 'Slipped ✗' : 'Resisted ✓';
      cardClass = `habit-card bad-habit${isChecked ? ' slipped' : ' resisted'}`;
    } else {
      statusLabel = isChecked ? 'Done' : 'Pending';
      cardClass = `habit-card${isChecked ? ' done' : ''}`;
    }

    const card = document.createElement('div');
    card.className = cardClass;
    card.style.animationDelay = `${index * 0.05}s`;
    card.dataset.id = habit.id;

    const checkIcon = isBad && isChecked
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

    card.innerHTML = `
      <div class="habit-emoji">${habit.emoji}</div>
      <div class="habit-info">
        <div class="habit-name">
          ${habit.name}
          ${habit.isNew ? '<span class="new-badge">New</span>' : ''}
          ${isBad ? '<span class="bad-badge">Break</span>' : ''}
        </div>
        <div class="habit-status-label">${statusLabel}</div>
      </div>
      <button class="habit-edit-btn" data-edit="${habit.id}" title="Edit" aria-label="Edit ${habit.name}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <div class="habit-check">${checkIcon}</div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.habit-edit-btn')) return;
      toggleHabit(habit.id);
    });

    card.querySelector('.habit-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(habit);
    });

    return card;
  }

  function buildTaskCard(task, key, index) {
    const isChecked = task.isCompleted;
    const statusLabel = isChecked ? 'Done' : 'Pending';
    const cardClass = `habit-card${isChecked ? ' done' : ''}`;

    const card = document.createElement('div');
    card.className = cardClass;
    card.style.animationDelay = `${index * 0.05}s`;
    card.dataset.id = task.id;

    const checkIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

    card.innerHTML = `
      <div class="habit-emoji">${task.emoji}</div>
      <div class="habit-info">
        <div class="habit-name">
          ${task.name}
          <span class="special-badge">Special</span>
        </div>
        <div class="habit-status-label">${statusLabel}</div>
      </div>
      <button class="habit-edit-btn" data-edit="${task.id}" title="Edit" aria-label="Edit ${task.name}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <div class="habit-check">${checkIcon}</div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.habit-edit-btn')) return;
      toggleTask(task.id, key);
    });

    card.querySelector('.habit-edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal({ ...task, type: 'task' });
    });

    return card;
  }

  function renderHabits() {
    const key = dateKey(currentDate);
    const completions = state.completions[key] || {};
    const tasks = state.tasks[key] || [];
    
    dom.goodHabitList.innerHTML = '';
    dom.badHabitList.innerHTML = '';
    dom.specialTaskList.innerHTML = '';

    const goodHabits = state.habits.filter(h => h.type !== 'bad');
    const badHabits = state.habits.filter(h => h.type === 'bad');

    goodHabits.forEach((h, i) => dom.goodHabitList.appendChild(buildHabitCard(h, completions, i)));
    badHabits.forEach((h, i) => dom.badHabitList.appendChild(buildHabitCard(h, completions, i)));
    tasks.forEach((t, i) => dom.specialTaskList.appendChild(buildTaskCard(t, key, i)));

    dom.goodHabitCount.textContent = goodHabits.length;
    dom.badHabitCount.textContent = badHabits.length;
    dom.specialTaskCount.textContent = tasks.length;
    
    dom.goodHabitsHeader.style.display = goodHabits.length ? 'flex' : 'none';
    dom.badHabitsHeader.style.display = badHabits.length ? 'flex' : 'none';
    dom.specialTasksHeader.style.display = tasks.length ? 'flex' : 'none';
  }

  function renderStreak() {
    let streak = 0;
    const today = new Date();
    resetToMidnight(today);

    // Count backwards from today (or yesterday if today isn't complete)
    const checkDate = new Date(today);
    const todayKey = dateKey(today);
    const todayCompletions = state.completions[todayKey] || {};
    const todayTasks = state.tasks[todayKey] || [];
    const todayDone = state.habits.every(h => getHabitScore(h, todayCompletions)) &&
                      (todayTasks.length === 0 || todayTasks.every(t => t.isCompleted));

    if (!todayDone) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const key = dateKey(checkDate);
      const completions = state.completions[key] || {};
      const tasks = state.tasks[key] || [];
      const hasHabits = state.habits.length > 0;
      const allDone = hasHabits && state.habits.every(h => getHabitScore(h, completions)) &&
                      (tasks.length === 0 || tasks.every(t => t.isCompleted));
      if (!allDone) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Include today if all done
    if (todayDone && state.habits.length > 0) streak++;

    dom.streakCount.textContent = streak;
  }

  function renderWeeklyHeatmap() {
    dom.weeklyHeatmap.innerHTML = '';
    const today = new Date();
    resetToMidnight(today);

    // Get start of week (Monday)
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const key = dateKey(d);
      const completions = state.completions[key] || {};
      const tasks = state.tasks[key] || [];
      
      const total = state.habits.length + tasks.length;
      let done = state.habits.filter(h => getHabitScore(h, completions)).length;
      done += tasks.filter(t => t.isCompleted).length;
      
      const pct = total > 0 ? done / total : 0;

      let level = 0;
      if (pct > 0 && pct <= 0.25) level = 1;
      else if (pct > 0.25 && pct <= 0.5) level = 2;
      else if (pct > 0.5 && pct < 1) level = 3;
      else if (pct === 1) level = 4;

      const isCurrentDay = dateKey(d) === dateKey(today);
      const dayEl = document.createElement('div');
      dayEl.className = `heatmap-day${isCurrentDay ? ' today' : ''}`;
      dayEl.innerHTML = `
        <span class="heatmap-label">${DAYS[d.getDay()]}</span>
        <div class="heatmap-dot level-${level}"></div>
        <span class="heatmap-score">${total > 0 ? Math.round(pct * 100) + '%' : '—'}</span>
      `;

      // Click to navigate to that day
      dayEl.style.cursor = 'pointer';
      dayEl.addEventListener('click', () => {
        currentDate = new Date(d);
        renderAll();
      });

      dom.weeklyHeatmap.appendChild(dayEl);
    }
  }

  function renderQuote(idx) {
    if (idx === undefined) {
      idx = Math.floor(Math.random() * QUOTES.length);
    }
    currentQuoteIdx = idx;
    dom.quoteText.textContent = QUOTES[currentQuoteIdx].text;
  }

  function renderAll() {
    renderDate();
    renderHabits();
    renderScore();
    renderStreak();
    renderWeeklyHeatmap();
  }

  // ── Actions ──
  function toggleHabit(habitId) {
    const key = dateKey(currentDate);
    if (!state.completions[key]) state.completions[key] = {};

    if (state.completions[key][habitId]) {
      delete state.completions[key][habitId];
    } else {
      state.completions[key][habitId] = true;
    }

    saveState();
    renderAll();
  }

  function spawnConfetti() {
    dom.confettiContainer.innerHTML = '';
    const colors = ['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
    for (let i = 0; i < 24; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.8 + 's';
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      dom.confettiContainer.appendChild(piece);
    }
  }

  function toggleTask(taskId, key) {
    if (!state.tasks[key]) return;
    const task = state.tasks[key].find(t => t.id === taskId);
    if (task) {
      task.isCompleted = !task.isCompleted;
      saveState();
      renderAll();
    }
  }

  // ── Modal Logic ──
  function setModalType(type) {
    dom.habitType.value = type;
    $$('.type-opt').forEach(b => b.classList.toggle('selected', b.dataset.type === type));
    // Toggle emoji visibility
    $$('.emoji-good').forEach(b => b.style.display = (type === 'good' || type === 'task') ? '' : 'none');
    $$('.emoji-bad').forEach(b => b.style.display = type === 'bad' ? '' : 'none');
    // Clear emoji selection and pick first visible default
    $$('.emoji-opt').forEach(b => b.classList.remove('selected'));
    const defaultEmoji = type === 'bad' ? '🚬' : '🎯';
    const def = document.querySelector(`.emoji-opt[data-emoji="${defaultEmoji}"]`);
    if (def) { def.classList.add('selected'); dom.habitEmoji.value = defaultEmoji; }
    // Update placeholder
    dom.habitName.placeholder = type === 'bad' ? 'e.g. Doom scrolling' : (type === 'task' ? 'e.g. Call dentist' : 'e.g. Read 10 pages');
  }

  function openAddModal() {
    dom.modalTitle.textContent = 'Add New Habit';
    dom.saveHabitBtn.textContent = 'Add Habit';
    dom.deleteHabitBtn.style.display = 'none';
    dom.habitName.value = '';
    dom.habitIsNew.checked = false;
    dom.habitEditId.value = '';
    setModalType('good');
    dom.habitModal.style.display = 'flex';
    dom.habitName.focus();
  }

  function openEditModal(habit) {
    dom.modalTitle.textContent = 'Edit Habit';
    dom.saveHabitBtn.textContent = 'Save Changes';
    dom.deleteHabitBtn.style.display = 'block';
    dom.habitName.value = habit.name;
    dom.habitIsNew.checked = habit.isNew;
    dom.habitEditId.value = habit.id;
    setModalType(habit.type || 'good');
    dom.habitEmoji.value = habit.emoji;
    $$('.emoji-opt').forEach(b => b.classList.toggle('selected', b.dataset.emoji === habit.emoji));
    dom.habitModal.style.display = 'flex';
    dom.habitName.focus();
  }

  function closeModal() {
    dom.habitModal.style.display = 'none';
  }

  function saveHabit(e) {
    e.preventDefault();
    const name = dom.habitName.value.trim();
    if (!name) return;

    const editId = dom.habitEditId.value;
    const emoji = dom.habitEmoji.value;
    const isNew = dom.habitIsNew.checked;
    const type = dom.habitType.value || 'good';

    if (type === 'task') {
      const key = dateKey(currentDate);
      if (!state.tasks[key]) state.tasks[key] = [];
      if (editId) {
        const task = state.tasks[key].find(t => t.id === editId);
        if (task) {
          task.name = name;
          task.emoji = emoji;
        }
      } else {
        state.tasks[key].push({ id: genId(), emoji, name, isCompleted: false });
      }
    } else {
      if (editId) {
        const habit = state.habits.find(h => h.id === editId);
        if (habit) {
          habit.name = name;
          habit.emoji = emoji;
          habit.isNew = isNew;
          habit.type = type;
        }
      } else {
        state.habits.push({ id: genId(), emoji, name, isNew, type });
      }
    }

    saveState();
    closeModal();
    renderAll();
  }

  function deleteHabit() {
    const editId = dom.habitEditId.value;
    const type = dom.habitType.value;
    if (!editId) return;
    if (!confirm('Delete this? This cannot be undone.')) return;

    if (type === 'task') {
      const key = dateKey(currentDate);
      if (state.tasks[key]) {
        state.tasks[key] = state.tasks[key].filter(t => t.id !== editId);
      }
    } else {
      state.habits = state.habits.filter(h => h.id !== editId);
      // Clean up completions
      Object.keys(state.completions).forEach(key => {
        delete state.completions[key][editId];
      });
    }

    saveState();
    closeModal();
    renderAll();
  }

  // ── Settings ──
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `consistium-backup-${dateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData() {
    dom.importFile.click();
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.habits && data.completions) {
          state = data;
          saveState();
          renderAll();
          alert('Data imported successfully!');
        } else {
          alert('Invalid backup file.');
        }
      } catch {
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
    dom.importFile.value = '';
  }

  function resetData() {
    if (!confirm('Reset all data? This will delete all habits and history.')) return;
    if (!confirm('Are you absolutely sure?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = { habits: DEFAULT_HABITS.map(h => ({ ...h, id: genId() })), completions: {}, tasks: {} };
    saveState();
    renderAll();
    dom.settingsModal.style.display = 'none';
  }

  // ── Event Listeners ──
  function init() {
    injectGradient();
    renderAll();
    renderQuote();
    setInterval(() => renderQuote(), 5 * 60 * 1000); // Change quote every 5 minutes

    // Quote navigation
    dom.prevQuote.addEventListener('click', () => {
      let nextIdx = currentQuoteIdx - 1;
      if (nextIdx < 0) nextIdx = QUOTES.length - 1;
      renderQuote(nextIdx);
    });

    dom.nextQuote.addEventListener('click', () => {
      let nextIdx = currentQuoteIdx + 1;
      if (nextIdx >= QUOTES.length) nextIdx = 0;
      renderQuote(nextIdx);
    });

    // Date navigation
    dom.prevDay.addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() - 1);
      renderAll();
    });

    dom.nextDay.addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() + 1);
      renderAll();
    });

    // Add habit
    dom.addHabitBtn.addEventListener('click', openAddModal);

    // Modal
    dom.modalCloseBtn.addEventListener('click', closeModal);
    dom.habitModal.addEventListener('click', (e) => {
      if (e.target === dom.habitModal) closeModal();
    });
    dom.habitForm.addEventListener('submit', saveHabit);
    dom.deleteHabitBtn.addEventListener('click', deleteHabit);

    // Habit type toggle
    $$('.type-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        setModalType(btn.dataset.type);
      });
    });

    // Emoji picker
    $$('.emoji-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.emoji-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        dom.habitEmoji.value = btn.dataset.emoji;
      });
    });

    // Settings
    dom.settingsBtn.addEventListener('click', () => {
      dom.settingsModal.style.display = 'flex';
    });
    dom.settingsCloseBtn.addEventListener('click', () => {
      dom.settingsModal.style.display = 'none';
    });
    dom.settingsModal.addEventListener('click', (e) => {
      if (e.target === dom.settingsModal) dom.settingsModal.style.display = 'none';
    });
    dom.exportBtn.addEventListener('click', exportData);
    dom.importBtn.addEventListener('click', importData);
    dom.importFile.addEventListener('change', handleImport);
    dom.resetBtn.addEventListener('click', resetData);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        dom.settingsModal.style.display = 'none';
      }
      if (e.key === 'ArrowLeft' && !dom.habitModal.style.display.includes('flex')) {
        currentDate.setDate(currentDate.getDate() - 1);
        renderAll();
      }
      if (e.key === 'ArrowRight' && !dom.habitModal.style.display.includes('flex')) {
        currentDate.setDate(currentDate.getDate() + 1);
        renderAll();
      }
    });
  }

  // ── Boot ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
