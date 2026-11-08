import { useEffect, useMemo } from "react";

export const formatFileSize = (bytes) => {
  if (!bytes) return "";
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const useFilePreviews = (files) => {
  const fileList = useMemo(() => Array.from(files || []), [files]);
  const previews = useMemo(
    () =>
      fileList.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [fileList],
  );

  useEffect(
    () => () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    },
    [previews],
  );

  return previews;
};
