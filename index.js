const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ CoinGecko: Crypto Candles Route
app.get("/crypto", async (req, res) => {
  try {
    const { symbol, interval } = req.query;

    if (!symbol || !interval) {
      return res.status(400).json({ error: "Missing symbol or interval" });
    }

    const [base, quote] = symbol.toLowerCase().split("/");
    const daysMap = {
      "1m": 1 / 24 / 60,
      "5m": 1 / 24 / 12,
      "15m": 1 / 24 / 4,
      "1h": 1 / 24,
      "4h": 1,
      "1d": 7,
    };
    const days = daysMap[interval] || 1;

    const url = `https://api.coingecko.com/api/v3/coins/${base}/ohlc?vs_currency=${quote}&days=${days}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!Array.isArray(json)) throw new Error("Invalid response from CoinGecko");

    const data = json.map((d) => ({
      time: d[0] / 1000,
      open: d[1],
      high: d[2],
      low: d[3],
      close: d[4],
    }));

    res.json(data);
  } catch (err) {
    console.error("Crypto error:", err.message);
    res.status(500).json({ error: "Failed to fetch from CoinGecko" });
  }
});

// ✅ Twelve Data: Forex Route
const TD_KEY = "cd09497577194c51aab60c0269b10b45";

app.get("/forex", async (req, res) => {
  try {
    const { symbol, interval } = req.query;
    if (!symbol || !interval) {
      return res.status(400).json({ error: "Missing symbol or interval" });
    }

    const formattedSymbol = symbol.includes("/") ? symbol.toUpperCase() : symbol.slice(0, 3) + "/" + symbol.slice(3);
    const intervalMap = {
      "1m": "1min",
      "5m": "5min",
      "15m": "15min",
      "1h": "1h",
      "4h": "4h",
      "1d": "1day",
    };
    const formattedInterval = intervalMap[interval] || interval;

    const url = `https://api.twelvedata.com/time_series?symbol=${formattedSymbol}&interval=${formattedInterval}&outputsize=500&apikey=${TD_KEY}`;
    const response = await fetch(url);
    const json = await response.json();

    if (!json.values) throw new Error("Invalid Twelve Data response");

    const data = json.values.reverse().map((d) => ({
      time: new Date(d.datetime).getTime() / 1000,
      open: parseFloat(d.open),
      high: parseFloat(d.high),
      low: parseFloat(d.low),
      close: parseFloat(d.close),
    }));

    res.json(data);
  } catch (err) {
    console.error("Forex error:", err.message);
    res.status(500).json({ error: "Failed to fetch from Twelve Data" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
