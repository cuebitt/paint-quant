import { describe, it, expect, beforeEach } from "vite-plus/test";
import { savePreferences, loadPreferences } from "../hooks/preferences";

const STORAGE_KEY = "paintcraft-preferences";

describe("savePreferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves preferences to localStorage", () => {
    savePreferences(
      {
        quantMethod: "neuquant",
        fitMode: "contain",
        resizeFilter: "lanczos3",
        paintFormat: "jop-1x",
      },
      "dark",
    );
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const data = JSON.parse(raw!);
    expect(data.quantMethod).toBe("neuquant");
    expect(data.fitMode).toBe("contain");
    expect(data.resizeFilter).toBe("lanczos3");
    expect(data.paintFormat).toBe("jop-1x");
    expect(data.theme).toBe("dark");
    expect(typeof data.lastUsed).toBe("number");
  });

  it("overwrites previous preferences", () => {
    savePreferences(
      {
        quantMethod: "neuquant",
        fitMode: "contain",
        resizeFilter: "lanczos3",
        paintFormat: "jop-1x",
      },
      "dark",
    );
    savePreferences(
      { quantMethod: "wuquant", fitMode: "width", resizeFilter: "nearest", paintFormat: "jop-2x" },
      "light",
    );
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(data.quantMethod).toBe("wuquant");
    expect(data.theme).toBe("light");
  });
});

describe("loadPreferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty object when nothing stored", () => {
    expect(loadPreferences()).toEqual({});
  });

  it("loads valid preferences", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        quantMethod: "neuquant",
        fitMode: "fill",
        resizeFilter: "lanczos3",
        paintFormat: "jop-delta",
        theme: "dark",
        lastUsed: 12345,
      }),
    );
    const result = loadPreferences();
    expect(result.quantMethod).toBe("neuquant");
    expect(result.fitMode).toBe("fill");
    expect(result.resizeFilter).toBe("lanczos3");
    expect(result.paintFormat).toBe("jop-delta");
  });

  it("ignores invalid quantMethod values", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ quantMethod: "invalid-method", lastUsed: 1 }),
    );
    const result = loadPreferences();
    expect(result.quantMethod).toBeUndefined();
  });

  it("ignores invalid fitMode values", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fitMode: "invalid-mode", lastUsed: 1 }));
    const result = loadPreferences();
    expect(result.fitMode).toBeUndefined();
  });

  it("ignores invalid resizeFilter values", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ resizeFilter: "invalid-filter", lastUsed: 1 }),
    );
    const result = loadPreferences();
    expect(result.resizeFilter).toBeUndefined();
  });

  it("ignores invalid paintFormat values", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ paintFormat: "invalid-format", lastUsed: 1 }),
    );
    const result = loadPreferences();
    expect(result.paintFormat).toBeUndefined();
  });

  it("returns empty object on malformed JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not-json{{{");
    const result = loadPreferences();
    expect(result).toEqual({});
  });

  it("accepts all valid quant methods", () => {
    for (const method of ["median-cut", "neuquant", "wuquant"]) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ quantMethod: method, lastUsed: 1 }));
      expect(loadPreferences().quantMethod).toBe(method);
    }
  });

  it("accepts all valid fit modes", () => {
    for (const mode of ["contain", "fill", "width", "height"]) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ fitMode: mode, lastUsed: 1 }));
      expect(loadPreferences().fitMode).toBe(mode);
    }
  });

  it("accepts all valid resize filters", () => {
    for (const filter of ["nearest", "box", "hamming", "lanczos2", "lanczos3", "mks2013"]) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ resizeFilter: filter, lastUsed: 1 }));
      expect(loadPreferences().resizeFilter).toBe(filter);
    }
  });

  it("accepts all valid paint formats", () => {
    for (const format of ["jop-1x", "jop-delta", "jop-2x"]) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ paintFormat: format, lastUsed: 1 }));
      expect(loadPreferences().paintFormat).toBe(format);
    }
  });
});
