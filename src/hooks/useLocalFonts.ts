import { useEffect } from "react";
import { buildFontFaceCss } from "../data/localFonts";

const STYLE_ID = "cv-local-fonts";

/** Injects every font pairing's @font-face rules once, from the self-hosted
 *  files under public/fonts/ (see src/data/localFonts.ts for why those are
 *  WOFF rather than the WOFF2 Google's CDN would otherwise serve). Runs
 *  once for the app's whole lifetime — unlike the old per-selection Google
 *  Fonts <link> swap, there's nothing to redo when the user picks a
 *  different pairing, since only the CSS `font-family` on the CV itself
 *  actually changes; the browser fetches whichever declared face that ends
 *  up using regardless of which (if any) were already resident. */
export function useLocalFonts(): void {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = buildFontFaceCss();
    document.head.appendChild(style);
  }, []);
}
