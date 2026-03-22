import { NextRequest, NextResponse } from "next/server";
import ytdl from "ytdl-core";

export const runtime = "nodejs"; // Richiede Node.js runtime (non Edge)
export const maxDuration = 60;   // Max 60s (Vercel Pro) — adeguare se necessario

/**
 * GET /api/youtube?url=...
 * Restituisce i metadati del video YouTube (titolo, thumbnail, durata)
 * senza scaricare l'audio — utile per mostrare un'anteprima prima del download.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Parametro 'url' mancante" }, { status: 400 });
  }

  if (!ytdl.validateURL(url)) {
    return NextResponse.json({ error: "URL YouTube non valido" }, { status: 400 });
  }

  try {
    const info = await ytdl.getInfo(url);
    const details = info.videoDetails;

    return NextResponse.json({
      title: details.title,
      author: details.author.name,
      lengthSeconds: parseInt(details.lengthSeconds, 10),
      thumbnail:
        details.thumbnails?.[details.thumbnails.length - 1]?.url ?? null,
      videoId: details.videoId,
    });
  } catch (err) {
    console.error("[YouTube API] Errore getInfo:", err);
    return NextResponse.json(
      { error: "Impossibile recuperare le informazioni del video" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/youtube
 * Body: { url: string }
 * Scarica l'audio dal video YouTube e lo restituisce come stream MP3/WebM.
 * Il client riceve il file audio direttamente (Content-Disposition: attachment).
 */
export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON non valido" }, { status: 400 });
  }

  const { url } = body;

  if (!url) {
    return NextResponse.json({ error: "Campo 'url' mancante nel body" }, { status: 400 });
  }

  if (!ytdl.validateURL(url)) {
    return NextResponse.json({ error: "URL YouTube non valido" }, { status: 400 });
  }

  try {
    // Recupera info per il nome del file
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title
      .replace(/[^a-zA-Z0-9\s\-_àèéìòù]/g, "") // rimuove caratteri speciali
      .trim()
      .slice(0, 80); // max 80 caratteri

    // Seleziona il formato audio di migliore qualità
    const audioFormat = ytdl.chooseFormat(info.formats, {
      quality: "highestaudio",
      filter: "audioonly",
    });

    const contentType = audioFormat.mimeType?.split(";")[0] ?? "audio/webm";
    const extension = contentType.includes("mp4") ? "m4a" : "webm";
    const filename = `${title}.${extension}`;

    // Crea lo stream audio
    const audioStream = ytdl.downloadFromInfo(info, {
      format: audioFormat,
    });

    // Converti il Node.js Readable stream in un ReadableStream Web
    const webStream = new ReadableStream({
      start(controller) {
        audioStream.on("data", (chunk: Buffer) => {
          controller.enqueue(chunk);
        });
        audioStream.on("end", () => {
          controller.close();
        });
        audioStream.on("error", (err: Error) => {
          console.error("[YouTube API] Errore stream:", err);
          controller.error(err);
        });
      },
      cancel() {
        audioStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "X-Track-Title": encodeURIComponent(title),
        "X-Track-Duration": info.videoDetails.lengthSeconds,
        "X-Track-Thumbnail":
          info.videoDetails.thumbnails?.[info.videoDetails.thumbnails.length - 1]?.url ?? "",
      },
    });
  } catch (err) {
    console.error("[YouTube API] Errore download:", err);
    return NextResponse.json(
      { error: "Errore durante il download dell'audio. Riprova o verifica che il video sia pubblico." },
      { status: 500 }
    );
  }
}
