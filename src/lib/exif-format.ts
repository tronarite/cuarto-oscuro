export interface ExifSource {
  cameraMake: string | null;
  cameraModel: string | null;
  lens: string | null;
  iso: number | null;
  aperture: number | null;
  shutterSpeed: string | null;
  focalLength: number | null;
}

function cameraLabel(make: string | null, model: string | null): string {
  if (make && model) {
    // Muchas cámaras ya incluyen la marca dentro del modelo del EXIF
    // (ej. modelo "Canon EOS 600D" con marca "Canon"): evita duplicarla.
    return model.toLowerCase().startsWith(make.toLowerCase())
      ? model
      : `${make} ${model}`;
  }
  return make || model || "";
}

export function exifLine(photo: ExifSource): string[] {
  const parts: string[] = [];
  const camera = cameraLabel(photo.cameraMake, photo.cameraModel);
  if (camera) parts.push(camera);
  if (photo.lens) parts.push(photo.lens);
  if (photo.focalLength) parts.push(`${photo.focalLength}mm`);
  if (photo.aperture) parts.push(`f/${photo.aperture}`);
  if (photo.shutterSpeed) parts.push(photo.shutterSpeed);
  if (photo.iso) parts.push(`ISO ${photo.iso}`);
  return parts;
}
