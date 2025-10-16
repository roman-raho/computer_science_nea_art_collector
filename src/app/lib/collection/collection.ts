import { create } from "zustand";

type searchQuery = {
  query: string;
  sortOrder: "asc" | "desc"; // for sort
  setQuery: (query: string) => void;
  toggleSortOrder: () => void;
};

export const useQueryStore = create<searchQuery>((set) => ({
  query: "",
  sortOrder: "asc", // added to amtch type
  setQuery: (query) => set({ query }),
  toggleSortOrder: () =>
    set((state) => ({ sortOrder: state.sortOrder === "asc" ? "desc" : "asc" })), // will toggle between the two
}));
