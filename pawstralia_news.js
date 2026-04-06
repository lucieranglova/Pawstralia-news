/**
 * 🐨 Pawstralia News
 * Fetches real yesterday's Australian animal news using OpenAI with web search
 * and sends a fun daily digest to Discord.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

// Funny headline prefixes to spice up the digest
const INTROS = [
  "G'day mate! Here's what the animals of Australia got up to yesterday 🦘",
  "Crikey! The wildlife has been busy! Here's yesterday's Pawstralia News 🐨",
  "No dramas! Just your daily dose of Australian animal chaos 🐊",
  "The bush telegraph is buzzing! Yesterday in Australian wildlife... 🦜",
  "Strewth! You won't believe what the animals were up to yesterday 🐍",
];

function randomIntro() {
  return INTROS[Math.floor(Math.random() * INTROS.length)];
}

function yesterdayDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0]; // "2026-04-05"
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

Find 3-5 interesting, fun or unusual stories about Australian wildlife, animals or nature from that specific date.

For each story write:
- Generate a funny, punny, or dramatic headline about Australian wildlife news. Use a variety of relevant emojis, changing them between headlines and matching the animal or theme (e.g., 🦘 for kangaroos, 🐨 for koalas, 🦡 for wombats, 🎉 for celebrations). Example:
"Kangaroo Escapes Sydney Suburb, Hops Into Local Pub 🦘🍺"
Make each headline playful and visually engaging, and alternate emojis so they don’t repeat too predictably.
- 1-2 sentence summary of what happened - Make each headline playful and visually engaging, and alternate emojis so they don’t repeat too predictably

Format your response as a JSON array, no other text:
[
  {
    "headline": "🐨 funny headline with emojis here",
    "summary": "Short summary of what happened."
  }
]

Focus only on stories genuinely from ${formattedDate}. If there are no major animal stories from that exact date, use the most recent Australian animal stories you can find and note the actual date. Keep it fun, light-hearted and emoji-rich!`;

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
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }

  const data = await res.json();
  let text = data.choices[0].message.content.trim();
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(text);
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
      color: 0x2E8B57,  // forest green
      footer: { text: "Pawstralia News • Australian Wildlife Daily Digest" },
    }],
  });

  const res = await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "DiscordBot (https://github.com, 1.0)",
    },
    body: payload,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord error ${res.status}: ${text}`);
  }

  console.log("Discord message sent!");
}

async function main() {
  console.log(`[${new Date().toISOString()}] Fetching Pawstralia News...`);

  if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
  if (!DISCORD_WEBHOOK) throw new Error("Missing DISCORD_WEBHOOK_URL");

  const yesterday = yesterdayDate();
  console.log(`Searching for animal news from ${yesterday}...`);

  const stories = await fetchNews();
  console.log(`Found ${stories.length} stories.`);
  stories.forEach(s => console.log(` - ${s.headline}`));

  await sendDiscord(stories, yesterday);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
