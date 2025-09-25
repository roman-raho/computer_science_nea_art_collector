"use client";
import React from "react";
import Image from "next/image";
import { IoAddOutline } from "react-icons/io5";
import { useArtworkModal } from "@/app/lib/collection/update-artwork";

export default function ArtworkModal() {
  const { isOpen, selectedArtwork, closeModal } = useArtworkModal();

  if (!isOpen || !selectedArtwork) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-lg overflow-y-auto max-h-[90vh] p-8">
        <button
          onClick={closeModal}
          className="absolute cursor-pointer top-4 right-4 text-gray-500 hover:text-black text-xl"
        >
          <IoAddOutline className="transform rotate-45" size={23} />
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {selectedArtwork.image_url && (
            <div className="w-full md:w-1/2">
              <Image
                src={selectedArtwork.image_url}
                alt={selectedArtwork.title || "Artwork"}
                width={800}
                height={800}
                className="w-full h-auto rounded-lg object-cover"
              />
            </div>
          )}

          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">
              {selectedArtwork.title || "Untitled"}
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              {selectedArtwork.artist_name || "Unknown Artist"}
            </p>

            <div className="space-y-2 text-sm">
              <p><strong>Medium:</strong> {selectedArtwork.medium || "Unknown"}</p>
              <p>
                <strong>Dimensions:</strong>{" "}
                {selectedArtwork.width_cm || 0} × {selectedArtwork.height_cm || 0} ×{" "}
                {selectedArtwork.depth_cm || 0} cm
              </p>
              <p><strong>Date Acquired:</strong> {selectedArtwork.date_acquired || "Unknown"}</p>
              <p><strong>Location Acquired:</strong> {selectedArtwork.location_acquired || "Unknown"}</p>
              <p><strong>Storage Location:</strong> {selectedArtwork.storage_location || "Unknown"}</p>
              <p><strong>Storage Company:</strong> {selectedArtwork.storage_company || "Unknown"}</p>
              <p><strong>Notes:</strong> {selectedArtwork.notes || "None"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
