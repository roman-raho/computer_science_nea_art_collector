"use client";

import { useState } from 'react'
import { updatePassword, validatePassword } from '../(actions)/login/login-main';

export default function Settings() {
  const [passwordCorrect, setPasswordCorrect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [worked, setWorked] = useState<string | null>(null);

  async function checkPasswordValid(formData: FormData) {
    const result = await validatePassword(formData);
    console.log(result || "no result");
    if (!result!.success) {
      setError(result!.error || "An unknown error occurred");
    } else {
      setError(null);
      setPasswordCorrect(true);
    }
  }

  async function updatePasswordAsync(formData: FormData) {
    const result = await updatePassword(formData);
    if (!result!.success) {
      setError(result!.error || "An unknown error occurred");
      setWorked(null);
    } else {
      setError(null);
      setWorked("Password updated successfully");
      setPasswordCorrect(false);
    }
  }

  return (
    <main className='flex flex-col justify-start pl-50 py-10 items-start h-screen w-screen'>
      <h1 className='text-3xl font-bold mb-10'>Settings Page</h1>
      {!passwordCorrect ? (
        <form
          action={checkPasswordValid}
          className='flex flex-col gap-2 items-start'
        >
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          {worked && <p className="text-green-500 text-sm mb-2">{worked}</p>}
          <p>Change password</p>
          <span>Enter password first:
            <input name="password" type="password" className='border rounded-xl border-gray-300 p-1 m-1' />
          </span>
          <button
            className='bg-blue-500 hover:bg-blue-700 cursor-pointer px-4 text-white rounded-xl p-1 m-1'
            type="submit"
          >
            Submit
          </button>
        </form>) : (
        <form
          className='flex flex-col gap-2 items-start'
          action={updatePasswordAsync}
        >
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <p>Password correct</p>
          <span>New password: <input name="pass1" type="password" className='border rounded-xl border-gray-300 p-1 m-1' /></span>
          <span>Confirm password: <input name="pass2" type="password" className='border rounded-xl border-gray-300 p-1 m-1' /></span>
          <button
            className='bg-blue-500 hover:bg-blue-700 cursor-pointer px-4 text-white rounded-xl p-1 m-1'
            type="submit"
          >Submit</button>
        </form>
      )}
    </main>
  )
}
