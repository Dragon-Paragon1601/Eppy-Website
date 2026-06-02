import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const MUSIC_DIR = path.join(process.cwd(), "..", "music");

// Tworzenie nowej playlisty
export async function POST(request) {
  try {
    const { playlistName } = await request.json();

    if (!playlistName) {
      return NextResponse.json(
        { error: "playlistName is required" },
        { status: 400 },
      );
    }

    // Sanitizacja nazwy folderu
    let sanitized = playlistName.replace(/[^\w\s-]/g, "").trim();
    if (!sanitized) {
      return NextResponse.json(
        { error: "Invalid playlist name" },
        { status: 400 },
      );
    }

    const playlistPath = path.join(MUSIC_DIR, sanitized);

    // Sprawdzenie czy folder już istnieje
    try {
      await fs.access(playlistPath);
      return NextResponse.json(
        { error: "Playlist already exists" },
        { status: 409 },
      );
    } catch {
      // Folder nie istnieje, możemy go stworzyć
    }

    // Tworzenie folderu
    await fs.mkdir(playlistPath, { recursive: true });

    return NextResponse.json({
      success: true,
      playlistName: sanitized,
      message: `Playlist ${sanitized} created successfully`,
    });
  } catch (error) {
    console.error("Error creating playlist:", error);
    return NextResponse.json(
      { error: "Failed to create playlist", details: error.message },
      { status: 500 },
    );
  }
}

// Usunięcie playlisty
export async function DELETE(request) {
  try {
    const { playlistName } = await request.json();

    if (!playlistName) {
      return NextResponse.json(
        { error: "playlistName is required" },
        { status: 400 },
      );
    }

    const playlistPath = path.join(MUSIC_DIR, playlistName);

    // Sprawdzenie czy folder istnieje
    try {
      const stat = await fs.stat(playlistPath);
      if (!stat.isDirectory()) {
        return NextResponse.json(
          { error: "Playlist not found" },
          { status: 404 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 },
      );
    }

    // Usunięcie całego folderu rekursywnie
    await fs.rm(playlistPath, { recursive: true, force: true });

    return NextResponse.json({
      success: true,
      message: `Playlist ${playlistName} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return NextResponse.json(
      { error: "Failed to delete playlist", details: error.message },
      { status: 500 },
    );
  }
}

// Rename playlisty
export async function PATCH(request) {
  try {
    const { oldName, newName } = await request.json();

    if (!oldName || !newName) {
      return NextResponse.json(
        { error: "Both oldName and newName are required" },
        { status: 400 },
      );
    }

    const oldPath = path.join(MUSIC_DIR, oldName);
    const newPath = path.join(MUSIC_DIR, newName);

    // Sprawdzenie czy stary folder istnieje
    try {
      const stat = await fs.stat(oldPath);
      if (!stat.isDirectory()) {
        return NextResponse.json(
          { error: "Playlist not found" },
          { status: 404 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 },
      );
    }

    // Sprawdzenie czy nowy folder już istnieje
    try {
      await fs.access(newPath);
      return NextResponse.json(
        { error: "Playlist with this name already exists" },
        { status: 409 },
      );
    } catch {
      // Nowy folder nie istnieje, możemy zmienić nazwę
    }

    // Zmiana nazwy folderu
    await fs.rename(oldPath, newPath);

    return NextResponse.json({
      success: true,
      message: `Playlist renamed from ${oldName} to ${newName}`,
    });
  } catch (error) {
    console.error("Error renaming playlist:", error);
    return NextResponse.json(
      { error: "Failed to rename playlist", details: error.message },
      { status: 500 },
    );
  }
}
