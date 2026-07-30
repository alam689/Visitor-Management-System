/* Images live in localStorage as data URLs, so they are downscaled and
   re-encoded before they are stored — a raw phone photo would blow the ~5MB
   quota on its own. */

const MAX_BYTES = 8 * 1024 * 1024;

export function readImage(file, { maxDim = 640, quality = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file selected"));
    if (!file.type.startsWith("image/")) return reject(new Error("That file isn't an image"));
    if (file.size > MAX_BYTES) return reject(new Error("Image is larger than 8MB"));

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode that image"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          reject(new Error("Could not process that image"));
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/** Rough byte size of a data URL, for the "stored size" hint. */
export const dataUrlSize = url => (url ? Math.round((url.length * 3) / 4 / 1024) : 0);
