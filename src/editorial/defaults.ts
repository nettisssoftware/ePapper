import type {
  ContentModel,
  DesignModel,
  ExportModel,
  NewspaperDocument,
  TypographyModel,
} from "./schema";

export const DEFAULT_IMAGE_SRC = "/editorial/hero.jpg";

export const DEFAULT_CONTENT: ContentModel = {
  editionLabel: "EDICIÓN",
  date: "2026-09-25",
  emissionLabel: "EMISIÓN",
  time: "08:00",
  masthead: "EL CRONISTA",
  headline: "La ciudad reescribe su horizonte sobre el río",
  dek: "El plan de orillas, debatido durante tres legislaturas, propone devolver al cauce su sección histórica y abrir al peatón las dos márgenes.",
  image: {
    src: DEFAULT_IMAGE_SRC,
    caption:
      "El casco antiguo y los puentes de piedra, al amanecer, antes de que el tráfico corte de nuevo el mirador.",
    alt: "Amanecer sobre un río urbano con puentes de piedra y caserío histórico",
    fit: "cover",
    focalX: 0.55,
    focalY: 0.42,
  },
  body: "En la madrugada, el río devolvió a la ciudad un perfil que muchos daban por perdido. Las grúas se detuvieron. El silencio, tan raro entre avenidas, dejó oír de nuevo el agua contra los estribos de piedra.\n\nEl plan urbanístico no es un capricho estético: es una corrección hidrológica y una apuesta por la memoria material de un puerto interior que durante siglos organizó el comercio, la lengua y el rumor de la plaza. Los arquitectos insisten en que la operación no reconstruye el pasado. Lo traduce. Donde hubo almacenes, habrá porches de sombra; donde el tráfico cortaba el mirador, una losa continua permitirá cruzar sin perder de vista el horizonte.\n\nLa controversia, previsible, enfrenta a quienes temen la museificación del centro con quienes recuerdan las riadas de 1987 y 2002. El documento técnico fija una cota de seguridad, un régimen de vegetación de ribera y un calendario de obras por tramos para no cerrar la ciudad.\n\nLo que se juega no es una postal. Es la forma en que una ciudad decide mirarse. El río, indiferente a los comunicados, sigue su curso y espera. A orillas del cauce, los vecinos ya miden con el cuerpo lo que los planos apenas insinúan: la distancia entre una barandilla y un banco, el ancho de un paso, la sombra a las siete de la tarde.",
  author: "Elena Varela",
  source: "Redacción — Ciudad",
};

export const DEFAULT_DESIGN: DesignModel = {
  layoutId: "l01",
  paletteId: "ivory",
  formatId: "a4",
  orientation: "portrait",
  marginScale: 1,
  gutterScale: 1,
  columns: 2,
  autoColumns: true,
  customWidth: 1080,
  customHeight: 1350,
  customUnit: "px",
  showGuides: false,
};

export const DEFAULT_TYPOGRAPHY: TypographyModel = {
  displayFamily: "Playfair Display Variable",
  bodyFamily: "Newsreader Variable",
  headlineWeight: 800,
  dekWeight: 500,
  bodyWeight: 400,
  metaWeight: 500,
  headlineScale: 1,
  dekScale: 1,
  bodyScale: 1,
  captionScale: 1,
  headlineLeading: 1.06,
  dekLeading: 1.32,
  bodyLeading: 1.45,
  headlineTracking: -0.018,
  dekTracking: 0,
  bodyTracking: 0.004,
};

export const DEFAULT_EXPORT: ExportModel = {
  format: "png",
  dpi: 300,
  pixelScale: 2,
  jpegQuality: 0.92,
  filename: "portada",
};

export const DEFAULT_DOCUMENT: NewspaperDocument = {
  schemaVersion: 1,
  content: DEFAULT_CONTENT,
  design: DEFAULT_DESIGN,
  typography: DEFAULT_TYPOGRAPHY,
  export: DEFAULT_EXPORT,
};
