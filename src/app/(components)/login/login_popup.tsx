"use client";

import { createUser, validateUser } from '@/app/(actions)/login/login-main';
import { useLoginModal } from '@/app/lib/login/login-modal';
import React, { useState } from 'react'
import { IoMdClose } from "react-icons/io";
import emailjs from '@emailjs/browser';
import { validateOTP } from '@/app/(actions)/login/email-verification';

export default function LoginPopup() {
  const { isOpen, close, switchToSignup } = useLoginModal()
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await validateUser(formData);
    if (!result.success) {
      setError(result.error || "An unknown error occurred");
    } else {
      setError(null);
      close();
    }
  }

  if (isOpen === "login") {
    return (
      <form
        className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 py-5 px-6 rounded-lg shadow-lg z-50 flex flex-col'
        onClick={(e) => e.stopPropagation()}
        action={handleSubmit}
      >
        <button
          type="button"
          className="mt-2 absolute top-4.5 right-5 text-lg hover:text-blue-600 cursor-pointer duration-150"
          onClick={close}
        >
          <IoMdClose />
        </button>
        <h2 className='font-bold text-center text-lg mb-4'>Login</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <span className='mr-3'>Email</span>
        <input
          name="email"
          type="text"
          className='border border-gray-200 rounded-xl text-base p-2 mt-1 mb-4' />
        <span className='mr-3'>Password</span>
        <input
          name="password"
          type="password"
          className='border border-gray-200 rounded-xl text-base p-2 my-1' />
        <button
          type="submit"
          className='cursor-pointer p-1 border-1 rounded-lg border-gray-300 text-sm w-[50%] mx-auto my-2 hover:bg-gray-100 bg-gray-50'
        >
          Enter
        </button>
        <button
          className="mt-2 text-xs text-blue-600 hover:text-blue-300 cursor-pointer duration-150"
          onClick={switchToSignup}
          type="button"
        >
          Dont have an account? Signup
        </button>
      </form>
    )
  } else if (isOpen === "signup") {
    return <SignUpPopup />
  } else {
    return <EmailVerificationPopup />
  }
}

function SignUpPopup() {
  const { isOpen, close, switchToLogin, switchToEmailVerif, setUserCreated } = useLoginModal()
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await createUser(formData);
    if (!result.success) {
      setError(result.error || "An unknown error occurred");
    } else {
      setError(null);
      setUserCreated(result); // store the email of the created user
      sendOTP(result.email!, result.OTP!); // send OTP to the user's email
    }

  }

  async function sendOTP(email: string, otp: number) {
    try {
      await emailjs.init({ publicKey: process.env.NEXT_PUBLIC_EMAIL_JS_PUBLIC! });
      await emailjs.send( // send email using emailjs
        process.env.NEXT_PUBLIC_EMAIL_JS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAIL_JS_TEMPLATE_ID!,
        {
          email: email,
          passcode: otp.toString(),
        }
      );
      switchToEmailVerif(); // switch to email verification popup to enter OTP
    } catch (error) {
      console.log(error)
      setError("Failed to send OTP email. Please try again.");
    }
  }

  if (isOpen !== "signup") return null

  return (
    <form
      className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 py-5 px-6 rounded-lg shadow-lg z-50 flex flex-col'
      onClick={(e) => e.stopPropagation()}
      action={handleSubmit}
    >
      <button
        type="button"
        className="mt-2 absolute top-4.5 right-5 text-lg hover:text-blue-600 cursor-pointer duration-150"
        onClick={close}
      >
        <IoMdClose /></button>
      <h2 className='font-bold text-center text-lg mb-4'>Sign Up</h2>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <span className='mr-3'>Email</span>
      <input
        name="email"
        type="text"
        className='border border-gray-200 rounded-xl text-base p-2 mt-1 mb-4'
      />
      <span className='mr-3'>Password</span>
      <input
        name="password"
        type="password"
        className='border border-gray-200 rounded-xl text-base p-2 my-1'
      />
      <span className='mr-3'>Confirm Password</span>
      <input
        name="password_confirm"
        type="password"
        className='border border-gray-200 rounded-xl text-base p-2 my-1'
      />
      <button
        type="submit"
        className='cursor-pointer p-1 border-1 rounded-lg border-gray-300 text-sm w-[50%] mx-auto my-2 hover:bg-gray-100 bg-gray-50'
      >
        Sign Up
      </button>
      <button
        className="mt-2 text-xs text-blue-600 hover:text-blue-300 cursor-pointer duration-150"
        type="button"
        onClick={switchToLogin}
      >
        Already have an account? Login
      </button>
    </form>
  )
}

function EmailVerificationPopup() {

  const { isOpen, close, userCreated } = useLoginModal();
  const [error, setError] = useState<string | null>(null);

  async function handleEmailVerification(formData: FormData) {
    console.log("Handling email verification")
    const otpCode = formData.get("otp-code")?.toString();
    if (!otpCode) {
      setError("You need to enter a code");
      return;
    }

    const result = await validateOTP(parseInt(otpCode), userCreated.email!);
    if (!result.success) {
      setError(result.error || "An unknown error occurred");
    } else {
      setError(null);
      close();
    }
  }

  if (isOpen !== "email-verif") return null

  return (
    <form
      className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 py-5 px-6 rounded-lg shadow-lg z-50 flex flex-col'
      onClick={(e) => e.stopPropagation()}
      action={handleEmailVerification}
    >
      <h2 className='font-bold text-xl mb-3'>Verify Email</h2>
      <h3 className='text-sm mb-2'>Please enter the 6 digit OTP sent to your email</h3>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <input type="text" name="otp-code" maxLength={6} className='border border-gray-200 text-center rounded-xl text-base p-2 my-1' />
      <button type="submit" className='text-green-500 border cursor-pointer hover:bg-green-100 duration-100 rounded-xl w-[50%] mx-auto my-3'>Verify</button>
      <button onClick={close} type="button" className='hover:text-neutral-700 text-sm'>Don&apos;t enable 2FA</button>
    </form>
  )
}

