import fs from "node:fs";
import path from "node:path";
import { micromark } from "micromark";

interface Plugin {
  name: string;
  enforce?: "pre" | "post";
  resolveId?(id: string): string | null | void;
  load?(id: string): string | { code: string; map: null } | null | void;
}

export function markdownHtml(): Plugin {
  const suffix = "?html";

  return {
    name: "vite-plugin-markdown-html",
    enforce: "pre",

    resolveId(id) {
      if (id.endsWith(suffix)) {
        return id;
      }
    },

    load(id) {
      if (!id.endsWith(suffix)) return;

      const filePath = id.slice(0, -suffix.length);
      const resolved = path.normalize(filePath);
      const content = fs.readFileSync(resolved, "utf-8");
      return {
        code: `export default ${JSON.stringify(micromark(content))}`,
        map: null,
      };
    },
  };
}
