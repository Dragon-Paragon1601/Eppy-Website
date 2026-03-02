"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ChevronDown,
  Library,
  Pause,
  Play,
  Plus,
  Repeat,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Trash2,
} from "lucide-react";

const ACCENT_CLASS = "text-blue-300";
const ACCENT_BORDER_CLASS = "border-blue-500/70";

const EMPTY_MUSIC_STATE = {
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

const HOME_COLLECTIONS = [
  {
    id: "home-a1",
    type: "artist",
    title: "Ado Collection",
    subtitle: "26 tracks",
  },
  {
    id: "home-a2",
    type: "artist",
    title: "Kenshi Yonezu Library",
    subtitle: "18 tracks",
  },
  {
    id: "home-a3",
    type: "artist",
    title: "LiSA Collection",
    subtitle: "22 tracks",
  },
  {
    id: "home-p1",
    type: "playlist",
    title: "Top Premade Mix",
    subtitle: "32 tracks",
  },
  {
    id: "home-p2",
    type: "playlist",
    title: "Night Drive",
    subtitle: "18 tracks",
  },
  {
    id: "home-p3",
    type: "playlist",
    title: "Openings Collection",
    subtitle: "44 tracks",
  },
];

function durationToSeconds(duration) {
  const [minutes, seconds] = String(duration || "0:00")
    .split(":")
    .map((value) => Number(value) || 0);
  return minutes * 60 + seconds;
}

export default function MusicPage() {
  const { data: session } = useSession();
  const [servers, setServers] = useState([]);
  const [selectedGuildId, setSelectedGuildId] = useState("");
  const [isServerPickerOpen, setIsServerPickerOpen] = useState(false);
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [isSendingAction, setIsSendingAction] = useState(false);
  const [musicState, setMusicState] = useState(EMPTY_MUSIC_STATE);
  const [libraryTracks, setLibraryTracks] = useState([]);
  const [premadePlaylists, setPremadePlaylists] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [userVoiceState, setUserVoiceState] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedUserPlaylistId, setSelectedUserPlaylistId] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState("number");
  const [sortDirection, setSortDirection] = useState("asc");
  const [browseTitle, setBrowseTitle] = useState("Home");
  const [browseView, setBrowseView] = useState("home");
  const [selectedPlaylistName, setSelectedPlaylistName] = useState("");
  const [selectedPlaylistKeys, setSelectedPlaylistKeys] = useState([]);
  const [selectedTrackKeys, setSelectedTrackKeys] = useState([]);
  const [isAddToPlaylistsOpen, setIsAddToPlaylistsOpen] = useState(false);
  const [pendingAddTrackKeys, setPendingAddTrackKeys] = useState([]);
  const [checkedPlaylistIds, setCheckedPlaylistIds] = useState([]);
  const [queueTab, setQueueTab] = useState("queue");
  const [activeControlFlash, setActiveControlFlash] = useState("");

  useEffect(() => {
    if (!session) return;

    setIsLoadingServers(true);
    fetch("/api/servers", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        const fetchedServers = Array.isArray(payload?.servers)
          ? payload.servers
          : [];
        setServers(fetchedServers);
      })
      .finally(() => {
        setIsLoadingServers(false);
      });
  }, [session]);

  useEffect(() => {
    if (selectedGuildId || !servers.length) return;
    const preferredGuild =
      servers.find((server) => server.can_edit) || servers[0];
    setSelectedGuildId(preferredGuild.guild_id);
  }, [servers, selectedGuildId]);

  const fetchMusicState = useCallback(
    async (guildId) => {
      if (!guildId || !session) return;

      const response = await fetch(`/api/music?guild_id=${guildId}`, {
        cache: "no-store",
      });

      if (!response.ok) return;
      const payload = await response.json();
      setMusicState(payload?.state || EMPTY_MUSIC_STATE);
      setLibraryTracks(
        Array.isArray(payload?.libraryTracks) ? payload.libraryTracks : [],
      );
      setPremadePlaylists(
        Array.isArray(payload?.premadePlaylists)
          ? payload.premadePlaylists
          : [],
      );
      setUserPlaylists(
        Array.isArray(payload?.userPlaylists) ? payload.userPlaylists : [],
      );
      setUserVoiceState(payload?.userVoiceState || null);
    },
    [session],
  );

  useEffect(() => {
    if (!selectedGuildId || !session) return;

    let isCancelled = false;

    const run = async () => {
      if (isCancelled) return;
      await fetchMusicState(selectedGuildId);
    };

    run();
    const timer = setInterval(run, 2500);

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [selectedGuildId, session, fetchMusicState]);

  const selectedGuild = useMemo(
    () => servers.find((server) => server.guild_id === selectedGuildId),
    [selectedGuildId, servers],
  );

  const runActionBatch = useCallback(
    async (actions = []) => {
      if (!selectedGuildId || isSendingAction || !actions.length) return;

      setIsSendingAction(true);
      try {
        for (const item of actions) {
          await fetch("/api/music", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              guild_id: selectedGuildId,
              action: item.action,
              ...(item.payload || {}),
            }),
          });
        }
      } finally {
        setIsSendingAction(false);
      }

      await fetchMusicState(selectedGuildId);
    },
    [fetchMusicState, isSendingAction, selectedGuildId],
  );

  const sendAction = useCallback(
    async (action, payload = {}) => {
      await runActionBatch([{ action, payload }]);
    },
    [runActionBatch],
  );

  const shuffleMode =
    musicState.shuffle_mode === "smart" || musicState.shuffle_mode === "shuffle"
      ? musicState.shuffle_mode
      : musicState.is_shuffle_enabled === true
        ? "shuffle"
        : "off";
  const shuffleEnabled = shuffleMode !== "off";
  const smartShuffleEnabled = shuffleMode === "smart";
  const loopEnabled = musicState.is_loop_enabled === true;

  const sortedLibraryTracks = useMemo(() => {
    const tracksWithNumber = libraryTracks.map((track, index) => ({
      ...track,
      id: track.track_key || track.path || `track-${index}`,
      number: index + 1,
      duration: track.duration || "--:--",
    }));

    return [...tracksWithNumber].sort((left, right) => {
      let result = 0;

      if (sortBy === "artist") {
        result = left.artist.localeCompare(right.artist);
      } else if (sortBy === "title") {
        result = left.title.localeCompare(right.title);
      } else if (sortBy === "duration") {
        result =
          durationToSeconds(left.duration) - durationToSeconds(right.duration);
      } else {
        result = left.number - right.number;
      }

      return sortDirection === "asc" ? result : -result;
    });
  }, [libraryTracks, sortBy, sortDirection]);

  const searchResults = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query.length) {
      return [];
    }

    return sortedLibraryTracks.filter(
      (track) =>
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query),
    );
  }, [searchValue, sortedLibraryTracks]);

  const isSearchOpen = searchValue.trim().length > 0;

  const queueWithPriority = useMemo(() => {
    const priorityItems = (musicState.priorityQueue || []).map(
      (track, index) => ({
        ...track,
        isPriority: true,
        priorityIndex: index + 1,
        id: track.path || `p-${index}`,
      }),
    );
    const regularQueue = musicState.queue || [];
    const nowPlayingTitle = (musicState.now_playing_title || "")
      .trim()
      .toLowerCase();
    const nowPlayingArtist = (musicState.now_playing_artist || "")
      .trim()
      .toLowerCase();

    const firstQueueItem = regularQueue[0];
    const firstQueueTitle = (firstQueueItem?.title || "").trim().toLowerCase();
    const firstQueueArtist = (firstQueueItem?.artist || "")
      .trim()
      .toLowerCase();

    const shouldSkipFirstQueueItem =
      !!firstQueueItem &&
      nowPlayingTitle.length > 0 &&
      firstQueueTitle === nowPlayingTitle &&
      firstQueueArtist === nowPlayingArtist;

    const regularItems = (
      shouldSkipFirstQueueItem ? regularQueue.slice(1) : regularQueue
    ).map((track, index) => ({
      ...track,
      isPriority: false,
      id: track.path || `q-${index}`,
    }));

    return [...priorityItems, ...regularItems];
  }, [
    musicState.now_playing_artist,
    musicState.now_playing_title,
    musicState.priorityQueue,
    musicState.queue,
  ]);

  const previouslyPlayedItems = useMemo(
    () =>
      (musicState.previousQueue || []).map((track, index) => ({
        ...track,
        isPriority: false,
        id: track.path || `h-${index}`,
      })),
    [musicState.previousQueue],
  );

  const currentQueueItems =
    queueTab === "queue" ? queueWithPriority : previouslyPlayedItems;
  const hasQueuedTracks = queueWithPriority.length > 0;

  const currentState = useMemo(() => {
    const playbackState = musicState.playback_state || "idle";
    const showControls =
      playbackState === "playing" || playbackState === "paused";
    const canStartFromDashboard =
      playbackState === "idle" && !!userVoiceState?.channel_id;

    return {
      state:
        playbackState === "paused"
          ? "Paused"
          : playbackState === "playing"
            ? "Playing"
            : "Idle",
      channelLabel: musicState.channel_label || "No channel",
      dimmed: playbackState === "idle",
      message:
        playbackState === "playing"
          ? "Now playing with active controls."
          : playbackState === "paused"
            ? "Playback paused."
            : canStartFromDashboard
              ? `Ready to start in #${userVoiceState?.channel_name || "voice"}.`
              : "Join a voice channel and queue a track.",
      showControls,
      canStartFromDashboard,
    };
  }, [musicState, userVoiceState]);

  const handleGuildSelect = (guildId) => {
    setSelectedGuildId(guildId);
    setIsServerPickerOpen(false);
    setBrowseView("home");
    setBrowseTitle("Home");
  };

  const handlePlaylistBrowse = (playlistName, type = "playlist") => {
    setBrowseView(type);
    setBrowseTitle(playlistName);
    setSelectedPlaylistName(type === "playlist" ? playlistName : "");
  };

  const toPlaylistKey = (playlist, scope = "premade") => {
    if (!playlist) return "";
    return scope === "user"
      ? `user:${playlist.id}`
      : `premade:${playlist.name}`;
  };

  const buildPlaylistPayload = (playlist, scope = "premade") => ({
    playlist_scope: scope,
    playlist_id: scope === "user" ? playlist.id : null,
    playlist_name: playlist.name,
  });

  const handlePlaylistCardClick = (event, playlist, scope = "premade") => {
    if (!playlist) return;

    if (event?.ctrlKey) {
      const key = toPlaylistKey(playlist, scope);
      if (scope === "user") {
        setSelectedUserPlaylistId(null);
      }
      setSelectedPlaylistKeys((current) =>
        current.includes(key)
          ? current.filter((item) => item !== key)
          : [...current, key],
      );
      return;
    }

    setSelectedPlaylistKeys([]);
    setSelectedTrackKeys([]);

    if (scope === "user") {
      setSelectedUserPlaylistId(playlist.id);
    } else {
      setSelectedUserPlaylistId(null);
    }

    handlePlaylistBrowse(playlist.name, "playlist");
  };

  const handleCreatePlaylist = () => {
    const safeName = newPlaylistName.trim();
    if (!safeName.length) return;

    sendAction("create_user_playlist", { playlist_name: safeName });
    setNewPlaylistName("");
  };

  const handleDeletePlaylist = (playlistId, playlistName = "this playlist") => {
    if (!playlistId) return;

    const confirmed = window.confirm(
      `Delete playlist "${playlistName}"? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    sendAction("delete_user_playlist", { playlist_id: playlistId });
    if (selectedUserPlaylistId === playlistId) {
      setSelectedUserPlaylistId(null);
    }
  };

  const handleAddTrackToSelectedPlaylist = (track) => {
    if (!selectedUserPlaylistId || !track?.track_key) return;

    sendAction("add_track_to_user_playlist", {
      playlist_id: selectedUserPlaylistId,
      track_key: track.track_key,
    });
  };

  const handleRemoveTrackFromPlaylist = (playlistId, trackKey) => {
    if (!playlistId || !trackKey) return;

    sendAction("remove_track_from_user_playlist", {
      playlist_id: playlistId,
      track_key: trackKey,
    });
  };

  const selectedUserPlaylist = useMemo(
    () =>
      userPlaylists.find(
        (playlist) => playlist.id === selectedUserPlaylistId,
      ) || null,
    [selectedUserPlaylistId, userPlaylists],
  );

  const isSelectedPrivatePlaylistView =
    browseView === "playlist" &&
    selectedUserPlaylist &&
    selectedUserPlaylist.name === selectedPlaylistName;

  const trackByKey = useMemo(() => {
    const byKey = new Map();
    for (const track of sortedLibraryTracks) {
      const key = track.track_key || track.path || track.id;
      if (!key) continue;
      byKey.set(String(key), track);
    }
    return byKey;
  }, [sortedLibraryTracks]);

  const getSelectedTracksForAction = useCallback(
    (clickedTrack) => {
      const clickedKey = String(
        clickedTrack?.track_key || clickedTrack?.path || clickedTrack?.id || "",
      );

      if (!clickedKey) {
        return clickedTrack ? [clickedTrack] : [];
      }

      if (
        selectedTrackKeys.length > 0 &&
        selectedTrackKeys.includes(clickedKey)
      ) {
        const selectedTracks = selectedTrackKeys
          .map((key) => trackByKey.get(String(key)))
          .filter((track) => !!track?.track_key);
        if (selectedTracks.length) {
          return selectedTracks;
        }
      }

      return clickedTrack?.track_key ? [clickedTrack] : [];
    },
    [selectedTrackKeys, trackByKey],
  );

  const handleTrackCardClick = (event, track) => {
    const key = String(track?.track_key || track?.path || track?.id || "");
    if (!key) return;

    if (event?.ctrlKey) {
      setSelectedTrackKeys((current) =>
        current.includes(key)
          ? current.filter((item) => item !== key)
          : [...current, key],
      );
      return;
    }

    setSelectedTrackKeys([key]);
    setSelectedPlaylistKeys([]);
  };

  const visibleLibraryTracks = useMemo(() => {
    if (browseView !== "playlist" || !selectedPlaylistName) {
      return sortedLibraryTracks;
    }

    if (
      selectedUserPlaylist &&
      selectedUserPlaylist.name === selectedPlaylistName
    ) {
      return (selectedUserPlaylist.tracks || [])
        .filter((track) => !!track.track_key)
        .map((track, index) => {
          const key = String(track.track_key);
          const libraryTrack = trackByKey.get(key);

          return {
            ...(libraryTrack || {}),
            ...track,
            id:
              libraryTrack?.id ||
              track.track_key ||
              track.path ||
              `user-playlist-track-${index}`,
            number: index + 1,
            duration: track.duration || libraryTrack?.duration || "--:--",
          };
        });
    }

    return sortedLibraryTracks.filter(
      (track) => track.playlist_name === selectedPlaylistName,
    );
  }, [
    browseView,
    selectedPlaylistName,
    selectedUserPlaylist,
    trackByKey,
    sortedLibraryTracks,
  ]);

  const handlePriorityQueueAdd = (track) => {
    const tracksToQueue = getSelectedTracksForAction(track);
    if (!tracksToQueue.length) return;

    runActionBatch(
      tracksToQueue.map((item) => ({
        action: "enqueue_priority",
        payload: {
          track_title: item.title,
          track_path: item.path || null,
        },
      })),
    );
    setBrowseView("track");
    setBrowseTitle(
      tracksToQueue.length > 1
        ? `Priority queued: ${tracksToQueue.length} tracks`
        : `Priority queued: ${track.title}`,
    );
  };

  const handlePriorityQueueAddSingle = (track) => {
    if (!track?.track_key) return;

    runActionBatch([
      {
        action: "enqueue_priority",
        payload: {
          track_title: track.title,
          track_path: track.path || null,
        },
      },
    ]);
    setBrowseView("track");
    setBrowseTitle(`Priority queued: ${track.title}`);
  };

  const handleOpenAddToPlaylists = (track) => {
    const tracksToAdd = getSelectedTracksForAction(track);
    if (!tracksToAdd.length) return;

    const keys = tracksToAdd
      .map((item) => String(item.track_key || ""))
      .filter(Boolean);
    if (!keys.length) return;

    setPendingAddTrackKeys(keys);
    setCheckedPlaylistIds([]);
    setIsAddToPlaylistsOpen(true);
  };

  const handleOpenAddToPlaylistsSingle = (track) => {
    if (!track?.track_key) return;

    setPendingAddTrackKeys([String(track.track_key)]);
    setCheckedPlaylistIds([]);
    setIsAddToPlaylistsOpen(true);
  };

  const handleConfirmAddToPlaylists = () => {
    if (!pendingAddTrackKeys.length || !checkedPlaylistIds.length) {
      setIsAddToPlaylistsOpen(false);
      return;
    }

    const orderedTracks = pendingAddTrackKeys
      .map((key) => trackByKey.get(String(key)))
      .filter((track) => !!track?.track_key);

    if (!orderedTracks.length) {
      setIsAddToPlaylistsOpen(false);
      return;
    }

    const actions = [];
    for (const playlistId of checkedPlaylistIds) {
      for (const track of orderedTracks) {
        actions.push({
          action: "add_track_to_user_playlist",
          payload: {
            playlist_id: playlistId,
            track_key: track.track_key,
          },
        });
      }
    }

    runActionBatch(actions);
    setIsAddToPlaylistsOpen(false);
    setPendingAddTrackKeys([]);
    setCheckedPlaylistIds([]);
  };

  const handleRemoveTracksFromSelectedPrivatePlaylist = (track) => {
    if (!selectedUserPlaylistId) return;

    const tracksToRemove = getSelectedTracksForAction(track).filter(
      (item) => !!item?.track_key,
    );
    if (!tracksToRemove.length) return;

    runActionBatch(
      tracksToRemove.map((item) => ({
        action: "remove_track_from_user_playlist",
        payload: {
          playlist_id: selectedUserPlaylistId,
          track_key: item.track_key,
        },
      })),
    );
  };

  const handlePlaylistQueueAdd = (playlist, scope = "premade") => {
    if (!playlist) return;

    const selectedPayloads = selectedPlaylistKeys
      .map((key) => {
        const [keyScope, keyValue] = String(key).split(":");

        if (keyScope === "user") {
          const userPlaylist = userPlaylists.find(
            (item) => String(item.id) === String(keyValue),
          );
          return userPlaylist
            ? buildPlaylistPayload(userPlaylist, "user")
            : null;
        }

        if (keyScope === "premade") {
          const premadePlaylist = premadePlaylists.find(
            (item) => item.name === keyValue,
          );
          return premadePlaylist
            ? buildPlaylistPayload(premadePlaylist, "premade")
            : null;
        }

        return null;
      })
      .filter(Boolean);

    const clickedKey = toPlaylistKey(playlist, scope);
    const useSelected =
      selectedPayloads.length > 0 && selectedPlaylistKeys.includes(clickedKey);

    if (useSelected) {
      sendAction("enqueue_playlists", {
        playlists: selectedPayloads,
      });
      return;
    }

    sendAction("enqueue_playlist", buildPlaylistPayload(playlist, scope));
  };

  const handleQueueRemove = (track) => {
    sendAction(track.isPriority ? "remove_priority" : "remove_queue", {
      track_title: track.title,
      track_path: track.path || null,
    });
  };

  const handleClearCurrentQueue = () => {
    sendAction("clear_queue");
  };

  const handleBackToHome = () => {
    setBrowseView("home");
    setBrowseTitle("Home");
    setSelectedPlaylistName("");
    setSelectedPlaylistKeys([]);
    setSelectedTrackKeys([]);
    setSearchValue("");
  };

  const handleSearchInput = (value) => {
    setSearchValue(value);
    if (value.trim().length > 0) {
      setBrowseView("search");
      setBrowseTitle("Search results");
      setSelectedPlaylistName("");
    }
  };

  const triggerControlFlash = (controlKey) => {
    setActiveControlFlash(controlKey);
    setTimeout(() => {
      setActiveControlFlash((current) =>
        current === controlKey ? "" : current,
      );
    }, 180);
  };

  const getControlClassName = (
    controlKey,
    sizeClass = "h-8 w-8",
    isActive = false,
  ) => {
    const isFlashing = activeControlFlash === controlKey;
    const activeClass = isActive
      ? "border-blue-500/70 bg-blue-500/20 text-blue-300"
      : "border-zinc-700 bg-zinc-900 text-zinc-100";
    return `flex ${sizeClass} items-center justify-center rounded-full border transition-all duration-150 hover:bg-zinc-800 active:scale-95 ${activeClass} ${isFlashing ? "bg-blue-400/30 border-blue-400/70" : ""}`;
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 text-white">
      <div className="mb-4">
        <p className="text-2xl font-bold">Music</p>
        <p className="text-sm text-zinc-300">
          Live state with backend command bridge.
        </p>
      </div>

      <section className="relative z-50 mb-4 max-w-md">
        {isServerPickerOpen ? (
          <button
            type="button"
            aria-label="Close server picker"
            onClick={() => setIsServerPickerOpen(false)}
            className="fixed inset-0 z-40 bg-black/20"
          />
        ) : null}

        <div className="relative z-50">
          <button
            type="button"
            onClick={() => setIsServerPickerOpen((prev) => !prev)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/85 px-3 py-2 text-left"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-zinc-400">Select server</p>
                <p
                  className={`truncate text-sm ${selectedGuild?.can_edit ? "text-zinc-100" : "text-zinc-500"}`}
                >
                  {selectedGuild?.guild_name || "No server selected"}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform ${isServerPickerOpen ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          {isServerPickerOpen ? (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[60] rounded-lg border border-zinc-700 bg-zinc-950/95 p-2 shadow-lg">
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {servers
                  .filter((server) => server.guild_id !== selectedGuildId)
                  .map((server) => (
                    <button
                      key={server.guild_id}
                      type="button"
                      onClick={() => handleGuildSelect(server.guild_id)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-left hover:bg-zinc-800"
                    >
                      <p
                        className={`truncate text-sm ${server.can_edit ? "text-zinc-100" : "text-zinc-500"}`}
                      >
                        {server.guild_name}
                      </p>
                      {!server.can_edit ? (
                        <p className="text-[11px] text-zinc-500">
                          no permissions
                        </p>
                      ) : null}
                    </button>
                  ))}
              </div>
            </div>
          ) : null}
        </div>

        {isLoadingServers ? (
          <p className="mt-2 text-xs text-zinc-500">Loading servers...</p>
        ) : null}

        {!isLoadingServers && !servers.length ? (
          <p className="mt-2 text-xs text-zinc-500">
            No editable servers available.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-700 bg-zinc-950/80 p-3 md:p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <aside className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Library</h2>
              <div className="flex items-center gap-1">
                <input
                  value={newPlaylistName}
                  onChange={(event) => setNewPlaylistName(event.target.value)}
                  placeholder="New playlist"
                  className="w-28 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={handleCreatePlaylist}
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs hover:bg-zinc-800"
                  title="Create playlist"
                >
                  <Plus size={13} /> New
                </button>
              </div>
            </div>

            <p className="mb-2 text-xs text-zinc-400">Premade playlists</p>
            <div className="mb-4 max-h-44 space-y-2 overflow-y-auto pr-1">
              {premadePlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  className={`group relative rounded-md border px-2 py-2 hover:bg-zinc-800 ${selectedPlaylistKeys.includes(toPlaylistKey(playlist, "premade")) ? "border-green-500/70 bg-green-500/10" : "border-zinc-700 bg-zinc-900"}`}
                >
                  <button
                    type="button"
                    onClick={(event) =>
                      handlePlaylistCardClick(event, playlist, "premade")
                    }
                    className="w-full pr-9 text-left"
                  >
                    <p className="truncate text-sm text-zinc-100">
                      {playlist.name}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {playlist.songs} tracks
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handlePlaylistQueueAdd(playlist, "premade");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/95 text-zinc-100 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`Play ${playlist.name}`}
                    title={`Play ${playlist.name}`}
                  >
                    <Play size={13} />
                  </button>
                </div>
              ))}
            </div>

            <p className="mb-2 text-xs text-zinc-400">Your playlists</p>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {userPlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  className={`group relative rounded-md border px-2 py-2 hover:bg-zinc-800 ${selectedPlaylistKeys.includes(toPlaylistKey(playlist, "user")) ? "border-green-500/70 bg-green-500/10" : selectedUserPlaylistId === playlist.id ? `${ACCENT_BORDER_CLASS} bg-blue-500/10` : "border-zinc-700 bg-zinc-900"}`}
                >
                  <button
                    type="button"
                    onClick={(event) =>
                      handlePlaylistCardClick(event, playlist, "user")
                    }
                    className="w-full pr-9 text-left"
                  >
                    <p className="truncate text-sm text-zinc-100">
                      {playlist.name}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      owner: {playlist.owner} • {playlist.songs} tracks
                    </p>
                  </button>

                  <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => handlePlaylistQueueAdd(playlist, "user")}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/95 text-zinc-100"
                      aria-label={`Play ${playlist.name}`}
                      title={`Play ${playlist.name}`}
                    >
                      <Play size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeletePlaylist(playlist.id, playlist.name)
                      }
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/95 text-red-300"
                      aria-label={`Delete ${playlist.name}`}
                      title={`Delete ${playlist.name}`}
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}

              {!userPlaylists.length ? (
                <p className="text-[11px] text-zinc-500">
                  No custom playlists yet.
                </p>
              ) : null}
            </div>
          </aside>

          <div className="space-y-3 lg:col-span-6">
            <div className="relative z-30 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              {isSearchOpen ? (
                <button
                  type="button"
                  className="fixed inset-0 z-20 bg-black/25"
                  onClick={() => setSearchValue("")}
                  aria-label="Close search results"
                />
              ) : null}

              <div className="relative z-30 grid grid-cols-[auto_1fr_auto] items-center gap-2">
                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                  aria-label="Back to music home"
                >
                  <ArrowLeft size={16} />
                </button>

                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    value={searchValue}
                    onChange={(event) => handleSearchInput(event.target.value)}
                    placeholder="Search songs or artists"
                    className={`w-full rounded-full border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 ${isSearchOpen ? "ring-1 ring-blue-500/50" : ""}`}
                  />

                  {isSearchOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-72 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-950 p-2 shadow-xl">
                      {searchResults.length ? (
                        <div className="space-y-2">
                          {searchResults.map((track) => (
                            <div
                              key={`search-${track.id}`}
                              className="flex items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 hover:bg-zinc-800"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTrackKeys([]);
                                  setSelectedPlaylistKeys([]);
                                  setBrowseView("track");
                                  setBrowseTitle(
                                    `${track.title} • ${track.artist}`,
                                  );
                                  setSearchValue("");
                                }}
                                className="min-w-0 flex-1 text-left"
                              >
                                <p className="truncate text-sm text-zinc-100">
                                  {track.title}
                                </p>
                                <p className="truncate text-xs text-zinc-400">
                                  {track.artist}
                                </p>
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenAddToPlaylistsSingle(track)
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100"
                                  aria-label="Add to selected playlist"
                                  title="Add to playlists"
                                >
                                  <Plus size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handlePriorityQueueAddSingle(track)
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100"
                                  aria-label={`Add ${track.title} to priority queue`}
                                  title="Add to priority queue"
                                >
                                  <Play size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="px-2 py-3 text-sm text-zinc-500">
                          No results found.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBrowseView("library");
                    setBrowseTitle("All library tracks");
                    setSelectedPlaylistName("");
                    setSelectedTrackKeys([]);
                    setSelectedPlaylistKeys([]);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800"
                  aria-label="Open full library"
                  title="All library tracks"
                >
                  <Library size={16} />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <p className="text-lg font-semibold text-zinc-100">
                {browseTitle}
              </p>
              {browseView === "home" ? (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {HOME_COLLECTIONS.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setBrowseView(item.type);
                        setBrowseTitle(item.title);
                      }}
                      className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-left hover:bg-zinc-900"
                    >
                      <p className="truncate text-sm text-zinc-100">
                        {item.title}
                      </p>
                      <p className="text-xs text-zinc-400">{item.subtitle}</p>
                    </button>
                  ))}
                </div>
              ) : browseView === "playlist" ? (
                <></>
              ) : (
                <p className="mt-2 text-xs text-zinc-400">
                  Currently browsing this section.
                </p>
              )}
            </div>

            {browseView !== "home" ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-zinc-400">Library tracks</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200"
                    >
                      <option value="number">Sort: number</option>
                      <option value="artist">Sort: artist</option>
                      <option value="title">Sort: alphabetically</option>
                      <option value="duration">Sort: duration</option>
                    </select>

                    <select
                      value={sortDirection}
                      onChange={(event) => setSortDirection(event.target.value)}
                      className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>

                <div className="max-h-[21rem] space-y-2 overflow-y-auto pr-1">
                  {visibleLibraryTracks.map((track) => (
                    <div
                      key={track.id}
                      onClick={(event) => handleTrackCardClick(event, track)}
                      className={`group flex items-center justify-between rounded-md border px-3 py-2 ${selectedTrackKeys.includes(String(track.track_key || track.path || track.id || "")) ? "border-green-500/70 bg-green-500/10" : "border-zinc-700 bg-zinc-950"}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-zinc-100">
                          {track.number} • {track.title}
                        </p>
                        <p className="truncate text-xs text-zinc-400">
                          {track.artist}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-xs text-zinc-400">
                          {track.duration}
                        </p>
                        {isSelectedPrivatePlaylistView ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRemoveTracksFromSelectedPrivatePlaylist(
                                track,
                              );
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-red-300 opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="Remove from selected private playlist"
                            title="Remove from playlist"
                          >
                            <Trash2 size={12} />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenAddToPlaylists(track);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-30"
                          aria-label="Add to selected playlist"
                          title="Add to playlists"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handlePriorityQueueAdd(track);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 opacity-0 transition-opacity group-hover:opacity-100 "
                          aria-label={`Add ${track.title} to priority queue`}
                          title="Add to priority queue"
                        >
                          <Play size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {!visibleLibraryTracks.length ? (
                    <p className="px-1 py-2 text-sm text-zinc-500">
                      No tracks in this playlist.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-100">
                  Current state: {currentState.state}
                </p>
                <p className="text-sm font-semibold text-zinc-100">
                  Channel: {currentState.channelLabel}
                </p>
              </div>

              <div
                className={`mt-3 rounded-lg border border-zinc-700 bg-zinc-950 p-3 transition ${currentState.dimmed ? "opacity-55" : "opacity-100"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      Now playing:{" "}
                      {musicState.now_playing_title || "Nothing playing"}
                    </p>
                    <p className="truncate text-xs text-zinc-400">
                      {musicState.now_playing_artist || ""}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerControlFlash("previous");
                          sendAction("previous");
                        }}
                        disabled={!currentState.showControls}
                        className={`${getControlClassName("previous")} disabled:opacity-40`}
                      >
                        <SkipBack size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerControlFlash("toggle_pause");
                          if (currentState.canStartFromDashboard) {
                            sendAction("start_playback");
                          } else {
                            sendAction("toggle_pause");
                          }
                        }}
                        disabled={
                          !currentState.showControls &&
                          !currentState.canStartFromDashboard
                        }
                        className={`${getControlClassName("toggle_pause")} disabled:opacity-40`}
                      >
                        {currentState.state === "Playing" ? (
                          <Pause size={14} />
                        ) : (
                          <Play size={14} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerControlFlash("next");
                          sendAction("next");
                        }}
                        disabled={!currentState.showControls}
                        className={`${getControlClassName("next")} disabled:opacity-40`}
                      >
                        <SkipForward size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 pr-1">
                      <button
                        type="button"
                        onClick={() => {
                          const nextShuffleMode =
                            shuffleMode === "off"
                              ? "shuffle"
                              : shuffleMode === "shuffle"
                                ? "smart"
                                : "off";

                          setMusicState((current) => ({
                            ...current,
                            shuffle_mode: nextShuffleMode,
                            is_shuffle_enabled: nextShuffleMode !== "off",
                          }));

                          triggerControlFlash("set_shuffle");
                          sendAction("set_shuffle", {
                            mode: nextShuffleMode,
                            value: nextShuffleMode !== "off",
                          });
                        }}
                        className={getControlClassName(
                          "set_shuffle",
                          "h-7 w-7",
                          shuffleEnabled,
                        )}
                        title={
                          smartShuffleEnabled
                            ? "Smart shuffle"
                            : shuffleEnabled
                              ? "Shuffle"
                              : "Shuffle off"
                        }
                        disabled={isSendingAction}
                      >
                        {smartShuffleEnabled ? (
                          <span className="relative inline-flex h-4 w-4 items-center justify-center">
                            <Shuffle size={14} />
                            <Sparkles
                              size={8}
                              className="absolute -right-1 -top-1"
                            />
                          </span>
                        ) : (
                          <Shuffle size={14} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerControlFlash("set_loop");
                          sendAction("set_loop", {
                            value: !loopEnabled,
                          });
                        }}
                        className={getControlClassName(
                          "set_loop",
                          "h-7 w-7",
                          loopEnabled,
                        )}
                        title="Loop"
                        disabled={isSendingAction}
                      >
                        <Repeat size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-center text-xs text-zinc-400">
                  {currentState.message}
                </p>
                {!currentState.showControls && userVoiceState?.channel_id ? (
                  <p className="mt-1 text-center text-[11px] text-zinc-500">
                    Your voice channel: #
                    {userVoiceState.channel_name || "voice"}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <h3 className="mb-2 font-semibold">Now Playing & Queue</h3>

            <div className="mb-3 rounded-lg border border-zinc-700 bg-zinc-950 p-3">
              <p className="text-xs text-zinc-400">Currently playing</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">
                {musicState.now_playing_title || "Nothing playing"}
              </p>
              <p className="text-xs text-zinc-400">
                {musicState.now_playing_artist || ""}
              </p>
            </div>

            <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-2">
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-zinc-800 px-1">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setQueueTab("queue")}
                    className={`pb-1 text-xs transition ${queueTab === "queue" ? `${ACCENT_CLASS} border-b ${ACCENT_BORDER_CLASS}` : "text-zinc-400 border-b border-transparent"}`}
                  >
                    Queue
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueTab("previous")}
                    className={`pb-1 text-xs transition ${queueTab === "previous" ? `${ACCENT_CLASS} border-b ${ACCENT_BORDER_CLASS}` : "text-zinc-400 border-b border-transparent"}`}
                  >
                    Previously played
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClearCurrentQueue}
                  disabled={
                    isSendingAction || queueTab !== "queue" || !hasQueuedTracks
                  }
                  className="mb-1 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Clear queue (keeps currently playing track)"
                  aria-label="Clear queue"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="max-h-[27rem] space-y-2 overflow-y-auto pr-1">
                {currentQueueItems.map((track, index) => {
                  return (
                    <div
                      key={`${track.id}-${index}-${queueTab}`}
                      className={`group rounded-md border px-2 py-2 ${track.isPriority && queueTab === "queue" ? `${ACCENT_BORDER_CLASS} bg-blue-500/10` : "border-zinc-700 bg-zinc-900"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-zinc-100">
                            {track.title}
                          </p>
                          <p className="truncate text-[11px] text-zinc-400">
                            {track.artist}
                            {track.isPriority && queueTab === "queue"
                              ? " • priority"
                              : ""}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQueueRemove(track)}
                          className="mt-0.5 text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                          title="Remove from queue"
                          aria-label="Remove from queue"
                        >
                          X
                        </button>
                      </div>
                    </div>
                  );
                })}

                {!currentQueueItems.length ? (
                  <p className="px-1 py-2 text-sm text-zinc-500">
                    No tracks in this list.
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {isAddToPlaylistsOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => {
              setIsAddToPlaylistsOpen(false);
              setPendingAddTrackKeys([]);
              setCheckedPlaylistIds([]);
            }}
            aria-label="Close add-to-playlists dialog"
          />

          <div className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl">
            <p className="text-sm font-semibold text-zinc-100">
              Add selected track(s) to playlists
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Selected tracks: {pendingAddTrackKeys.length}
            </p>

            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
              {userPlaylists.map((playlist) => {
                const isChecked = checkedPlaylistIds.includes(playlist.id);
                return (
                  <label
                    key={`add-${playlist.id}`}
                    className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(event) => {
                        setCheckedPlaylistIds((current) =>
                          event.target.checked
                            ? [...current, playlist.id]
                            : current.filter((id) => id !== playlist.id),
                        );
                      }}
                    />
                    <span className="truncate">{playlist.name}</span>
                  </label>
                );
              })}

              {!userPlaylists.length ? (
                <p className="text-xs text-zinc-500">
                  No private playlists available.
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddToPlaylistsOpen(false);
                  setPendingAddTrackKeys([]);
                  setCheckedPlaylistIds([]);
                }}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddToPlaylists}
                disabled={
                  !checkedPlaylistIds.length || !pendingAddTrackKeys.length
                }
                className="rounded-md border border-green-600/70 bg-green-600/20 px-3 py-1.5 text-xs text-green-200 hover:bg-green-600/30 disabled:opacity-40"
              >
                Add to selected playlists
              </button>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
