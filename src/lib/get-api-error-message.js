export const getApiErrorMessage = (
  error,
  fallback = "Failed to connect with server!",
) => {
  const data = error?.data;

  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data[0] || fallback;

  const candidates = [data.error, data.message, data.detail, data.non_field_errors];

  for (const candidate of candidates) {
    if (typeof candidate === "string") return candidate;
    if (Array.isArray(candidate) && candidate.length) return candidate[0];
  }

  if (typeof data === "object") {
    const firstFieldError = Object.values(data).find((value) => {
      return Array.isArray(value) ? value.length : typeof value === "string";
    });

    if (typeof firstFieldError === "string") return firstFieldError;
    if (Array.isArray(firstFieldError)) return firstFieldError[0];
  }

  return fallback;
};
