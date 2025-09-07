"use client";

import { useLoginModal } from '@/app/lib/login/login-modal';
import React from 'react'
import { IoMdClose } from "react-icons/io";

export default function LoginPopup() {
  const { isOpen, close, switchToSignup } = useLoginModal()

  if (isOpen === "login") {
    return (
      <div
        className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 py-5 px-6 rounded-lg shadow-lg z-50 flex flex-col'
        onClick={(e) => e.stopPropagation()}
      >
        <button className="mt-2 absolute top-4.5 right-5 text-lg hover:text-blue-600 cursor-pointer duration-150" onClick={close}><IoMdClose /></button>
        <h2 className='font-bold text-center text-lg mb-4'>Login</h2>
        <span className='mr-3'>Email</span>
        <input type="text" className='border border-gray-200 rounded-xl text-base p-2 mt-1 mb-4' />
        <span className='mr-3'>Password</span>
        <input type="password" className='border border-gray-200 rounded-xl text-base p-2 my-1' />
        <button className="mt-2 text-xs text-blue-600 hover:text-blue-300 cursor-pointer duration-150" onClick={switchToSignup}>Dont have an account? Signup</button>
      </div>
    )
  } else {
    return <SignUpPopup />
  }
}

function SignUpPopup() {
  const { isOpen, close, switchToLogin } = useLoginModal()

  if (isOpen !== "signup") return null

  return (
    <div
      className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 py-5 px-6 rounded-lg shadow-lg z-50 flex flex-col'
      onClick={(e) => e.stopPropagation()}
    >
      <button className="mt-2 absolute top-4.5 right-5 text-lg hover:text-blue-600 cursor-pointer duration-150" onClick={close}><IoMdClose /></button>
      <h2 className='font-bold text-center text-lg mb-4'>Signup</h2>
      <span className='mr-3'>Email</span>
      <input type="text" className='border border-gray-200 rounded-xl text-base p-2 mt-1 mb-4' />
      <span className='mr-3'>Password</span>
      <input type="password" className='border border-gray-200 rounded-xl text-base p-2 my-1' />
      <button className="mt-2 text-xs text-blue-600 hover:text-blue-300 cursor-pointer duration-150" onClick={switchToLogin}>Already have an account? Login</button>
    </div>
  )
}
