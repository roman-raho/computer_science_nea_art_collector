"use client";

import { create } from "zustand";

export type Artwork = {
  // artowkr
  id?: string;
  image_url?: string;
  title?: string;
  artist_name?: string;
  medium?: string;
  width_cm?: number;
  height_cm?: number;
  depth_cm?: number;
  date_acquired?: string;
  location_acquired?: string;
  storage_location?: string;
  storage_company?: string;
  notes?: string;
};

type ArtworkModalState = {
  isOpen: boolean;
  selectedArtwork: Artwork | null;
  openModal: (artwork: Artwork) => void;
  closeModal: () => void;
};

export const useArtworkModal = create<ArtworkModalState>((set) => ({
  isOpen: false,
  selectedArtwork: null,
  openModal: (
    artwork // when opened pass an artwork
  ) =>
    set({
      isOpen: true,
      selectedArtwork: artwork,
    }),
  closeModal: () =>
    // when clsoed clear
    set({
      isOpen: false,
      selectedArtwork: null,
    }),
}));
