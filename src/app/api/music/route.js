import { getServerSession } from "next-auth";
import mysql from "mysql2";
import { authOptions } from "@/lib/auth";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME,
});

const promisePool = pool.promise();
const ALLOWED_ACTIONS = new Set([
  "toggle_pause",
  "next",
  "previous",
  "start_playback",
  "set_shuffle",
  "set_loop",
  "enqueue_priority",
  "enqueue_playlist",
  "enqueue_playlists",
  "remove_priority",
  "remove_queue",
  "clear_queue",
  "create_user_playlist",
  "delete_user_playlist",
  "add_track_to_user_playlist",
  "remove_track_from_user_playlist",
  "pin_user_playlist",
  "unpin_user_playlist",
]);

const TABLE_DEFINITIONS = [
  {
    table: "music_command_queue",
    sql: "CREATE TABLE IF NOT EXISTS music_command_queue (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, guild_id VARCHAR(32) NOT NULL, action VARCHAR(64) NOT NULL, payload_json LONGTEXT NULL, requested_by VARCHAR(32) NULL, status ENUM('pending','processing','done','failed') NOT NULL DEFAULT 'pending', result_message VARCHAR(512) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, processed_at TIMESTAMP NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY idx_music_cmd_status_created (status, created_at), KEY idx_music_cmd_guild_status (guild_id, status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "guild_music_state",
    sql: "CREATE TABLE IF NOT EXISTS guild_music_state (guild_id VARCHAR(32) NOT NULL PRIMARY KEY, playback_state VARCHAR(16) NOT NULL DEFAULT 'idle', channel_label VARCHAR(255) NULL, now_playing_title VARCHAR(255) NULL, now_playing_artist VARCHAR(255) NULL, shuffle_mode VARCHAR(16) NOT NULL DEFAULT 'off', is_shuffle_enabled TINYINT(1) NOT NULL DEFAULT 0, is_loop_enabled TINYINT(1) NOT NULL DEFAULT 0, queue_json LONGTEXT NULL, priority_queue_json LONGTEXT NULL, previous_queue_json LONGTEXT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "music_library_tracks",
    sql: "CREATE TABLE IF NOT EXISTS music_library_tracks (track_key VARCHAR(512) NOT NULL PRIMARY KEY, track_path TEXT NOT NULL, playlist_name VARCHAR(255) NULL, title VARCHAR(255) NOT NULL, artist VARCHAR(255) NULL, duration_seconds INT NOT NULL DEFAULT 0, duration_label VARCHAR(16) NOT NULL DEFAULT '--:--', source_type ENUM('root','folder') NOT NULL DEFAULT 'folder', updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, KEY idx_music_library_playlist (playlist_name), KEY idx_music_library_title (title)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "guild_music_playlists",
    sql: "CREATE TABLE IF NOT EXISTS guild_music_playlists (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, guild_id VARCHAR(32) NOT NULL, name VARCHAR(255) NOT NULL, created_by VARCHAR(32) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uniq_guild_playlist_name (guild_id, name), KEY idx_guild_music_playlists_guild (guild_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "guild_music_playlist_tracks",
    sql: "CREATE TABLE IF NOT EXISTS guild_music_playlist_tracks (playlist_id BIGINT UNSIGNED NOT NULL, track_key VARCHAR(512) NOT NULL, position INT NOT NULL DEFAULT 0, added_by VARCHAR(32) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (playlist_id, track_key), KEY idx_guild_music_playlist_tracks_position (playlist_id, position), KEY idx_guild_music_playlist_tracks_track (track_key)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "guild_user_voice_states",
    sql: "CREATE TABLE IF NOT EXISTS guild_user_voice_states (guild_id VARCHAR(32) NOT NULL, user_id VARCHAR(32) NOT NULL, channel_id VARCHAR(32) NOT NULL, channel_name VARCHAR(255) NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, PRIMARY KEY (guild_id, user_id), KEY idx_guild_voice_channel (guild_id, channel_id), KEY idx_guild_voice_updated (updated_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "guild_user_music_playlist_pins",
    sql: "CREATE TABLE IF NOT EXISTS guild_user_music_playlist_pins (guild_id VARCHAR(32) NOT NULL, user_id VARCHAR(32) NOT NULL, playlist_id BIGINT UNSIGNED NOT NULL, pinned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (guild_id, user_id, playlist_id), KEY idx_guild_user_playlist_pins_order (guild_id, user_id, pinned_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
  {
    table: "guild_user_music_recent_playlists",
    sql: "CREATE TABLE IF NOT EXISTS guild_user_music_recent_playlists (guild_id VARCHAR(32) NOT NULL, user_id VARCHAR(32) NOT NULL, playlist_id BIGINT UNSIGNED NOT NULL, last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, play_count INT UNSIGNED NOT NULL DEFAULT 0, PRIMARY KEY (guild_id, user_id, playlist_id), KEY idx_guild_user_recent_playlists_order (guild_id, user_id, last_played_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
  },
];

const EMPTY_STATE = {
  playback_state: "idle",
  channel_label: "No channel",
  now_playing_title: "Nothing playing",
  now_playing_artist: "",
  shuffle_mode: "off",
  is_shuffle_enabled: false,
  is_loop_enabled: false,
  queue: [],
  priorityQueue: [],
  previousQueue: [],
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return fallback;
}

function parseJsonArray(input) {
  if (!input || typeof input !== "string") return [];
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function truncate(value, maxLength) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function toPositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

async function ensureMusicTables() {
  for (const definition of TABLE_DEFINITIONS) {
    await promisePool.query(definition.sql);
  }

  try {
    await promisePool.query(
      "ALTER TABLE music_library_tracks ADD COLUMN duration_seconds INT NOT NULL DEFAULT 0",
    );
  } catch (error) {
    if (!String(error?.message || "").includes("Duplicate column")) {
      throw error;
    }
  }

  try {
    await promisePool.query(
      "ALTER TABLE music_library_tracks ADD COLUMN duration_label VARCHAR(16) NOT NULL DEFAULT '--:--'",
    );
  } catch (error) {
    if (!String(error?.message || "").includes("Duplicate column")) {
      throw error;
    }
  }

  try {
    await promisePool.query(
      "ALTER TABLE guild_music_state ADD COLUMN shuffle_mode VARCHAR(16) NOT NULL DEFAULT 'off'",
    );
  } catch (error) {
    if (!String(error?.message || "").includes("Duplicate column")) {
      throw error;
    }
  }
}

async function canAccessGuild(userId, guildId) {
  const [rows] = await promisePool.query(
    "SELECT 1 AS has_access FROM users WHERE user_id = ? AND guild_id = ? LIMIT 1",
    [userId, guildId],
  );

  return rows.length > 0;
}

async function playlistBelongsToGuild(playlistId, guildId) {
  const [playlistRows] = await promisePool.query(
    "SELECT id FROM guild_music_playlists WHERE id = ? AND guild_id = ? LIMIT 1",
    [playlistId, guildId],
  );

  return !!playlistRows?.length;
}

async function upsertRecentUserPlaylist(guildId, userId, playlistId) {
  if (!guildId || !userId || !playlistId) return;

  await promisePool.query(
    "INSERT INTO guild_user_music_recent_playlists (guild_id, user_id, playlist_id, play_count) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE last_played_at = CURRENT_TIMESTAMP, play_count = play_count + 1",
    [guildId, userId, playlistId],
  );
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const guildId = new URL(request.url).searchParams.get("guild_id");
  if (!guildId) {
    return jsonResponse({ error: "guild_id is required" }, 400);
  }

  await ensureMusicTables();

  const canAccess = await canAccessGuild(session.user.id, guildId);
  if (!canAccess) {
    return jsonResponse({ error: "No access to this guild" }, 403);
  }

  const [rows] = await promisePool.query(
    "SELECT * FROM guild_music_state WHERE guild_id = ? LIMIT 1",
    [guildId],
  );

  const row = rows?.[0];
  if (!row) {
    return jsonResponse({ guild_id: guildId, state: EMPTY_STATE });
  }

  const state = {
    playback_state: row.playback_state || "idle",
    channel_label: row.channel_label || "No channel",
    now_playing_title: row.now_playing_title || "Nothing playing",
    now_playing_artist: row.now_playing_artist || "",
    shuffle_mode:
      row.shuffle_mode === "smart" || row.shuffle_mode === "shuffle"
        ? row.shuffle_mode
        : normalizeBoolean(row.is_shuffle_enabled, false)
          ? "shuffle"
          : "off",
    is_shuffle_enabled: normalizeBoolean(row.is_shuffle_enabled, false),
    is_loop_enabled: normalizeBoolean(row.is_loop_enabled, false),
    queue: parseJsonArray(row.queue_json),
    priorityQueue: parseJsonArray(row.priority_queue_json),
    previousQueue: parseJsonArray(row.previous_queue_json),
  };

  const [libraryRows] = await promisePool.query(
    "SELECT track_key, track_path, playlist_name, title, artist, duration_seconds, duration_label FROM music_library_tracks ORDER BY COALESCE(playlist_name, ''), title ASC",
  );

  const libraryTracks = libraryRows.map((track) => ({
    track_key: track.track_key,
    path: track.track_path,
    title: track.title,
    artist: track.artist || "",
    duration_seconds: Number(track.duration_seconds || 0),
    duration: track.duration_label || "--:--",
    playlist_name: track.playlist_name || null,
  }));

  const premadeMap = new Map();
  for (const track of libraryTracks) {
    if (!track.playlist_name) continue;
    premadeMap.set(
      track.playlist_name,
      (premadeMap.get(track.playlist_name) || 0) + 1,
    );
  }

  const premadePlaylists = Array.from(premadeMap.entries())
    .map(([name, tracks]) => ({
      id: name,
      name,
      songs: tracks,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  const [playlistRows] = await promisePool.query(
    "SELECT p.id, p.name, p.created_by, p.created_at, COUNT(pt.track_key) AS songs FROM guild_music_playlists p LEFT JOIN guild_music_playlist_tracks pt ON pt.playlist_id = p.id WHERE p.guild_id = ? GROUP BY p.id, p.name, p.created_by, p.created_at ORDER BY p.created_at DESC",
    [guildId],
  );

  const [pinRows] = await promisePool.query(
    "SELECT playlist_id, pinned_at FROM guild_user_music_playlist_pins WHERE guild_id = ? AND user_id = ? ORDER BY pinned_at ASC",
    [guildId, session.user.id],
  );

  const pinnedByPlaylistId = new Map(
    pinRows.map((pin) => [String(pin.playlist_id), pin.pinned_at]),
  );

  const playlistIds = playlistRows.map((playlist) => playlist.id);
  let playlistTracksRows = [];
  if (playlistIds.length > 0) {
    const [rowsPlaylistTracks] = await promisePool.query(
      `SELECT pt.playlist_id, pt.track_key, pt.position, l.track_path, l.title, l.artist
       FROM guild_music_playlist_tracks pt
       LEFT JOIN music_library_tracks l ON l.track_key = pt.track_key
       WHERE pt.playlist_id IN (${playlistIds.map(() => "?").join(",")})
       ORDER BY pt.playlist_id ASC, pt.position ASC, pt.created_at ASC`,
      playlistIds,
    );
    playlistTracksRows = rowsPlaylistTracks;
  }

  const tracksByPlaylist = new Map();
  for (const track of playlistTracksRows) {
    if (!tracksByPlaylist.has(track.playlist_id)) {
      tracksByPlaylist.set(track.playlist_id, []);
    }

    tracksByPlaylist.get(track.playlist_id).push({
      track_key: track.track_key,
      path: track.track_path,
      title: track.title,
      artist: track.artist || "",
      position: track.position,
    });
  }

  const userPlaylists = playlistRows.map((playlist) => ({
    id: playlist.id,
    name: playlist.name,
    songs: Number(playlist.songs || 0),
    owner: playlist.created_by === session.user.id ? "You" : "Shared",
    is_pinned: pinnedByPlaylistId.has(String(playlist.id)),
    pinned_at: pinnedByPlaylistId.get(String(playlist.id)) || null,
    tracks: tracksByPlaylist.get(playlist.id) || [],
  }));

  const [recentRows] = await promisePool.query(
    "SELECT r.playlist_id, r.last_played_at FROM guild_user_music_recent_playlists r INNER JOIN guild_music_playlists p ON p.id = r.playlist_id AND p.guild_id = r.guild_id WHERE r.guild_id = ? AND r.user_id = ? ORDER BY r.last_played_at DESC LIMIT 8",
    [guildId, session.user.id],
  );

  const playlistById = new Map(
    userPlaylists.map((playlist) => [String(playlist.id), playlist]),
  );

  const recentUserPlaylists = recentRows
    .map((rowRecent) => {
      const playlist = playlistById.get(String(rowRecent.playlist_id));
      if (!playlist) return null;

      return {
        id: playlist.id,
        name: playlist.name,
        songs: playlist.songs,
        owner: playlist.owner,
        last_played_at: rowRecent.last_played_at,
      };
    })
    .filter(Boolean);

  const [voiceRows] = await promisePool.query(
    "SELECT channel_id, channel_name, updated_at FROM guild_user_voice_states WHERE guild_id = ? AND user_id = ? LIMIT 1",
    [guildId, session.user.id],
  );

  const userVoiceState = voiceRows?.[0]
    ? {
        channel_id: voiceRows[0].channel_id,
        channel_name: voiceRows[0].channel_name || "voice",
        updated_at: voiceRows[0].updated_at,
      }
    : null;

  return jsonResponse({
    guild_id: guildId,
    state,
    libraryTracks,
    premadePlaylists,
    userPlaylists,
    recentUserPlaylists,
    userVoiceState,
  });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const body = await request.json().catch(() => null);
  const guildId = body?.guild_id;
  const action = body?.action;

  if (!guildId || !action) {
    return jsonResponse({ error: "guild_id and action are required" }, 400);
  }

  if (!ALLOWED_ACTIONS.has(action)) {
    return jsonResponse({ error: "Unsupported action" }, 400);
  }

  await ensureMusicTables();

  const canAccess = await canAccessGuild(session.user.id, guildId);
  if (!canAccess) {
    return jsonResponse({ error: "No access to this guild" }, 403);
  }

  const payload = {
    mode: body?.mode || null,
    value: body?.value,
    track_title: body?.track_title || null,
    track_path: body?.track_path || null,
    track_key: body?.track_key || null,
    playlist_id: body?.playlist_id || null,
    playlist_name: body?.playlist_name || null,
    playlist_scope: body?.playlist_scope || null,
  };

  if (action === "enqueue_playlist") {
    const playlistId = toPositiveInt(payload.playlist_id);
    const playlistName = truncate(payload.playlist_name, 255);

    if (!playlistId && !playlistName) {
      return jsonResponse(
        { error: "playlist_id or playlist_name is required" },
        400,
      );
    }

    payload.playlist_id = playlistId;
    payload.playlist_name = playlistName || null;
    payload.playlist_scope = String(payload.playlist_scope || "").slice(0, 16);

    if (payload.playlist_scope === "user" && payload.playlist_id) {
      await upsertRecentUserPlaylist(
        guildId,
        session.user.id,
        payload.playlist_id,
      );
    }
  }

  if (action === "set_shuffle") {
    const mode = String(payload.mode || "").toLowerCase();
    if (mode === "off" || mode === "shuffle" || mode === "smart") {
      payload.mode = mode;
      payload.value = mode !== "off";
    } else {
      payload.mode = null;
    }

    const normalizedMode = payload.mode || (payload.value ? "shuffle" : "off");
    await promisePool.query(
      "INSERT INTO guild_music_state (guild_id, shuffle_mode, is_shuffle_enabled) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE shuffle_mode = VALUES(shuffle_mode), is_shuffle_enabled = VALUES(is_shuffle_enabled)",
      [guildId, normalizedMode, normalizedMode === "off" ? 0 : 1],
    );
  }

  if (action === "enqueue_playlists") {
    const rawPlaylists = Array.isArray(body?.playlists) ? body.playlists : [];
    if (!rawPlaylists.length) {
      return jsonResponse({ error: "playlists are required" }, 400);
    }

    const playlists = rawPlaylists
      .slice(0, 50)
      .map((item) => {
        const playlistId = toPositiveInt(item?.playlist_id);
        const playlistName = truncate(item?.playlist_name, 255);
        const playlistScope = String(item?.playlist_scope || "").slice(0, 16);

        if (!playlistId && !playlistName) {
          return null;
        }

        return {
          playlist_id: playlistId,
          playlist_name: playlistName || null,
          playlist_scope: playlistScope,
        };
      })
      .filter(Boolean);

    if (!playlists.length) {
      return jsonResponse(
        { error: "Each playlist needs playlist_id or playlist_name" },
        400,
      );
    }

    payload.playlists = playlists;

    const recentUserPlaylistIds = [
      ...new Set(
        playlists
          .filter((item) => item.playlist_scope === "user" && item.playlist_id)
          .map((item) => item.playlist_id),
      ),
    ];

    for (const playlistId of recentUserPlaylistIds) {
      await upsertRecentUserPlaylist(guildId, session.user.id, playlistId);
    }
  }

  if (action === "pin_user_playlist" || action === "unpin_user_playlist") {
    const playlistId = toPositiveInt(payload.playlist_id);
    if (!playlistId) {
      return jsonResponse({ error: "playlist_id is required" }, 400);
    }

    const existsInGuild = await playlistBelongsToGuild(playlistId, guildId);
    if (!existsInGuild) {
      return jsonResponse({ error: "Playlist not found" }, 404);
    }

    if (action === "pin_user_playlist") {
      const [countRows] = await promisePool.query(
        "SELECT COUNT(*) AS total FROM guild_user_music_playlist_pins WHERE guild_id = ? AND user_id = ?",
        [guildId, session.user.id],
      );

      const currentPinnedCount = Number(countRows?.[0]?.total || 0);
      const [alreadyPinnedRows] = await promisePool.query(
        "SELECT 1 AS is_pinned FROM guild_user_music_playlist_pins WHERE guild_id = ? AND user_id = ? AND playlist_id = ? LIMIT 1",
        [guildId, session.user.id, playlistId],
      );

      if (!alreadyPinnedRows?.length && currentPinnedCount >= 8) {
        return jsonResponse({ error: "Maximum 8 pinned playlists" }, 409);
      }

      await promisePool.query(
        "INSERT INTO guild_user_music_playlist_pins (guild_id, user_id, playlist_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE pinned_at = pinned_at",
        [guildId, session.user.id, playlistId],
      );

      return jsonResponse({ ok: true });
    }

    await promisePool.query(
      "DELETE FROM guild_user_music_playlist_pins WHERE guild_id = ? AND user_id = ? AND playlist_id = ?",
      [guildId, session.user.id, playlistId],
    );

    return jsonResponse({ ok: true });
  }

  if (action === "create_user_playlist") {
    const playlistName = truncate(payload.playlist_name, 255);
    if (!playlistName) {
      return jsonResponse({ error: "playlist_name is required" }, 400);
    }

    try {
      const [result] = await promisePool.query(
        "INSERT INTO guild_music_playlists (guild_id, name, created_by) VALUES (?, ?, ?)",
        [guildId, playlistName, session.user.id],
      );
      return jsonResponse({ ok: true, playlist_id: result.insertId });
    } catch (error) {
      if (
        String(error?.message || "")
          .toLowerCase()
          .includes("duplicate")
      ) {
        return jsonResponse(
          { error: "Playlist with this name already exists" },
          409,
        );
      }
      return jsonResponse({ error: "Could not create playlist" }, 500);
    }
  }

  if (action === "delete_user_playlist") {
    const playlistId = toPositiveInt(payload.playlist_id);
    if (!playlistId) {
      return jsonResponse({ error: "playlist_id is required" }, 400);
    }

    await promisePool.query(
      "DELETE FROM guild_music_playlists WHERE id = ? AND guild_id = ?",
      [playlistId, guildId],
    );

    return jsonResponse({ ok: true });
  }

  if (action === "add_track_to_user_playlist") {
    const playlistId = toPositiveInt(payload.playlist_id);
    if (!playlistId || !payload.track_key) {
      return jsonResponse(
        { error: "playlist_id and track_key are required" },
        400,
      );
    }

    const [playlistRows] = await promisePool.query(
      "SELECT id FROM guild_music_playlists WHERE id = ? AND guild_id = ? LIMIT 1",
      [playlistId, guildId],
    );
    if (!playlistRows?.length) {
      return jsonResponse({ error: "Playlist not found" }, 404);
    }

    const [trackRows] = await promisePool.query(
      "SELECT track_key FROM music_library_tracks WHERE track_key = ? LIMIT 1",
      [payload.track_key],
    );
    if (!trackRows?.length) {
      return jsonResponse({ error: "Track not found in library" }, 404);
    }

    const [maxPositionRows] = await promisePool.query(
      "SELECT COALESCE(MAX(position), 0) AS max_position FROM guild_music_playlist_tracks WHERE playlist_id = ?",
      [playlistId],
    );

    const nextPosition = Number(maxPositionRows?.[0]?.max_position || 0) + 1;
    await promisePool.query(
      "INSERT INTO guild_music_playlist_tracks (playlist_id, track_key, position, added_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE track_key = track_key",
      [playlistId, payload.track_key, nextPosition, session.user.id],
    );

    return jsonResponse({ ok: true });
  }

  if (action === "remove_track_from_user_playlist") {
    const playlistId = toPositiveInt(payload.playlist_id);
    if (!playlistId || !payload.track_key) {
      return jsonResponse(
        { error: "playlist_id and track_key are required" },
        400,
      );
    }

    await promisePool.query(
      "DELETE FROM guild_music_playlist_tracks WHERE playlist_id = ? AND track_key = ?",
      [playlistId, payload.track_key],
    );

    const [remainingRows] = await promisePool.query(
      "SELECT track_key FROM guild_music_playlist_tracks WHERE playlist_id = ? ORDER BY position ASC, created_at ASC",
      [playlistId],
    );

    for (let index = 0; index < remainingRows.length; index += 1) {
      await promisePool.query(
        "UPDATE guild_music_playlist_tracks SET position = ? WHERE playlist_id = ? AND track_key = ?",
        [index + 1, playlistId, remainingRows[index].track_key],
      );
    }

    return jsonResponse({ ok: true });
  }

  const [result] = await promisePool.query(
    "INSERT INTO music_command_queue (guild_id, action, payload_json, requested_by, status) VALUES (?, ?, ?, ?, 'pending')",
    [guildId, action, JSON.stringify(payload), session.user.id],
  );

  return jsonResponse({
    ok: true,
    command_id: result.insertId,
  });
}
