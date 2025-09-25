"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import ArtworkCard from "../(components)/collection/artworkCard";
import UtilityBar from "../(components)/collection/utilityBar";
import AddArtwork from "../(components)/collection/addArtwork";
import { fetchArtworksClient } from "../(actions)/collection/get-artworks-client";
import ArtworkModal from "../(components)/collection/fullViewArtwork";

type Artwork = {
  id: string;
  image_url: string | null;
  title: string | null;
  artist_name: string | null;
  width_cm: number | null;
  height_cm: number | null;
  depth_cm?: number | null;
  location_acquired: string | null;
  date_acquired: string | null;
};

export default function Collection() {
  const {
    data: artworks,
    error,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["artworks"],
    queryFn: fetchArtworksClient,
    retry: 1,
  });
  return (
    <main>
      <ArtworkModal />

      <UtilityBar />
      <AddArtwork />

      {isLoading && (
        <p className="text-center text-gray-500 mt-8">Loading artworks...</p>
      )}

      {isError && (
        <div className="text-center mt-8 text-red-600 font-medium">
          <p>Error: {(error as Error).message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      )}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 gap-4 mt-8">
          {artworks && artworks.length > 0 ? (
            artworks.map((art: Artwork) => (
              <ArtworkCard
                key={art.id}
                artwork={art}
              />
            ))
          ) : (
            <p className="text-center text-gray-500">No artworks found.</p>
          )}
        </div>
      )}
    </main>
  )
}
