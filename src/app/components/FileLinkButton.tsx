import { useState } from "react";
import type { LessonMaterial } from "../types/domain";
import { FilePreview } from "./FilePreview";
import { Button } from "./ui/button";

interface FileLinkButtonProps {
  file: LessonMaterial;
  fallback: string;
  files?: LessonMaterial[];
}

export function FileLinkButton({
  file,
  fallback,
  files = [file],
}: FileLinkButtonProps) {
  const [open, setOpen] = useState(false);
  if (!file.url) return null;
  return (
    <>
      <Button
        type="button"
        className="max-w-full justify-start"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <span className="block max-w-[min(28rem,70vw)] truncate">
          {file.name || fallback}
        </span>
      </Button>
      {open ? (
        <FilePreview
          files={files}
          initialId={file.id}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
