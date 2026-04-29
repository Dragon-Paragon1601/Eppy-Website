import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const MUSIC_DIR = path.join(process.cwd(), "..", "music");

// Zmiana kolejności piosenek w playliście
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
    // Opcja 1: Zmieniać nazwy plików z numerami prefiksowymi (01-, 02-, itd)
    // Opcja 2: Utrzymywać metadata plik z porządkiem
    // Na razie logika jest w frontend'zie

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating playlist order:", error);
    return NextResponse.json(
      { error: "Failed to update playlist order" },
      { status: 500 },
    );
  }
}
