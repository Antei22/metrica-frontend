import { apiConfig } from "./endpoints";
import { apiRequest } from "./client";
import type { UploadedFileRef } from "../types/domain";

export async function uploadTutorFile(file: File): Promise<UploadedFileRef> {
  const formData = new FormData();
  formData.append("file", file);

  const payload = await apiRequest<{ file_id?: number; fileId?: number }>(
    apiConfig.tutor.upload,
    {
      method: "POST",
      body: formData,
    },
  );

  return {
    fileId: payload.file_id || payload.fileId || 0,
  };
}
