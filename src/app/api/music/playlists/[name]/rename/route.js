import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const MUSIC_DIR = path.join(process.cwd(), "..", "music");

// Rename piosenek w playliście
export async function POST(request, { params }) {
  try {
    const playlistName = decodeURIComponent(params.name);
    const playlistPath = path.join(MUSIC_DIR, playlistName);
    const { oldName, newName } = await request.json();

    if (!oldName || !newName) {
      return NextResponse.json(
        { error: "Both oldName and newName are required" },
        { status: 400 },
      );
    }

    const oldPath = path.join(playlistPath, `${oldName}.mp3`);
    const newPath = path.join(playlistPath, `${newName}.mp3`);

    // Sprawdzenie czy stary plik istnieje
    try {
      await fs.access(oldPath);
    } catch {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    // Sprawdzenie czy nowy plik już istnieje
    try {
      await fs.access(newPath);
      return NextResponse.json(
        { error: "Song with this name already exists" },
        { status: 409 },
      );
    } catch {
      // Nowy plik nie istnieje, możemy zmienić nazwę
    }

    // Zmiana nazwy pliku
    await fs.rename(oldPath, newPath);

    return NextResponse.json({
      success: true,
      message: `Song renamed from ${oldName} to ${newName}`,
    });
  } catch (error) {
    console.error("Error renaming song:", error);
    return NextResponse.json(
      { error: "Failed to rename song", details: error.message },
      { status: 500 },
    );
  }
}
