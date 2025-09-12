import { validateOTP } from "@/app/(actions)/login/email-verification";
import { generateLoginCookies } from "@/app/(actions)/login/login-main";
import { useLoginModal } from "@/app/lib/login/login-modal";
import { useState } from "react";

export default function EmailVerificationPopup() {

  const { isOpen, close, userCreated, loginDetails, setLoginDetails, setUserCreated, forgotEmail, setForgotEmail, switchToNewPassword } = useLoginModal();
  const [error, setError] = useState<string | null>(null);

  async function handleEmailVerification(formData: FormData) {
    console.log("Handling email verification")
    const otpCode = formData.get("otp-code")?.toString();
    if (!otpCode) {
      setError("You need to enter a code");
      return;
    }
    const result = await validateOTP(parseInt(otpCode), loginDetails?.email || userCreated?.email || forgotEmail);
    if (!result.success) {
      setError(result.error || "An unknown error occurred");
    } else {
      setError(null);
    }

    if (isOpen === "email-verif-login" && result.success) {
      await generateLoginCookies(loginDetails?.email || userCreated?.email); // if logging in, generate login cookies
    }

    if (isOpen === "email-verif-forgot-pass" && result.success) {
      switchToNewPassword();
      return
    }
    setLoginDetails(null);
    setUserCreated(null);
    close();
  }

  if (isOpen !== "email-verif-signup" && isOpen !== "email-verif-login" && isOpen !== "email-verif-forgot-pass") return null;

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
      <button onClick={close} type="button" className='hover:text-neutral-700 text-sm'>{(isOpen === "email-verif-signup") ? "Don&apos;t enable 2FA" : "Exit"}</button>
    </form>
  )
}