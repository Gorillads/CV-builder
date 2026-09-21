/** Every @font-face this app can use, self-hosted under public/fonts/ (see
 *  that directory for provenance notes) rather than loaded live from
 *  Google's CDN. Chromium's print-to-PDF pipeline embeds a WOFF2 @font-face
 *  as a Type 3 font — each glyph baked in as its own vector drawing, with
 *  no real font selectable by a PDF reader or an ATS — but embeds the exact
 *  same typeface correctly as a real, selectable TrueType font when it's
 *  served as WOFF instead. These files are the WOFF build of each family
 *  (Google normally only serves that to older browsers that can't take
 *  WOFF2), fetched once and committed here so every browser gets it
 *  regardless of what it asks for.
 *  Declaring a face here doesn't download it — the browser still only
 *  fetches whichever ones actual rendered text ends up using — so listing
 *  every pairing's fonts up front (rather than swapping which are declared
 *  based on the selected pairing, as this used to work via Google's CDN)
 *  costs nothing extra. */
export interface LocalFontFace {
  family: string;
  weight: number;
  file: string;
}

export const LOCAL_FONT_FACES: LocalFontFace[] = [
  { family: "Barlow Condensed", weight: 500, file: "barlow-condensed-500.woff" },
  { family: "Barlow Condensed", weight: 600, file: "barlow-condensed-600.woff" },
  { family: "Barlow Condensed", weight: 700, file: "barlow-condensed-700.woff" },
  { family: "Barlow", weight: 400, file: "barlow-400.woff" },
  { family: "Barlow", weight: 500, file: "barlow-500.woff" },
  { family: "Barlow", weight: 600, file: "barlow-600.woff" },
  { family: "IBM Plex Sans", weight: 400, file: "ibm-plex-sans-400.woff" },
  { family: "IBM Plex Sans", weight: 500, file: "ibm-plex-sans-500.woff" },
  { family: "IBM Plex Sans", weight: 600, file: "ibm-plex-sans-600.woff" },
  { family: "IBM Plex Sans", weight: 700, file: "ibm-plex-sans-700.woff" },
  { family: "Source Sans 3", weight: 400, file: "source-sans-3-400.woff" },
  { family: "Source Sans 3", weight: 500, file: "source-sans-3-500.woff" },
  { family: "Source Sans 3", weight: 600, file: "source-sans-3-600.woff" },
  { family: "Source Sans 3", weight: 700, file: "source-sans-3-700.woff" },
  { family: "Roboto", weight: 400, file: "roboto-400.woff" },
  { family: "Roboto", weight: 500, file: "roboto-500.woff" },
  { family: "Roboto", weight: 600, file: "roboto-600.woff" },
  { family: "Roboto", weight: 700, file: "roboto-700.woff" },
  { family: "Lato", weight: 400, file: "lato-400.woff" },
  { family: "Lato", weight: 700, file: "lato-700.woff" },
  { family: "Lato", weight: 900, file: "lato-900.woff" },
  { family: "Public Sans", weight: 400, file: "public-sans-400.woff" },
  { family: "Public Sans", weight: 500, file: "public-sans-500.woff" },
  { family: "Public Sans", weight: 600, file: "public-sans-600.woff" },
  { family: "Public Sans", weight: 700, file: "public-sans-700.woff" },
];

/** import.meta.env.BASE_URL (see vite.config.ts's `base`) rather than a
 *  hardcoded leading slash — these rules load from a plain <style> tag,
 *  not a file Vite rewrites for us the way it does index.html's own
 *  root-relative asset references, so the app's base path has to be
 *  applied by hand. */
export function buildFontFaceCss(): string {
  return LOCAL_FONT_FACES.map(
    (f) => `@font-face {
  font-family: '${f.family}';
  font-style: normal;
  font-weight: ${f.weight};
  font-display: swap;
  src: url('${import.meta.env.BASE_URL}fonts/${f.file}') format('woff');
}`,
  ).join("\n");
}
