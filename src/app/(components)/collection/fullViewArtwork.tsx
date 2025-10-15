"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { IoAddOutline } from "react-icons/io5";
import { useArtworkModal } from "@/app/lib/collection/update-artwork";
import { updateArtwork } from "@/app/(actions)/collection/update-artwork";

export default function ArtworkModal() {
  const { isOpen, selectedArtwork, closeModal } = useArtworkModal();


  const [draft, setDraft] = useState(selectedArtwork);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setDraft(selectedArtwork), [selectedArtwork]); // if the artwork changes set draft

  const handleChange = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let value: any = e.currentTarget.value;

    if (e.currentTarget.type === "number") {
      value = value === "" ? undefined : Number(value);
    }

    setDraft((d: any) => ({ ...d, [key]: value }));
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!draft) return;
      const formData = new FormData();
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

      const res = await updateArtwork(formData, selectedArtwork?.id)
      if (res.success) {
        setSaving(false);
        setDraft(null);
        closeModal();
      } else {
        setSaving(false);
        setError(res.error || "Failed to save artwork.");
      }
    } catch (error) {
      setSaving(false);
      setError((error as Error).message || "Failed to save artwork.");
    }
  }

  if (!isOpen || !selectedArtwork) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
      <form className="relative bg-white w-full max-w-3xl rounded-2xl shadow-lg overflow-y-auto max-h-[90vh] p-8">
        <button
          onClick={closeModal}
          className="absolute cursor-pointer top-4 right-4 text-gray-500 hover:text-black text-xl"
        >
          <IoAddOutline className="transform rotate-45" size={23} />
        </button>

        <div className="flex flex-col items-center w-full p-5 gap-8">
          {draft?.image_url && (
            <div className="w-full md:w-1/2">
              <Image
                src={draft?.image_url || ""}
                alt={draft?.title || "Artwork"}
                width={800}
                height={800}
                className="w-full h-auto rounded-lg object-cover"
              />
            </div>
          )}

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
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
