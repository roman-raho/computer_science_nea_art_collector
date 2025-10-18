"use client";

import { useAddArtwork } from '@/app/lib/collection/add-artwork';
import React, { useRef } from 'react'
import { useQueryStore } from "@/app/lib/collection/collection";
import { IoMdAdd } from "react-icons/io";
import { FaSortDown, FaSortUp } from "react-icons/fa6";
import { IoFilter } from "react-icons/io5";
import { useFilterStore } from '@/app/lib/collection/filters';
import FilterDropdown from './filterDropdown';

export default function UtilityBar() {
  const { open } = useAddArtwork();
  const { toggleFilter } = useFilterStore();
  const { query, setQuery, sortOrder, toggleSortOrder } = useQueryStore();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-[70%] relative mx-auto border border-gray-400 rounded-full p-4 gap-4 flex justify-between items-center mt-10">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search artworks..."
        className="p-2 w-full border hover:border-gray-500 transition border-gray-400 rounded-full outline-none focus:ring-2 focus:ring-gray-300"
      />

      {/* Filter button */}
      <button
        className="p-2 border hover:border-gray-500 transition border-gray-400 cursor-pointer rounded-full"
        aria-label="Filter Artworks"
        onClick={toggleFilter}
      >
        <IoFilter size={22} />
      </button>

      {/* Sort button */}
      <button
        onClick={toggleSortOrder}
        className="p-2 border hover:border-gray-500 transition border-gray-400 cursor-pointer rounded-full"
        aria-label={`Sort artworks ${sortOrder === "asc" ? "A→Z" : "Z→A"}`}
      >
        {sortOrder === "asc" ? <FaSortDown size={22} /> : <FaSortUp size={22} />}
      </button>

      {/* Add button */}
      <button
        onClick={open}
        className="p-2 border hover:border-gray-500 transition border-gray-400 cursor-pointer rounded-full"
        aria-label="Add new artwork"
      >
        <IoMdAdd size={22} />
      </button>

      <FilterDropdown />
    </div>
  )
}
