import { getServerSession } from "next-auth";
import mysql from "mysql2";
import { authOptions } from "@/lib/auth";
import logger from "../../../../logger";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME,
});

const promisePool = pool.promise();
const MANAGE_GUILD_LEVEL = 6;
const TABLE_DEFINITIONS = [
  {
    table: "queue_channels",
    sql: "CREATE TABLE IF NOT EXISTS queue_channels (guild_id VARCHAR(32) NOT NULL PRIMARY KEY, queue_channel_id VARCHAR(32) NOT NULL, selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, selected_by VARCHAR(32) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "notification_channels",
    sql: "CREATE TABLE IF NOT EXISTS notification_channels (guild_id VARCHAR(32) NOT NULL PRIMARY KEY, notification_channel_id VARCHAR(32) NOT NULL, selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, selected_by VARCHAR(32) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "welcome_channels",
    sql: "CREATE TABLE IF NOT EXISTS welcome_channels (guild_id VARCHAR(32) NOT NULL PRIMARY KEY, welcome_channel_id VARCHAR(32) NOT NULL, selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, selected_by VARCHAR(32) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "update_notification_channels",
    sql: "CREATE TABLE IF NOT EXISTS update_notification_channels (guild_id VARCHAR(32) NOT NULL PRIMARY KEY, update_notification_channel_id VARCHAR(32) NOT NULL, selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, selected_by VARCHAR(32) NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "ban_notification_channels",
    sql: "CREATE TABLE IF NOT EXISTS ban_notification_channels (guild_id VARCHAR(32) NOT NULL PRIMARY KEY, ban_notification_channel_id VARCHAR(32) NOT NULL, selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, selected_by VARCHAR(32) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "kick_notification_channels",
    sql: "CREATE TABLE IF NOT EXISTS kick_notification_channels (guild_id VARCHAR(32) NOT NULL PRIMARY KEY, kick_notification_channel_id VARCHAR(32) NOT NULL, selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, selected_by VARCHAR(32) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "update_notification_roles",
    sql: "CREATE TABLE IF NOT EXISTS update_notification_roles (guild_id VARCHAR(32) NOT NULL PRIMARY KEY, notification_role_id VARCHAR(32) NOT NULL, selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, selected_by VARCHAR(32) NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
];

async function ensureSettingsTables() {
  for (const definition of TABLE_DEFINITIONS) {
    await promisePool.query(definition.sql);
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function getUserGuilds(userId) {
  const [rows] = await promisePool.query(
    `SELECT
      u.guild_id,
      COALESCE(NULLIF(s.name, ''), u.guild_name) AS guild_name,
      CASE
        WHEN s.icon IS NOT NULL AND s.icon != '' THEN s.icon
        WHEN u.guild_icon IS NOT NULL AND u.guild_icon LIKE '%/icons/%' THEN u.guild_icon
        ELSE NULL
      END AS guild_icon,
      u.admin_prem
    FROM users u
    LEFT JOIN servers s ON s.id = u.guild_id
    WHERE u.user_id = ?`,
    [userId],
  );
  return rows;
}

async function getMemberProfiles(accessToken, guildIds) {
  const profiles = {};

  if (!accessToken || !guildIds.length) {
    return profiles;
  }

  for (const guildId of guildIds) {
    try {
      const response = await fetch(
        `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        continue;
      }

      const member = await response.json();
      const username = member?.user?.username || null;
      const globalName = member?.user?.global_name || null;
      const nickname = member?.nick || null;

      profiles[guildId] = {
        nickname,
        username,
        displayName: nickname || globalName || username || null,
      };
    } catch {
      profiles[guildId] = profiles[guildId] || null;
    }
  }

  return profiles;
}

async function getGuildChannels(guildIds) {
  if (!guildIds.length) {
    return [];
  }

  const [rows] = await promisePool.query(
    "SELECT guild_id, channel_id, channel_name, channel_type FROM channels WHERE guild_id IN (?) AND channel_type = '0' ORDER BY channel_name ASC",
    [guildIds],
  );

  return rows;
}

async function getGuildSettings(guildIds) {
  if (!guildIds.length) {
    return [];
  }

  const [queueRows] = await promisePool.query(
    "SELECT guild_id, queue_channel_id FROM queue_channels WHERE guild_id IN (?)",
    [guildIds],
  );
  const [notificationRows] = await promisePool.query(
    "SELECT guild_id, notification_channel_id FROM notification_channels WHERE guild_id IN (?)",
    [guildIds],
  );
  const [welcomeRows] = await promisePool.query(
    "SELECT guild_id, welcome_channel_id FROM welcome_channels WHERE guild_id IN (?)",
    [guildIds],
  );
  const [updateRows] = await promisePool.query(
    "SELECT guild_id, update_notification_channel_id FROM update_notification_channels WHERE guild_id IN (?)",
    [guildIds],
  );
  const [banRows] = await promisePool.query(
    "SELECT guild_id, ban_notification_channel_id FROM ban_notification_channels WHERE guild_id IN (?)",
    [guildIds],
  );
  const [kickRows] = await promisePool.query(
    "SELECT guild_id, kick_notification_channel_id FROM kick_notification_channels WHERE guild_id IN (?)",
    [guildIds],
  );
  const [roleRows] = await promisePool.query(
    "SELECT guild_id, notification_role_id FROM update_notification_roles WHERE guild_id IN (?)",
    [guildIds],
  );

  const settingsMap = new Map();

  guildIds.forEach((guildId) => {
    settingsMap.set(guildId, {
      guild_id: guildId,
      queue_channel_id: null,
      notification_channel_id: null,
      welcome_channel_id: null,
      update_notification_channel_id: null,
      ban_notification_channel_id: null,
      kick_notification_channel_id: null,
      notification_role_id: null,
    });
  });

  queueRows.forEach((row) => {
    const current = settingsMap.get(row.guild_id);
    if (current) {
      current.queue_channel_id = row.queue_channel_id;
    }
  });

  notificationRows.forEach((row) => {
    const current = settingsMap.get(row.guild_id);
    if (current) {
      current.notification_channel_id = row.notification_channel_id;
    }
  });

  welcomeRows.forEach((row) => {
    const current = settingsMap.get(row.guild_id);
    if (current) {
      current.welcome_channel_id = row.welcome_channel_id;
    }
  });

  updateRows.forEach((row) => {
    const current = settingsMap.get(row.guild_id);
    if (current) {
      current.update_notification_channel_id =
        row.update_notification_channel_id;
    }
  });

  banRows.forEach((row) => {
    const current = settingsMap.get(row.guild_id);
    if (current) {
      current.ban_notification_channel_id = row.ban_notification_channel_id;
    }
  });

  kickRows.forEach((row) => {
    const current = settingsMap.get(row.guild_id);
    if (current) {
      current.kick_notification_channel_id = row.kick_notification_channel_id;
    }
  });

  roleRows.forEach((row) => {
    const current = settingsMap.get(row.guild_id);
    if (current) {
      current.notification_role_id = row.notification_role_id;
    }
  });

  return Array.from(settingsMap.values());
}

async function canManageGuild(userId, guildId) {
  const [rows] = await promisePool.query(
    "SELECT admin_prem FROM users WHERE user_id = ? AND guild_id = ? LIMIT 1",
    [userId, guildId],
  );

  if (!rows.length) {
    return false;
  }

  return Number(rows[0].admin_prem || 0) >= MANAGE_GUILD_LEVEL;
}

async function isTextChannelInGuild(guildId, channelId) {
  const [rows] = await promisePool.query(
    "SELECT channel_id FROM channels WHERE guild_id = ? AND channel_id = ? AND channel_type = '0' LIMIT 1",
    [guildId, channelId],
  );

  return rows.length > 0;
}

async function upsertOrDeleteSetting(
  tableName,
  columnName,
  guildId,
  value,
  userId,
) {
  if (!value) {
    await promisePool.query(`DELETE FROM ${tableName} WHERE guild_id = ?`, [
      guildId,
    ]);
    return;
  }

  await promisePool.query(
    `INSERT INTO ${tableName} (guild_id, ${columnName}, selected_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ${columnName} = VALUES(${columnName}), selected_by = VALUES(selected_by), selected_at = CURRENT_TIMESTAMP`,
    [guildId, value, userId],
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    logger.warn("❌ Brak autoryzacji!");
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const userId = session.user?.id || session.user?.sub;
  if (!userId) {
    logger.warn("❌ Brak ID użytkownika w sesji!");
    return jsonResponse({ error: "Brak ID użytkownika" }, 400);
  }

  try {
    await ensureSettingsTables();

    const userServers = await getUserGuilds(userId);

    if (!userServers.length) {
      return jsonResponse({
        servers: [],
        channels: [],
        guildSettings: [],
      });
    }

    const guildIds = userServers.map((server) => server.guild_id);
    const channels = await getGuildChannels(guildIds);
    const guildSettings = await getGuildSettings(guildIds);
    const memberProfiles = await getMemberProfiles(
      session.accessToken,
      guildIds,
    );

    const servers = userServers.map((server) => ({
      ...server,
      can_edit: Number(server.admin_prem || 0) >= MANAGE_GUILD_LEVEL,
      member_profile: memberProfiles[server.guild_id] || null,
    }));

    return jsonResponse({
      servers,
      channels,
      guildSettings,
    });
  } catch (error) {
    logger.error("❌ Błąd pobierania danych użytkownika:", error);
    return jsonResponse({ error: "Database error" }, 500);
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    logger.warn("❌ Brak autoryzacji!");
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const userId = session.user?.id || session.user?.sub;
  if (!userId) {
    logger.warn("❌ Brak ID użytkownika w sesji!");
    return jsonResponse({ error: "Brak ID użytkownika" }, 400);
  }

  const body = await req.json();
  const guildId = body.guild_id;

  if (!guildId) {
    return jsonResponse({ error: "Brak guild_id" }, 400);
  }

  try {
    await ensureSettingsTables();

    const hasManageGuild = await canManageGuild(userId, guildId);
    if (!hasManageGuild) {
      return jsonResponse(
        { error: "Brak uprawnień ManageGuild do zapisu ustawień" },
        403,
      );
    }

    const channelSettings = [
      {
        table: "queue_channels",
        column: "queue_channel_id",
        value: body.queue_channel_id || null,
      },
      {
        table: "notification_channels",
        column: "notification_channel_id",
        value: body.notification_channel_id || null,
      },
      {
        table: "welcome_channels",
        column: "welcome_channel_id",
        value: body.welcome_channel_id || null,
      },
      {
        table: "update_notification_channels",
        column: "update_notification_channel_id",
        value: body.update_notification_channel_id || null,
      },
      {
        table: "ban_notification_channels",
        column: "ban_notification_channel_id",
        value: body.ban_notification_channel_id || null,
      },
      {
        table: "kick_notification_channels",
        column: "kick_notification_channel_id",
        value: body.kick_notification_channel_id || null,
      },
    ];

    for (const setting of channelSettings) {
      if (setting.value) {
        const isValid = await isTextChannelInGuild(guildId, setting.value);
        if (!isValid) {
          return jsonResponse(
            {
              error: `Kanał ${setting.value} nie istnieje lub nie jest kanałem tekstowym dla wybranej gildii.`,
            },
            400,
          );
        }
      }
    }

    const roleId = body.notification_role_id || null;
    if (roleId && !/^\d+$/.test(String(roleId))) {
      return jsonResponse(
        { error: "notification_role_id musi być poprawnym ID roli Discord." },
        400,
      );
    }

    for (const setting of channelSettings) {
      await upsertOrDeleteSetting(
        setting.table,
        setting.column,
        guildId,
        setting.value,
        userId,
      );
    }

    await upsertOrDeleteSetting(
      "update_notification_roles",
      "notification_role_id",
      guildId,
      roleId,
      userId,
    );

    logger.info(`✅ Ustawienia zapisane dla gildii ${guildId} przez ${userId}`);

    return jsonResponse({
      message: "Ustawienia zapisane pomyślnie",
      guild_id: guildId,
      queue_channel_id: body.queue_channel_id || null,
      notification_channel_id: body.notification_channel_id || null,
      welcome_channel_id: body.welcome_channel_id || null,
      update_notification_channel_id:
        body.update_notification_channel_id || null,
      ban_notification_channel_id: body.ban_notification_channel_id || null,
      kick_notification_channel_id: body.kick_notification_channel_id || null,
      notification_role_id: roleId,
    });
  } catch (error) {
    logger.error("❌ Błąd zapisu ustawień w MySQL:", error);
    return jsonResponse({ error: "Database error" }, 500);
  }
}
