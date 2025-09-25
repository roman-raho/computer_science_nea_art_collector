import { useArtworkModal } from "@/app/lib/collection/update-artwork";
import Image from "next/image";
import React from "react";

export default function ArtworkCard({ artwork }: { artwork: any }) {

  const openModal = useArtworkModal((state) => state.openModal); // get state action
  return (
    <div
      onClick={() => openModal(artwork)} // set to artwork
      className="border border-gray-300 w-[80%] mx-auto cursor-pointer rounded-xl p-6 flex items-center gap-8 shadow-sm hover:shadow-md transition">
      <div className="flex-shrink-0">
        <Image
          className="rounded-md object-cover"
          src={artwork.image_url || ""}
          alt={artwork.title || "Artwork"}
          width={220}
          height={160}
        />
      </div>

      <div className="flex flex-col justify-between flex-1">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {artwork.title || "Untitled"}
          </h2>
          <p className="text-sm text-gray-500">
            {artwork.artist_name || "Unknown Artist"}
          </p>
        </div>

        <div className="mt-4 text-sm text-gray-700 space-y-1">
          <p>
            <span className="font-medium text-gray-800">Dimensions:</span>{" "}
            {artwork.width_cm || "0"} × {artwork.height_cm || "0"} × {artwork.depth_cm || "0"} cm
          </p>
          <p>
            <span className="font-medium text-gray-800">Location Acquired:</span>{" "}
            {artwork.location_acquired || "Unknown"}
          </p>
          <p>
            <span className="font-medium text-gray-800">Date Acquired:</span>{" "}
            {artwork.date_acquired || "Unknown"}
          </p>
        </div>
      </div>
    </div>
  );
}
