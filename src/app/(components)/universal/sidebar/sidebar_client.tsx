"use client";

import Link from "next/link";
import { useLoginModal } from "@/app/lib/login/login-modal";
import { logoutUser } from "@/app/(actions)/login/login-main";

const NAVIGATION = [
  { label: "Home", location: "/collection" },
  { label: "3D View", location: "/3d-view" },
  { label: "Settings", location: "/settings" },
];

export default function SidebarClient({ isAuthed }: { isAuthed: boolean }) {
  return (
    <div className="w-auto flex items-center px-8 py-4 justify-between border-b border-neutral-200 bg-white">
      <div className="flex items-center gap-6">
        {NAVIGATION.map((item) => (
          <div
            key={item.label}
            className="select-none h-fit hover:text-blue-400 transition duration-75"
          >
            <Link href={item.location}>{item.label}</Link>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {isAuthed ? (
          <form action={logoutUser}>
            <button
              className="select-none h-fit hover:text-blue-400 transition duration-75"
              type="submit"
            >
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
      </div>
    </div>
  );
}
