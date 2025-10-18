import { create } from "zustand";

export type ArtworkFilters = {
  // define types of filters
  names: string[];
  acquiredFrom: string | null;
  acquiredTo: string | null;
};

export const defaultFilters: ArtworkFilters = {
  // define defaults
  names: [],
  acquiredFrom: null,
  acquiredTo: null,
};

export type FilterState = {
  filters: ArtworkFilters;
  availableNames: string[];
  setFilters: (next: ArtworkFilters) => void; // replace entire filters object
  patchFilters: (next: Partial<ArtworkFilters>) => void; // for partial updates
  clearFilters: () => void;
  setAvailableNames: (names: string[]) => void;
  open: boolean;
  setOpen: () => void;
  setClosed: () => void;
  toggleFilter: () => void;
};

export const useFilterStore = create<FilterState>((set) => ({
  filters: { ...defaultFilters }, // set as default
  availableNames: [],

  setFilters: (next) => set({ filters: next }),
  patchFilters: (patch) =>
    set((s) => ({ filters: { ...s.filters, ...patch } })),
  clearFilters: () => set({ filters: { ...defaultFilters } }), // clear filters

  setAvailableNames: (names) =>
    set({
      availableNames: [...new Set(names)].sort((a, b) => a.localeCompare(b)), // set and sort names
    }),

  open: false,
  setOpen: () => set(() => ({ open: true })),
  setClosed: () => set(() => ({ open: false })),
  toggleFilter: () => set((s) => ({ open: !s.open })),
}));
