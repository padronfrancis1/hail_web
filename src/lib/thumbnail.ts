const THUMBNAIL_WIDTH = 200;

export async function generateThumbnail(source: HTMLCanvasElement | Blob): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  let srcCanvas: HTMLCanvasElement;

  if (source instanceof HTMLCanvasElement) {
    srcCanvas = source;
  } else {
    // Decode Blob into an image, then draw to a temporary canvas
    const url = URL.createObjectURL(source);
    try {
      const img = await loadImage(url);
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = img.naturalWidth;
      tmpCanvas.height = img.naturalHeight;
      tmpCanvas.getContext("2d")!.drawImage(img, 0, 0);
      srcCanvas = tmpCanvas;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const scale = THUMBNAIL_WIDTH / srcCanvas.width;
  canvas.width = THUMBNAIL_WIDTH;
  canvas.height = Math.round(srcCanvas.height * scale);
  ctx.drawImage(srcCanvas, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob returned null"))),
      "image/jpeg",
      0.8
    );
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
