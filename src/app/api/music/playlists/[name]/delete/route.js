import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const MUSIC_DIR = path.join(process.cwd(), "..", "music");

// Usunięcie piosenki z playlisty
export async function DELETE(request, { params }) {
  try {
    const playlistName = decodeURIComponent(params.name);
    const playlistPath = path.join(MUSIC_DIR, playlistName);
    const { songName } = await request.json();

    if (!songName) {
      return NextResponse.json(
        { error: "songName is required" },
        { status: 400 },
      );
    }

    const filePath = path.join(playlistPath, `${songName}.mp3`);

    // Sprawdzenie czy plik istnieje
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    // Usunięcie pliku
    await fs.unlink(filePath);

    return NextResponse.json({
      success: true,
      message: `Song ${songName} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting song:", error);
    return NextResponse.json(
      { error: "Failed to delete song", details: error.message },
      { status: 500 },
    );
  }
}
