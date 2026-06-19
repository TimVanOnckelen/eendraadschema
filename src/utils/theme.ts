export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "eendraadschema-theme";

/**
 * Returns the currently active theme.
 * Falls back to the user's system preference, then to light.
 */
export function getTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (stored === "dark" || stored === "light") return stored;

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

/**
 * Applies the theme to the document and persists it.
 */
export function setTheme(theme: Theme): void {
  if (typeof document === "undefined") return;

  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Toggles between light and dark theme.
 */
export function toggleTheme(): Theme {
  const newTheme = getTheme() === "dark" ? "light" : "dark";
  setTheme(newTheme);
  return newTheme;
}

/**
 * Initializes the theme on app startup.
 */
export function initTheme(): void {
  setTheme(getTheme());
}
