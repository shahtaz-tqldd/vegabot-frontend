import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function toComparableOptionValue(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export const getInitials = (name, single = false) => {
  if (single) {
    return name[0].toUpperCase();
  }
  return (
    String(name || "Workspace")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "W"
  );
};

export const formatStatus = (status) =>
  String(status || "draft")
    .replace(/[._]+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const toArray = (value) => (Array.isArray(value) ? value : []);

export const toSnakeCase = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export const getPaletteIndex = (value, palette) => {
  const hash = String(value || "argon")
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return hash % palette.length;
};
