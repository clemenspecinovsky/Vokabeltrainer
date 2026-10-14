"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import AvatarCropper from "@/components/AvatarCropper";
import ComicButton from "@/components/ComicButton";

type Stage = "camera" | "preview" | "working" | "position" | "error";
type Task = "comic" | "save";

interface MangaPhotoButtonProps {
  onSaved: (filename: string) => void;
  disabled?: boolean;
}

const MAX_SOURCE = 1280;

function frameToDataUrl(source: CanvasImageSource, width: number, height: number): string {
  const scale = Math.min(1, MAX_SOURCE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Bild kann nicht geladen werden"));
    image.src = src;
  });
}

async function fileToSource(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Datei kann nicht gelesen werden"));
    reader.readAsDataURL(file);
  });
  const image = await loadImage(dataUrl);
  return frameToDataUrl(image, image.naturalWidth, image.naturalHeight);
}

export default function MangaPhotoButton({ onSaved, disabled = false }: MangaPhotoButtonProps) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("camera");
  const [task, setTask] = useState<Task>("comic");
  const [source, setSource] = useState<string | null>(null);
  const [comic, setComic] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [fromCamera, setFromCamera] = useState(true);
  const [message, setMessage] = useState("");
  const [canCamera, setCanCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCanCamera(
      window.isSecureContext && typeof navigator.mediaDevices?.getUserMedia === "function",
    );
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  useEffect(() => stopStream, []);

  useEffect(() => {
    if (stage === "camera" && open && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [stage, open]);

  function close() {
    stopStream();
    setOpen(false);
    setSource(null);
    setComic(null);
    setFallback(false);
    setMessage("");
    setStage("camera");
  }

  async function openCamera() {
    setMessage("");
    setSource(null);
    setComic(null);
    setFallback(false);
    setFromCamera(true);
    if (!canCamera) {
      setMessage("Die Kamera geht nur über localhost oder https. Nutze sonst „Bild hochladen“.");
      setStage("error");
      setOpen(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setStage("camera");
      setOpen(true);
    } catch {
      setMessage("Die Kamera ist nicht erlaubt oder belegt. Nutze „Bild hochladen“.");
      setStage("error");
      setOpen(true);
    }
  }

  function chooseFile() {
    setMessage("");
    fileRef.current?.click();
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setSource(frameToDataUrl(video, video.videoWidth, video.videoHeight));
    stopStream();
    setStage("preview");
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage("");
    setComic(null);
    setFallback(false);
    setFromCamera(false);
    try {
      setSource(await fileToSource(file));
      setStage("preview");
      setOpen(true);
    } catch {
      setMessage("Dieses Bild kann ich nicht lesen.");
      setStage("error");
      setOpen(true);
    }
  }

  async function generate() {
    if (!source) return;
    setStage("working");
    setTask("comic");
    setMessage("");
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 120000);
    try {
      const response = await fetch("/api/settings/avatar-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: source, mode: "comic" }),
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => ({}))) as {
        image?: string;
        error?: string;
        mode?: string;
      };
      if (!response.ok || !data.image) {
        setStage("error");
        setMessage(data.error ?? "Das hat nicht geklappt. Bitte noch einmal.");
        return;
      }
      setComic(data.image);
      setFallback(data.mode !== "comic");
      setStage("position");
    } catch {
      setStage("error");
      setMessage("Der Comic-Zauber dauert zu lange. Bitte noch einmal.");
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function savePosition(dataUrl: string) {
    setStage("working");
    setTask("save");
    setMessage("");
    try {
      const response = await fetch("/api/settings/avatar-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, mode: "save" }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        avatarImage?: string;
        error?: string;
      };
      if (!response.ok || !data.avatarImage) {
        setStage("error");
        setMessage(data.error ?? "Das hat nicht geklappt. Bitte noch einmal.");
        return;
      }
      onSaved(data.avatarImage);
      close();
    } catch {
      setStage("error");
      setMessage("Kein Kontakt zum Server. Bitte noch einmal.");
    }
  }

  const heading =
    stage === "working"
      ? task === "save"
        ? "SPEICHERN…"
        : "COMIC…"
      : stage === "position"
        ? "AUSRICHTEN"
        : stage === "preview"
          ? "SIEHT GUT AUS?"
          : stage === "error"
            ? "UPS!"
            : "CHEESE!";

  return (
    <>
      <div className="row">
        <ComicButton tone="pink" size="md" icon="✎" onClick={openCamera} disabled={disabled}>
          FOTO MIT KAMERA
        </ComicButton>
        <ComicButton
          tone="cyan"
          size="md"
          icon="+"
          onClick={chooseFile}
          disabled={disabled}
        >
          BILD HOCHLADEN
        </ComicButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={onFile}
        />
      </div>

      {open ? (
        <div className="feedback" role="dialog" aria-modal="true">
          <div className="feedback__card pop-in">
            <h2
              className="display"
              style={{ fontSize: "clamp(1.8rem, 7vw, 3rem)", margin: "0 0 0.6rem" }}
            >
              {heading}
            </h2>

            {stage === "camera" ? (
              <div className="camera-stage">
                <video ref={videoRef} playsInline muted autoPlay />
              </div>
            ) : null}
            {comic && stage === "position" ? (
              <AvatarCropper src={comic} output="png" onConfirm={savePosition} onCancel={close} />
            ) : null}
            {stage !== "camera" && stage !== "position" && (comic ?? source) ? (
              <img className="camera-stage" src={comic ?? source ?? ""} alt="Dein Foto" />
            ) : null}

            {stage === "working" ? (
              <p className="hint hint--live">
                {task === "save"
                  ? "Ich speichere deinen Comic-Avatar. Einen Moment."
                  : "Ich mache aus deinem Foto einen Comic. Das dauert ein paar Sekunden."}
              </p>
            ) : null}
            {stage === "position" && fallback ? (
              <p className="hint">
                Der Comic-Zauber macht gerade Pause. Ich habe nur den Hintergrund weggemacht.
              </p>
            ) : null}
            {message ? (
              <p className="error-box" role="alert">
                {message}
              </p>
            ) : null}

            {stage !== "position" ? (
              <div className="row" style={{ marginTop: "0.6rem" }}>
                {stage === "camera" ? (
                  <>
                    <ComicButton tone="green" size="md" icon="◉" onClick={capture}>
                      FOTO MACHEN
                    </ComicButton>
                    <ComicButton tone="white" size="md" onClick={close}>
                      ABBRECHEN
                    </ComicButton>
                  </>
                ) : null}

                {stage === "preview" ? (
                  <>
                    <ComicButton tone="pink" size="md" icon="★" onClick={generate}>
                      COMIC MACHEN!
                    </ComicButton>
                    <ComicButton
                      tone="white"
                      size="md"
                      onClick={fromCamera ? openCamera : chooseFile}
                    >
                      NOCHMAL
                    </ComicButton>
                  </>
                ) : null}

                {stage === "error" || stage === "working" ? (
                  <ComicButton tone="white" size="md" onClick={close} disabled={stage === "working"}>
                    ZU
                  </ComicButton>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
