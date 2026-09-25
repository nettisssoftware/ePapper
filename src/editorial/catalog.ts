import type {
  FormatId,
  LayoutId,
  PaletteId,
  ResolvedPalette,
} from "./schema";

export interface FormatDef {
  id: FormatId;
  name: string;
  kind: "print" | "digital" | "custom";
  widthMm?: number;
  heightMm?: number;
  widthIn?: number;
  heightIn?: number;
  widthPx?: number;
  heightPx?: number;
}

export const FORMATS: FormatDef[] = [
  { id: "a4", name: "A4", kind: "print", widthMm: 210, heightMm: 297 },
  { id: "a3", name: "A3", kind: "print", widthMm: 297, heightMm: 420 },
  {
    id: "tabloid",
    name: "Tabloide",
    kind: "print",
    widthIn: 11,
    heightIn: 17,
  },
  {
    id: "ig-portrait",
    name: "1080 × 1350",
    kind: "digital",
    widthPx: 1080,
    heightPx: 1350,
  },
  {
    id: "square",
    name: "1080 × 1080",
    kind: "digital",
    widthPx: 1080,
    heightPx: 1080,
  },
  {
    id: "story",
    name: "1080 × 1920",
    kind: "digital",
    widthPx: 1080,
    heightPx: 1920,
  },
  {
    id: "wide",
    name: "1200 × 675",
    kind: "digital",
    widthPx: 1200,
    heightPx: 675,
  },
  { id: "custom", name: "Personalizado", kind: "custom" },
];

export const PALETTES: ResolvedPalette[] = [
  {
    id: "white",
    name: "Blanco editorial",
    page: "#FAFAF8",
    surface: "#FAFAF8",
    ink: "#1A1916",
    inkMuted: "#5C5852",
    rule: "#1A1916",
    caption: "#4A4640",
    inverted: false,
  },
  {
    id: "ivory",
    name: "Marfil periódico",
    page: "#F4EFE4",
    surface: "#F4EFE4",
    ink: "#1C1915",
    inkMuted: "#5E574C",
    rule: "#1C1915",
    caption: "#4C463C",
    inverted: false,
  },
  {
    id: "paper-gray",
    name: "Gris papel",
    page: "#E8E6E1",
    surface: "#E8E6E1",
    ink: "#1A1A18",
    inkMuted: "#5A5954",
    rule: "#1A1A18",
    caption: "#454440",
    inverted: false,
  },
  {
    id: "warm-cream",
    name: "Crema cálido",
    page: "#F3E6C9",
    surface: "#F3E6C9",
    ink: "#2A2116",
    inkMuted: "#6A5B45",
    rule: "#2A2116",
    caption: "#534736",
    inverted: false,
  },
  {
    id: "cool-gray",
    name: "Gris frío",
    page: "#E4E7EA",
    surface: "#E4E7EA",
    ink: "#16181B",
    inkMuted: "#555C64",
    rule: "#16181B",
    caption: "#3E444A",
    inverted: false,
  },
  {
    id: "black",
    name: "Negro editorial",
    page: "#121212",
    surface: "#121212",
    ink: "#EDEBE6",
    inkMuted: "#A3A099",
    rule: "#D8D4CC",
    caption: "#B7B3AB",
    inverted: true,
  },
  {
    id: "night",
    name: "Azul noche",
    page: "#0D1B2A",
    surface: "#0D1B2A",
    ink: "#E7EEF4",
    inkMuted: "#9AADC0",
    rule: "#C5D4E0",
    caption: "#B3C3D1",
    inverted: true,
  },
  {
    id: "beige",
    name: "Beige prensa",
    page: "#EDE4D4",
    surface: "#EDE4D4",
    ink: "#221C14",
    inkMuted: "#635849",
    rule: "#221C14",
    caption: "#4E4538",
    inverted: false,
  },
  {
    id: "aged",
    name: "Papel envejecido",
    page: "#E8D5B5",
    surface: "#E8D5B5",
    ink: "#2B2114",
    inkMuted: "#6B5840",
    rule: "#2B2114",
    caption: "#534530",
    inverted: false,
  },
  {
    id: "graphite",
    name: "Gris grafito",
    page: "#2C2C2C",
    surface: "#2C2C2C",
    ink: "#E8E6E1",
    inkMuted: "#A8A59E",
    rule: "#D2CFC8",
    caption: "#B8B5AE",
    inverted: true,
  },
];

export interface LayoutDef {
  id: LayoutId;
  name: string;
  description: string;
  defaultColumns: number;
  imageAspect: number;
}

export const LAYOUTS: LayoutDef[] = [
  {
    id: "l01",
    name: "Imagen superior",
    description: "Titular, bajada, fotografía horizontal y cuerpo en columnas.",
    defaultColumns: 2,
    imageAspect: 3 / 2,
  },
  {
    id: "l02",
    name: "Imagen izquierda",
    description: "Fotografía flotante a la izquierda; el texto arranca a la derecha.",
    defaultColumns: 2,
    imageAspect: 4 / 5,
  },
  {
    id: "l03",
    name: "Imagen derecha",
    description: "Fotografía flotante a la derecha; el texto arranca a la izquierda.",
    defaultColumns: 2,
    imageAspect: 4 / 5,
  },
  {
    id: "l04",
    name: "Imagen central",
    description: "Eje centrado y cuerpo en columnas bajo la fotografía.",
    defaultColumns: 2,
    imageAspect: 3 / 2,
  },
  {
    id: "l05",
    name: "Editorial de dos columnas",
    description: "Imagen integrada en una columna; desarrollo en dos.",
    defaultColumns: 2,
    imageAspect: 4 / 5,
  },
  {
    id: "l06",
    name: "Editorial de tres columnas",
    description: "Imagen destacada y desarrollo en tres columnas.",
    defaultColumns: 3,
    imageAspect: 3 / 2,
  },
  {
    id: "l07",
    name: "Imagen dominante",
    description: "Fotografía de gran tamaño y desarrollo reducido debajo.",
    defaultColumns: 3,
    imageAspect: 16 / 9,
  },
  {
    id: "l08",
    name: "Modular",
    description: "Módulos de imagen y texto alineados a la retícula.",
    defaultColumns: 3,
    imageAspect: 4 / 5,
  },
];

export function paletteById(id: PaletteId): ResolvedPalette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[1]!;
}

export function formatById(id: FormatId): FormatDef {
  return FORMATS.find((f) => f.id === id) ?? FORMATS[0]!;
}

export function layoutById(id: LayoutId): LayoutDef {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0]!;
}
