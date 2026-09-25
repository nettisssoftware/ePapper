import "@fontsource-variable/playfair-display/wght.css";
import "@fontsource-variable/fraunces/wght.css";
import "@fontsource-variable/cormorant/wght.css";
import "@fontsource-variable/newsreader/wght.css";
import "@fontsource-variable/newsreader/wght-italic.css";
import "@fontsource-variable/source-serif-4/wght.css";
import "@fontsource-variable/source-serif-4/wght-italic.css";
import "@fontsource-variable/source-sans-3/wght.css";
import "@fontsource/libre-baskerville/latin-400.css";
import "@fontsource/libre-baskerville/latin-400-italic.css";
import "@fontsource/libre-baskerville/latin-700.css";
import "@fontsource/ibm-plex-serif/latin-400.css";
import "@fontsource/ibm-plex-serif/latin-400-italic.css";
import "@fontsource/ibm-plex-serif/latin-500.css";
import "@fontsource/ibm-plex-serif/latin-600.css";
import "@fontsource/ibm-plex-serif/latin-700.css";

export interface FontFamilyDef {
  id: string;
  cssName: string;
  label: string;
  role: "display" | "body" | "both";
  weights: number[];
  italic: boolean;
  variable: boolean;
}

export const FONT_CATALOG: FontFamilyDef[] = [
  {
    id: "playfair",
    cssName: "Playfair Display Variable",
    label: "Playfair Display",
    role: "display",
    weights: [400, 500, 600, 700, 800, 900],
    italic: false,
    variable: true,
  },
  {
    id: "fraunces",
    cssName: "Fraunces Variable",
    label: "Fraunces",
    role: "display",
    weights: [400, 500, 600, 700, 800, 900],
    italic: false,
    variable: true,
  },
  {
    id: "cormorant",
    cssName: "Cormorant Variable",
    label: "Cormorant",
    role: "display",
    weights: [400, 500, 600, 700],
    italic: false,
    variable: true,
  },
  {
    id: "newsreader",
    cssName: "Newsreader Variable",
    label: "Newsreader",
    role: "both",
    weights: [300, 400, 500, 600, 700, 800],
    italic: true,
    variable: true,
  },
  {
    id: "source-serif",
    cssName: "Source Serif 4 Variable",
    label: "Source Serif 4",
    role: "body",
    weights: [400, 500, 600, 700],
    italic: true,
    variable: true,
  },
  {
    id: "libre-baskerville",
    cssName: "Libre Baskerville",
    label: "Libre Baskerville",
    role: "both",
    weights: [400, 700],
    italic: true,
    variable: false,
  },
  {
    id: "ibm-plex-serif",
    cssName: "IBM Plex Serif",
    label: "IBM Plex Serif",
    role: "body",
    weights: [400, 500, 600, 700],
    italic: true,
    variable: false,
  },
  {
    id: "source-sans",
    cssName: "Source Sans 3 Variable",
    label: "Source Sans 3",
    role: "body",
    weights: [400, 500, 600, 700],
    italic: false,
    variable: true,
  },
];

export function fontByCssName(name: string): FontFamilyDef | undefined {
  return FONT_CATALOG.find((f) => f.cssName === name);
}

export function displayFonts(): FontFamilyDef[] {
  return FONT_CATALOG.filter((f) => f.role === "display" || f.role === "both");
}

export function bodyFonts(): FontFamilyDef[] {
  return FONT_CATALOG.filter((f) => f.role === "body" || f.role === "both");
}

export async function ensureFonts(families: string[]): Promise<boolean> {
  if (typeof document === "undefined") return false;
  const unique = [...new Set(families.filter(Boolean))];
  try {
    await document.fonts.ready;
    await Promise.all(
      unique.flatMap((family) => [
        document.fonts.load(`400 24px "${family}"`),
        document.fonts.load(`700 48px "${family}"`),
      ]),
    );
    return unique.every((family) => document.fonts.check(`16px "${family}"`));
  } catch {
    return false;
  }
}

export function fontsLoaded(families: string[]): boolean {
  if (typeof document === "undefined") return false;
  return families.every((family) => document.fonts.check(`16px "${family}"`));
}
