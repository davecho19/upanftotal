export const DEFAULT_UPCONTA_LOGO = "/artes/Logo_UpConta_2025_01.png";

let cachedUpContaPngDataUrl: string | null = null;

export function getUpContaLogoPngDataUrl(): string {
  if (cachedUpContaPngDataUrl) {
    return cachedUpContaPngDataUrl;
  }

  if (typeof document === "undefined") {
    return "";
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 520;
    canvas.height = 130;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    ctx.clearRect(0, 0, 520, 130);

    // "Up" in orange
    ctx.fillStyle = "#FF5500";
    ctx.font = "900 102px system-ui, -apple-system, sans-serif";
    ctx.fillText("Up", 10, 92);

    // "Conta" in navy
    ctx.fillStyle = "#0B2545";
    ctx.font = "900 102px system-ui, -apple-system, sans-serif";
    ctx.fillText("Conta", 152, 92);

    // Arrow on 'a'
    ctx.save();
    ctx.translate(426, 12);
    ctx.strokeStyle = "#FF5500";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(12, 50);
    ctx.lineTo(52, 50);
    ctx.arcTo(68, 50, 68, 34, 16);
    ctx.lineTo(68, 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(50, 22);
    ctx.lineTo(68, 4);
    ctx.lineTo(86, 22);
    ctx.stroke();
    ctx.restore();

    cachedUpContaPngDataUrl = canvas.toDataURL("image/png");
    return cachedUpContaPngDataUrl;
  } catch (err) {
    console.error("Error generating UpConta PNG logo data URL:", err);
    return "";
  }
}

/**
 * Downloads an image (PNG or SVG rasterized to high-res PNG)
 */
export async function downloadArteImage(imageUrl: string, filename: string) {
  if (typeof document === "undefined") return;

  const targetFilename = filename.endsWith(".png") ? filename : `${filename}.png`;

  // If it's a PNG already, download directly with fetch blob
  if (imageUrl.endsWith(".png") || imageUrl.startsWith("data:image/png") || imageUrl.includes(".png")) {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = targetFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
      return;
    } catch {
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = targetFilename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
  }

  // If it's an SVG, load into Image and export as 2x crisp PNG
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = (img.naturalWidth || 800) * scale;
      canvas.height = (img.naturalHeight || 1150) * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
    } catch (e) {
      console.warn("Canvas export fallback:", e);
    }

    // Direct fallback
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  img.onerror = () => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  img.src = imageUrl;
}
