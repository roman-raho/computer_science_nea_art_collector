"use client";

import Link from 'next/link'
import { useState } from 'react'
import { BiChevronDown } from 'react-icons/bi'
import { useLoginModal } from '@/app/lib/login/login-modal';

const NAVIGATION = [
  { label: "Home", location: "/" },
  { label: "3D View", location: "/3d-view" },
  { label: "Settings", location: "/settings" },
  { label: "Login", location: "*" }
]

export default function Sidebar() {
  const [showSidebar, setShowSidebar] = useState(true)
  const toggleSideBar = () => setShowSidebar((s) => !s)

  return (
    <div className='fixed top-10 left-10 flex flex-col items-center border-1 border-neutral-100 shadow-xl p-3 rounded-lg h-auto gap-4'>
      {showSidebar && NAVIGATION.map(item =>
        item.location != "*" ?
          (
            <div key={item.label} className='select-none h-fit hover:text-blue-400 transition duration-75'>
              <Link href={item.location}>
                {item.label}
              </Link>
            </div>
          ) :
          (
            <button
              key={item.label}
              className='select-none h-fit hover:text-blue-400 transition duration-75'
              onClick={useLoginModal.getState().open}
            >
              {item.label}
            </button>
          )
      )}
      <BiChevronDown
        onClick={toggleSideBar}
        size={24}
        className={`${showSidebar ? "-rotate-180" : ""} 
      transition-rotation duration-350 cursor-pointer`}
      />
    </div>
  )
}
