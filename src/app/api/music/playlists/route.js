import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const MUSIC_DIR = path.join(process.cwd(), "..", "music");

export async function GET() {
  try {
    const files = await fs.readdir(MUSIC_DIR);
    const folders = [];

    for (const file of files) {
      const stat = await fs.stat(path.join(MUSIC_DIR, file));
      if (stat.isDirectory() && !file.startsWith(".")) {
        folders.push(file);
      }
    }

    return NextResponse.json(folders.sort());
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 },
    );
  }
}
