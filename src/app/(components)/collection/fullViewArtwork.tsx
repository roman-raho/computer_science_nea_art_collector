"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { IoAddOutline } from "react-icons/io5";
import { useArtworkModal } from "@/app/lib/collection/update-artwork";
import { deleteArtwork, updateArtwork } from "@/app/(actions)/collection/update-artwork";
import { useQueryClient } from "@tanstack/react-query";
import { MdOutlineFileUpload } from "react-icons/md";

export default function ArtworkModal() {
  const { isOpen, selectedArtwork, closeModal } = useArtworkModal();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState(selectedArtwork);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const previewUrl = useMemo(() => (
    file ? URL.createObjectURL(file) : null
  ), [file]);

  useEffect(() => {
    setDraft(selectedArtwork ?? null);
    setError(null);
    setFile(null);
    setImageChanged(false);
  }, [selectedArtwork]); // if the artwork changes set draft

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displayImageUrl = previewUrl ?? draft?.image_url ?? "";

  const handleChange = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let value: any = e.currentTarget.value;

    if (e.currentTarget.type === "number") {
      value = value === "" ? undefined : Number(value);
    }

    setDraft((d: any) => ({ ...d, [key]: value }));
  }

  const handlePickImage = () => fileInputRef.current?.click();

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setImageChanged(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!draft) return;

      const formData = new FormData(); // append all fields to form data
      formData.append("title", draft.title ?? "");
      formData.append("artistName", draft.artist_name ?? "");
      formData.append("medium", draft.medium ?? "");
      formData.append("widthCm", String(draft.width_cm ?? 0));
      formData.append("heightCm", String(draft.height_cm ?? 0));
      formData.append("depthCm", String(draft.depth_cm ?? 0));
      formData.append("dateAcquired", draft.date_acquired ?? "");
      formData.append("locationAcquired", draft.location_acquired ?? "");
      formData.append("storageLocation", draft.storage_location ?? "");
      formData.append("storageCompany", draft.storage_company ?? "");
      formData.append("notes", draft.notes ?? "");

      if (imageChanged && file) {
        formData.append("imageFileMain", file);
      }

      const res = await updateArtwork(formData, selectedArtwork?.id, Boolean(imageChanged && file)) // call server action
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["artworks"] });
        setSaving(false);
        setImageChanged(false);
        setFile(null);
        setDraft(null);
        closeModal();
      } else {
        setSaving(false);
        setError(res.error || "Failed to save artwork.");
      }
    } catch (error) { // catch any errors
      setSaving(false);
      setError((error as Error).message || "Failed to save artwork.");
    }
  }

  const deleteArt = async () => {
    if (!selectedArtwork?.id) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete “${selectedArtwork.title || "this artwork"}”?`
    );
    if (!confirmDelete) return;

    const res = await deleteArtwork(selectedArtwork.id);
    if (res.success) {
      await queryClient.invalidateQueries({ queryKey: ["artworks"] });
      closeModal();
    } else {
      setError(res.error || "Failed to delete artwork.");
    }
  }

  const handleClose = () => {
    closeModal();
    setDraft(null);
    setError(null);
    setFile(null);
    setImageChanged(false);
  }

  if (!isOpen || !selectedArtwork) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
      <form className="relative bg-white w-full max-w-3xl rounded-2xl shadow-lg overflow-y-auto max-h-[90vh] p-8">
        <button
          onClick={handleClose}
          className="absolute cursor-pointer top-4 right-4 text-gray-500 hover:text-black text-xl"
        >
          <IoAddOutline className="transform rotate-45" size={23} />
        </button>

        <div className="flex flex-col items-center w-full p-5 gap-8">
          <div className="w-full md:w-1/2">
            {displayImageUrl ? (
              <div className="relative group">
                <Image
                  src={displayImageUrl}
                  alt={draft?.title || "Artwork"}
                  width={1600}
                  height={1600}
                  className="w-full h-auto rounded-lg object-cover"
                />
                <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handlePickImage}
                    className="px-3 py-2 rounded-lg bg-white text-black text-sm font-medium flex items-center gap-2"
                  >
                    <MdOutlineFileUpload size={18} />
                    {imageChanged ? "Change image" : "Upload image"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelected}
                  // name not needed here; we append manually to FormData
                  />
                </div>

                {imageChanged && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setImageChanged(false);
                    }}
                    className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-black/70 text-white"
                  >
                    Remove
                  </button>
                )}
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                onClick={handlePickImage}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <MdOutlineFileUpload size={40} className="text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelected}
                />
              </label>
            )}
          </div>

          <div className="flex-1">
            <input
              className="text-2xl font-bold mb-2 w-full border rounded-md px-3 py-2"
              placeholder="Title"
              name="title"
              value={draft?.title || ""}
              onChange={handleChange("title")}
            />
            <input
              className="text-lg text-gray-700 mb-4 w-full border rounded-md px-3 py-2"
              placeholder="Artist Name"
              name="artistName"
              value={draft?.artist_name || ""}
              onChange={handleChange("artist_name")}
            />

            <div className="space-y-3 text-sm">
              <div>
                <label className="font-medium text-gray-800 block mb-1">
                  Medium
                </label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  name="medium"
                  placeholder="e.g., Oil on canvas"
                  value={draft?.medium || ""}
                  onChange={handleChange("medium")}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-medium text-gray-800 block mb-1">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    name="widthCm"
                    className="w-full border rounded-md px-3 py-2"
                    value={draft?.width_cm ?? ""}
                    onChange={handleChange("width_cm")}
                  />
                </div>
                <div>
                  <label className="font-medium text-gray-800 block mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="heightCm"
                    className="w-full border rounded-md px-3 py-2"
                    value={draft?.height_cm ?? ""}
                    onChange={handleChange("height_cm")}
                  />
                </div>
                <div>
                  <label className="font-medium text-gray-800 block mb-1">
                    Depth (cm)
                  </label>
                  <input
                    type="number"
                    name="depthCm"
                    className="w-full border rounded-md px-3 py-2"
                    value={draft?.depth_cm ?? ""}
                    onChange={handleChange("depth_cm")}
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-gray-800 block mb-1">
                  Date Acquired
                </label>
                <input
                  type="date"
                  name="dateAcquired"
                  className="w-full border rounded-md px-3 py-2"
                  value={draft?.date_acquired || ""}
                  onChange={handleChange("date_acquired")}
                />
              </div>

              <div>
                <label className="font-medium text-gray-800 block mb-1">
                  Location Acquired
                </label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="e.g., London"
                  name="locationAcquired"
                  value={draft?.location_acquired || ""}
                  onChange={handleChange("location_acquired")}
                />
              </div>

              <div>
                <label className="font-medium text-gray-800 block mb-1">
                  Storage Location
                </label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="e.g., Unit A3"
                  value={draft?.storage_location || ""}
                  name="storageLocation"
                  onChange={handleChange("storage_location")}
                />
              </div>

              <div>
                <label className="font-medium text-gray-800 block mb-1">
                  Storage Company
                </label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="e.g., Sotheby’s Storage"
                  value={draft?.storage_company || ""}
                  name="storageCompany"
                  onChange={handleChange("storage_company")}
                />
              </div>

              <div>
                <label className="font-medium text-gray-800 block mb-1">
                  Notes
                </label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 min-h-[60px]"
                  placeholder="Additional notes..."
                  value={draft?.notes || ""}
                  name="notes"
                  onChange={handleChange("notes")}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                type="button"
                className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>

              <button
                onClick={closeModal}
                type="button"
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={deleteArt}
                type="button"
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
