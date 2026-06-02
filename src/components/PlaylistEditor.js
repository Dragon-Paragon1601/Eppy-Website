"use client";

import { useState, useEffect } from "react";
import { useDevMode } from "./DevModeContext";
import {
  Settings,
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Upload,
  Edit2,
  FolderPlus,
} from "lucide-react";

export default function PlaylistEditor() {
  const { isUnlocked } = useDevMode();
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [renamingSong, setRenamingSong] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [isRenamingPlaylist, setIsRenamingPlaylist] = useState(false);
  const [renamePlaylistValue, setRenamePlaylistValue] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Nie wyświetlaj jeśli nie jest w dev mode

  // Pobranie listy playlist
  useEffect(() => {
    if (isUnlocked) {
      fetchPlaylists();
    }
  }, [isUnlocked]);

  // Clear messages po 3 sekundach
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!isUnlocked) {
    return null;
  }

  const fetchPlaylists = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch("/api/music/playlists");
      if (!response.ok) throw new Error("Failed to fetch playlists");
      const data = await response.json();
      setPlaylists(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaylistSongs = async (playlistName) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(
        `/api/music/playlists/${encodeURIComponent(playlistName)}`,
      );
      if (!response.ok) throw new Error("Failed to fetch playlist songs");
      const data = await response.json();
      setSongs(data);
      setSelectedPlaylist(playlistName);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError("");
    setMessage("");
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        setUploadProgress(((i + 1) / files.length) * 100);

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
          `/api/music/playlists/${encodeURIComponent(selectedPlaylist)}/upload`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          const data = await response.json();
          setError(`Failed to upload ${file.name}: ${data.error}`);
          return;
        }

        const data = await response.json();
        setMessage(`✓ ${data.fileName} uploaded successfully`);
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    // Refresh songs list
    await fetchPlaylistSongs(selectedPlaylist);
    setUploadProgress(0);
  };

  const handleRenameSong = async (oldName) => {
    if (!renameValue.trim()) {
      setError("Song name cannot be empty");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        `/api/music/playlists/${encodeURIComponent(selectedPlaylist)}/rename`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldName, newName: renameValue }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rename song");
      }

      setMessage(`✓ Song renamed to ${renameValue}`);
      setRenamingSong(null);
      setRenameValue("");
      await fetchPlaylistSongs(selectedPlaylist);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSong = async (songName) => {
    if (!confirm(`Delete "${songName}"?`)) return;

    try {
      setError("");

      const response = await fetch(
        `/api/music/playlists/${encodeURIComponent(selectedPlaylist)}/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songName }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete song");
      }

      setMessage(`✓ Song deleted successfully`);
      await fetchPlaylistSongs(selectedPlaylist);
    } catch (err) {
      setError(err.message);
    }
  };

  const createNewPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      setError("Playlist name cannot be empty");
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const response = await fetch("/api/music/playlist-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistName: newPlaylistName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create playlist");
      }

      const data = await response.json();
      setMessage(`✓ Playlist "${data.playlistName}" created successfully`);
      setNewPlaylistName("");
      setIsCreatingPlaylist(false);
      await fetchPlaylists();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renamePlaylist = async () => {
    if (!renamePlaylistValue.trim()) {
      setError("Playlist name cannot be empty");
      return;
    }

    if (renamePlaylistValue === selectedPlaylist) {
      setIsRenamingPlaylist(false);
      return;
    }

    try {
      setError("");
      setIsLoading(true);

      const response = await fetch("/api/music/playlist-management", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldName: selectedPlaylist,
          newName: renamePlaylistValue,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rename playlist");
      }

      setMessage(`✓ Playlist renamed to "${renamePlaylistValue}"`);
      setSelectedPlaylist(renamePlaylistValue);
      setIsRenamingPlaylist(false);
      setRenamePlaylistValue("");
      await fetchPlaylists();
      await fetchPlaylistSongs(renamePlaylistValue);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deletePlaylist = async () => {
    if (
      !confirm(
        `Delete playlist "${selectedPlaylist}" and all its songs? This cannot be undone.`,
      )
    )
      return;

    try {
      setError("");
      setIsLoading(true);

      const response = await fetch("/api/music/playlist-management", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistName: selectedPlaylist }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete playlist");
      }

      setMessage(`✓ Playlist deleted successfully`);
      setSelectedPlaylist(null);
      setSongs([]);
      await fetchPlaylists();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Przycisk Edit w lewym górnym rogu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-7 right-7 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-700 hover:from-blue-400 hover:to-blue-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group z-index:10"
        title="Edytuj Playlisty"
        aria-label="Edit Playlists"
      >
        <Settings
          size={24}
          className="text-white group-hover:animate-spin"
          strokeWidth={2.5}
        />
      </button>

      {/* Modal Editor */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/50 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between bg-slate-800 border-b border-blue-500/30 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings size={28} className="text-blue-400" />
                Edytor Playlist
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">
                  ❌ {error}
                </div>
              )}

              {message && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded text-green-300 text-sm">
                  {message}
                </div>
              )}

              {isLoading && selectedPlaylist === null ? (
                <div className="text-center text-gray-400">
                  Ładowanie playlist...
                </div>
              ) : selectedPlaylist === null ? (
                <div>
                  {/* Sekcja tworzenia nowej playlisty */}
                  {isCreatingPlaylist ? (
                    <div className="mb-6 p-4 bg-slate-800 border border-blue-500/30 rounded-lg">
                      <h4 className="text-white font-semibold mb-3">
                        Nowa Playlist
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          placeholder="Nazwa playlisty..."
                          className="flex-1 px-3 py-2 bg-slate-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") createNewPlaylist();
                          }}
                          autoFocus
                        />
                        <button
                          onClick={createNewPlaylist}
                          disabled={isLoading}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-white text-sm font-semibold"
                        >
                          Utwórz
                        </button>
                        <button
                          onClick={() => {
                            setIsCreatingPlaylist(false);
                            setNewPlaylistName("");
                          }}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
                        >
                          Anuluj
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCreatingPlaylist(true)}
                      className="mb-6 w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded text-white font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <FolderPlus size={18} />
                      Nowa Playlist
                    </button>
                  )}

                  {/* Lista playlisty */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {playlists.map((playlist) => (
                      <button
                        key={playlist}
                        onClick={() => fetchPlaylistSongs(playlist)}
                        className="p-4 bg-slate-800 hover:bg-slate-700 border border-gray-600 hover:border-blue-500 rounded-lg transition-all text-left hover:scale-105"
                      >
                        <div className="font-semibold text-white truncate">
                          {playlist}
                        </div>
                        <div className="text-xs text-gray-400">
                          Click to open →
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => {
                        setSelectedPlaylist(null);
                        setSongs([]);
                        setRenamingSong(null);
                        setRenameValue("");
                      }}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                    >
                      ← Wróć
                    </button>
                    <div className="flex-1">
                      {isRenamingPlaylist ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={renamePlaylistValue}
                            onChange={(e) =>
                              setRenamePlaylistValue(e.target.value)
                            }
                            className="flex-1 px-3 py-1 bg-slate-700 border border-blue-500 rounded text-white text-sm focus:outline-none"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") renamePlaylist();
                              if (e.key === "Escape")
                                setIsRenamingPlaylist(false);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={renamePlaylist}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-semibold"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setIsRenamingPlaylist(false)}
                            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-white text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-white">
                            {selectedPlaylist}
                          </h3>
                          <button
                            onClick={() => {
                              setIsRenamingPlaylist(true);
                              setRenamePlaylistValue(selectedPlaylist);
                            }}
                            className="p-1 hover:bg-slate-700 rounded transition-colors"
                            title="Rename playlist"
                          >
                            <Edit2 size={16} className="text-blue-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">
                      {songs.length} piosenek
                    </span>
                    <button
                      onClick={deletePlaylist}
                      className="p-2 hover:bg-red-500/20 rounded transition-colors"
                      title="Delete playlist"
                    >
                      <Trash2 size={18} className="text-red-400" />
                    </button>
                  </div>

                  {/* Upload sekcja */}
                  <div className="mb-6 p-4 bg-slate-800 border border-blue-500/30 rounded-lg">
                    <label className="flex items-center justify-center gap-2 cursor-pointer">
                      <Upload size={18} className="text-blue-400" />
                      <span className="text-white font-semibold">
                        Upload MP3
                      </span>
                      <input
                        type="file"
                        multiple
                        accept=".mp3"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-2 w-full bg-slate-700 rounded h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>

                  {/* Lista piosenek */}
                  <div className="space-y-2">
                    {songs.map((song, index) => (
                      <div
                        key={index}
                        className="bg-slate-800 border border-gray-600 hover:border-blue-500/50 rounded p-3 flex items-center justify-between group"
                      >
                        {renamingSong === index ? (
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") handleRenameSong(song);
                              if (e.key === "Escape") setRenamingSong(null);
                            }}
                            className="flex-1 px-2 py-1 bg-slate-700 border border-blue-500 rounded text-white text-sm focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white truncate">
                              {index + 1}. {song}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          {renamingSong === index ? (
                            <>
                              <button
                                onClick={() => handleRenameSong(song)}
                                className="p-1 hover:bg-slate-700 rounded"
                                title="Confirm rename"
                              >
                                <Plus size={16} className="text-green-400" />
                              </button>
                              <button
                                onClick={() => {
                                  setRenamingSong(null);
                                  setRenameValue("");
                                }}
                                className="p-1 hover:bg-slate-700 rounded"
                                title="Cancel"
                              >
                                <X size={16} className="text-red-400" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setRenamingSong(index);
                                  setRenameValue(song);
                                }}
                                className="p-1 hover:bg-slate-700 rounded"
                                title="Rename song"
                              >
                                <Edit2 size={16} className="text-blue-400" />
                              </button>
                              <button
                                onClick={() => deleteSong(song)}
                                className="p-1 hover:bg-red-500/20 rounded"
                                title="Delete song"
                              >
                                <Trash2 size={16} className="text-red-400" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {songs.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      Brak piosenek w tej playliście. Upload nowe mp3 powyżej!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
