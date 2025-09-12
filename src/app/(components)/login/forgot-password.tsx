"use client";

import { useState } from "react";
import emailjs from '@emailjs/browser';
import { useLoginModal } from "@/app/lib/login/login-modal";
import { emailSchema } from "@/app/types/login";
import { generateOTP } from "@/app/(actions)/login/generate-otp";
import { updatePassword } from "@/app/(actions)/login/login-main";

export default function ForgotPassword() {
  const [error, setError] = useState<string | null>(null);
  const { switchToEmailVerifPassword, setForgotEmail } = useLoginModal();


  async function handleSubmit(formData: FormData) {
    const email = formData.get("email")?.toString();
    if (!email) {
      setError("You need to enter an email");
      return;
    }

    setForgotEmail(email)

    const correctType = emailSchema.safeParse(email)

    if (!correctType.success) {
      setError("Invalid email address");
      return;
    }

    const result = await generateOTP(email);

    if (!result.success) {
      setError(result.error || "An unknown error occurred");
      return;
    }

    const OTP = result.OTP;

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
        switchToEmailVerifPassword(); // switch to email verification popup to enter OTP
      } catch (error) {
        console.log(error)
        setError("Failed to send OTP email. Please try again.");
      }
    }

    await sendOTP(email, OTP!); // send the OTP to the user's email
  }


  return (
    <form
      className='fixed top-1/2 left-1/2 w-100 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 py-5 px-6 rounded-lg shadow-lg z-50 flex flex-col'
      onClick={(e) => e.stopPropagation()}
      action={handleSubmit}
    >
      <h2 className='font-bold text-xl mb-3'>Enter Email</h2>
      <h3 className='text-sm mb-2'>Please enter your email</h3>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <input type="text" name="email" className='border border-gray-200 text-center rounded-xl text-base p-2 my-1' />
      <button type="submit" className='text-green-500 border cursor-pointer hover:bg-green-100 duration-100 rounded-xl w-[50%] mx-auto my-3'>Enter</button>
      <button onClick={close} type="button" className='hover:text-neutral-700 text-sm'>Exit</button>
    </form>
  )
}

export function NewPassword() {
  const [error, setError] = useState<string | null | undefined>(null);
  const { forgotEmail, setForgotEmail } = useLoginModal();
  const { close } = useLoginModal();
  async function changePassword(formData: FormData) {
    if (!forgotEmail) setError("Error fetching due to missing email.")
    const result = await updatePassword(formData, false, forgotEmail!);

    if (!result.success || result.error)
      setError(result.error)

    if (result.success)
      close();

    setForgotEmail(null);
  }

  return (
    <form
      className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 py-5 px-6 rounded-lg shadow-lg z-50 flex flex-col'
      onClick={(e) => e.stopPropagation()}
      action={changePassword}
    >
      <h2 className='font-bold text-xl mb-3'>Set New Password</h2>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <span className='mr-3'>New Password</span>
      <input type="password" name="pass1" className='border border-gray-200 rounded-xl text-base p-2 my-1' />
      <span className='mr-3'>Confirm Password</span>
      <input type="password" name="pass2" className='border border-gray-200 rounded-xl text-base p-2 my-1' />
      <button type="submit" className='text-green-500 border cursor-pointer hover:bg-green-100 duration-100 rounded-xl w-[50%] mx-auto my-3'>Set Password</button>
    </form>
  )
}