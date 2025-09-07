"use client";

import Link from 'next/link'
import { useState } from 'react'
import { BiChevronDown } from 'react-icons/bi'
import { useLoginModal } from '@/app/lib/login/login-modal';
import { logoutUser } from '@/app/(actions)/login/login-main';

const NAVIGATION = [
  { label: "Home", location: "/collection" },
  { label: "3D View", location: "/3d-view" },
  { label: "Settings", location: "/settings" },
]

export default function SidebarClient({ isAuthed }: { isAuthed: boolean }) {
  const [showSidebar, setShowSidebar] = useState(true)
  const toggleSideBar = () => setShowSidebar((s) => !s)

  return (
    <div className='fixed top-10 left-10 flex flex-col items-center border-1 border-neutral-100 shadow-xl p-3 rounded-lg h-auto gap-4'>
      {showSidebar &&
        NAVIGATION.map((item) => (
          <div key={item.label} className="select-none h-fit hover:text-blue-400 transition duration-75">
            <Link href={item.location}>{item.label}</Link>
          </div>
        ))}

      {isAuthed ? (
        // Server action must be called via a form from client
        <form action={logoutUser}>
          <button className="select-none h-fit hover:text-blue-400 transition duration-75" type="submit">
            Logout
          </button>
        </form>
      ) : (
        <button
          className="select-none h-fit hover:text-blue-400 transition duration-75"
          onClick={useLoginModal.getState().open}
        >
          Login
        </button>
      )}

      <BiChevronDown
        onClick={toggleSideBar}
        size={24}
        className={`${showSidebar ? "-rotate-180" : ""} transition-rotation duration-350 cursor-pointer`}
      />
    </div>
  )
}
