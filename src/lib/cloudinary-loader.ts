import type { ImageLoaderProps } from "next/image";

export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src) {
    return "";
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    return src;
  }

  const normalizedSrc = src.replace(/^\/+/, "");
  const qualityValue = quality ?? 80;

  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_${qualityValue},w_${width}/${normalizedSrc}`;
}

