"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import ComicButton from "@/components/ComicButton";

interface AvatarCropperProps {
  src: string;
  size?: number;
  output?: "png" | "jpeg";
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

const DEFAULT_VIEW = 300;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export default function AvatarCropper({
  src,
  size = 512,
  output = "png",
  onConfirm,
  onCancel,
}: AvatarCropperProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const [view, setView] = useState(DEFAULT_VIEW);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const update = () => setView(element.clientWidth || DEFAULT_VIEW);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 0.92;
      setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current * factor)));
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setNatural({ w: image.naturalWidth, h: image.naturalHeight });
      setZoom(MIN_ZOOM);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    image.src = src;
    return () => {
      image.onload = null;
    };
  }, [src]);

  const fit = natural ? Math.max(view / natural.w, view / natural.h) : 1;
  const scale = fit * zoom;

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!natural) return;
    viewportRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset({
      x: drag.ox + (event.clientX - drag.x),
      y: drag.oy + (event.clientY - drag.y),
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    viewportRef.current?.releasePointerCapture?.(event.pointerId);
  };

  const confirm = useCallback(() => {
    const image = imageRef.current;
    if (!image || !natural) return;
    const ratio = size / view;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (output === "jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, size, size);
    }
    context.save();
    context.translate(size / 2 + offset.x * ratio, size / 2 + offset.y * ratio);
    context.rotate((rotation * Math.PI) / 180);
    context.scale(scale * ratio, scale * ratio);
    context.drawImage(image, -natural.w / 2, -natural.h / 2, natural.w, natural.h);
    context.restore();
    onConfirm(
      output === "jpeg" ? canvas.toDataURL("image/jpeg", 0.9) : canvas.toDataURL("image/png"),
    );
  }, [natural, size, view, offset, rotation, scale, output, onConfirm]);

  return (
    <div className="cropper">
      <div
        ref={viewportRef}
        className="cropper__viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {natural ? (
          <img
            src={src}
            alt="Avatar ausrichten"
            draggable={false}
            className="cropper__image"
            style={{
              width: natural.w,
              height: natural.h,
              transform:
                `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) ` +
                `rotate(${rotation}deg) scale(${scale})`,
            }}
          />
        ) : null}
        <div className="cropper__circle" aria-hidden="true" />
      </div>

      <label className="cropper__control">
        <span>Größe</span>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          disabled={!natural}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
      </label>

      <label className="cropper__control">
        <span>Drehen</span>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={rotation}
          disabled={!natural}
          onChange={(event) => setRotation(Number(event.target.value))}
        />
      </label>

      <div className="row" style={{ marginTop: "0.6rem" }}>
        <ComicButton tone="green" size="md" icon="✓" onClick={confirm}>
          PASST!
        </ComicButton>
        <ComicButton tone="white" size="md" onClick={onCancel}>
          ABBRECHEN
        </ComicButton>
      </div>
    </div>
  );
}
