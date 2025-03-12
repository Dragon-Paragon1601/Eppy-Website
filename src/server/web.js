const express = require("express");
const cors = require("cors");
const app = express();
const port = 3001; // Możesz zmienić port, jeśli potrzebujesz

const { Client } = require("discord.js");
const client = new Client({ intents: ["Guilds"] });

app.use(cors()); // Pozwala na zapytania z innej domeny

app.get("/api/guilds", async (req, res) => {
    try {
        if (!client.isReady()) {
            return res.status(500).json({ error: "Bot nie jest gotowy" });
        }

        const guilds = client.guilds.cache.map(guild => guild.id);
        res.json({ guilds });
    } catch (error) {
        console.error("Błąd pobierania serwerów:", error);
        res.status(500).json({ error: "Wystąpił problem" });
    }
});

app.listen(port, () => {
    console.log(`API bota działa na http://localhost:${port}`);
});

// Eksportujemy aplikację, jeśli chcemy użyć jej gdzieś indziej
module.exports = app;
