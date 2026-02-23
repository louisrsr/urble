// server.js
const express = require("express");
const fetch = require("node-fetch"); // npm i node-fetch
const app = express();
const PORT = 3000;

// Optional: curated local JSON as fallback
const WORDS = require("./words.json"); // your full curated JSON

function shuffleSeed(array, seed) {
  let result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    let j = Math.floor((seed / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

app.get("/dailywords", async (req, res) => {
  try {
    // Seed based on date
    const seed = Number(new Date().toISOString().split("T")[0].replace(/-/g, ""));

    // Pick 5 words from local JSON
    let dailyWords = shuffleSeed(WORDS, seed).slice(0, 5);

    // Optional: fetch definitions from Urban Dictionary API
    for (let wordObj of dailyWords) {
      const response = await fetch(
        `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(wordObj.word)}`
      );
      const data = await response.json();
      if (data.list && data.list.length > 0) {
        wordObj.correct = data.list[0].definition;
      }
    }

    res.json(dailyWords);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
