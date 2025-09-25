"use client";

import { useAddArtwork } from '@/app/lib/collection/add-artwork';
import React from 'react'
import { IoMdAdd } from "react-icons/io";

export default function UtilityBar() {
  const { open } = useAddArtwork();
  return (
    <div className='w-[70%] mx-auto border border-gray-400 rounded-full p-4 gap-4 flex justify-between items-center mt-10'>
      <input type="text" className='p-2 w-full border hover:border-gray-500 transition border-gray-400 rounded-full' />
      <button
        onClick={open}
        className='p-2 border hover:border-gray-500 transition border-gray-400 cursor-pointer rounded-full'>
        <IoMdAdd size={22} />
      </button>
    </div>
  )
}
