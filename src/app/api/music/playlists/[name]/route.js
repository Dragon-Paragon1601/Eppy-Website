import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const MUSIC_DIR = path.join(process.cwd(), "..", "music");

export async function GET(request, { params }) {
  try {
    const playlistName = decodeURIComponent(params.name);
    const playlistPath = path.join(MUSIC_DIR, playlistName);

    // Sprawdzanie czy folder istnieje
    const stat = await fs.stat(playlistPath);
    if (!stat.isDirectory()) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 },
      );
    }

    // Pobranie listy plików MP3
    const files = await fs.readdir(playlistPath);
    const songs = files
      .filter((file) => file.endsWith(".mp3"))
      .sort()
      .map((file) => file.replace(/\.mp3$/, ""));

    return NextResponse.json(songs);
  } catch (error) {
    console.error("Error fetching playlist songs:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist songs" },
      { status: 500 },
    );
  }
}

// Zapisanie nowej kolejności piosenek (przeorganizowanie nazw plików)
export async function POST(request, { params }) {
  try {
    const playlistName = decodeURIComponent(params.name);
    const playlistPath = path.join(MUSIC_DIR, playlistName);
    const { order } = await request.json();

    if (!Array.isArray(order)) {
      return NextResponse.json(
        { error: "Invalid order format" },
        { status: 400 },
      );
    }

    // Tutaj można by dodać logikę do rzeczywistego przeorganizowania plików
    // Na razie będziemy to symulować w frontend'zie
    // W przyszłości można by dodać numery prefix do plików

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving playlist order:", error);
    return NextResponse.json(
      { error: "Failed to save playlist order" },
      { status: 500 },
    );
  }
}
