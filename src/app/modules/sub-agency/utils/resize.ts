import sharp from "sharp";

export async function resizeImage(base64String: string) {
  const [meta, base64Data] = base64String.split(";base64,");
  const contentType = meta.split(":")[1]; 
  const buffer = Buffer.from(base64Data, "base64");

  let outputBuffer: Buffer;

  const image = sharp(buffer).resize({ width: 500 });

  switch (contentType) {
    case "image/jpeg":
      outputBuffer = await image.jpeg({ quality: 70 }).toBuffer();
      break;

    case "image/png":
      outputBuffer = await image.png({ compressionLevel: 9 }).toBuffer();
      break;

    case "image/webp":
      outputBuffer = await image.webp({ quality: 70 }).toBuffer();
      break;

    case "image/avif":
      outputBuffer = await image.avif({ quality: 50 }).toBuffer();
      break;

    case "image/gif":
      outputBuffer = await image.toBuffer();
      break;

    default:
      throw new Error("Unsupported image format: " + contentType);
  }

  return {
    data: outputBuffer,
    contentType,
  };
}