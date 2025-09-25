"use client";
import { addArtwork } from '@/app/(actions)/collection/add-artwork';
import { useAddArtwork } from '@/app/lib/collection/add-artwork';
import React, { useEffect, useMemo, useState } from 'react'
import { MdOutlineFileUpload } from "react-icons/md";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";

export default function AddArtwork() {
  const queryClient = useQueryClient();
  const { isOpen, close } = useAddArtwork();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (file) {
      formData.append("imageFileMain", file);
    }

    const result = await addArtwork(formData);

    if (result.success) {
      close();
      setError(null);
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["artworks"] });
    } else {
      setError(result.error || "An unknown error occurred.");
      setFile(null);
    }
  }

  const handleClose = () => {
    close();
    setError(null);
    setFile(null);
  }

  return (
    <div className="w-[80%] max-w-2xl p-8 rounded-2xl border border-gray-400 h-auto z-50 fixed bg-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg overflow-y-auto max-h-[90vh]">
      <h2 className="text-xl font-semibold mb-6">Add Artwork</h2>
      <form className="space-y-4" onSubmit={handleSubmit} encType="multipart/form-data">
        {/* Image */}
        <div>
          <label className="block text-sm mb-4 font-medium text-gray-700">
            Artwork Image
          </label>
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <div>
            <label className="block text-sm mb-2 font-medium text-gray-700">Artwork Image</label>

            {previewUrl ? (
              <div className="relative">
                <Image src={previewUrl} alt="image preview" width={1920} height={1080} />
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-black/70 text-white"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="imageFile"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <MdOutlineFileUpload size={40} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG</p>
                  </div>
                  {/* This input is what actually sends the File to the server action */}
                  <input
                    id="imageFile"
                    name="imageFile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            )}
          </div>

        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            name="title"
            className="w-full p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Artist Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Artist Name
          </label>
          <input
            type="text"
            name="artistName"
            className="w-full p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Medium */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Medium
          </label>
          <input
            type="text"
            name="medium"
            placeholder="Oil, Acrylic, Digital..."
            className="w-full p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width (cm)
            </label>
            <input
              type="number"
              step="0.1"
              name="widthCm"
              className="w-full p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height (cm)
            </label>
            <input
              type="number"
              step="0.1"
              name="heightCm"
              className="w-full p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Depth (cm)
            </label>
            <input
              type="number"
              step="0.1"
              name="depthCm"
              className="w-full p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Acquisition */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Acquired
            </label>
            <input
              type="date"
              name="dateAcquired"
              className="w-full p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Acquired
            </label>
            <input
              type="text"
              name="locationAcquired"
              className="w-full p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Storage */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Storage Location
            </label>
            <input
              type="text"
              name="storageLocation"
              className="w-full p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Storage Company
            </label>
            <input
              type="text"
              name="storageCompany"
              className="w-full p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          ></textarea>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-md border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Add Artwork
          </button>
        </div>
      </form>
    </div>

  )
}
