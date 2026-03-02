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
const NOTIFICATION_DEFAULTS = {
  notifications_enabled: true,
  queue_notifications_enabled: true,
  welcome_notifications_enabled: false,
  ban_notifications_enabled: true,
  kick_notifications_enabled: true,
  notification_channel_enabled: false,
  update_notification_channel_enabled: false,
};
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
  {
    table: "notification_roles",
    sql: "CREATE TABLE IF NOT EXISTS notification_roles (guild_id VARCHAR(32) NOT NULL PRIMARY KEY, notification_role_id VARCHAR(32) NOT NULL, selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, selected_by VARCHAR(32) NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "guild_notification_settings",
    sql: "CREATE TABLE IF NOT EXISTS guild_notification_settings (guild_id VARCHAR(32) NOT NULL PRIMARY KEY, notifications_enabled TINYINT(1) NOT NULL DEFAULT 1, queue_notifications_enabled TINYINT(1) NOT NULL DEFAULT 1, welcome_notifications_enabled TINYINT(1) NOT NULL DEFAULT 0, ban_notifications_enabled TINYINT(1) NOT NULL DEFAULT 1, kick_notifications_enabled TINYINT(1) NOT NULL DEFAULT 1, notification_channel_enabled TINYINT(1) NOT NULL DEFAULT 0, update_notification_channel_enabled TINYINT(1) NOT NULL DEFAULT 0, selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, selected_by VARCHAR(32) NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "guild_roles",
    sql: "CREATE TABLE IF NOT EXISTS guild_roles (guild_id VARCHAR(32) NOT NULL, role_id VARCHAR(32) NOT NULL, role_name VARCHAR(255) NOT NULL, role_color INT UNSIGNED NOT NULL DEFAULT 0, permission_level TINYINT NOT NULL DEFAULT 0, permissions_bitfield VARCHAR(32) NOT NULL, position INT NOT NULL DEFAULT 0, is_hoist TINYINT(1) NOT NULL DEFAULT 0, is_mentionable TINYINT(1) NOT NULL DEFAULT 0, is_managed TINYINT(1) NOT NULL DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (guild_id, role_id), KEY idx_guild_roles_guild_id (guild_id), KEY idx_guild_roles_position (guild_id, position)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
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

function normalizeBoolean(value, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === 1 || value === "1" || value === "true") {
    return true;
  }
  if (value === 0 || value === "0" || value === "false") {
    return false;
  }
  return fallback;
}

