import exifr from "exifr";

export interface ExtractedExif {
  cameraMake?: string;
  cameraModel?: string;
  lens?: string;
  iso?: number;
  aperture?: number;
  shutterSpeed?: string;
  focalLength?: number;
  latitude?: number;
  longitude?: number;
  takenAt?: Date;
}

function formatShutterSpeed(exposureTime?: number): string | undefined {
  if (!exposureTime) return undefined;
  if (exposureTime >= 1) return `${exposureTime}s`;
  return `1/${Math.round(1 / exposureTime)}`;
}

export async function extractExif(
  fileBuffer: Buffer | ArrayBuffer,
): Promise<ExtractedExif> {
  const data = await exifr.parse(fileBuffer, {
    pick: [
      "Make",
      "Model",
      "LensModel",
      "ISO",
      "FNumber",
      "ExposureTime",
      "FocalLength",
      "latitude",
      "longitude",
      "DateTimeOriginal",
    ],
  });

  if (!data) return {};

  return {
    cameraMake: data.Make,
    cameraModel: data.Model,
    lens: data.LensModel,
    iso: data.ISO,
    aperture: data.FNumber,
    shutterSpeed: formatShutterSpeed(data.ExposureTime),
    focalLength: data.FocalLength,
    latitude: data.latitude,
    longitude: data.longitude,
    takenAt: data.DateTimeOriginal,
  };
}
