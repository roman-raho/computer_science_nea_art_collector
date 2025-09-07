import { redirect } from 'next/navigation'
import { validateEmail } from '../(actions)/login/email-verification'

export default async function Email_Verification_Page({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const searchParamNew = await searchParams
  const token = searchParamNew.token

  if (!token) {
    return <div className='h-screen w-screen flex items-center justify-center'>No token provided</div>
  }
  const result = await validateEmail(token)

  if (result.ok) {
    redirect('/')
  }

  if (!result.ok) {
    return <div className='h-screen w-screen flex items-center justify-center'>Error: {result.reason}</div>
  }
}