function normalizeNotificationSettings(input = {}) {
  return {
    notifications_enabled: normalizeBoolean(
      input.notifications_enabled,
      NOTIFICATION_DEFAULTS.notifications_enabled,
    ),
    queue_notifications_enabled: normalizeBoolean(
      input.queue_notifications_enabled,
      NOTIFICATION_DEFAULTS.queue_notifications_enabled,
    ),
    welcome_notifications_enabled: normalizeBoolean(
      input.welcome_notifications_enabled,
      NOTIFICATION_DEFAULTS.welcome_notifications_enabled,
    ),
    ban_notifications_enabled: normalizeBoolean(
      input.ban_notifications_enabled,
      NOTIFICATION_DEFAULTS.ban_notifications_enabled,
    ),
    kick_notifications_enabled: normalizeBoolean(
      input.kick_notifications_enabled,
      NOTIFICATION_DEFAULTS.kick_notifications_enabled,
    ),
    notification_channel_enabled: normalizeBoolean(
      input.notification_channel_enabled,
      NOTIFICATION_DEFAULTS.notification_channel_enabled,
    ),
    update_notification_channel_enabled: normalizeBoolean(
      input.update_notification_channel_enabled,
      NOTIFICATION_DEFAULTS.update_notification_channel_enabled,
    ),
  };
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

async function getGuildRoles(guildIds) {
  if (!guildIds.length) {
    return [];
  }

  const [rows] = await promisePool.query(
    "SELECT guild_id, role_id, role_name, role_color, permission_level, permissions_bitfield, position, is_hoist, is_mentionable, is_managed, updated_at FROM guild_roles WHERE guild_id IN (?) ORDER BY position DESC, role_name ASC",
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
  const [updateRoleRows] = await promisePool.query(
    "SELECT guild_id, notification_role_id FROM update_notification_roles WHERE guild_id IN (?)",
    [guildIds],
  );
  const [notificationRoleRows] = await promisePool.query(
    "SELECT guild_id, notification_role_id FROM notification_roles WHERE guild_id IN (?)",
    [guildIds],
  );
  const [notificationSettingsRows] = await promisePool.query(
    "SELECT guild_id, notifications_enabled, queue_notifications_enabled, welcome_notifications_enabled, ban_notifications_enabled, kick_notifications_enabled, notification_channel_enabled, update_notification_channel_enabled FROM guild_notification_settings WHERE guild_id IN (?)",
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
      update_notification_role_id: null,
      ...NOTIFICATION_DEFAULTS,
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

  notificationRoleRows.forEach((row) => {
    const current = settingsMap.get(row.guild_id);
    if (current) {
      current.notification_role_id = row.notification_role_id;
    }
  });

  updateRoleRows.forEach((row) => {
    const current = settingsMap.get(row.guild_id);
    if (current) {
      current.update_notification_role_id = row.notification_role_id;
    }
  });

  notificationSettingsRows.forEach((row) => {
    const current = settingsMap.get(row.guild_id);
    if (current) {
      current.notifications_enabled = Boolean(row.notifications_enabled);
      current.queue_notifications_enabled = Boolean(
        row.queue_notifications_enabled,
      );
      current.welcome_notifications_enabled = Boolean(
        row.welcome_notifications_enabled,
      );
      current.ban_notifications_enabled = Boolean(
        row.ban_notifications_enabled,
      );
      current.kick_notifications_enabled = Boolean(
        row.kick_notifications_enabled,
      );
      current.notification_channel_enabled = Boolean(
        row.notification_channel_enabled,
      );
      current.update_notification_channel_enabled = Boolean(
        row.update_notification_channel_enabled,
      );
    }
  });

  return Array.from(settingsMap.values());
}

async function upsertNotificationSettings(guildId, settings, userId) {
  await promisePool.query(
    `INSERT INTO guild_notification_settings (
      guild_id,
      notifications_enabled,
      queue_notifications_enabled,
      welcome_notifications_enabled,
      ban_notifications_enabled,
      kick_notifications_enabled,
      notification_channel_enabled,
      update_notification_channel_enabled,
      selected_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      notifications_enabled = VALUES(notifications_enabled),
      queue_notifications_enabled = VALUES(queue_notifications_enabled),
      welcome_notifications_enabled = VALUES(welcome_notifications_enabled),
      ban_notifications_enabled = VALUES(ban_notifications_enabled),
      kick_notifications_enabled = VALUES(kick_notifications_enabled),
      notification_channel_enabled = VALUES(notification_channel_enabled),
      update_notification_channel_enabled = VALUES(update_notification_channel_enabled),
      selected_by = VALUES(selected_by),
      selected_at = CURRENT_TIMESTAMP`,
    [
      guildId,
      settings.notifications_enabled ? 1 : 0,
      settings.queue_notifications_enabled ? 1 : 0,
      settings.welcome_notifications_enabled ? 1 : 0,
      settings.ban_notifications_enabled ? 1 : 0,
      settings.kick_notifications_enabled ? 1 : 0,
      settings.notification_channel_enabled ? 1 : 0,
      settings.update_notification_channel_enabled ? 1 : 0,
      userId,
    ],
  );
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

async function isRoleInGuild(guildId, roleId) {
  const [rows] = await promisePool.query(
    "SELECT role_id FROM guild_roles WHERE guild_id = ? AND role_id = ? LIMIT 1",
    [guildId, roleId],
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
    const roles = await getGuildRoles(guildIds);
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
      roles,
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
  const notificationSettings = normalizeNotificationSettings(body);

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

    if (
      notificationSettings.notifications_enabled &&
      notificationSettings.notification_channel_enabled &&
      !body.notification_channel_id
    ) {
      return jsonResponse(
        {
          error:
            "Dla włączonych Eppy Notifications musisz wybrać notification channel.",
        },
        400,
      );
    }

    if (
      notificationSettings.notifications_enabled &&
      notificationSettings.update_notification_channel_enabled &&
      !body.update_notification_channel_id
    ) {
      return jsonResponse(
        {
          error:
            "Dla włączonych Eppy Updates musisz wybrać update notification channel.",
        },
        400,
      );
    }

    const notificationRoleId = body.notification_role_id || null;
    const updateNotificationRoleId = body.update_notification_role_id || null;

    if (notificationRoleId && !/^\d+$/.test(String(notificationRoleId))) {
      return jsonResponse(
        { error: "notification_role_id musi być poprawnym ID roli Discord." },
        400,
      );
    }

    if (
      updateNotificationRoleId &&
      !/^\d+$/.test(String(updateNotificationRoleId))
    ) {
      return jsonResponse(
        {
          error:
            "update_notification_role_id musi być poprawnym ID roli Discord.",
        },
        400,
      );
    }

    if (notificationRoleId) {
      const isRoleValid = await isRoleInGuild(guildId, notificationRoleId);
      if (!isRoleValid) {
        return jsonResponse(
          {
            error:
              "notification_role_id nie istnieje dla wybranej gildii albo role nie zostały jeszcze zsynchronizowane.",
          },
          400,
        );
      }
    }

    if (updateNotificationRoleId) {
      const isRoleValid = await isRoleInGuild(
        guildId,
        updateNotificationRoleId,
      );
      if (!isRoleValid) {
        return jsonResponse(
          {
            error:
              "update_notification_role_id nie istnieje dla wybranej gildii albo role nie zostały jeszcze zsynchronizowane.",
          },
          400,
        );
      }
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
      "notification_roles",
      "notification_role_id",
      guildId,
      notificationRoleId,
      userId,
    );

    await upsertOrDeleteSetting(
      "update_notification_roles",
      "notification_role_id",
      guildId,
      updateNotificationRoleId,
      userId,
    );

    await upsertNotificationSettings(guildId, notificationSettings, userId);

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
      notification_role_id: notificationRoleId,
      update_notification_role_id: updateNotificationRoleId,
      ...notificationSettings,
    });
  } catch (error) {
    logger.error("❌ Błąd zapisu ustawień w MySQL:", error);
    return jsonResponse({ error: "Database error" }, 500);
  }
}
