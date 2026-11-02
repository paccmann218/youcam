import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const BASE = "https://api.sarvam.ai";
/** English for the demo. Sarvam also speaks and transcribes Hindi, Tamil, Telugu and other Indian languages. */
export const VOICE_LANGUAGE = process.env.SARVAM_LANGUAGE || "en-IN";

export function sarvamConfigured(): boolean {
  return Boolean(process.env.SARVAM_API_KEY);
}

function key(): string {
  const value = process.env.SARVAM_API_KEY;
  if (!value) throw new Error("SARVAM_API_KEY is not set on the laptop.");
  return value;
}

/**
 * Sarvam Bulbul text-to-speech, cached by text so repeated prompts are instant. MP3 when Sarvam
 * offers it: the watch often reaches the laptop over the phone's Bluetooth link, where a WAV is slow.
 */
export async function speak(text: string): Promise<Buffer> {
  const dir = path.join(process.cwd(), ".data", "voice");
  const file = path.join(dir, `${createHash("sha1").update(`${VOICE_LANGUAGE}|mp3|${text}`).digest("hex")}.audio`);
  try {
    return await readFile(file);
  } catch {
    /* not cached yet */
  }
  const request = (codec: boolean) =>
    fetch(`${BASE}/text-to-speech`, {
      method: "POST",
      headers: { "api-subscription-key": key(), "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        target_language_code: VOICE_LANGUAGE,
        model: "bulbul:v3",
        speech_sample_rate: 16000,
        ...(codec ? { output_audio_codec: "mp3" } : {}),
      }),
    });
  let res = await request(true);
  if (res.status === 400 || res.status === 422) res = await request(false);
  const json = (await res.json().catch(() => ({}))) as { audios?: string[]; error?: { message?: string } };
  if (!res.ok || !json.audios?.[0]) throw new Error(json.error?.message ?? `Sarvam text-to-speech failed (${res.status}).`);
  const audio = Buffer.from(json.audios[0], "base64");
  await mkdir(dir, { recursive: true });
  await writeFile(file, audio);
  return audio;
}

/** Sarvam Saarika speech-to-text on a short WAV clip. */
export async function transcribe(audio: Blob): Promise<string> {
  const form = new FormData();
  form.set("file", audio, "answer.wav");
  form.set("model", "saarika:v2.5");
  form.set("language_code", VOICE_LANGUAGE);
  const res = await fetch(`${BASE}/speech-to-text`, { method: "POST", headers: { "api-subscription-key": key() }, body: form });
  const json = (await res.json().catch(() => ({}))) as { transcript?: string; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? `Sarvam speech-to-text failed (${res.status}).`);
  return (json.transcript ?? "").trim();
}
