"use client";

import { useEffect, useState } from 'react'
import { updatePassword, validatePassword } from '../(actions)/login/login-main';
import { check2faStatus, toggle2fa } from '../(actions)/login/utils';

export default function Settings() {
  const [passwordCorrect, setPasswordCorrect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [worked, setWorked] = useState<string | null>(null);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  useEffect(() => {
    async function fetch2FAStatus() {
      const status = await check2faStatus();
      setTwoFAEnabled(status.success!);
    }
    fetch2FAStatus();
  }, []);

  useEffect(() => {
    toggle2FA(twoFAEnabled);
  }, [twoFAEnabled]);

  async function toggle2FA(twofaOn: boolean) {
    const result = await toggle2fa(twofaOn);
    if (!result!.success) {
      setError(result!.error || "An unknown error occurred");
    }
    else {
      setError(null);
    }
  }
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

  const toggle = () => setTwoFAEnabled(!twoFAEnabled);

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

      {/* 2fa */}
      <div className="flex items-center gap-3 mt-8">
        <span className="text-lg">Two-Factor Authentication</span>
        <button
          type="button"
          onClick={async () => { await toggle2FA(!twoFAEnabled); toggle() }}
          className={`relative cursor-pointer inline-flex h-6 w-12 items-center rounded-full transition-colors ${twoFAEnabled ? "bg-green-500" : "bg-gray-300"
            }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${twoFAEnabled ? "translate-x-6" : "translate-x-1"
              }`}
          />
        </button>
        <span className="text-sm text-gray-600">
          {twoFAEnabled ? "Enabled" : "Disabled"}
        </span>
      </div>

    </main>
  )
}
