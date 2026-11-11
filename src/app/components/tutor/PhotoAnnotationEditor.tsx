import { useEffect, useRef, useState, type PointerEvent } from "react";
import { resolveApiUrl } from "../../api/client";
import {
  drawPhotoMarks,
  type PhotoMark,
  type Point,
} from "../../lib/photoAnnotations";
import type { LessonMaterial } from "../../types/domain";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

type Stroke = Extract<PhotoMark, { points: Point[] }>;

export default function PhotoAnnotationEditor({
  file,
  onSave,
  onClose,
}: {
  file: LessonMaterial;
  onSave: (file: File) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePointer = useRef<number | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [marks, setMarks] = useState<PhotoMark[]>([]);
  const [draft, setDraft] = useState<Stroke | null>(null);
  const [tool, setTool] = useState<PhotoMark["kind"]>("pen");
  const [color, setColor] = useState("#dc2626");
  const [thickness, setThickness] = useState(4);
  const [textSize, setTextSize] = useState(48);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let objectUrl: string | undefined;
    async function loadImage() {
      try {
        const response = await fetch(resolveApiUrl(file.url), {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Photo unavailable");
        let blob = await response.blob();
        if (
          /\.(heic|heif)$/i.test(file.name) ||
          /image\/(heic|heif)/i.test(file.mimeType || "")
        ) {
          const { default: convert } = await import("heic2any");
          const result = await convert({
            blob,
            toType: "image/jpeg",
            quality: 0.95,
          });
          blob = Array.isArray(result) ? result[0] : result;
        }
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        const next = new Image();
        next.src = objectUrl;
        await next.decode();
        if (active) setImage(next);
      } catch {
        if (active)
          setError(
            "Не удалось загрузить фото. Закройте редактор и попробуйте ещё раз.",
          );
      }
    }
    void loadImage();
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file.url, file.name, file.mimeType]);

  const scale = image
    ? Math.min(1, 4096 / Math.max(image.naturalWidth, image.naturalHeight))
    : 1;
  const width = image ? Math.max(1, Math.round(image.naturalWidth * scale)) : 1;
  const height = image
    ? Math.max(1, Math.round(image.naturalHeight * scale))
    : 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    drawPhotoMarks(context, draft ? [...marks, draft] : marks, width, height);
  }, [image, marks, draft, width, height]);

  function pointAt(event: PointerEvent<HTMLCanvasElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(width, ((event.clientX - bounds.left) * width) / bounds.width),
      ),
      y: Math.max(
        0,
        Math.min(
          height,
          ((event.clientY - bounds.top) * height) / bounds.height,
        ),
      ),
    };
  }

  function addText(point: Point) {
    if (!text.trim()) {
      setError("Введите комментарий, затем выберите место на фото.");
      return;
    }
    setMarks((current) => [
      ...current,
      {
        kind: "text",
        point,
        text: text.trim(),
        color,
        size: Math.max(14, (width * textSize) / 1000),
      },
    ]);
    setError(null);
  }

  function pointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (
      !image ||
      saving ||
      activePointer.current !== null ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    const point = pointAt(event);
    if (tool === "text") {
      addText(point);
      return;
    }
    activePointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraft({
      kind: tool,
      color,
      width:
        Math.max(1, (thickness * width) / 1000) *
        (tool === "highlight" ? 6 : 1),
      points: [point],
    });
  }

  function pointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (activePointer.current !== event.pointerId) return;
    const point = pointAt(event);
    setDraft((current) =>
      current ? { ...current, points: [...current.points, point] } : null,
    );
  }

  function finishStroke(
    event: PointerEvent<HTMLCanvasElement>,
    commit: boolean,
  ) {
    if (activePointer.current !== event.pointerId) return;
    activePointer.current = null;
    if (commit && draft) setMarks((current) => [...current, draft]);
    setDraft(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function requestClose() {
    if (saving) return;
    if (marks.length || draft || text.trim()) setDiscardOpen(true);
    else onClose();
  }

  async function saveCopy() {
    const canvas = canvasRef.current;
    if (!canvas || !marks.length || draft || saving) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (result) =>
            result ? resolve(result) : reject(new Error("Export failed")),
          "image/png",
        ),
      );
      const basename = (file.name || "Фото").replace(/\.[^.]+$/, "");
      onSave(
        new File([blob], `${basename}-пометки-${file.fileId || file.id}.png`, {
          type: "image/png",
        }),
      );
      onClose();
    } catch {
      setError(
        "Не удалось подготовить копию. Пометки сохранены в редакторе — попробуйте ещё раз.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <DialogContent
          className="max-h-[95vh] overflow-y-auto sm:max-w-6xl"
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader className="pr-6">
            <DialogTitle>Пометки на фото</DialogTitle>
            <DialogDescription className="break-words">
              {file.name}. Копия с пометками отправится ученику после сохранения
              проверки.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="photo-tool">Инструмент</Label>
              <select
                id="photo-tool"
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={tool}
                disabled={saving}
                onChange={(event) =>
                  setTool(event.target.value as PhotoMark["kind"])
                }
              >
                <option value="pen">Перо</option>
                <option value="highlight">Маркер</option>
                <option value="text">Текст</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="photo-color">Цвет</Label>
              <input
                id="photo-color"
                className="block h-10 w-14 rounded-md border"
                type="color"
                value={color}
                disabled={saving}
                onChange={(event) => setColor(event.target.value)}
              />
            </div>
            {tool === "text" ? (
              <div className="space-y-1">
                <Label htmlFor="photo-text-size">Размер текста</Label>
                <select
                  id="photo-text-size"
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={textSize}
                  disabled={saving}
                  onChange={(event) => setTextSize(Number(event.target.value))}
                >
                  <option value={32}>Мелкий</option>
                  <option value={48}>Средний</option>
                  <option value={64}>Крупный</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="photo-width">Толщина: {thickness}</Label>
                <input
                  id="photo-width"
                  className="block h-10 w-28"
                  type="range"
                  min="2"
                  max="12"
                  step="2"
                  value={thickness}
                  disabled={saving}
                  onChange={(event) => setThickness(Number(event.target.value))}
                />
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={!marks.length || Boolean(draft) || saving}
              onClick={() => setMarks((current) => current.slice(0, -1))}
            >
              Отменить пометку
            </Button>
          </div>
          {tool === "text" ? (
            <div className="space-y-2">
              <Label htmlFor="photo-comment">Комментарий на фото</Label>
              <Textarea
                id="photo-comment"
                rows={2}
                maxLength={300}
                value={text}
                disabled={saving}
                onChange={(event) => setText(event.target.value)}
                placeholder="Например: здесь меняется знак"
              />
              <p className="text-xs text-muted-foreground">
                Нажмите на фото в нужном месте или добавьте комментарий кнопкой.
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={!image || !text.trim() || saving}
                onClick={() => addText({ x: width * 0.05, y: height * 0.05 })}
              >
                Добавить текст на фото
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Рисуйте мышью, пальцем или стилусом. Пометки можно отменить до
              сохранения копии.
            </p>
          )}
          {error ? (
            <p role="alert" className="text-sm text-danger-foreground">
              {error}
            </p>
          ) : null}
          {!image && !error ? <p role="status">Загружаем фото…</p> : null}
          {image ? (
            <div className="flex justify-center overflow-auto rounded-xl border bg-canvas p-2">
              <canvas
                ref={canvasRef}
                width={width}
                height={height}
                role="img"
                aria-label={`Фото для пометок: ${file.name}`}
                className="block max-w-full touch-none"
                style={{
                  width: `min(100%, ${width}px, ${(55 * width) / height}vh)`,
                  height: "auto",
                }}
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={(event) => finishStroke(event, true)}
                onPointerCancel={(event) => finishStroke(event, false)}
                onLostPointerCapture={(event) => finishStroke(event, false)}
              />
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={requestClose}
            >
              Отмена
            </Button>
            <Button
              type="button"
              disabled={!image || !marks.length || Boolean(draft) || saving}
              onClick={() => void saveCopy()}
            >
              {saving ? "Готовим копию…" : "Добавить копию в проверку"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Закрыть без сохранения пометок?</AlertDialogTitle>
            <AlertDialogDescription>
              Изменения на этом фото будут потеряны. Оригинал останется без
              изменений.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Продолжить редактирование</AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>
              Закрыть без сохранения
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
