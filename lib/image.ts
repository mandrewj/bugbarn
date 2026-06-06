// Client-side image handling: downscale an uploaded image to a small
// JPEG (≤900px, q0.82 — same as the prototype's fileToDataURL) and POST
// it to /api/upload, which stores it in Vercel Blob and returns a URL.

function readAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

export async function downscaleImage(file: File, maxPx = 900, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Not an image");
  const img = await loadImage(await readAsDataURL(file));
  let w = img.width;
  let h = img.height;
  const scale = Math.min(1, maxPx / Math.max(w, h));
  w = Math.round(w * scale);
  h = Math.round(h * scale);
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  cv.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return await new Promise((res, rej) =>
    cv.toBlob((b) => (b ? res(b) : rej(new Error("encode failed"))), "image/jpeg", quality),
  );
}

/** Downscale + upload an image, returning the stored URL. */
export async function uploadPhoto(file: File): Promise<string> {
  const blob = await downscaleImage(file);
  const form = new FormData();
  form.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error("upload failed");
  const { url } = (await res.json()) as { url: string };
  return url;
}
