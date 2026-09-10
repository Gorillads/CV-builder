import { useEffect } from "react";
import { FONTS, byId } from "../data/designTokens";

const LINK_ID = "cv-google-font";

/** Swaps a single <link> tag's href to load the Google Fonts families for
 *  the currently selected font pairing (Aptos has no web font of its own,
 *  so its pairing loads its Google Fonts stand-in instead). */
export function useGoogleFont(fontId: string): void {
  useEffect(() => {
    const pairing = byId(FONTS, fontId);
    if (!pairing.googleFamilies.length) return;
    const href =
      "https://fonts.googleapis.com/css2?" +
      pairing.googleFamilies.map((f) => `family=${encodeURIComponent(f)}`).join("&") +
      "&display=swap";

    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }, [fontId]);
}
