import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const MUSIC_DIR = path.join(process.cwd(), "..", "music");

// Dodanie piosenek do playlist
export async function POST(request, { params }) {
  try {
    const playlistName = decodeURIComponent(params.name);
    const playlistPath = path.join(MUSIC_DIR, playlistName);
    const { song } = await request.json();

    if (!song) {
      return NextResponse.json({ error: "No song provided" }, { status: 400 });
    }

    // Tutaj można by dodać logikę do dodawania piosenek z innego folderu
    // Na razie będziemy to symulować - w przyszłości można by hardlink'ować pliki

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding song to playlist:", error);
    return NextResponse.json(
      { error: "Failed to add song to playlist" },
      { status: 500 },
    );
  }
}
