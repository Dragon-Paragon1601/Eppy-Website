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
} from "lucide-react";

export default function PlaylistEditor() {
  const { isUnlocked } = useDevMode();
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Nie wyświetlaj jeśli nie jest w dev mode

  // Pobranie listy playlist
  useEffect(() => {
    fetchPlaylists();
  }, []);

  if (!isUnlocked) {
    return null;
  }

  const fetchPlaylists = async () => {
    try {
      setIsLoading(true);
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

  const moveSongUp = async (index) => {
    if (index === 0) return;
    const newSongs = [...songs];
    [newSongs[index], newSongs[index - 1]] = [
      newSongs[index - 1],
      newSongs[index],
    ];
    setSongs(newSongs);
    await saveSongOrder(newSongs);
  };

  const moveSongDown = async (index) => {
    if (index === songs.length - 1) return;
    const newSongs = [...songs];
    [newSongs[index], newSongs[index + 1]] = [
      newSongs[index + 1],
      newSongs[index],
    ];
    setSongs(newSongs);
    await saveSongOrder(newSongs);
  };

  const saveSongOrder = async (songOrder) => {
    try {
      const response = await fetch(
        `/api/music/playlists/${encodeURIComponent(selectedPlaylist)}/order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: songOrder }),
        },
      );
      if (!response.ok) throw new Error("Failed to save order");
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSong = async (index) => {
    const newSongs = songs.filter((_, i) => i !== index);
    setSongs(newSongs);
    await saveSongOrder(newSongs);
  };

  const moveSongToPlaylist = async (songIndex, targetPlaylist) => {
    if (targetPlaylist === selectedPlaylist) return;
    try {
      const song = songs[songIndex];
      const response = await fetch(
        `/api/music/playlists/${encodeURIComponent(targetPlaylist)}/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ song }),
        },
      );
      if (!response.ok) throw new Error("Failed to move song");
      const newSongs = songs.filter((_, i) => i !== songIndex);
      setSongs(newSongs);
      await saveSongOrder(newSongs);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      {/* Przycisk Edit w lewym górnym rogu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-8 left-8 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
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
          <div className="bg-slate-900 border border-orange-500/50 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between bg-slate-800 border-b border-orange-500/30 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Settings size={28} className="text-orange-400" />
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
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300">
                  {error}
                </div>
              )}

              {isLoading && selectedPlaylist === null ? (
                <div className="text-center text-gray-400">
                  Ładowanie playlist...
                </div>
              ) : selectedPlaylist === null ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist}
                      onClick={() => fetchPlaylistSongs(playlist)}
                      className="p-4 bg-slate-800 hover:bg-slate-700 border border-gray-600 hover:border-orange-500 rounded-lg transition-all text-left"
                    >
                      <div className="font-semibold text-white truncate">
                        {playlist}
                      </div>
                      <div className="text-sm text-gray-400">
                        {/* Będziemy uaktualniać liczbę piosenek */}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <button
                      onClick={() => {
                        setSelectedPlaylist(null);
                        setSongs([]);
                      }}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
                    >
                      ← Wróć
                    </button>
                    <h3 className="text-xl font-bold text-white flex-1">
                      {selectedPlaylist}
                    </h3>
                    <span className="text-sm text-gray-400">
                      {songs.length} piosenek
                    </span>
                  </div>

                  {/* Lista piosenek */}
                  <div className="space-y-2">
                    {songs.map((song, index) => (
                      <div
                        key={index}
                        className="bg-slate-800 border border-gray-600 hover:border-orange-500/50 rounded p-3 flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">
                            {index + 1}. {song}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => moveSongUp(index)}
                            disabled={index === 0}
                            className="p-1 hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Przenieś wyżej"
                          >
                            <ChevronUp size={18} className="text-blue-400" />
                          </button>
                          <button
                            onClick={() => moveSongDown(index)}
                            disabled={index === songs.length - 1}
                            className="p-1 hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Przenieś niżej"
                          >
                            <ChevronDown size={18} className="text-blue-400" />
                          </button>

                          {/* Dropdown do przeniesienia do innej playlist */}
                          <select
                            onChange={(e) => {
                              if (e.target.value)
                                moveSongToPlaylist(index, e.target.value);
                              e.target.value = "";
                            }}
                            className="px-2 py-1 bg-slate-700 border border-gray-600 rounded text-white text-sm cursor-pointer"
                            defaultValue=""
                          >
                            <option value="">Przenieś...</option>
                            {playlists
                              .filter((p) => p !== selectedPlaylist)
                              .map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                          </select>

                          <button
                            onClick={() => deleteSong(index)}
                            className="p-1 hover:bg-red-500/20 rounded"
                            title="Usuń piosenkę"
                          >
                            <Trash2 size={18} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {songs.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      Brak piosenek w tej playliście
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
