"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

const EMPTY_SETTINGS = {
  queue_channel_id: "",
  notification_channel_id: "",
  welcome_channel_id: "",
  update_notification_channel_id: "",
  ban_notification_channel_id: "",
  kick_notification_channel_id: "",
  notification_role_id: "",
};

const PRIMARY_CHANNEL_FIELDS = [
  {
    id: "kick-notification-channel",
    key: "kick_notification_channel_id",
    label: "Kick",
  },
  {
    id: "ban-notification-channel",
    key: "ban_notification_channel_id",
    label: "Ban",
  },
  {
    id: "welcome-channel",
    key: "welcome_channel_id",
    label: "Welcome",
  },
  {
    id: "queue-channel",
    key: "queue_channel_id",
    label: "Queue",
  },
];

const EVENT_CHANNEL_FIELDS = [
  {
    id: "notification-channel",
    key: "notification_channel_id",
    label: "Eppy Notifications",
  },
  {
    id: "update-notification-channel",
    key: "update_notification_channel_id",
    label: "Eppy Updates",
  },
];

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [servers, setServers] = useState([]);
  const [channelsByGuild, setChannelsByGuild] = useState({});
  const [settingsByGuild, setSettingsByGuild] = useState({});
  const [selectedGuildId, setSelectedGuildId] = useState("");
  const [form, setForm] = useState(EMPTY_SETTINGS);
  const [saveState, setSaveState] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!session) {
      return;
    }

    setIsLoading(true);

    fetch("/api/servers")
      .then((res) => res.json())
      .then((data) => {
        const nextServers = data?.servers || [];
        const nextChannels = {};
        const nextSettings = {};

        (data?.channels || []).forEach((channel) => {
          if (!nextChannels[channel.guild_id]) {
            nextChannels[channel.guild_id] = [];
          }
          nextChannels[channel.guild_id].push(channel);
        });

        (data?.guildSettings || []).forEach((guildSetting) => {
          nextSettings[guildSetting.guild_id] = {
            queue_channel_id: guildSetting.queue_channel_id || "",
            notification_channel_id: guildSetting.notification_channel_id || "",
            welcome_channel_id: guildSetting.welcome_channel_id || "",
            update_notification_channel_id:
              guildSetting.update_notification_channel_id || "",
            ban_notification_channel_id:
              guildSetting.ban_notification_channel_id || "",
            kick_notification_channel_id:
              guildSetting.kick_notification_channel_id || "",
            notification_role_id: guildSetting.notification_role_id || "",
          };
        });

        setServers(nextServers);
        setChannelsByGuild(nextChannels);
        setSettingsByGuild(nextSettings);

        if (nextServers.length > 0) {
          const firstGuildId = nextServers[0].guild_id;
          setSelectedGuildId(firstGuildId);
          setForm(nextSettings[firstGuildId] || EMPTY_SETTINGS);
        } else {
          setSelectedGuildId("");
          setForm(EMPTY_SETTINGS);
        }
      })
      .catch(() => {
        setSaveState({
          type: "error",
          message: "Could not load server list.",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [session]);

  const selectedGuild = useMemo(
    () => servers.find((server) => server.guild_id === selectedGuildId),
    [servers, selectedGuildId],
  );

  const editableServersCount = useMemo(
    () => servers.filter((server) => server.can_edit).length,
    [servers],
  );

  const selectedGuildChannels = channelsByGuild[selectedGuildId] || [];

  const savedSettings = settingsByGuild[selectedGuildId] || EMPTY_SETTINGS;

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedSettings),
    [form, savedSettings],
  );

  const handleGuildChange = (guildId) => {
    setSelectedGuildId(guildId);
    setForm(settingsByGuild[guildId] || EMPTY_SETTINGS);
    setSaveState({ type: "", message: "" });
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReset = () => {
    setForm(savedSettings);
    setSaveState({ type: "", message: "" });
  };

  const handleSave = async () => {
    if (!selectedGuildId || isSaving || !selectedGuild?.can_edit) {
      return;
    }

    setSaveState({ type: "", message: "" });
    setIsSaving(true);

    try {
      const response = await fetch("/api/servers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guild_id: selectedGuildId,
          queue_channel_id: form.queue_channel_id || null,
          notification_channel_id: form.notification_channel_id || null,
          welcome_channel_id: form.welcome_channel_id || null,
          update_notification_channel_id:
            form.update_notification_channel_id || null,
          ban_notification_channel_id: form.ban_notification_channel_id || null,
          kick_notification_channel_id:
            form.kick_notification_channel_id || null,
          notification_role_id: form.notification_role_id || null,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setSaveState({
          type: "error",
          message: payload?.error || "Could not save settings.",
        });
        return;
      }

      const nextSaved = {
        queue_channel_id: payload.queue_channel_id || "",
        notification_channel_id: payload.notification_channel_id || "",
        welcome_channel_id: payload.welcome_channel_id || "",
        update_notification_channel_id:
          payload.update_notification_channel_id || "",
        ban_notification_channel_id: payload.ban_notification_channel_id || "",
        kick_notification_channel_id:
          payload.kick_notification_channel_id || "",
        notification_role_id: payload.notification_role_id || "",
      };

      setSettingsByGuild((prev) => ({
        ...prev,
        [selectedGuildId]: nextSaved,
      }));

      setForm(nextSaved);

      setSaveState({
        type: "success",
        message: "Settings saved.",
      });
    } catch {
      setSaveState({
        type: "error",
        message: "Connection error while saving.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") {
    return <p className="text-center text-white mt-20">Loading session...</p>;
  }

  if (!session) {
    return (
      <p className="text-center text-white mt-20">
        You need to sign in to view the dashboard.
      </p>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 text-white">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Server Dashboard</h1>
          <p className="text-gray-300 mt-1 text-sm">
            Configure channels and notification role for the selected server.
          </p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-700 rounded-lg px-4 py-2 text-sm">
          Editable servers:{" "}
          <span className="font-semibold">{editableServersCount}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
          <div className="h-32 bg-zinc-800 rounded-xl" />
          <div className="h-32 bg-zinc-800 rounded-xl lg:col-span-2" />
          <div className="h-80 bg-zinc-800 rounded-xl lg:col-span-3" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 lg:col-span-1">
              <label
                htmlFor="guild-select"
                className="block mb-2 font-semibold"
              >
                Select server
              </label>
              <select
                id="guild-select"
                className="w-full p-2 rounded-md bg-zinc-950 border border-zinc-700"
                value={selectedGuildId}
                onChange={(e) => handleGuildChange(e.target.value)}
                disabled={servers.length === 0}
              >
                {servers.length === 0 ? (
                  <option value="">No shared servers with bot</option>
                ) : (
                  servers.map((server) => (
                    <option key={server.guild_id} value={server.guild_id}>
                      {server.guild_name}
                      {server.can_edit ? "" : " (read only)"}
                    </option>
                  ))
                )}
              </select>

              <p className="text-xs text-gray-400 mt-2">
                You can choose only servers where both you and Eppy are present.
              </p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-4 lg:col-span-2">
              {selectedGuild ? (
                <div className="flex items-center gap-3">
                  {selectedGuild.guild_icon ? (
                    <Image
                      src={selectedGuild.guild_icon}
                      alt={selectedGuild.guild_name}
                      width={52}
                      height={52}
                      className="rounded-full border border-zinc-600"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center font-bold">
                      {selectedGuild.guild_name?.[0] || "?"}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-lg">
                      {selectedGuild.guild_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      Guild ID: {selectedGuild.guild_id}
                    </div>
                    <div className="text-xs text-gray-300 mt-2">
                      Nickname:{" "}
                      {selectedGuild.member_profile?.nickname || "No nickname"}
                    </div>
                    <div className="text-xs text-gray-400">
                      Username:{" "}
                      {selectedGuild.member_profile?.username ||
                        session.user?.name ||
                        "Unknown"}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-300">
                  Select a server to view its settings.
                </p>
              )}
            </div>
          </div>

          {selectedGuild && (
            <div className="relative bg-zinc-900/80 border border-zinc-700 rounded-xl p-5 space-y-6">
              {!selectedGuild.can_edit ? (
                <div className="absolute inset-0 z-20 rounded-xl bg-black/35 backdrop-blur-[6px] flex items-center justify-center p-6 text-center">
                  <p className="text-sm text-zinc-200 max-w-md">
                    You do not have permissions to edit settings on this server.
                    You can view the configuration, but saving is disabled.
                  </p>
                </div>
              ) : null}

              <div className={selectedGuild.can_edit ? "" : "opacity-70"}>
                <section>
                  <h2 className="text-lg font-semibold mb-3">
                    Primary Channels
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PRIMARY_CHANNEL_FIELDS.map((field) => (
                      <ChannelSelect
                        key={field.key}
                        id={field.id}
                        label={field.label}
                        value={form[field.key]}
                        channels={selectedGuildChannels}
                        onChange={(value) =>
                          handleFieldChange(field.key, value)
                        }
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3">
                    Additional Channels
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {EVENT_CHANNEL_FIELDS.map((field) => (
                      <ChannelSelect
                        key={field.key}
                        id={field.id}
                        label={field.label}
                        value={form[field.key]}
                        channels={selectedGuildChannels}
                        onChange={(value) =>
                          handleFieldChange(field.key, value)
                        }
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3">Role</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="notification-role-id"
                        className="block mb-1 text-sm text-gray-200"
                      >
                        Discord role ID
                      </label>
                      <input
                        id="notification-role-id"
                        type="text"
                        value={form.notification_role_id}
                        onChange={(e) =>
                          handleFieldChange(
                            "notification_role_id",
                            e.target.value.replace(/\D/g, ""),
                          )
                        }
                        className="w-full p-2 rounded-md bg-zinc-950 border border-zinc-700"
                        placeholder="Example: 123456789012345678"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Enable Developer Mode in Discord and copy the role ID.
                      </p>
                    </div>
                  </div>
                </section>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
                  <div className="text-sm text-gray-300">
                    {isDirty
                      ? "You have unsaved changes."
                      : "All changes saved."}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 rounded-md border border-zinc-600 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50"
                      disabled={!isDirty || isSaving || !selectedGuild.can_edit}
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!isDirty || isSaving || !selectedGuild.can_edit}
                    >
                      {isSaving ? "Saving..." : "Save settings"}
                    </button>
                  </div>
                </div>

                {saveState.message ? (
                  <p
                    className={`text-sm rounded-md px-3 py-2 ${
                      saveState.type === "error"
                        ? "bg-red-900/50 border border-red-700 text-red-200"
                        : "bg-emerald-900/50 border border-emerald-700 text-emerald-200"
                    }`}
                  >
                    {saveState.message}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ChannelSelect({ id, label, value, channels, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="block mb-1 text-sm text-gray-200">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 rounded-md bg-zinc-950 border border-zinc-700"
      >
        <option value="">None (clear setting)</option>
        {channels.map((channel) => (
          <option key={channel.channel_id} value={channel.channel_id}>
            #{channel.channel_name}
          </option>
        ))}
      </select>
    </div>
  );
}
