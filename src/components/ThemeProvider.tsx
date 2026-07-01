import { useCallback, useContext, useEffect, useMemo, useState } from "preact/hooks";
import { createContext } from "preact";
import type { ComponentChildren } from "preact";

type Theme = "dark" | "light" | "system";

export type AccentColor = {
  name: string;
  light: string;
  dark: string;
};

export const ACCENT_COLORS: AccentColor[] = [
  { name: "Orange", light: "oklch(0.75 0.18 55)", dark: "oklch(0.65 0.18 55)" },
  { name: "Rose", light: "oklch(0.72 0.19 350)", dark: "oklch(0.62 0.19 350)" },
  { name: "Yellow", light: "oklch(0.82 0.17 85)", dark: "oklch(0.72 0.17 85)" },
  { name: "Green", light: "oklch(0.72 0.19 155)", dark: "oklch(0.62 0.19 155)" },
  { name: "Teal", light: "oklch(0.72 0.15 180)", dark: "oklch(0.62 0.15 180)" },
  { name: "Blue", light: "oklch(0.65 0.18 250)", dark: "oklch(0.58 0.18 250)" },
  { name: "Violet", light: "oklch(0.62 0.20 290)", dark: "oklch(0.55 0.20 290)" },
  { name: "Pink", light: "oklch(0.72 0.18 330)", dark: "oklch(0.62 0.18 330)" },
];

type ThemeProviderProps = {
  children: ComponentChildren;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  showTooltips: boolean;
  setShowTooltips: (show: boolean) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

const VALID_THEMES = new Set<string>(["dark", "light", "system"]);

function parseTheme(value: string | null, fallback: Theme): Theme {
  if (value && VALID_THEMES.has(value)) return value as Theme;
  return fallback;
}

function resolveMode(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() =>
    parseTheme(localStorage.getItem(storageKey), defaultTheme),
  );

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const stored = localStorage.getItem(`${storageKey}-accent`);
    if (stored) {
      return ACCENT_COLORS.find((c) => c.name === stored) ?? ACCENT_COLORS[0]!;
    }
    return ACCENT_COLORS[0]!;
  });

  const [showTooltips, setShowTooltipsState] = useState<boolean>(() => {
    const stored = localStorage.getItem(`${storageKey}-tooltips`);
    return stored !== "false";
  });

  useEffect(() => {
    const root = window.document.documentElement;

    const apply = () => {
      root.classList.remove("light", "dark");
      const resolved = resolveMode(theme);
      root.classList.add(resolved);

      const hue = accentColor[resolved].match(/oklch\([\d.]+ [\d.]+ ([\d.]+)/)?.[1] ?? "55";
      root.style.setProperty("--accent", accentColor[resolved]);
      root.style.setProperty("--accent-hue", hue);
    };

    apply();

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply();
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme, accentColor]);

  const setAccentColor = useCallback(
    (color: AccentColor) => {
      localStorage.setItem(`${storageKey}-accent`, color.name);
      setAccentColorState(color);
    },
    [storageKey],
  );

  const setShowTooltips = useCallback(
    (show: boolean) => {
      localStorage.setItem(`${storageKey}-tooltips`, String(show));
      setShowTooltipsState(show);
    },
    [storageKey],
  );

  const handleSetTheme = useCallback(
    (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
    [storageKey],
  );

  const value = useMemo(
    () => ({
      theme,
      setTheme: handleSetTheme,
      accentColor,
      setAccentColor,
      showTooltips,
      setShowTooltips,
    }),
    [theme, handleSetTheme, accentColor, setAccentColor, showTooltips, setShowTooltips],
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
