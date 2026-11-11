import type { LessonMaterial } from "../types/domain";

export type Point = { x: number; y: number };
export type PhotoMark =
  | { kind: "pen" | "highlight"; color: string; width: number; points: Point[] }
  | { kind: "text"; color: string; size: number; point: Point; text: string };

export function isAnnotatablePhoto(file: LessonMaterial) {
  const extension = (file.name || file.url.split("?")[0])
    .split(".")
    .pop()
    ?.toLowerCase();
  return (
    Boolean(file.url) &&
    ([
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif",
      "heic",
      "heif",
      "avif",
      "bmp",
    ].includes(extension || "") ||
      /^image\/(jpeg|png|webp|gif|heic|heif|avif|bmp)$/i.test(
        file.mimeType || "",
      ))
  );
}

export function drawPhotoMarks(
  context: CanvasRenderingContext2D,
  marks: PhotoMark[],
  width: number,
  height: number,
) {
  for (const mark of marks) {
    context.save();
    if (mark.kind === "text") {
      context.textBaseline = "top";
      let size = Math.min(mark.size, width / 8, height / 4);
      let padding = 0;
      let lineHeight = 0;
      let x = 0;
      let maxWidth = 0;
      let lines: string[] = [];
      // Fit long comments inside the image, including when placed near an edge.
      for (let attempt = 0; attempt < 30; attempt++) {
        padding = size * 0.2;
        lineHeight = size * 1.3;
        x = Math.min(Math.max(padding, mark.point.x), width - size * 7);
        maxWidth = width - x - padding;
        context.font = `${size}px sans-serif`;
        lines = [];
        for (const paragraph of mark.text.split("\n")) {
          let line = "";
          for (const char of paragraph) {
            if (line && context.measureText(line + char).width > maxWidth) {
              lines.push(line);
              line = "";
            }
            line += char;
          }
          lines.push(line);
        }
        if (lines.length * lineHeight + padding * 2 <= height) break;
        size *= 0.8;
      }
      const y = Math.max(
        padding,
        Math.min(mark.point.y, height - lines.length * lineHeight - padding),
      );
      lines.forEach((line, index) => {
        context.fillStyle = "rgba(255,255,255,0.92)";
        context.fillRect(
          x - padding,
          y + index * lineHeight - padding,
          context.measureText(line).width + padding * 2,
          lineHeight,
        );
        context.fillStyle = mark.color;
        context.fillText(line, x, y + index * lineHeight, maxWidth);
      });
    } else {
      context.strokeStyle = mark.color;
      context.fillStyle = mark.color;
      context.lineWidth = mark.width;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.globalAlpha = mark.kind === "highlight" ? 0.3 : 1;
      context.beginPath();
      mark.points.forEach((point, index) => {
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      if (mark.points.length === 1) {
        context.arc(
          mark.points[0].x,
          mark.points[0].y,
          mark.width / 2,
          0,
          Math.PI * 2,
        );
        context.fill();
      } else context.stroke();
    }
    context.restore();
  }
}
