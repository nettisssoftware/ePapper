export type LayoutId =
  | "l01"
  | "l02"
  | "l03"
  | "l04"
  | "l05"
  | "l06"
  | "l07"
  | "l08";

export type PaletteId =
  | "white"
  | "ivory"
  | "paper-gray"
  | "warm-cream"
  | "cool-gray"
  | "black"
  | "night"
  | "beige"
  | "aged"
  | "graphite";

export type FormatId =
  | "a4"
  | "a3"
  | "tabloid"
  | "ig-portrait"
  | "square"
  | "story"
  | "wide"
  | "custom";

export type ImageFit = "cover" | "contain" | "focal";
export type Orientation = "portrait" | "landscape";
export type ExportFormat = "png" | "jpg" | "webp" | "pdf";
export type CustomUnit = "px" | "mm" | "in";

export interface NewspaperImage {
  src: string;
  caption: string;
  alt: string;
  fit: ImageFit;
  focalX: number;
  focalY: number;
}

export interface ContentModel {
  editionLabel: string;
  date: string;
  emissionLabel: string;
  time: string;
  masthead: string;
  headline: string;
  dek: string;
  image: NewspaperImage;
  body: string;
  author: string;
  source: string;
}

export interface DesignModel {
  layoutId: LayoutId;
  paletteId: PaletteId;
  formatId: FormatId;
  orientation: Orientation;
  marginScale: number;
  gutterScale: number;
  columns: number;
  autoColumns: boolean;
  customWidth: number;
  customHeight: number;
  customUnit: CustomUnit;
  showGuides: boolean;
}

export interface TypographyModel {
  displayFamily: string;
  bodyFamily: string;
  headlineWeight: number;
  dekWeight: number;
  bodyWeight: number;
  metaWeight: number;
  headlineScale: number;
  dekScale: number;
  bodyScale: number;
  captionScale: number;
  headlineLeading: number;
  dekLeading: number;
  bodyLeading: number;
  headlineTracking: number;
  dekTracking: number;
  bodyTracking: number;
}

export interface ExportModel {
  format: ExportFormat;
  dpi: number;
  pixelScale: number;
  jpegQuality: number;
  filename: string;
}

export interface NewspaperDocument {
  schemaVersion: 1;
  content: ContentModel;
  design: DesignModel;
  typography: TypographyModel;
  export: ExportModel;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FontSpec {
  family: string;
  weight: number;
  size: number;
  letterSpacing: number;
  lineHeight: number;
  style?: "normal" | "italic";
}

export interface PreparedImage {
  src: string;
  element: HTMLImageElement | null;
  naturalWidth: number;
  naturalHeight: number;
  fit: ImageFit;
  focalX: number;
  focalY: number;
}

export interface ResolvedPalette {
  id: PaletteId;
  name: string;
  page: string;
  surface: string;
  ink: string;
  inkMuted: string;
  rule: string;
  caption: string;
  inverted: boolean;
}

export interface ResolvedType {
  displayFamily: string;
  bodyFamily: string;
  masthead: FontSpec;
  edition: FontSpec;
  headline: FontSpec;
  dek: FontSpec;
  body: FontSpec;
  caption: FontSpec;
  meta: FontSpec;
}

export interface Grid {
  pageWidth: number;
  pageHeight: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  columns: number;
  gutter: number;
  columnWidth: number;
  content: Box;
  header: Box;
  columnBoxes: Box[];
}

export type SceneRole =
  | "page"
  | "masthead"
  | "headline"
  | "dek"
  | "body"
  | "caption"
  | "author"
  | "source"
  | "edition"
  | "emission"
  | "header-rule"
  | "image"
  | "guide"
  | "surface";

export type SceneNode =
  | {
      type: "rect";
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
      fill: string;
      role?: SceneRole;
    }
  | {
      type: "line";
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      stroke: string;
      strokeWidth: number;
      role?: SceneRole;
    }
  | {
      type: "text";
      id: string;
      x: number;
      y: number;
      text: string;
      fontFamily: string;
      fontWeight: number;
      fontSize: number;
      letterSpacing: number;
      fontStyle?: "normal" | "italic";
      fill: string;
      align: "left" | "center" | "right";
      role?: SceneRole;
    }
  | {
      type: "textline";
      id: string;
      y: number;
      words: { x: number; text: string }[];
      fontFamily: string;
      fontWeight: number;
      fontSize: number;
      letterSpacing: number;
      fontStyle?: "normal" | "italic";
      fill: string;
      role?: SceneRole;
    }
  | {
      type: "image";
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
      src: string;
      naturalWidth: number;
      naturalHeight: number;
      crop: { sx: number; sy: number; sw: number; sh: number };
      role?: SceneRole;
    }
  | {
      type: "guide";
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      role?: SceneRole;
    };

export interface ValidationIssue {
  id: string;
  level: "ok" | "warn" | "error";
  label: string;
  detail?: string;
}

export interface ValidationReport {
  ok: boolean;
  blocking: boolean;
  issues: ValidationIssue[];
}

export interface SceneMeta {
  header: Box;
  content: Box;
  columns: Box[];
  gutter: number;
  margins: { top: number; right: number; bottom: number; left: number };
  fontsUsed: string[];
  mastheadColor: string;
  textBounds: Box[];
  imageBounds: Box[];
  unplacedBodyLines: number;
  overflow: boolean;
  autofit: { typeScale: number; imageScale: number; spacingScale: number; columns: number };
}

export interface Scene {
  width: number;
  height: number;
  background: string;
  nodes: SceneNode[];
  meta: SceneMeta;
  validation: ValidationReport;
}
