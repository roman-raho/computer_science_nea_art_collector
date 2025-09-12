"use client";

import { generateLoginCookies, validateUser } from '@/app/(actions)/login/login-main';
import { useLoginModal } from '@/app/lib/login/login-modal';
import React, { useEffect, useState } from 'react'
import { IoMdClose } from "react-icons/io";
import emailjs from '@emailjs/browser';
import EmailVerificationPopup from './email-verification';
import SignUpPopup from './signup';
import ForgotPassword, { NewPassword } from './forgot-password';

export default function LoginPopup() {
  const { isOpen, close, switchToSignup, switchToEmailVerifLogin, setLoginDetails, switchToForgotPassword } = useLoginModal()
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("isOpen=", isOpen)
  }, [isOpen])

  async function handleSubmit(formData: FormData) {
    const result = await validateUser(formData);
    if (!result.success) {
      setError(result.error || "An unknown error occurred");
    } else {
      setError(null);
      console.log("correct")
      console.log(result.email, result.OTP)
    }

    setLoginDetails(result)

    if (result.twofa_enabled) {
      sendOTP(result.email!, result.OTP!); //  if the user has 2FA enabled send OTP to their email
    } else {
      await generateLoginCookies(result.email); // if not, log them in directly
      close();
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
        switchToEmailVerifLogin(); // switch to email verification popup to enter OTP
      } catch (error) {
        console.log(error)
        setError("Failed to send OTP email. Please try again.");
      }
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
        <p
          className="mt-2 text-xs mx-auto text-neutral-700"
        >
          Forgot Password? <button onClick={switchToForgotPassword}
            type="button" className='underline cursor-pointer duration-150 hover:text-neutral-900'>Reset</button>
        </p>
      </form>
    )
  } else if (isOpen === "signup") {
    return <SignUpPopup />
  } else if (isOpen === "email-verif-signup" || isOpen === "email-verif-login" || isOpen === "email-verif-forgot-pass") {
    return <EmailVerificationPopup />
  } else if (isOpen === "forgot-password") {
    return <ForgotPassword />
  } else if (isOpen === "new-password") {
    return <NewPassword />
  }
}




