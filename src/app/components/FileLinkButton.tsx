import { resolveApiUrl } from "../api/client";
import type { LessonMaterial } from "../types/domain";
import { Button } from "./ui/button";

interface FileLinkButtonProps {
  file: LessonMaterial;
  fallback: string;
}

export function FileLinkButton({ file, fallback }: FileLinkButtonProps) {
  if (!file.url) {
    return null;
  }

  return (
    <Button asChild className="max-w-full justify-start" variant="outline">
      <a href={resolveApiUrl(file.url)} rel="noreferrer" target="_blank">
        <span className="block max-w-[min(28rem,70vw)] truncate">
          {file.name || fallback}
        </span>
      </a>
    </Button>
  );
}
