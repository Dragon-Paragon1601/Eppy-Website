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
  update_notification_role_id: "",
  notifications_enabled: true,
  queue_notifications_enabled: true,
  welcome_notifications_enabled: false,
  ban_notifications_enabled: true,
  kick_notifications_enabled: true,
  notification_channel_enabled: false,
  update_notification_channel_enabled: false,
};

const NOTIFICATION_FIELDS = [
  {
    id: "kick-notification-channel",
    key: "kick_notification_channel_id",
    label: "Kick",
    toggleKey: "kick_notifications_enabled",
    requiresChannel: false,
  },
  {
    id: "ban-notification-channel",
    key: "ban_notification_channel_id",
    label: "Ban",
    toggleKey: "ban_notifications_enabled",
    requiresChannel: false,
  },
  {
    id: "welcome-channel",
    key: "welcome_channel_id",
    label: "Welcome",
    toggleKey: "welcome_notifications_enabled",
    requiresChannel: true,
  },
  {
    id: "queue-channel",
    key: "queue_channel_id",
    label: "Queue",
    toggleKey: "queue_notifications_enabled",
    requiresChannel: false,
  },
  {
    id: "notification-channel",
    key: "notification_channel_id",
    label: "Eppy Notifications",
    toggleKey: "notification_channel_enabled",
    requiresChannel: true,
  },
  {
    id: "update-notification-channel",
    key: "update_notification_channel_id",
    label: "Eppy Updates",
    toggleKey: "update_notification_channel_enabled",
    requiresChannel: true,
  },
];

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [servers, setServers] = useState([]);
  const [channelsByGuild, setChannelsByGuild] = useState({});
  const [rolesByGuild, setRolesByGuild] = useState({});
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
        const nextRoles = {};
        const nextSettings = {};

        (data?.channels || []).forEach((channel) => {
          if (!nextChannels[channel.guild_id]) {
            nextChannels[channel.guild_id] = [];
          }
          nextChannels[channel.guild_id].push(channel);
        });

        (data?.roles || []).forEach((role) => {
          if (!nextRoles[role.guild_id]) {
            nextRoles[role.guild_id] = [];
          }
          nextRoles[role.guild_id].push(role);
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
            update_notification_role_id:
              guildSetting.update_notification_role_id || "",
            notifications_enabled: guildSetting.notifications_enabled !== false,
            queue_notifications_enabled:
              guildSetting.queue_notifications_enabled !== false,
            welcome_notifications_enabled:
              guildSetting.welcome_notifications_enabled !== false,
            ban_notifications_enabled:
              guildSetting.ban_notifications_enabled !== false,
            kick_notifications_enabled:
              guildSetting.kick_notifications_enabled !== false,
            notification_channel_enabled:
              guildSetting.notification_channel_enabled !== false,
            update_notification_channel_enabled:
              guildSetting.update_notification_channel_enabled !== false,
          };
        });

        setServers(nextServers);
        setChannelsByGuild(nextChannels);
        setRolesByGuild(nextRoles);
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
  const selectedGuildRoles = rolesByGuild[selectedGuildId] || [];

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
          update_notification_role_id: form.update_notification_role_id || null,
          notifications_enabled: form.notifications_enabled,
          queue_notifications_enabled: form.queue_notifications_enabled,
          welcome_notifications_enabled: form.welcome_notifications_enabled,
          ban_notifications_enabled: form.ban_notifications_enabled,
          kick_notifications_enabled: form.kick_notifications_enabled,
          notification_channel_enabled: form.notification_channel_enabled,
          update_notification_channel_enabled:
            form.update_notification_channel_enabled,
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
        update_notification_role_id: payload.update_notification_role_id || "",
        notifications_enabled: payload.notifications_enabled !== false,
        queue_notifications_enabled:
          payload.queue_notifications_enabled !== false,
        welcome_notifications_enabled:
          payload.welcome_notifications_enabled !== false,
        ban_notifications_enabled: payload.ban_notifications_enabled !== false,
        kick_notifications_enabled:
          payload.kick_notifications_enabled !== false,
        notification_channel_enabled:
          payload.notification_channel_enabled !== false,
        update_notification_channel_enabled:
          payload.update_notification_channel_enabled !== false,
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
            Configure channels and notification roles for the selected server.
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
              <p className="block mb-2 font-semibold">Select server</p>

              {servers.length === 0 ? (
                <div className="w-full p-3 rounded-md bg-zinc-950 border border-zinc-700 text-sm text-zinc-400">
                  No shared servers with bot
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {servers.map((server) => {
                    const isSelected = selectedGuildId === server.guild_id;

                    return (
                      <button
                        key={server.guild_id}
                        type="button"
                        onClick={() => handleGuildChange(server.guild_id)}
                        className={`w-full rounded-md border px-3 py-2 text-left transition ${
                          isSelected
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-zinc-700 bg-zinc-950 hover:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {server.guild_icon ? (
                            <Image
                              src={server.guild_icon}
                              alt={server.guild_name}
                              width={28}
                              height={28}
                              className={`rounded-full border border-zinc-600 ${
                                server.can_edit ? "" : "opacity-45"
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold ${
                                server.can_edit ? "" : "opacity-45"
                              }`}
                            >
                              {server.guild_name?.[0] || "?"}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p
                              className={`truncate text-sm ${
                                server.can_edit
                                  ? "text-zinc-100"
                                  : "text-zinc-500"
                              }`}
                            >
                              {server.guild_name}
                            </p>
                            {!server.can_edit ? (
                              <p className="text-[11px] leading-tight text-zinc-500">
                                no permissions
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

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
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <h2 className="text-lg font-semibold">Notifications</h2>
                    <ToggleSwitch
                      id="notifications-category-enabled"
                      checked={form.notifications_enabled}
                      onChange={(value) =>
                        handleFieldChange("notifications_enabled", value)
                      }
                      label="Category enabled"
                    />
                  </div>

                  <div
                    className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
                      form.notifications_enabled ? "" : "opacity-60"
                    }`}
                  >
                    {NOTIFICATION_FIELDS.map((field) => {
                      const channelEnabled = form[field.toggleKey];
                      const fieldActive =
                        form.notifications_enabled && channelEnabled;

                      return (
                        <div
                          key={field.key}
                          className="rounded-lg border border-zinc-700 bg-zinc-950/60 p-3"
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <p className="text-sm font-medium text-zinc-100">
                              {field.label}
                            </p>
                            <ToggleSwitch
                              id={`${field.id}-enabled`}
                              checked={channelEnabled}
                              onChange={(value) =>
                                handleFieldChange(field.toggleKey, value)
                              }
                              label="Enabled"
                              disabled={!form.notifications_enabled}
                            />
                          </div>

                          <ChannelSelect
                            id={field.id}
                            label="Channel"
                            value={form[field.key]}
                            channels={selectedGuildChannels}
                            onChange={(value) =>
                              handleFieldChange(field.key, value)
                            }
                            disabled={!fieldActive}
                            emptyLabel={
                              field.requiresChannel
                                ? "Select channel"
                                : "None (use command channel)"
                            }
                          />

                          {field.requiresChannel &&
                          fieldActive &&
                          !form[field.key] ? (
                            <p className="text-[11px] text-amber-300 mt-1">
                              Channel is required when enabled.
                            </p>
                          ) : null}

                          {!field.requiresChannel ? (
                            <p className="text-[11px] text-zinc-400 mt-1">
                              Without selected channel, bot uses command
                              channel.
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-semibold mb-3">Roles</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RoleSelect
                      id="notification-role-id"
                      label="Notification role"
                      value={form.notification_role_id}
                      roles={selectedGuildRoles}
                      onChange={(value) =>
                        handleFieldChange("notification_role_id", value)
                      }
                    />

                    <RoleSelect
                      id="update-notification-role-id"
                      label="Update notification role"
                      value={form.update_notification_role_id}
                      roles={selectedGuildRoles}
                      onChange={(value) =>
                        handleFieldChange("update_notification_role_id", value)
                      }
                    />
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

function ToggleSwitch({ id, checked, onChange, label, disabled = false }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        if (!disabled) {
          onChange(!checked);
        }
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        disabled
          ? "opacity-50 cursor-not-allowed bg-zinc-700"
          : checked
            ? "bg-blue-600"
            : "bg-zinc-600"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function formatRoleColor(colorValue) {
  const numeric = Number(colorValue || 0);
  const safeNumber = Number.isFinite(numeric) ? numeric : 0;
  return `#${safeNumber.toString(16).padStart(6, "0").toUpperCase()}`;
}

function RoleSelect({ id, label, value, roles, onChange, disabled = false }) {
  const selectedRole = roles.find((role) => role.role_id === value) || null;
  const selectedColor = selectedRole
    ? formatRoleColor(selectedRole.role_color)
    : null;

  return (
    <div>
      <label htmlFor={id} className="block mb-1 text-sm text-gray-200">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full p-2 rounded-md bg-zinc-950 border border-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <option value="">None</option>
        {roles.map((role) => {
          const colorHex = formatRoleColor(role.role_color);
          const level = Number(role.permission_level || 0);
          return (
            <option key={role.role_id} value={role.role_id}>
              @{role.role_name} • {colorHex} • lvl {level}
            </option>
          );
        })}
      </select>

      {selectedRole ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-300">
          <span
            className="inline-block h-3 w-3 rounded-full border border-zinc-600"
            style={{ backgroundColor: selectedColor }}
            aria-hidden
          />
          <span>
            Selected: @{selectedRole.role_name} ({selectedColor})
          </span>
        </div>
      ) : (
        <p className="text-xs text-zinc-400 mt-1">No role selected.</p>
      )}
    </div>
  );
}

function ChannelSelect({
  id,
  label,
  value,
  channels,
  onChange,
  disabled = false,
  emptyLabel = "None (clear setting)",
}) {
  return (
    <div>
      <label htmlFor={id} className="block mb-1 text-sm text-gray-200">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full p-2 rounded-md bg-zinc-950 border border-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <option value="">{emptyLabel}</option>
        {channels.map((channel) => (
          <option key={channel.channel_id} value={channel.channel_id}>
            #{channel.channel_name}
          </option>
        ))}
      </select>
    </div>
  );
}
