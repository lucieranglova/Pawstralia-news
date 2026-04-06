/**
 * 🐨 Pawstralia News
 * Fetches real yesterday's Australian animal news using OpenAI with web search
 * and sends a fun daily digest to Discord.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

// Funny headline prefixes
const INTROS = [
  "G'day mate! Here's what the animals of Australia got up to yesterday 🦘",
  "Crikey! The wildlife has been busy! Here's yesterday's Pawstralia News 🐨",
  "No dramas! Just your daily dose of Australian animal chaos 🐊",
  "The bush telegraph is buzzing! Yesterday in Australian wildlife... 🦜",
  "Strewth! You won't believe what the animals were up to yesterday 🐍",
];

const EMOJI_MAP = {
  koala: "🐨",
  kangaroo: "🦘",
  wallaby: "🦘",
  crocodile: "🐊",
  snake: "🐍",
  python: "🐍",
  shark: "🦈",
  whale: "🐋",
  dolphin: "🐬",
  turtle: "🐢",
  bird: "🐦",
  parrot: "🦜",
  cockatoo: "🦜",
  bat: "🦇",
  spider: "🕷️",
  dingo: "🐕",
  platypus: "🦦",
  echidna: "🦔"
};

const EMOJI_POOL = ["🦘","🐨","🐍","🐊","🦜","🦈","🐢","🦇","🐋","🐬","🕷️"];

const STYLES = [
  "funny",
  "dramatic",
  "cute",
  "chaotic",
];

function randomIntro() {
  return INTROS[Math.floor(Math.random() * INTROS.length)];
}

function yesterdayDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-AU", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

async function fetchNews() {
  const yesterday = yesterdayDate();
  const formattedDate = formatDate(yesterday);

  const prompt = `Search the web for Australian animal news from ${formattedDate} (yesterday).

Find 3-5 interesting stories about Australian wildlife.

STRICT RULES:
- Each headline must use a DIFFERENT emoji
- Emoji must MATCH the animal in the story
- Use only 1–2 emojis per headline
- Do NOT repeat emojis across stories
- Vary tone: some funny, some dramatic, some chaotic, some cute

For each story write:
- A short engaging headline
- 1-2 sentence summary

Return JSON only:
[
  {
    "headline": "...",
    "summary": "..."
  }
]`;

  const payload = JSON.stringify({
    model: "gpt-4o-mini-search-preview",
    messages: [{ role: "user", content: prompt }],
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: payload,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();
  let text = data.choices[0].message.content.trim();
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  return JSON.parse(text);
}

// 🧠 detect correct emoji from headline
function getRelevantEmoji(headline) {
  const lower = headline.toLowerCase();

  for (const key of Object.keys(EMOJI_MAP)) {
    if (lower.includes(key)) {
      return EMOJI_MAP[key];
    }
  }

  return null;
}

// 🔧 enforce correct + unique emoji
function fixEmojis(stories) {
  const used = new Set();

  return stories.map((story, i) => {
    let emoji = getRelevantEmoji(story.headline);

    if (!emoji || used.has(emoji)) {
      emoji = EMOJI_POOL.find(e => !used.has(e));
    }

    used.add(emoji);

    // remove existing emoji
    let clean = story.headline.replace(/[\p{Emoji}]/gu, "").trim();

    // apply style variation
    const style = STYLES[i % STYLES.length];

    if (style === "dramatic") {
      clean = clean.toUpperCase();
    } else if (style === "cute") {
      clean = clean + " 🥺";
    } else if (style === "chaotic") {
      clean = "BREAKING: " + clean;
    }

    return {
      ...story,
      headline: `${emoji} ${clean}`
    };
  });
}

async function sendDiscord(stories, date) {
  const formattedDate = formatDate(date);
  const intro = randomIntro();

  const description = [
    `*${intro}*`,
    ``,
    ...stories.map(s => `**${s.headline}**\n${s.summary}`),
    ``,
    `*🌏 Keeping you updated from Down Under, one paw at a time.*`,
  ].join("\n\n");

  const payload = JSON.stringify({
    embeds: [{
      title: `🦘 Pawstralia News — ${formattedDate}`,
      description,
      color: 0x2E8B57,
      footer: { text: "Pawstralia News • Australian Wildlife Daily Digest" },
    }],
  });

  const res = await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "DiscordBot",
    },
    body: payload,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  console.log("Discord message sent!");
}

async function main() {
  console.log(`[${new Date().toISOString()}] Fetching Pawstralia News...`);

  if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
  if (!DISCORD_WEBHOOK) throw new Error("Missing DISCORD_WEBHOOK_URL");

  const yesterday = yesterdayDate();

  const rawStories = await fetchNews();
  const stories = fixEmojis(rawStories);

  console.log(`Processed ${stories.length} stories.`);
  stories.forEach(s => console.log(` - ${s.headline}`));

  await sendDiscord(stories, yesterday);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
