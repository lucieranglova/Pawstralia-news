/**
 * 🐨 Pawstralia News
 * Fetches real yesterday's Australian animal news using OpenAI with web search
 * and sends a fun daily digest to Discord.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

const INTROS = [
  "G'day mate! Here's what the animals of Australia got up to yesterday 🦘",
  "Crikey! The wildlife has been busy! Here's yesterday's Pawstralia News 🐨",
  "No dramas! Just your daily dose of Australian animal chaos 🐊",
  "The bush telegraph is buzzing! Yesterday in Australian wildlife... 🦜",
  "Strewth! You won't believe what the animals were up to yesterday 🐍",
];

// 🔥 přesnější mapa (rozšířená)
const EMOJI_MAP = {
  bilby: "🐭",
  bettong: "🐀",
  kangaroo: "🦘",
  wallaby: "🦘",
  koala: "🐨",
  crocodile: "🐊",
  snake: "🐍",
  shark: "🦈",
  whale: "🐋",
  dolphin: "🐬",
  turtle: "🐢",
  parrot: "🦜",
  cockatoo: "🦜",
  bat: "🦇",
  spider: "🕷️",
  dingo: "🐕",
  platypus: "🦆",
  echidna: "🦔",
  cat: "🐱",
  fox: "🦊",
};

const FALLBACK_EMOJIS = ["🦘","🐨","🐊","🦜","🦈","🐢","🦇","🐋"];

const STYLES = ["funny", "dramatic", "cute", "chaotic"];

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

  const prompt = `Search the web for Australian animal news from ${formattedDate}.

Return JSON only.

STRICT FORMAT:
[
  {
    "animal": "main animal in one word (e.g. bilby, kangaroo, koala, fox)",
    "headline": "short engaging headline WITHOUT emoji",
    "summary": "1-2 sentence summary"
  }
]

RULES:
- animal must be specific (bilby, bettong, fox — NOT "animal")
- headline must NOT contain emoji
- keep headlines short and punchy`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-search-preview",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  let text = data.choices[0].message.content.trim();
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  return JSON.parse(text);
}

// 🎯 klíčová funkce
function getEmoji(animal, used) {
  const key = animal.toLowerCase();

  let emoji = EMOJI_MAP[key];

  if (!emoji || used.has(emoji)) {
    emoji = FALLBACK_EMOJIS.find(e => !used.has(e));
  }

  used.add(emoji);
  return emoji;
}

function stylizeHeadline(headline, style) {
  if (style === "dramatic") return headline.toUpperCase();
  if (style === "cute") return headline + " 🥺";
  if (style === "chaotic") return "BREAKING: " + headline;
  return headline;
}

function processStories(stories) {
  const used = new Set();

  return stories.map((s, i) => {
    const emoji = getEmoji(s.animal, used);
    const style = STYLES[i % STYLES.length];

    return {
      ...s,
      headline: `${emoji} ${stylizeHeadline(s.headline, style)}`
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

  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });
}

async function main() {
  const yesterday = yesterdayDate();

  const raw = await fetchNews();
  const stories = processStories(raw);

  await sendDiscord(stories, yesterday);
}

main();
