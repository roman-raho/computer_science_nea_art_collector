import { z } from "zod";

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ImageFileMain = z
  .instanceof(File)
  .optional()
  .refine((f) => !f || f.size <= MAX_IMAGE_SIZE, "Image must be ≤ 5MB")
  .refine(
    (f) => !f || ACCEPTED_IMAGE_TYPES.includes(f.type),
    "Only PNG, JPG, or WEBP"
  );

export const AddArtworkSchema = z.object({
  imageFileMain: ImageFileMain.nullish(),
  title: z
    .string()
    .max(160)
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val)),
  artistName: z
    .string()
    .max(120)
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val)),
  medium: z
    .string()
    .max(60)
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val)),
  widthCm: z.coerce.number().positive().optional(),
  heightCm: z.coerce.number().positive().optional(),
  depthCm: z.coerce.number().min(0).optional(),
  dateAcquired: z.coerce.date().optional(),
  locationAcquired: z
    .string()
    .max(120)
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val)),
  storageLocation: z
    .string()
    .max(120)
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val)),
  storageCompany: z
    .string()
    .max(120)
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val)),
  notes: z
    .string()
    .max(2000)
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val)),
});

export type AddArtworkInput = z.infer<typeof AddArtworkSchema>;

export function parseAddArtworkForm(form: FormData): AddArtworkInput {
  return AddArtworkSchema.parse({
    imageFileMain:
      form.get("imageFileMain") instanceof File
        ? (form.get("imageFileMain") as File)
        : undefined,
    title: form.get("title")?.toString() || undefined,
    artistName: form.get("artistName")?.toString() || undefined,
    medium: form.get("medium")?.toString() || undefined,
    widthCm: form.get("widthCm")?.toString() || undefined,
    heightCm: form.get("heightCm")?.toString() || undefined,
    depthCm: form.get("depthCm")?.toString() || undefined,
    dateAcquired: form.get("dateAcquired")?.toString() || undefined,
    locationAcquired: form.get("locationAcquired")?.toString() || undefined,
    storageLocation: form.get("storageLocation")?.toString() || undefined,
    storageCompany: form.get("storageCompany")?.toString() || undefined,
    notes: form.get("notes")?.toString() || undefined,
  });
}
