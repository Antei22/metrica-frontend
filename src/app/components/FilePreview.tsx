import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { resolveApiUrl } from "../api/client";
import type { LessonMaterial } from "../types/domain";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

function previewKind(file: LessonMaterial) {
  const extension = (file.name || file.url.split("?")[0])
    .split(".")
    .pop()
    ?.toLowerCase();
  if (
    ["jpg", "jpeg", "png", "webp", "gif", "avif", "bmp"].includes(
      extension || "",
    ) ||
    [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "image/bmp",
    ].includes(file.mimeType || "")
  )
    return "image";
  if (
    ["heic", "heif"].includes(extension || "") ||
    ["image/heic", "image/heif"].includes(file.mimeType || "")
  )
    return "heic";
  if (extension === "txt" || file.mimeType === "text/plain") return "text";
  if (extension === "pdf" || file.mimeType === "application/pdf") return "pdf";
  if (
    extension === "docx" ||
    file.mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "docx";
  return "unsupported";
}

function FileContent({ file }: { file: LessonMaterial }) {
  const kind = previewKind(file);
  const url = resolveApiUrl(file.url);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!["docx", "heic", "text"].includes(kind)) return;
    const controller = new AbortController();
    let active = true;
    let objectUrl: string | undefined;
    async function loadDocument() {
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          credentials: "include",
        });
        if (!response.ok) throw new Error("Document unavailable");
        if (kind === "heic") {
          const [{ default: convert }, blob] = await Promise.all([
            import("heic2any"),
            response.blob(),
          ]);
          const result = await convert({
            blob,
            toType: "image/jpeg",
            quality: 0.9,
          });
          if (active) {
            objectUrl = URL.createObjectURL(
              Array.isArray(result) ? result[0] : result,
            );
            setText(objectUrl);
          }
        } else if (kind === "text") {
          const result = await response.text();
          if (active) setText(result);
        } else {
          const [mammoth, arrayBuffer] = await Promise.all([
            import("mammoth/mammoth.browser"),
            response.arrayBuffer(),
          ]);
          const result = await mammoth.extractRawText({ arrayBuffer });
          if (active) setText(result.value);
        }
      } catch {
        if (active) setError(true);
      }
    }
    void loadDocument();
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [kind, url]);

  if (error)
    return (
      <p role="alert">
        Не удалось показать файл. Вы можете открыть или скачать оригинал.
      </p>
    );
  if (kind === "heic")
    return text === null ? (
      <p role="status">Готовим фото…</p>
    ) : (
      <img
        className="mx-auto max-h-[60vh] max-w-full object-contain"
        src={text}
        alt={file.name}
        onError={() => setError(true)}
      />
    );
  if (kind === "text")
    return text === null ? (
      <p role="status">Загружаем текст…</p>
    ) : (
      <pre className="whitespace-pre-wrap break-words text-sm">{text}</pre>
    );
  if (kind === "image")
    return (
      <img
        className="mx-auto max-h-[60vh] max-w-full object-contain"
        src={url}
        alt={file.name}
        onError={() => setError(true)}
      />
    );
  if (kind === "pdf")
    return (
      <object
        className="h-[60vh] w-full"
        data={url}
        type="application/pdf"
        aria-label={file.name}
      >
        <p>
          Браузер не поддерживает просмотр PDF. Откройте оригинал по ссылке
          ниже.
        </p>
      </object>
    );
  if (kind === "docx")
    return text === null ? (
      <p role="status">Загружаем документ…</p>
    ) : (
      <div className="whitespace-pre-wrap break-words text-sm">
        {text ||
          "В документе нет текста для предпросмотра. Откройте оригинал, чтобы увидеть изображения."}
      </div>
    );
  return (
    <p>
      Предпросмотр этого формата недоступен. Откройте или скачайте оригинал.
    </p>
  );
}

export function FilePreview({
  files,
  initialId,
  onClose,
}: {
  files: LessonMaterial[];
  initialId: string;
  onClose: () => void;
}) {
  const availableFiles = files.filter((file) => file.url);
  const [selectedId, setSelectedId] = useState(initialId);
  const index = Math.max(
    0,
    availableFiles.findIndex((file) => file.id === selectedId),
  );
  const file = availableFiles[index];
  function move(delta: number) {
    const next = availableFiles[index + delta];
    if (next) setSelectedId(next.id);
  }
  if (!file) return null;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="max-h-[95vh] overflow-y-auto sm:max-w-5xl"
        onKeyDown={(event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.closest("a, input, textarea")
          )
            return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
        }}
      >
        <DialogHeader className="min-w-0 pr-6">
          <DialogTitle className="break-words">
            {file.name || "Просмотр файла"}
          </DialogTitle>
          <DialogDescription>
            Файл {index + 1} из {availableFiles.length}
            {previewKind(file) === "docx"
              ? " · Текст документа; оформление и изображения доступны в оригинале"
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-32 overflow-auto rounded-xl bg-canvas p-3">
          <FileContent key={`${file.id}-${file.url}`} file={file} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={index === 0}
              onClick={() => move(-1)}
              aria-label="Предыдущий файл"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={index === availableFiles.length - 1}
              onClick={() => move(1)}
              aria-label="Следующий файл"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
          <Button asChild variant="outline">
            <a
              href={resolveApiUrl(file.url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download aria-hidden="true" className="size-4" />
              Открыть оригинал / скачать
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
