"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useDevMode } from "@/components/DevModeContext";
import PlaylistEditor from "@/components/PlaylistEditor";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Library,
  Pause,
  Pin,
  Play,
  Plus,
  Repeat,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Trash2,
  Unplug,
} from "lucide-react";

const ACCENT_CLASS = "text-blue-300";
const ACCENT_BORDER_CLASS = "border-blue-500/70";
const SORT_BY_OPTIONS = [
  { value: "number", label: "Sort: number" },
  { value: "artist", label: "Sort: artist" },
  { value: "title", label: "Sort: alphabetically" },
  { value: "duration", label: "Sort: duration" },
];
const SORT_DIRECTION_OPTIONS = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

const SAME_VOICE_CHANNEL_REQUIRED_ACTIONS = new Set([
  "toggle_pause",
  "next",
  "previous",
  "disconnect",
  "set_shuffle",
  "set_loop",
  "enqueue_priority",
  "enqueue_artist",
  "enqueue_playlist",
  "enqueue_playlists",
  "jump_to_queue_track",
  "reorder_queue_track",
  "remove_priority",
  "remove_queue",
  "clear_queue",
]);

function normalizeChannelName(value) {
  return String(value || "")
    .trim()
    .replace(/^#/, "")
    .trim()
    .toLowerCase();
}

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

function durationToSeconds(duration) {
  const [minutes, seconds] = String(duration || "0:00")
    .split(":")
    .map((value) => Number(value) || 0);
  return minutes * 60 + seconds;
}

function splitArtistNames(artistValue) {
  return String(artistValue || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function getPlaylistOrderValue(playlist) {
  const parsed = Number(playlist?.playlist_order);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export default function MusicPage() {
  const { data: session } = useSession();
  const { isUnlocked: isDevMode } = useDevMode();
  const [servers, setServers] = useState([]);
  const [selectedGuildId, setSelectedGuildId] = useState("");
  const [isServerPickerOpen, setIsServerPickerOpen] = useState(false);
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [isSendingAction, setIsSendingAction] = useState(false);
  const [musicState, setMusicState] = useState(EMPTY_MUSIC_STATE);
  const [libraryTracks, setLibraryTracks] = useState([]);
  const [premadePlaylists, setPremadePlaylists] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [recentUserPlaylists, setRecentUserPlaylists] = useState([]);
  const [userVoiceState, setUserVoiceState] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isPlaylistSearchOpen, setIsPlaylistSearchOpen] = useState(false);
  const [playlistSearchValue, setPlaylistSearchValue] = useState("");
  const [selectedUserPlaylistId, setSelectedUserPlaylistId] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState("number");
  const [sortDirection, setSortDirection] = useState("asc");
  const [openSortMenu, setOpenSortMenu] = useState(null);
  const [browseTitle, setBrowseTitle] = useState("Home");
  const [browseView, setBrowseView] = useState("home");
  const [selectedPlaylistName, setSelectedPlaylistName] = useState("");
  const [selectedArtistName, setSelectedArtistName] = useState("");
  const [selectedPlaylistKeys, setSelectedPlaylistKeys] = useState([]);
  const [selectedTrackKeys, setSelectedTrackKeys] = useState([]);
  const [isAddToPlaylistsOpen, setIsAddToPlaylistsOpen] = useState(false);
  const [pendingAddTrackKeys, setPendingAddTrackKeys] = useState([]);
  const [checkedPlaylistIds, setCheckedPlaylistIds] = useState([]);
  const [pendingDeletePlaylist, setPendingDeletePlaylist] = useState(null);
  const [queueTab, setQueueTab] = useState("queue");
  const [activeControlFlash, setActiveControlFlash] = useState("");
  const [draggedQueueTrack, setDraggedQueueTrack] = useState(null);
  const [queueDropTarget, setQueueDropTarget] = useState(null);
  const [draggedUserPlaylistId, setDraggedUserPlaylistId] = useState(null);
  const [draggedUserPlaylistPinned, setDraggedUserPlaylistPinned] =
    useState(null);
  const [dropTargetUserPlaylistId, setDropTargetUserPlaylistId] =
    useState(null);
  const [dropTargetPosition, setDropTargetPosition] = useState("before");
  const [draggedPlaylistTrackKey, setDraggedPlaylistTrackKey] = useState(null);
  const [playlistTrackDropTarget, setPlaylistTrackDropTarget] = useState(null);

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
      setRecentUserPlaylists(
        Array.isArray(payload?.recentUserPlaylists)
          ? payload.recentUserPlaylists
          : [],
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

  const normalizedPlaylistSearch = playlistSearchValue.trim().toLowerCase();
  const currentSortByLabel =
    SORT_BY_OPTIONS.find((option) => option.value === sortBy)?.label ||
    "Sort: number";
  const currentSortDirectionLabel =
    SORT_DIRECTION_OPTIONS.find((option) => option.value === sortDirection)
      ?.label || "Ascending";

  const pinnedUserPlaylists = useMemo(
    () =>
      userPlaylists
        .filter((playlist) => playlist.is_pinned)
        .sort((left, right) => {
          const leftOrder = getPlaylistOrderValue(left);
          const rightOrder = getPlaylistOrderValue(right);

          if (leftOrder !== null && rightOrder !== null) {
            return leftOrder - rightOrder;
          }

          if (leftOrder !== null) return -1;
          if (rightOrder !== null) return 1;

          return (
            new Date(left.pinned_at || 0).getTime() -
            new Date(right.pinned_at || 0).getTime()
          );
        }),
    [userPlaylists],
  );

  const unpinnedUserPlaylists = useMemo(
    () =>
      userPlaylists
        .filter((playlist) => !playlist.is_pinned)
        .sort((left, right) => {
          const leftOrder = getPlaylistOrderValue(left);
          const rightOrder = getPlaylistOrderValue(right);

          if (leftOrder !== null && rightOrder !== null) {
            return leftOrder - rightOrder;
          }

          if (leftOrder !== null) return -1;
          if (rightOrder !== null) return 1;

          return (
            new Date(right.created_at || 0).getTime() -
            new Date(left.created_at || 0).getTime()
          );
        }),
    [userPlaylists],
  );

  const orderedUserPlaylists = useMemo(
    () => [...pinnedUserPlaylists, ...unpinnedUserPlaylists],
    [pinnedUserPlaylists, unpinnedUserPlaylists],
  );

  const pinnedPlaylistCount = pinnedUserPlaylists.length;

  const filteredPremadePlaylists = useMemo(() => {
    if (!normalizedPlaylistSearch) {
      return premadePlaylists;
    }

    return premadePlaylists.filter((playlist) =>
      String(playlist?.name || "")
        .toLowerCase()
        .includes(normalizedPlaylistSearch),
    );
  }, [normalizedPlaylistSearch, premadePlaylists]);

  const filteredUserPlaylists = useMemo(() => {
    if (!normalizedPlaylistSearch) {
      return orderedUserPlaylists;
    }

    return orderedUserPlaylists.filter((playlist) =>
      String(playlist?.name || "")
        .toLowerCase()
        .includes(normalizedPlaylistSearch),
    );
  }, [normalizedPlaylistSearch, orderedUserPlaylists]);

  const mergedFilteredPlaylists = useMemo(() => {
    const allPlaylists = [
      ...orderedUserPlaylists.map((playlist) => ({
        ...playlist,
        scope: "user",
      })),
      ...premadePlaylists.map((playlist) => ({
        ...playlist,
        scope: "premade",
      })),
    ];

    if (!normalizedPlaylistSearch) {
      return allPlaylists;
    }

    return allPlaylists.filter((playlist) =>
      String(playlist?.name || "")
        .toLowerCase()
        .includes(normalizedPlaylistSearch),
    );
  }, [normalizedPlaylistSearch, premadePlaylists, orderedUserPlaylists]);

  const homeCollectionItems = useMemo(() => {
    const maxItems = 8;
    const items = [];
    const usedKeys = new Set();

    const pushUnique = (item) => {
      if (!item || items.length >= maxItems) return;
      if (usedKeys.has(item.id)) return;
      usedKeys.add(item.id);
      items.push(item);
    };

    pinnedUserPlaylists.forEach((playlist, index) => {
      pushUnique({
        id: `home-user-${playlist.id}`,
        type: "playlist",
        title: playlist.name,
        subtitle: `Pinned #${index + 1} • ${playlist.songs} tracks`,
        scope: "user",
        playlistId: playlist.id,
        isPinned: true,
      });
    });

    recentUserPlaylists.forEach((playlist) => {
      pushUnique({
        id: `home-user-${playlist.id}`,
        type: "playlist",
        title: playlist.name,
        subtitle: `Recently played • ${playlist.songs} tracks`,
        scope: "user",
        playlistId: playlist.id,
        isPinned: false,
      });
    });

    orderedUserPlaylists.forEach((playlist) => {
      pushUnique({
        id: `home-user-${playlist.id}`,
        type: "playlist",
        title: playlist.name,
        subtitle: `${playlist.songs} tracks`,
        scope: "user",
        playlistId: playlist.id,
        isPinned: playlist.is_pinned === true,
      });
    });

    premadePlaylists.forEach((playlist) => {
      pushUnique({
        id: `home-premade-${playlist.id}`,
        type: "playlist",
        title: playlist.name,
        subtitle: `${playlist.songs} tracks`,
        scope: "premade",
        playlistId: playlist.id,
        isPinned: false,
      });
    });

    return items;
  }, [
    orderedUserPlaylists,
    pinnedUserPlaylists,
    premadePlaylists,
    recentUserPlaylists,
  ]);

  const runActionBatch = useCallback(
    async (actions = []) => {
      if (!selectedGuildId || isSendingAction || !actions.length) return;

      setIsSendingAction(true);
      try {
        for (const item of actions) {
          const playbackState = String(musicState.playback_state || "idle");
          const actionNeedsSharedChannel =
            SAME_VOICE_CHANNEL_REQUIRED_ACTIONS.has(item.action);
          const playbackActive =
            playbackState === "playing" || playbackState === "paused";

          if (actionNeedsSharedChannel && playbackActive) {
            const userChannel = normalizeChannelName(
              userVoiceState?.channel_name,
            );
            const botChannel = normalizeChannelName(musicState.channel_label);

            if (
              !userVoiceState?.channel_id ||
              !userChannel ||
              !botChannel ||
              userChannel !== botChannel
            ) {
              window.alert(
                "Musisz być na tym samym kanale głosowym co bot, aby sterować odtwarzaniem.",
              );
              break;
            }
          }

          const response = await fetch("/api/music", {
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

          if (!response.ok) {
            let message = "Nie udało się wykonać akcji muzycznej.";
            try {
              const payload = await response.json();
              if (payload?.error) {
                message = String(payload.error);
              }
            } catch {
              // Ignore parse errors and keep fallback message.
            }

            window.alert(message);
            break;
          }
        }
      } finally {
        setIsSendingAction(false);
      }

      await fetchMusicState(selectedGuildId);
    },
    [
      fetchMusicState,
      isSendingAction,
      musicState.channel_label,
      musicState.playback_state,
      selectedGuildId,
      userVoiceState?.channel_id,
      userVoiceState?.channel_name,
    ],
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
  const canDisconnect =
    String(musicState.channel_label || "") !== "" &&
    String(musicState.channel_label || "") !== "No channel";

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

  const artistSearchProfiles = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query.length) {
      return [];
    }

    const byArtist = new Map();
    for (const track of sortedLibraryTracks) {
      const trackArtists = splitArtistNames(track.artist);
      for (const artist of trackArtists) {
        const artistKey = artist.toLowerCase();
        if (!artistKey.includes(query)) continue;

        if (!byArtist.has(artistKey)) {
          byArtist.set(artistKey, {
            id: artistKey,
            artist,
            tracks: 0,
          });
        }

        byArtist.get(artistKey).tracks += 1;
      }
    }

    return [...byArtist.values()].sort((left, right) => {
      const leftKey = left.artist.toLowerCase();
      const rightKey = right.artist.toLowerCase();

      const leftExact = leftKey === query ? 0 : 1;
      const rightExact = rightKey === query ? 0 : 1;
      if (leftExact !== rightExact) {
        return leftExact - rightExact;
      }

      const leftStarts = leftKey.startsWith(query) ? 0 : 1;
      const rightStarts = rightKey.startsWith(query) ? 0 : 1;
      if (leftStarts !== rightStarts) {
        return leftStarts - rightStarts;
      }

      return left.artist.localeCompare(right.artist);
    });
  }, [searchValue, sortedLibraryTracks]);

  const isSearchOpen = searchValue.trim().length > 0;

  const queueWithPriority = useMemo(() => {
    const priorityItems = (musicState.priorityQueue || []).map(
      (track, index) => ({
        ...track,
        isPriority: true,
        priorityIndex: index + 1,
        sourceIndex: index,
        id: `${track.path || `p-${index}`}-priority-${index}`,
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
      sourceIndex: shouldSkipFirstQueueItem ? index + 1 : index,
      id: `${track.path || `q-${index}`}-queue-${shouldSkipFirstQueueItem ? index + 1 : index}`,
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
    setIsCreatePlaylistOpen(false);
  };

  const handleDeletePlaylist = (playlistId, playlistName = "this playlist") => {
    if (!playlistId) return;

    setPendingDeletePlaylist({
      id: playlistId,
      name: playlistName,
    });
  };

  const handleCancelDeletePlaylist = () => {
    setPendingDeletePlaylist(null);
  };

  const handleConfirmDeletePlaylist = () => {
    const playlistId = pendingDeletePlaylist?.id;
    if (!playlistId) return;

    sendAction("delete_user_playlist", { playlist_id: playlistId });
    if (selectedUserPlaylistId === playlistId) {
      setSelectedUserPlaylistId(null);
    }
    setPendingDeletePlaylist(null);
  };

  const handleTogglePlaylistPin = (playlist) => {
    if (!playlist?.id) return;

    const isPinned = playlist.is_pinned === true;
    if (!isPinned && pinnedPlaylistCount >= 8) {
      window.alert("You can pin up to 8 playlists.");
      return;
    }

    sendAction(isPinned ? "unpin_user_playlist" : "pin_user_playlist", {
      playlist_id: playlist.id,
    });
  };

  const resetUserPlaylistDragState = useCallback(() => {
    setDraggedUserPlaylistId(null);
    setDraggedUserPlaylistPinned(null);
    setDropTargetUserPlaylistId(null);
    setDropTargetPosition("before");
  }, []);

  const canDropOnUserPlaylist = useCallback(
    (targetPlaylist) => {
      if (!targetPlaylist || !draggedUserPlaylistId) return false;
      if (Number(targetPlaylist.id) === Number(draggedUserPlaylistId)) {
        return false;
      }

      return Boolean(targetPlaylist.is_pinned) === draggedUserPlaylistPinned;
    },
    [draggedUserPlaylistId, draggedUserPlaylistPinned],
  );

  const handleUserPlaylistDragStart = useCallback((event, playlist) => {
    if (!playlist?.id) return;

    setDraggedUserPlaylistId(Number(playlist.id));
    setDraggedUserPlaylistPinned(Boolean(playlist.is_pinned));
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(playlist.id));
  }, []);

  const handleUserPlaylistDragOver = useCallback(
    (event, targetPlaylist) => {
      if (!canDropOnUserPlaylist(targetPlaylist)) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      const bounds = event.currentTarget.getBoundingClientRect();
      const midpoint = bounds.top + bounds.height / 2;
      const position = event.clientY >= midpoint ? "after" : "before";

      setDropTargetUserPlaylistId(Number(targetPlaylist.id));
      setDropTargetPosition(position);
    },
    [canDropOnUserPlaylist],
  );

  const handleUserPlaylistDragLeave = useCallback(
    (event, targetPlaylist) => {
      const nextTarget = event.relatedTarget;
      if (nextTarget && event.currentTarget.contains(nextTarget)) {
        return;
      }

      if (Number(targetPlaylist?.id) === Number(dropTargetUserPlaylistId)) {
        setDropTargetUserPlaylistId(null);
      }
    },
    [dropTargetUserPlaylistId],
  );

  const handleUserPlaylistDrop = useCallback(
    async (event, targetPlaylist) => {
      event.preventDefault();

      if (!canDropOnUserPlaylist(targetPlaylist) || !draggedUserPlaylistId) {
        resetUserPlaylistDragState();
        return;
      }

      const draggedPlaylistId = Number(draggedUserPlaylistId);
      const targetPlaylistId = Number(targetPlaylist.id);
      const position =
        Number(dropTargetUserPlaylistId) === targetPlaylistId
          ? dropTargetPosition
          : "before";

      resetUserPlaylistDragState();
      await sendAction("reorder_user_playlist", {
        dragged_playlist_id: draggedPlaylistId,
        target_playlist_id: targetPlaylistId,
        drop_position: position,
      });
    },
    [
      canDropOnUserPlaylist,
      draggedUserPlaylistId,
      dropTargetPosition,
      dropTargetUserPlaylistId,
      resetUserPlaylistDragState,
      sendAction,
    ],
  );

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

  const isUserPlaylistTrackReorderEnabled =
    isSelectedPrivatePlaylistView && sortBy === "number";

  const resetPlaylistTrackDragState = useCallback(() => {
    setDraggedPlaylistTrackKey(null);
    setPlaylistTrackDropTarget(null);
  }, []);

  useEffect(() => {
    if (isUserPlaylistTrackReorderEnabled) return;
    resetPlaylistTrackDragState();
  }, [isUserPlaylistTrackReorderEnabled, resetPlaylistTrackDragState]);

  const canDropOnPlaylistTrack = useCallback(
    (track) => {
      if (!isUserPlaylistTrackReorderEnabled || !track?.track_key) {
        return false;
      }

      return String(track.track_key) !== String(draggedPlaylistTrackKey);
    },
    [draggedPlaylistTrackKey, isUserPlaylistTrackReorderEnabled],
  );

  const handlePlaylistTrackDragStart = useCallback(
    (event, track) => {
      if (!isUserPlaylistTrackReorderEnabled || !track?.track_key) return;

      setDraggedPlaylistTrackKey(String(track.track_key));
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(track.track_key));
    },
    [isUserPlaylistTrackReorderEnabled],
  );

  const handlePlaylistTrackDragOver = useCallback(
    (event, track) => {
      if (!canDropOnPlaylistTrack(track)) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      const bounds = event.currentTarget.getBoundingClientRect();
      const midpoint = bounds.top + bounds.height / 2;
      const position = event.clientY >= midpoint ? "after" : "before";

      setPlaylistTrackDropTarget({
        trackKey: String(track.track_key),
        position,
      });
    },
    [canDropOnPlaylistTrack],
  );

  const handlePlaylistTrackDragLeave = useCallback((event, track) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setPlaylistTrackDropTarget((current) => {
      if (!current || !track?.track_key) return current;
      if (String(current.trackKey) !== String(track.track_key)) {
        return current;
      }

      return null;
    });
  }, []);

  const handlePlaylistTrackDrop = useCallback(
    async (event, track) => {
      event.preventDefault();

      if (
        !selectedUserPlaylistId ||
        !canDropOnPlaylistTrack(track) ||
        !draggedPlaylistTrackKey
      ) {
        resetPlaylistTrackDragState();
        return;
      }

      const position =
        playlistTrackDropTarget &&
        String(playlistTrackDropTarget.trackKey) === String(track.track_key)
          ? playlistTrackDropTarget.position
          : "before";

      const draggedTrackKey = String(draggedPlaylistTrackKey);
      const targetTrackKey = String(track.track_key);

      resetPlaylistTrackDragState();

      await sendAction("reorder_track_in_user_playlist", {
        playlist_id: selectedUserPlaylistId,
        dragged_track_key: draggedTrackKey,
        target_track_key: targetTrackKey,
        drop_position: position,
      });
    },
    [
      canDropOnPlaylistTrack,
      draggedPlaylistTrackKey,
      playlistTrackDropTarget,
      resetPlaylistTrackDragState,
      selectedUserPlaylistId,
      sendAction,
    ],
  );

  const trackByKey = useMemo(() => {
    const byKey = new Map();
    for (const track of sortedLibraryTracks) {
      const key = track.track_key || track.path || track.id;
      if (!key) continue;
      byKey.set(String(key), track);
    }
    return byKey;
  }, [sortedLibraryTracks]);

  const nowPlayingTrackForPlaylists = useMemo(() => {
    const nowPlayingTitle = String(musicState.now_playing_title || "")
      .trim()
      .toLowerCase();
    if (!nowPlayingTitle) return null;

    const nowPlayingArtist = String(musicState.now_playing_artist || "")
      .trim()
      .toLowerCase();

    const isNowPlayingMatch = (track) => {
      const trackTitle = String(track?.title || "")
        .trim()
        .toLowerCase();
      const trackArtist = String(track?.artist || "")
        .trim()
        .toLowerCase();

      if (!trackTitle || trackTitle !== nowPlayingTitle) {
        return false;
      }

      if (!nowPlayingArtist.length) {
        return true;
      }

      return trackArtist === nowPlayingArtist;
    };

    const queueCandidate = [
      ...(musicState.priorityQueue || []),
      ...(musicState.queue || []),
    ].find(isNowPlayingMatch);

    if (queueCandidate?.track_key) {
      return (
        trackByKey.get(String(queueCandidate.track_key)) ||
        sortedLibraryTracks.find(
          (track) =>
            String(track.track_key || "") === String(queueCandidate.track_key),
        ) ||
        null
      );
    }

    if (queueCandidate?.path) {
      const queuePath = String(queueCandidate.path);
      const byPath = sortedLibraryTracks.find(
        (track) => String(track.path || "") === queuePath,
      );
      if (byPath) {
        return byPath;
      }
    }

    return sortedLibraryTracks.find(isNowPlayingMatch) || null;
  }, [
    musicState.now_playing_artist,
    musicState.now_playing_title,
    musicState.priorityQueue,
    musicState.queue,
    sortedLibraryTracks,
    trackByKey,
  ]);

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
    if (browseView === "artist" && selectedArtistName) {
      const artistQuery = selectedArtistName.trim().toLowerCase();
      return sortedLibraryTracks.filter((track) =>
        splitArtistNames(track.artist)
          .map((artist) => artist.toLowerCase())
          .includes(artistQuery),
      );
    }

    if (browseView !== "playlist" || !selectedPlaylistName) {
      return sortedLibraryTracks;
    }

    if (
      selectedUserPlaylist &&
      selectedUserPlaylist.name === selectedPlaylistName
    ) {
      const mappedTracks = (selectedUserPlaylist.tracks || [])
        .filter((track) => !!track.track_key)
        .map((track, index) => {
          const key = String(track.track_key);
          const libraryTrack = trackByKey.get(key);
          const playlistNumber = index + 1;

          return {
            ...(libraryTrack || {}),
            ...track,
            id:
              libraryTrack?.id ||
              track.track_key ||
              track.path ||
              `user-playlist-track-${index}`,
            number: playlistNumber,
            playlist_number: playlistNumber,
            duration: track.duration || libraryTrack?.duration || "--:--",
          };
        });

      return [...mappedTracks].sort((left, right) => {
        let result = 0;

        if (sortBy === "artist") {
          result = String(left.artist || "").localeCompare(
            String(right.artist || ""),
          );
        } else if (sortBy === "title") {
          result = String(left.title || "").localeCompare(
            String(right.title || ""),
          );
        } else if (sortBy === "duration") {
          result =
            durationToSeconds(left.duration) -
            durationToSeconds(right.duration);
        } else {
          result =
            Number(left.playlist_number || left.number || 0) -
            Number(right.playlist_number || right.number || 0);
        }

        return sortDirection === "asc" ? result : -result;
      });
    }

    return sortedLibraryTracks.filter(
      (track) => track.playlist_name === selectedPlaylistName,
    );
  }, [
    browseView,
    sortBy,
    sortDirection,
    selectedArtistName,
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

  const handleQueueJump = (track) => {
    if (!track) return;

    sendAction("jump_to_queue_track", {
      track_title: track.title,
      track_path: track.path || null,
      is_priority: track.isPriority === true,
    });
  };

  const resetQueueDragState = useCallback(() => {
    setDraggedQueueTrack(null);
    setQueueDropTarget(null);
  }, []);

  const canQueueDropOnTrack = useCallback(
    (track) => {
      if (!track || !draggedQueueTrack) return false;
      if (queueTab !== "queue") return false;

      return (
        Boolean(track.isPriority) === Boolean(draggedQueueTrack.isPriority)
      );
    },
    [draggedQueueTrack, queueTab],
  );

  const handleQueueDragStart = useCallback(
    (event, track) => {
      if (queueTab !== "queue" || !track) return;

      setDraggedQueueTrack({
        isPriority: Boolean(track.isPriority),
        sourceIndex: Number(track.sourceIndex),
      });

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(track.id || "queue"));
    },
    [queueTab],
  );

  const handleQueueDragOver = useCallback(
    (event, track) => {
      if (!canQueueDropOnTrack(track)) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      const bounds = event.currentTarget.getBoundingClientRect();
      const midpoint = bounds.top + bounds.height / 2;
      const position = event.clientY >= midpoint ? "after" : "before";

      setQueueDropTarget({
        sourceIndex: Number(track.sourceIndex),
        isPriority: Boolean(track.isPriority),
        position,
      });
    },
    [canQueueDropOnTrack],
  );

  const handleQueueDragLeave = useCallback((event, track) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setQueueDropTarget((current) => {
      if (
        !current ||
        Number(current.sourceIndex) !== Number(track?.sourceIndex) ||
        Boolean(current.isPriority) !== Boolean(track?.isPriority)
      ) {
        return current;
      }

      return null;
    });
  }, []);

  const handleQueueDrop = useCallback(
    async (event, track) => {
      event.preventDefault();

      if (!canQueueDropOnTrack(track) || !draggedQueueTrack) {
        resetQueueDragState();
        return;
      }

      const fromIndex = Number(draggedQueueTrack.sourceIndex);
      const targetIndex = Number(track.sourceIndex);
      const position =
        queueDropTarget &&
        Number(queueDropTarget.sourceIndex) === targetIndex &&
        Boolean(queueDropTarget.isPriority) === Boolean(track.isPriority)
          ? queueDropTarget.position
          : "before";

      let toIndex = position === "after" ? targetIndex + 1 : targetIndex;
      if (fromIndex < toIndex) {
        toIndex -= 1;
      }

      resetQueueDragState();

      if (fromIndex === toIndex) return;

      await sendAction("reorder_queue_track", {
        is_priority: Boolean(track.isPriority),
        from_index: fromIndex,
        to_index: toIndex,
      });
    },
    [
      canQueueDropOnTrack,
      draggedQueueTrack,
      queueDropTarget,
      resetQueueDragState,
      sendAction,
    ],
  );

  const handleClearCurrentQueue = () => {
    sendAction("clear_queue");
  };

  const handleBackToHome = () => {
    setBrowseView("home");
    setBrowseTitle("Home");
    setSelectedPlaylistName("");
    setSelectedArtistName("");
    setSelectedPlaylistKeys([]);
    setSelectedTrackKeys([]);
    setSearchValue("");
  };

  const handleOpenPlaylistFromHome = (item) => {
    if (!item?.title || item?.type !== "playlist") return;

    setSelectedPlaylistKeys([]);
    setSelectedTrackKeys([]);

    if (item.scope === "user" && item.playlistId) {
      setSelectedUserPlaylistId(item.playlistId);
    } else {
      setSelectedUserPlaylistId(null);
    }

    handlePlaylistBrowse(item.title, "playlist");
  };

  const handleSearchInput = (value) => {
    setSearchValue(value);
    if (value.trim().length > 0) {
      setOpenSortMenu(null);
      setBrowseView("search");
      setBrowseTitle("Search results");
      setSelectedPlaylistName("");
      setSelectedArtistName("");
    }
  };

  const handleArtistProfileOpen = useCallback(
    (artistName) => {
      const safeArtistName = String(artistName || "").trim();
      if (!safeArtistName.length) return;

      setSelectedTrackKeys([]);
      setSelectedPlaylistKeys([]);
      setSelectedUserPlaylistId(null);
      setSelectedPlaylistName("");
      setSelectedArtistName(safeArtistName);
      setBrowseView("artist");
      setBrowseTitle(`Artist: ${safeArtistName}`);
      setSearchValue("");

      sendAction("enqueue_artist", {
        artist_name: safeArtistName,
      });
    },
    [sendAction],
  );

  const renderArtistLinks = useCallback(
    (artistValue, options = {}) => {
      const {
        containerClass = "truncate text-xs text-zinc-400",
        extraText = "",
      } = options;
      const artists = splitArtistNames(artistValue);

      return (
        <p className={containerClass}>
          {artists.length
            ? artists.map((artist, index) => (
                <span key={`${artist}-${index}`}>
                  {index > 0 ? ", " : ""}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleArtistProfileOpen(artist);
                    }}
                    className="inline rounded-sm bg-transparent p-0 text-inherit no-underline underline-offset-2 hover:underline focus:outline-none"
                  >
                    {artist}
                  </button>
                </span>
              ))
            : null}
          {extraText ? <span>{extraText}</span> : null}
        </p>
      );
    },
    [handleArtistProfileOpen],
  );

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
      <section className="relative z-50 mb-4 flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        {isServerPickerOpen ? (
          <button
            type="button"
            aria-label="Close server picker"
            onClick={() => setIsServerPickerOpen(false)}
            className="fixed inset-0 z-40 bg-black/20"
          />
        ) : null}

        <div className="w-full md:max-w-[17.5rem]">
          <div className="relative z-50">
            <button
              type="button"
              onClick={() => setIsServerPickerOpen((prev) => !prev)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/85 px-3 py-2 text-left transition hover:border-zinc-500 hover:bg-zinc-900"
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
                <div className="app-scrollbar space-y-2 max-h-64 overflow-y-auto pr-1">
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
        </div>

        <div className="min-w-0 flex-1 md:pt-1">
          <p className="text-2xl font-bold">Music</p>
          <p className="text-sm text-zinc-300">
            Live state with backend command bridge.
          </p>
        </div>

        {/* Playlist Editor - visible only in dev mode */}
        {isDevMode && <PlaylistEditor />}
      </section>

      <section className="rounded-2xl border border-zinc-700 bg-zinc-950/80 p-3 md:p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <aside className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Library</h2>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCreatePlaylistOpen((current) => !current)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-green-300"
                  title="Create private playlist"
                >
                  <Plus size={14} />
                </button>

                {isCreatePlaylistOpen ? (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-64 rounded-lg border border-zinc-700 bg-zinc-950 p-3 shadow-xl">
                    <input
                      value={newPlaylistName}
                      onChange={(event) =>
                        setNewPlaylistName(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleCreatePlaylist();
                        }
                      }}
                      autoFocus
                      placeholder="Playlist name"
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 hover:border-cyan-200/40"
                    />

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatePlaylistOpen(false);
                          setNewPlaylistName("");
                        }}
                        className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-800  hover:text-red-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreatePlaylist}
                        disabled={!newPlaylistName.trim().length}
                        className="rounded-md border border-green-600/70 bg-green-600/20 px-2.5 py-1 text-xs text-green-200 hover:bg-green-600/30 disabled:opacity-40"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="app-scrollbar max-h-[32rem] overflow-y-auto overflow-x-hidden pr-2 [scrollbar-gutter:stable]">
              {isPlaylistSearchOpen ? (
                <div className="mb-3 flex items-center gap-2">
                  <div className="relative flex-1 group">
                    <Search
                      size={14}
                      className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 transition group-hover:text-cyan-100"
                    />
                    <input
                      value={playlistSearchValue}
                      onChange={(event) =>
                        setPlaylistSearchValue(event.target.value)
                      }
                      placeholder="Search all playlists"
                      className="w-full rounded-md border border-zinc-700 bg-zinc-950 py-1.5 pl-7 pr-2 text-xs text-zinc-100 placeholder:text-zinc-500 hover:border-cyan-200/40"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaylistSearchOpen(false);
                      setPlaylistSearchValue("");
                    }}
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-red-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm text-zinc-300">Premade playlists</p>
                  <button
                    type="button"
                    onClick={() => setIsPlaylistSearchOpen(true)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-cyan-100"
                    title="Search playlists"
                    aria-label="Search playlists"
                  >
                    <Search size={13} />
                  </button>
                </div>
              )}

              {isPlaylistSearchOpen ? (
                <div className="space-y-2">
                  {mergedFilteredPlaylists.map((playlist) => {
                    const scope = playlist.scope;
                    return (
                      <div
                        key={`${scope}:${playlist.id || playlist.name}`}
                        className={`group relative rounded-md border px-2 py-2 hover:bg-zinc-800 ${selectedPlaylistKeys.includes(toPlaylistKey(playlist, scope)) ? "border-green-500/70 bg-green-500/10" : (scope === "user" && selectedUserPlaylistId === playlist.id) || (scope === "premade" && browseView === "playlist" && !selectedUserPlaylistId && selectedPlaylistName === playlist.name) ? `${ACCENT_BORDER_CLASS} bg-blue-500/10` : "border-zinc-700 bg-zinc-900"}`}
                      >
                        <button
                          type="button"
                          onClick={(event) =>
                            handlePlaylistCardClick(event, playlist, scope)
                          }
                          className="w-full pr-9 text-left"
                        >
                          <p className="truncate text-sm text-zinc-100">
                            {playlist.name}
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            {scope === "user"
                              ? `owner: ${playlist.owner} • ${playlist.songs} tracks`
                              : `${playlist.songs} tracks`}
                          </p>
                        </button>

                        {scope === "user" ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleTogglePlaylistPin(playlist);
                            }}
                            disabled={
                              !playlist.is_pinned && pinnedPlaylistCount >= 8
                            }
                            className={`absolute right-0 top-0 z-10 flex h-6 w-6 translate-x-[35%] -translate-y-[35%] items-center justify-center rounded-full border transition-opacity hover:text-amber-300 ${playlist.is_pinned ? "border-zinc-700 bg-zinc-900 text-amber-300 opacity-100" : "border-zinc-700 bg-zinc-900 text-zinc-400 opacity-0 group-hover:opacity-100 disabled:opacity-30"}`}
                            aria-label={
                              playlist.is_pinned
                                ? `Unpin ${playlist.name}`
                                : `Pin ${playlist.name}`
                            }
                            title={
                              playlist.is_pinned
                                ? "Pinned playlist"
                                : pinnedPlaylistCount >= 8
                                  ? "Pin limit reached (8)"
                                  : "Pin playlist"
                            }
                          >
                            <Pin
                              size={12}
                              fill={
                                playlist.is_pinned ? "currentColor" : "none"
                              }
                            />
                          </button>
                        ) : null}

                        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {scope === "user" ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeletePlaylist(playlist.id, playlist.name)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/95 text-red-300"
                              aria-label={`Delete ${playlist.name}`}
                              title={`Delete ${playlist.name}`}
                            >
                              <Trash2 size={12} />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() =>
                              handlePlaylistQueueAdd(playlist, scope)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/95 text-zinc-100 hover:text-blue-300"
                            aria-label={`Play ${playlist.name}`}
                            title={`Play ${playlist.name}`}
                          >
                            <Play size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {!mergedFilteredPlaylists.length ? (
                    <p className="text-[11px] text-zinc-500">
                      No playlists match your search.
                    </p>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="mb-4 space-y-2">
                    {filteredPremadePlaylists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className={`group relative rounded-md border px-2 py-2 hover:bg-zinc-800 ${selectedPlaylistKeys.includes(toPlaylistKey(playlist, "premade")) ? "border-green-500/70 bg-green-500/10" : browseView === "playlist" && !selectedUserPlaylistId && selectedPlaylistName === playlist.name ? `${ACCENT_BORDER_CLASS} bg-blue-500/10` : "border-zinc-700 bg-zinc-900"}`}
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
                          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/95 text-zinc-100 opacity-0 transition-opacity group-hover:opacity-100 hover:text-blue-300"
                          aria-label={`Play ${playlist.name}`}
                          title={`Play ${playlist.name}`}
                        >
                          <Play size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
                    <span>Your playlists</span>
                  </p>
                  <div className="space-y-2">
                    {filteredUserPlaylists.map((playlist) => {
                      const isDragged =
                        Number(draggedUserPlaylistId) === Number(playlist.id);
                      const isDropTarget =
                        Number(dropTargetUserPlaylistId) ===
                          Number(playlist.id) &&
                        canDropOnUserPlaylist(playlist);

                      return (
                        <div
                          key={playlist.id}
                          draggable
                          onDragStart={(event) =>
                            handleUserPlaylistDragStart(event, playlist)
                          }
                          onDragOver={(event) =>
                            handleUserPlaylistDragOver(event, playlist)
                          }
                          onDragLeave={(event) =>
                            handleUserPlaylistDragLeave(event, playlist)
                          }
                          onDrop={(event) =>
                            handleUserPlaylistDrop(event, playlist)
                          }
                          onDragEnd={resetUserPlaylistDragState}
                          className={`group relative cursor-grab rounded-md border px-2 py-2 transition hover:bg-zinc-800 active:cursor-grabbing ${isDragged ? "z-20 scale-[1.015] border-cyan-400/60 bg-zinc-800 shadow-lg shadow-cyan-500/20" : ""} ${selectedPlaylistKeys.includes(toPlaylistKey(playlist, "user")) ? "border-green-500/70 bg-green-500/10" : selectedUserPlaylistId === playlist.id ? `${ACCENT_BORDER_CLASS} bg-blue-500/10` : "border-zinc-700 bg-zinc-900"}`}
                        >
                          {isDropTarget ? (
                            <span
                              className={`pointer-events-none absolute left-1 right-1 z-30 h-0.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.75)] ${dropTargetPosition === "after" ? "-bottom-1" : "-top-1"}`}
                              aria-hidden="true"
                            />
                          ) : null}
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

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleTogglePlaylistPin(playlist);
                            }}
                            disabled={
                              !playlist.is_pinned && pinnedPlaylistCount >= 8
                            }
                            className={`absolute right-0 top-0 z-10 flex h-6 w-6 translate-x-[35%] -translate-y-[35%] items-center justify-center rounded-full border transition-opacity hover:text-amber-300 ${playlist.is_pinned ? "border-zinc-700 bg-zinc-900 text-amber-300 opacity-100" : "border-zinc-700 bg-zinc-900 text-zinc-400 opacity-0 group-hover:opacity-100"}`}
                            aria-label={
                              playlist.is_pinned
                                ? `Unpin ${playlist.name}`
                                : `Pin ${playlist.name}`
                            }
                            title={
                              playlist.is_pinned
                                ? "Pinned playlist"
                                : pinnedPlaylistCount >= 8
                                  ? "Pin limit reached (8)"
                                  : "Pin playlist"
                            }
                          >
                            <Pin
                              size={12}
                              fill={
                                playlist.is_pinned ? "currentColor" : "none"
                              }
                            />
                          </button>

                          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() =>
                                handleDeletePlaylist(playlist.id, playlist.name)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/95 text-zinc-300 hover:text-red-300"
                              aria-label={`Delete ${playlist.name}`}
                              title={`Delete ${playlist.name}`}
                            >
                              <Trash2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handlePlaylistQueueAdd(playlist, "user")
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/95 text-zinc-100 hover:text-blue-300"
                              aria-label={`Play ${playlist.name}`}
                              title={`Play ${playlist.name}`}
                            >
                              <Play size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {!filteredUserPlaylists.length ? (
                      <p className="text-[11px] text-zinc-500">
                        No custom playlists yet.
                      </p>
                    ) : null}
                  </div>
                </>
              )}
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
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:text-blue-300"
                  aria-label="Back to music home"
                >
                  <ArrowLeft size={16} />
                </button>

                <div className="relative group">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 transition group-hover:text-cyan-100"
                  />
                  <input
                    value={searchValue}
                    onChange={(event) => handleSearchInput(event.target.value)}
                    placeholder="Search songs or artists"
                    className={`w-full rounded-full border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 hover:border-cyan-200/40 ${isSearchOpen ? "ring-1 ring-blue-500/50" : ""}`}
                  />

                  {isSearchOpen ? (
                    <div className="app-scrollbar absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-72 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-950 p-2 shadow-xl">
                      {artistSearchProfiles.length || searchResults.length ? (
                        <div className="space-y-2">
                          {artistSearchProfiles.map((artistProfile) => (
                            <div
                              key={`artist-${artistProfile.id}`}
                              className="flex items-center justify-between gap-2 rounded-md border border-blue-500/50 bg-blue-500/10 px-3 py-2 hover:bg-blue-500/15"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleArtistProfileOpen(artistProfile.artist)
                                }
                                className="min-w-0 flex-1 text-left"
                              >
                                <p className="truncate text-sm text-blue-100">
                                  {artistProfile.artist}
                                </p>
                                <p className="truncate text-xs text-blue-200/80">
                                  Artist profile • {artistProfile.tracks} tracks
                                </p>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleArtistProfileOpen(artistProfile.artist)
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-400/60 bg-zinc-900 text-blue-100 hover:text-blue-200"
                                aria-label={`Play artist ${artistProfile.artist}`}
                                title={`Play ${artistProfile.artist}`}
                              >
                                <Play size={13} />
                              </button>
                            </div>
                          ))}

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
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 hover:text-green-300"
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
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 hover:text-blue-300"
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
                    setSelectedArtistName("");
                    setSelectedTrackKeys([]);
                    setSelectedPlaylistKeys([]);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:text-amber-600"
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
                  {homeCollectionItems.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleOpenPlaylistFromHome(item)}
                      className="group relative rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-left hover:bg-zinc-900"
                    >
                      {item.scope === "user" ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleTogglePlaylistPin({
                              id: item.playlistId,
                              is_pinned: item.isPinned,
                              name: item.title,
                            });
                          }}
                          disabled={!item.isPinned && pinnedPlaylistCount >= 8}
                          className={`absolute right-0 top-0 z-10 flex h-6 w-6 translate-x-[35%] -translate-y-[35%] items-center justify-center rounded-full border transition-opacity hover:text-amber-300 ${item.isPinned ? "border-zinc-700 bg-zinc-900 text-amber-300 opacity-100" : "border-zinc-700 bg-zinc-900 text-zinc-400 opacity-0 group-hover:opacity-100 disabled:opacity-30"}`}
                          aria-label={
                            item.isPinned
                              ? `Unpin ${item.title}`
                              : `Pin ${item.title}`
                          }
                          title={
                            item.isPinned
                              ? "Pinned playlist"
                              : pinnedPlaylistCount >= 8
                                ? "Pin limit reached (8)"
                                : "Pin playlist"
                          }
                        >
                          <Pin
                            size={12}
                            fill={item.isPinned ? "currentColor" : "none"}
                          />
                        </button>
                      ) : null}

                      <p className="truncate text-sm text-zinc-100">
                        {item.title}
                      </p>
                      <p className="text-xs text-zinc-400">{item.subtitle}</p>
                    </button>
                  ))}

                  {!homeCollectionItems.length ? (
                    <p className="col-span-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-xs text-zinc-400">
                      Pin private playlists to see them here. If none are
                      pinned, recently played private playlists will appear.
                    </p>
                  ) : null}
                </div>
              ) : browseView === "playlist" ? (
                <></>
              ) : (
                <p className="mt-2 text-xs text-zinc-400">
                  Currently browsing this section.
                </p>
              )}
            </div>

            {browseView !== "home" && !isSearchOpen ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                {openSortMenu ? (
                  <button
                    type="button"
                    className="fixed inset-0 z-20"
                    onClick={() => setOpenSortMenu(null)}
                    aria-label="Close sorting menu"
                  />
                ) : null}
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-zinc-400">Library tracks</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative z-30">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenSortMenu((current) =>
                            current === "sortBy" ? null : "sortBy",
                          )
                        }
                        className="flex items-center gap-1 rounded-xl border border-zinc-700/70 bg-zinc-900/45 py-1 pl-2 pr-2 text-xs text-zinc-100 backdrop-blur-md transition hover:border-zinc-500 hover:bg-zinc-900/65"
                      >
                        <span>{currentSortByLabel}</span>
                        <ChevronDown
                          size={12}
                          className={`text-zinc-400 transition-transform ${openSortMenu === "sortBy" ? "rotate-180" : ""}`}
                        />
                      </button>

                      {openSortMenu === "sortBy" ? (
                        <div className="absolute left-0 top-[calc(100%+6px)] min-w-[11rem] rounded-xl border border-zinc-700 bg-zinc-950/95 p-1.5 shadow-xl backdrop-blur-md">
                          {SORT_BY_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setSortBy(option.value);
                                setOpenSortMenu(null);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition ${sortBy === option.value ? "bg-blue-500/20 text-blue-200" : "text-zinc-200 hover:bg-zinc-800"}`}
                            >
                              <span>{option.label}</span>
                              {sortBy === option.value ? (
                                <Check size={12} />
                              ) : null}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="relative z-30">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenSortMenu((current) =>
                            current === "sortDirection"
                              ? null
                              : "sortDirection",
                          )
                        }
                        className="flex items-center gap-1 rounded-xl border border-zinc-700/70 bg-zinc-900/45 py-1 pl-2 pr-2 text-xs text-zinc-100 backdrop-blur-md transition hover:border-zinc-500 hover:bg-zinc-900/65"
                      >
                        <span>{currentSortDirectionLabel}</span>
                        <ChevronDown
                          size={12}
                          className={`text-zinc-400 transition-transform ${openSortMenu === "sortDirection" ? "rotate-180" : ""}`}
                        />
                      </button>

                      {openSortMenu === "sortDirection" ? (
                        <div className="absolute left-0 top-[calc(100%+6px)] min-w-[10rem] rounded-xl border border-zinc-700 bg-zinc-950/95 p-1.5 shadow-xl backdrop-blur-md">
                          {SORT_DIRECTION_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setSortDirection(option.value);
                                setOpenSortMenu(null);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition ${sortDirection === option.value ? "bg-blue-500/20 text-blue-200" : "text-zinc-200 hover:bg-zinc-800"}`}
                            >
                              <span>{option.label}</span>
                              {sortDirection === option.value ? (
                                <Check size={12} />
                              ) : null}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="app-scrollbar max-h-[21rem] space-y-2 overflow-y-auto pr-1">
                  {visibleLibraryTracks.map((track) => {
                    const isDraggedTrack =
                      String(draggedPlaylistTrackKey || "") ===
                      String(track.track_key || "");
                    const isTrackDropTarget =
                      playlistTrackDropTarget &&
                      String(playlistTrackDropTarget.trackKey) ===
                        String(track.track_key || "") &&
                      canDropOnPlaylistTrack(track);

                    return (
                      <div
                        key={track.id}
                        draggable={isUserPlaylistTrackReorderEnabled}
                        onDragStart={(event) =>
                          handlePlaylistTrackDragStart(event, track)
                        }
                        onDragOver={(event) =>
                          handlePlaylistTrackDragOver(event, track)
                        }
                        onDragLeave={(event) =>
                          handlePlaylistTrackDragLeave(event, track)
                        }
                        onDrop={(event) =>
                          handlePlaylistTrackDrop(event, track)
                        }
                        onDragEnd={resetPlaylistTrackDragState}
                        onClick={(event) => handleTrackCardClick(event, track)}
                        className={`group relative flex items-center justify-between rounded-md border px-3 py-2 transition ${isUserPlaylistTrackReorderEnabled ? "cursor-grab active:cursor-grabbing" : ""} ${isDraggedTrack ? "z-20 scale-[1.01] border-cyan-400/60 bg-zinc-900 shadow-lg shadow-cyan-500/20" : ""} ${selectedTrackKeys.includes(String(track.track_key || track.path || track.id || "")) ? "border-green-500/70 bg-green-500/10" : "border-zinc-700 bg-zinc-950"}`}
                      >
                        {isTrackDropTarget ? (
                          <span
                            className={`pointer-events-none absolute left-1 right-1 z-30 h-0.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.75)] ${playlistTrackDropTarget?.position === "after" ? "-bottom-1" : "-top-1"}`}
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                            <span className="text-xs text-zinc-400 transition-opacity group-hover:opacity-0">
                              {track.number}
                            </span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handlePriorityQueueAdd(track);
                              }}
                              className="absolute flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 opacity-0 transition-opacity group-hover:opacity-100 hover:text-blue-300"
                              aria-label={`Add ${track.title} to priority queue`}
                              title="Add to priority queue"
                            >
                              <Play size={13} />
                            </button>
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm text-zinc-100">
                              {track.title}
                            </p>
                            {renderArtistLinks(track.artist)}
                          </div>
                        </div>

                        <div className="grid grid-cols-[1.75rem_3.25rem_1.75rem] items-center gap-2">
                          {isSelectedPrivatePlaylistView ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveTracksFromSelectedPrivatePlaylist(
                                  track,
                                );
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-300"
                              aria-label="Remove from selected private playlist"
                              title="Remove from playlist"
                            >
                              <Trash2 size={12} />
                            </button>
                          ) : (
                            <span className="h-7 w-7" aria-hidden="true" />
                          )}

                          <p className="text-center text-xs text-zinc-400">
                            {track.duration}
                          </p>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenAddToPlaylists(track);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 opacity-0 transition-opacity group-hover:opacity-100 hover:text-green-300 disabled:opacity-30"
                            aria-label="Add to selected playlist"
                            title="Add to playlists"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

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
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        Now playing:{" "}
                        {musicState.now_playing_title || "Nothing playing"}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenAddToPlaylistsSingle(
                            nowPlayingTrackForPlaylists,
                          )
                        }
                        disabled={!nowPlayingTrackForPlaylists?.track_key}
                        className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 transition hover:border-green-500/70 hover:text-green-300 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Add currently playing track to playlists"
                        title="Add currently playing track to playlists"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    {renderArtistLinks(musicState.now_playing_artist)}
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
                        className={`${getControlClassName("previous")} hover:text-blue-300 disabled:opacity-40`}
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
                        className={`${getControlClassName("toggle_pause")} hover:text-blue-300 disabled:opacity-40`}
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
                        className={`${getControlClassName("next")} hover:text-blue-300 disabled:opacity-40`}
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
                      <button
                        type="button"
                        onClick={() => {
                          sendAction("disconnect");
                        }}
                        disabled={isSendingAction || !canDisconnect}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Stop playback and disconnect"
                        aria-label="Stop playback and disconnect bot"
                      >
                        <Unplug size={14} />
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
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-zinc-100">
                  {musicState.now_playing_title || "Nothing playing"}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenAddToPlaylistsSingle(nowPlayingTrackForPlaylists)
                  }
                  disabled={!nowPlayingTrackForPlaylists?.track_key}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 transition hover:border-green-500/70 hover:text-green-300 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Add currently playing track to playlists"
                  title="Add currently playing track to playlists"
                >
                  <Plus size={11} />
                </button>
              </div>
              {renderArtistLinks(musicState.now_playing_artist, {
                containerClass: "text-xs text-zinc-400",
              })}
            </div>

            <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-2">
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-zinc-800 px-1">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setQueueTab("queue")}
                    className={`pb-1 px-1 text-xs transition ${queueTab === "queue" ? `${ACCENT_CLASS} border-b ${ACCENT_BORDER_CLASS}` : "text-zinc-400 border-b border-transparent hover:bg-zinc-800/60 hover:text-zinc-200"}`}
                  >
                    Queue
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueTab("previous")}
                    className={`pb-1 px-1 text-xs transition ${queueTab === "previous" ? `${ACCENT_CLASS} border-b ${ACCENT_BORDER_CLASS}` : "text-zinc-400 border-b border-transparent hover:bg-zinc-800/60 hover:text-zinc-200"}`}
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

              <div className="app-scrollbar max-h-[27rem] space-y-2 overflow-y-auto pr-1">
                {currentQueueItems.map((track, index) => {
                  const isDraggedQueueTrack =
                    draggedQueueTrack &&
                    Number(draggedQueueTrack.sourceIndex) ===
                      Number(track.sourceIndex) &&
                    Boolean(draggedQueueTrack.isPriority) ===
                      Boolean(track.isPriority);

                  const isQueueDropTarget =
                    queueDropTarget &&
                    Number(queueDropTarget.sourceIndex) ===
                      Number(track.sourceIndex) &&
                    Boolean(queueDropTarget.isPriority) ===
                      Boolean(track.isPriority) &&
                    canQueueDropOnTrack(track);

                  return (
                    <div
                      key={`${track.id}-${index}-${queueTab}`}
                      draggable={queueTab === "queue"}
                      onDragStart={(event) =>
                        handleQueueDragStart(event, track)
                      }
                      onDragOver={(event) => handleQueueDragOver(event, track)}
                      onDragLeave={(event) =>
                        handleQueueDragLeave(event, track)
                      }
                      onDrop={(event) => handleQueueDrop(event, track)}
                      onDragEnd={resetQueueDragState}
                      className={`group relative rounded-md border px-2 py-2 transition ${queueTab === "queue" ? "cursor-grab active:cursor-grabbing" : ""} ${isDraggedQueueTrack ? "z-20 scale-[1.01] border-cyan-400/60 bg-zinc-800 shadow-lg shadow-cyan-500/20" : ""} ${track.isPriority && queueTab === "queue" ? `${ACCENT_BORDER_CLASS} bg-blue-500/10 hover:bg-blue-500/15` : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800"}`}
                    >
                      {isQueueDropTarget ? (
                        <span
                          className={`pointer-events-none absolute left-1 right-1 z-30 h-0.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.75)] ${queueDropTarget?.position === "after" ? "-bottom-1" : "-top-1"}`}
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-zinc-100">
                            {track.title}
                          </p>
                          {renderArtistLinks(track.artist, {
                            containerClass:
                              "truncate text-[11px] text-zinc-400",
                            extraText:
                              track.isPriority && queueTab === "queue"
                                ? " • priority"
                                : "",
                          })}
                        </div>

                        <div className="flex h-10 w-7 flex-col items-center justify-between">
                          {queueTab === "queue" ? (
                            <button
                              type="button"
                              onClick={() => handleQueueJump(track)}
                              className="flex h-4 w-7 items-center justify-center text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:text-blue-300"
                              title="Jump to this track"
                              aria-label="Jump to this track"
                            >
                              <Play size={12} />
                            </button>
                          ) : (
                            <span className="h-4 w-7" aria-hidden="true" />
                          )}
                          <button
                            type="button"
                            onClick={() => handleQueueRemove(track)}
                            className="flex h-4 w-7 items-center justify-center text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                            title="Remove from queue"
                            aria-label="Remove from queue"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
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

          <div className="fixed left-1/2 top-1/2 z-[60] w-full max-w-[22.5rem] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl">
            <p className="text-sm font-semibold text-zinc-100">
              Add selected track(s) to playlists
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Selected tracks: {pendingAddTrackKeys.length}
            </p>

            <div className="app-scrollbar mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
              {userPlaylists.map((playlist) => {
                const isChecked = checkedPlaylistIds.includes(playlist.id);
                return (
                  <label
                    key={`add-${playlist.id}`}
                    className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 transition hover:bg-zinc-800"
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
                      className="peer sr-only"
                    />
                    <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-600 bg-zinc-950 transition peer-checked:border-green-500 peer-checked:bg-green-500/20">
                      <Check
                        size={12}
                        className="absolute -right-1 -top-1 text-green-300 opacity-0 transition peer-checked:opacity-100"
                      />
                    </span>
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
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-red-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddToPlaylists}
                disabled={
                  !checkedPlaylistIds.length || !pendingAddTrackKeys.length
                }
                className="rounded-md border border-green-700/70 bg-green-700/10 px-3 py-1.5 text-xs text-green-300 hover:bg-green-600/30 disabled:opacity-40"
              >
                Add to selected playlists
              </button>
            </div>
          </div>
        </>
      ) : null}

      {pendingDeletePlaylist ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 bg-black/50"
            onClick={handleCancelDeletePlaylist}
            aria-label="Close delete playlist dialog"
          />

          <div className="fixed left-1/2 top-1/2 z-[60] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl">
            <p className="text-sm font-semibold text-zinc-100">
              Are you sure you want to delete playlist{" "}
              <span className="text-zinc-200">
                “{pendingDeletePlaylist.name}”
              </span>
              ?
            </p>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelDeletePlaylist}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-red-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePlaylist}
                className="rounded-md border border-red-700/60 bg-red-700/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-600/25 hover:text-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}
