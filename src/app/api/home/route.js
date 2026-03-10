import mysql from "mysql2";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME,
});

const promisePool = pool.promise();

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

async function countFrom(query, fallback = 0, params = []) {
  try {
    const [rows] = await promisePool.query(query, params);
    return Number(rows?.[0]?.total || 0);
  } catch {
    return fallback;
  }
}

function formatInt(value) {
  return Number(value || 0).toLocaleString("en-US");
}

export async function GET() {
  const guildsTotal = await countFrom(
    "SELECT COUNT(DISTINCT guild_id) AS total FROM users",
    500,
  );
  const tracksTotal = await countFrom(
    "SELECT COUNT(*) AS total FROM music_library_tracks",
    0,
  );
  const playlistsTotal = await countFrom(
    "SELECT COUNT(*) AS total FROM guild_music_playlists",
    0,
  );
  const activePlayback = await countFrom(
    "SELECT COUNT(*) AS total FROM guild_music_state WHERE playback_state IN ('playing', 'paused')",
    0,
  );
  const queuedCommands24h = await countFrom(
    "SELECT COUNT(*) AS total FROM music_command_queue WHERE created_at >= (NOW() - INTERVAL 1 DAY)",
    0,
  );
  const moderationConfigured = await countFrom(
    "SELECT COUNT(*) AS total FROM guild_notification_settings WHERE notifications_enabled = 1",
    0,
  );

  const heroStats = [
    `${formatInt(guildsTotal)} communities`,
    `${formatInt(activePlayback)} active sessions`,
    `${formatInt(tracksTotal)} tracks indexed`,
  ];

  const overviewCards = [
    {
      label: "Connected Communities",
      value: formatInt(guildsTotal),
      tone: "neutral",
    },
    {
      label: "Music Library",
      value: `${formatInt(tracksTotal)} tracks`,
      tone: "neutral",
    },
    {
      label: "Playlists",
      value: formatInt(playlistsTotal),
      tone: "neutral",
    },
    {
      label: "Bot Health",
      value: "Operational",
      tone: "good",
    },
  ];

  const featurePanels = {
    moderation: {
      title: "Moderation Insights",
      items: [
        `${formatInt(moderationConfigured)} guilds with moderation enabled`,
        "Role and permission controls available in Dashboard",
        "Fast setup flow with server-level controls",
      ],
    },
    music: {
      title: "Music Insights",
      items: [
        `${formatInt(activePlayback)} active playback sessions`,
        `${formatInt(playlistsTotal)} total playlists configured`,
        `${formatInt(tracksTotal)} tracks ready in the library`,
      ],
    },
    tools: {
      title: "Community Tools",
      items: [
        `${formatInt(queuedCommands24h)} commands processed in last 24h`,
        "Dashboard and music controls available in one place",
        "Continuous updates delivered through the web panel",
      ],
    },
  };

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const changelog = [
    {
      version: "Live Snapshot",
      date: dateLabel,
      items: [
        `${formatInt(activePlayback)} active playback sessions right now.`,
        `${formatInt(queuedCommands24h)} commands queued in the last 24 hours.`,
        `${formatInt(tracksTotal)} tracks currently indexed in the music library.`,
      ],
    },
    {
      version: "Platform Overview",
      date: dateLabel,
      items: [
        `${formatInt(guildsTotal)} connected communities across the platform.`,
        `${formatInt(playlistsTotal)} playlists managed through Dashboard and Music pages.`,
        `${formatInt(moderationConfigured)} guilds with active moderation settings.`,
      ],
    },
  ];

  return jsonResponse({
    heroStats,
    overviewCards,
    featurePanels,
    changelog,
  });
}
