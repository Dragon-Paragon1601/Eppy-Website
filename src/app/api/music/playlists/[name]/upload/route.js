import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const MUSIC_DIR = path.join(process.cwd(), "..", "music");

// Upload MP3 pliku do playlist
export async function POST(request, { params }) {
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

    // Pobranie multipart form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Sprawdzenie czy to MP3
    if (!file.name.toLowerCase().endsWith(".mp3")) {
      return NextResponse.json(
        { error: "Only MP3 files are allowed" },
        { status: 400 },
      );
    }

    // Konwersja do buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Sanitizacja nazwy pliku (usunięcie niebezpiecznych znaków)
    let fileName = file.name;
    fileName = fileName.replace(/[^\w\s.-]/g, "").trim();
    if (!fileName.endsWith(".mp3")) {
      fileName += ".mp3";
    }

    // Sprawdzenie czy plik już istnieje
    const filePath = path.join(playlistPath, fileName);
    try {
      await fs.access(filePath);
      return NextResponse.json(
        {
          error: "File already exists",
          suggestion: `${path.parse(fileName).name}_${Date.now()}.mp3`,
        },
        { status: 409 },
      );
    } catch {
      // Plik nie istnieje, możemy go zapisać
    }

    // Zapisanie pliku
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      fileName: fileName,
      message: `File ${fileName} uploaded successfully`,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file", details: error.message },
      { status: 500 },
    );
  }
}
