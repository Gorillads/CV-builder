/** Downscales/re-encodes an uploaded image client-side (longest side
 *  capped at maxDim) before it ever reaches the store — an unmodified
 *  phone photo can be several MB, which would bloat both localStorage
 *  and JSON backups for what only ever renders at a few dozen/hundred px
 *  on the CV. Shared by the profile picture (DesignTab.tsx) and
 *  per-element logo (CategoryCard.tsx) uploads.
 *  Re-encoded as JPEG only when the source already was one (a photo,
 *  which has no transparency to lose anyway) — anything else (PNG, WebP,
 *  GIF, SVG, ...) is re-encoded as PNG instead, since JPEG has no alpha
 *  channel: canvas flattens a transparent background to solid black when
 *  asked for "image/jpeg", which silently ruined every logo uploaded
 *  with a transparent background. */
export function resizeImage(file: File, maxDim = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const isJpeg = file.type === "image/jpeg" || file.type === "image/jpg";
        resolve(isJpeg ? canvas.toDataURL("image/jpeg", 0.85) : canvas.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
