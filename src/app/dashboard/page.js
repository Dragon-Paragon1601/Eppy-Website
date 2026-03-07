"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Save,
  Settings2,
  Shield,
  Undo2,
} from "lucide-react";

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
    id: "queue-channel",
    key: "queue_channel_id",
    label: "Queue",
    toggleKey: "queue_notifications_enabled",
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

const ACCENT_TEXT_CLASS = "text-blue-300";
const ACCENT_BORDER_CLASS = "border-blue-500/70";

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [servers, setServers] = useState([]);
  const [channelsByGuild, setChannelsByGuild] = useState({});
  const [rolesByGuild, setRolesByGuild] = useState({});
  const [settingsByGuild, setSettingsByGuild] = useState({});
  const [selectedGuildId, setSelectedGuildId] = useState("");
  const [isServerListOpen, setIsServerListOpen] = useState(false);
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

  useEffect(() => {
    if (!isServerListOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsServerListOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isServerListOpen]);

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
    setIsServerListOpen(false);
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
    return (
      <main className="mx-auto mt-12 max-w-5xl px-4 md:px-6 text-white">
        <div className="rounded-2xl border border-zinc-700 bg-zinc-950/80 p-6 text-center text-zinc-300">
          Loading session...
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="mx-auto mt-12 max-w-5xl px-4 md:px-6 text-white">
        <div className="rounded-2xl border border-zinc-700 bg-zinc-950/80 p-6 text-center text-zinc-300">
          You need to sign in to view the dashboard.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-white md:px-6">
      <section className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Server tools
          </p>
          <h1 className="mt-1 text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-300">
            Configure channels and notification roles for the selected server.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${ACCENT_BORDER_CLASS} bg-blue-500/15 ${ACCENT_TEXT_CLASS}`}
          >
            <Shield size={14} />
            Editable servers: {editableServersCount}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-zinc-300">
            <Bell size={14} />
            Notification center
          </span>
        </div>
      </section>

      {isLoading ? (
        <section className="grid animate-pulse grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-36 rounded-2xl border border-zinc-800 bg-zinc-900/80" />
          <div className="h-36 rounded-2xl border border-zinc-800 bg-zinc-900/80 lg:col-span-2" />
          <div className="h-[33rem] rounded-2xl border border-zinc-800 bg-zinc-900/80 lg:col-span-3" />
        </section>
      ) : (
        <>
          <section className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-zinc-700 bg-zinc-950/80 p-4 lg:col-span-1">
              <p className="mb-2 text-xs uppercase tracking-wide text-zinc-400">
                Select server
              </p>

              {servers.length === 0 ? (
                <div className="w-full rounded-md border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-400">
                  No shared servers with bot
                </div>
              ) : (
                <div className="relative">
                  {isServerListOpen ? (
                    <button
                      type="button"
                      aria-label="Close server list"
                      onClick={() => setIsServerListOpen(false)}
                      className="fixed inset-0 z-20 bg-black/20"
                    />
                  ) : null}

                  <div className="relative z-30">
                    <button
                      type="button"
                      onClick={() =>
                        setIsServerListOpen((prev) =>
                          servers.length > 1 ? !prev : prev,
                        )
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900/85 px-3 py-2 text-left transition hover:border-zinc-500 hover:bg-zinc-900"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {selectedGuild?.guild_icon ? (
                            <Image
                              src={selectedGuild.guild_icon}
                              alt={selectedGuild.guild_name}
                              width={28}
                              height={28}
                              className={`rounded-full border border-zinc-600 ${
                                selectedGuild.can_edit ? "" : "opacity-45"
                              }`}
                            />
                          ) : (
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold ${
                                selectedGuild?.can_edit ? "" : "opacity-45"
                              }`}
                            >
                              {selectedGuild?.guild_name?.[0] || "?"}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="text-xs text-zinc-400">
                              Active guild
                            </p>
                            <p
                              className={`truncate text-sm ${
                                selectedGuild?.can_edit
                                  ? "text-zinc-100"
                                  : "text-zinc-500"
                              }`}
                            >
                              {selectedGuild?.guild_name ||
                                "No server selected"}
                            </p>
                          </div>
                        </div>

                        <ChevronDown
                          size={16}
                          className={`text-zinc-300 transition-transform ${
                            isServerListOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {isServerListOpen ? (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 rounded-lg border border-zinc-700 bg-zinc-950/95 p-2 shadow-lg backdrop-blur-sm">
                        <div className="app-scrollbar max-h-64 space-y-2 overflow-y-auto pr-1">
                          {servers
                            .filter(
                              (server) => server.guild_id !== selectedGuildId,
                            )
                            .map((server) => (
                              <button
                                key={server.guild_id}
                                type="button"
                                onClick={() =>
                                  handleGuildChange(server.guild_id)
                                }
                                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-left transition hover:bg-zinc-800"
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
                                      className={`flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold ${
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
                                      <p className="text-[11px] text-zinc-500">
                                        no permissions
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              <p className="mt-3 text-xs text-zinc-400">
                You can choose only servers where both you and Eppy are present.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-700 bg-zinc-950/80 p-4 lg:col-span-2">
              {selectedGuild ? (
                <div className="flex items-start gap-3 md:items-center">
                  {selectedGuild.guild_icon ? (
                    <Image
                      src={selectedGuild.guild_icon}
                      alt={selectedGuild.guild_name}
                      width={54}
                      height={54}
                      className="rounded-full border border-zinc-600"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700 font-bold">
                      {selectedGuild.guild_name?.[0] || "?"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-semibold text-zinc-100">
                      {selectedGuild.guild_name}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Guild ID: {selectedGuild.guild_id}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-zinc-300">
                        Nickname:{" "}
                        {selectedGuild.member_profile?.nickname ||
                          "No nickname"}
                      </span>
                      <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-zinc-300">
                        Username:{" "}
                        {selectedGuild.member_profile?.username ||
                          session.user?.name ||
                          "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-300">
                  Select a server to view its settings.
                </p>
              )}
            </div>
          </section>

          {selectedGuild ? (
            <section className="relative rounded-2xl border border-zinc-700 bg-zinc-950/80 p-4 md:p-5">
              {!selectedGuild.can_edit ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/35 p-6 text-center backdrop-blur-[6px]">
                  <p className="max-w-md text-sm text-zinc-200">
                    You do not have permissions to edit settings on this server.
                    You can view the configuration, but saving is disabled.
                  </p>
                </div>
              ) : null}

              <div
                className={`space-y-6 ${selectedGuild.can_edit ? "" : "opacity-70"}`}
              >
                <section>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className={ACCENT_TEXT_CLASS} />
                      <h2 className="text-lg font-semibold">Notifications</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">
                        Category enabled
                      </span>
                      <ToggleSwitch
                        id="notifications-category-enabled"
                        checked={form.notifications_enabled}
                        onChange={(value) =>
                          handleFieldChange("notifications_enabled", value)
                        }
                        label="Category enabled"
                      />
                    </div>
                  </div>

                  <div
                    className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${
                      form.notifications_enabled ? "" : "opacity-60"
                    }`}
                  >
                    {NOTIFICATION_FIELDS.map((field) => {
                      const channelEnabled = form[field.toggleKey];
                      const fieldActive =
                        form.notifications_enabled && channelEnabled;

                      return (
                        <article
                          key={field.key}
                          className={`rounded-xl border bg-zinc-900/65 p-3 transition hover:border-zinc-500 ${
                            fieldActive
                              ? `${ACCENT_BORDER_CLASS} shadow-[0_0_0_1px_rgba(59,130,246,0.15)]`
                              : "border-zinc-700"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
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
                            <p className="mt-1 text-[11px] text-amber-300">
                              Channel is required when enabled.
                            </p>
                          ) : null}

                          {!field.requiresChannel ? (
                            <p className="mt-1 text-[11px] text-zinc-400">
                              Without selected channel, bot uses command
                              channel.
                            </p>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Settings2 size={16} className="text-cyan-300" />
                    <h2 className="text-lg font-semibold">Roles</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

                <section className="flex flex-col gap-3 border-t border-zinc-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div
                    className={`inline-flex items-center gap-2 text-sm ${
                      isDirty ? "text-amber-200" : "text-emerald-200"
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    {isDirty
                      ? "You have unsaved changes."
                      : "All changes saved."}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!isDirty || isSaving || !selectedGuild.can_edit}
                    >
                      <Undo2 size={15} />
                      Reset
                    </button>
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center gap-1.5 rounded-md border border-blue-600/70 bg-blue-600/20 px-4 py-2 text-sm text-blue-100 transition hover:bg-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!isDirty || isSaving || !selectedGuild.can_edit}
                    >
                      <Save size={15} />
                      {isSaving ? "Saving..." : "Save settings"}
                    </button>
                  </div>
                </section>

                {saveState.message ? (
                  <p
                    className={`rounded-md border px-3 py-2 text-sm ${
                      saveState.type === "error"
                        ? "border-red-700 bg-red-900/50 text-red-200"
                        : "border-emerald-700 bg-emerald-900/50 text-emerald-200"
                    }`}
                  >
                    {saveState.message}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}
        </>
      )}
    </main>
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition ${
        disabled
          ? "cursor-not-allowed border-zinc-700 bg-zinc-700/80 opacity-50"
          : checked
            ? "border-blue-500/70 bg-blue-500/30"
            : "border-zinc-700 bg-zinc-700/80"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          checked ? "translate-x-6" : "translate-x-1.5"
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

function formatRoleName(roleName) {
  const safeName = String(roleName || "").trim();
  if (!safeName.length) {
    return "unknown";
  }

  return safeName.replace(/^@+/, "");
}

function RoleSelect({ id, label, value, roles, onChange, disabled = false }) {
  const selectedRole = roles.find((role) => role.role_id === value) || null;
  const selectedColor = selectedRole
    ? formatRoleColor(selectedRole.role_color)
    : null;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs uppercase tracking-wide text-zinc-400"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
        style={
          selectedColor
            ? {
                borderColor: selectedColor,
                boxShadow: `0 0 0 1px ${selectedColor}`,
              }
            : undefined
        }
      >
        <option value="">None</option>
        {roles.map((role) => {
          const displayName = formatRoleName(role.role_name);
          const level = Number(role.permission_level || 0);
          return (
            <option key={role.role_id} value={role.role_id}>
              @{displayName} • lvl {level}
            </option>
          );
        })}
      </select>

      {selectedRole ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-300">
          <span
            className="inline-block h-3 w-3 rounded-full border border-zinc-500"
            style={{ backgroundColor: selectedColor }}
            aria-hidden
          />
          <span>Selected: @{formatRoleName(selectedRole.role_name)}</span>
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
      <label
        htmlFor={id}
        className="mb-1 block text-xs uppercase tracking-wide text-zinc-400"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
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
