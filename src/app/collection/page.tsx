"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ArtworkCard from "../(components)/collection/artworkCard";
import UtilityBar from "../(components)/collection/utilityBar";
import AddArtwork from "../(components)/collection/addArtwork";
import { fetchArtworksClient } from "../(actions)/collection/get-artworks-client";
import ArtworkModal from "../(components)/collection/fullViewArtwork";
import { useQueryStore } from "../lib/collection/collection";

type Artwork = {
  id: string;
  image_url: string | null;
  title: string | null;
  medium: string | null;
  artist_name: string | null;
  width_cm: number | null;
  height_cm: number | null;
  depth_cm?: number | null;
  location_acquired: string | null;
  date_acquired: string | null;
};

// debounced function to search artworks
function useDebounced<T>(value: T, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debouncedValue;
}

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

  // search state
  const { query, sortOrder } = useQueryStore();
  const debouncedQuery = useDebounced(query, 300);

  // filter
  const filtered = useMemo(() => {
    const list = artworks ?? [];
    const q = debouncedQuery.trim().toLowerCase();
    let result = list; // will have two different results now

    if (q) {
      result = list.filter((art: Artwork) => { // assign result
        const t = (art.title ?? "").toLowerCase();
        const an = (art.artist_name ?? "").toLowerCase();
        const la = (art.location_acquired ?? "").toLowerCase();
        const da = (art.date_acquired ?? "").toLowerCase();
        const md = (art.medium ?? "").toLowerCase();
        const wd = (String(art.width_cm) ?? "").toLowerCase();
        const hd = (String(art.height_cm) ?? "").toLowerCase();
        const d = (String(art.depth_cm) ?? "").toLowerCase();

        return (
          t.includes(q) ||
          an.includes(q) ||
          la.includes(q) ||
          da.includes(q) ||
          md.includes(q) ||
          wd.includes(q) ||
          hd.includes(q) ||
          d.includes(q)
        );
      });
    }

    return [...result].sort((a, b) => { // return the filtered resulted sorted
      const titleA = (a.title ?? "").toLowerCase(); // compare titles
      const titleB = (b.title ?? "").toLowerCase();
      if (titleA < titleB) return sortOrder === "asc" ? -1 : 1;
      if (titleA > titleB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  }, [artworks, debouncedQuery, sortOrder]); // add sort order to dependencies

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
          {filtered && filtered.length > 0 ? (
            filtered.map((art: Artwork) => (
              <ArtworkCard
                key={art.id}
                artwork={art}
              />
            ))
          ) : (
            <p className="text-center text-gray-500">No artworks found matching {debouncedQuery}.</p>
          )}
        </div>
      )}
    </main>
  )
}
