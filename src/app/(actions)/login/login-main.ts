"use server";

import { supabaseAdmin } from "../../lib/supabase/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createUser(formData: FormData) {
  const email = formData.get("email")?.toString(); // get email
  const password = formData.get("password")?.toString(); // get password
  const password_confirm = formData.get("password_confirm")?.toString(); // get confirmation password

  if (!email || !password || !password_confirm) {
    return { success: false, error: "Missing required fields" };
  }

  if (password !== password_confirm) {
    // check that passwords match
    return { success: false, error: "Passwords do not match" };
  }

  const { data: exisitingUser, error: exisitingUserError } = await supabaseAdmin // i am selecting any users with the same email -> if there is one i will deny the create user request
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (exisitingUser) {
    return { success: false, error: "Email already in use" };
  }

  if (exisitingUserError) {
    return { success: false, error: "Error checking email duplicates" };
  }

  const salt = await bcrypt.genSalt(); // generate salt
  const hashedPassword = await bcrypt.hash(password, salt); // hash password with generated salt

  const { data: userData, error: userDataError } = await supabaseAdmin // create user with hased password and submitted email in "users" table
    .from("users")
    .insert([{ email: email, password_hash: hashedPassword }])
    .select("id") // return the id to create relational tables later
    .single();

  if (!userData || userDataError) {
    return { success: false, error: "Failed to create user." };
  }

  const randomEmailVerificationToken = crypto.randomUUID(); // generate random token for email verification

  await supabaseAdmin.from("email_verifications").insert([
    // insert a row into the email verification table storing the token that will be used to verify
    {
      user_id: userData.id,
      token: randomEmailVerificationToken,
      used: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hr
    },
  ]);

  const verifyUrl = `/verify-email?token=${randomEmailVerificationToken}`; // to push to the router to verify email (will always work in v1 for simplicity)

  return { success: true, verifyUrl };
}

export async function validateUser(formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password)
    // check presence of both fields
    return { success: false, error: "Missing required fields" };

  const { data: userDetails, error: userDataError } = await supabaseAdmin // find user with same email to retrieve password to compare
    .from("users")
    .select("password_hash,id")
    .eq("email", email)
    .maybeSingle();

  if (!userDetails) return { success: false, error: "No user with that email" };

  if (userDataError) return { success: false, error: "Failed to fetch user" };

  const isMatch = await bcrypt.compare(password, userDetails.password_hash); // use bcrypt password compare function to comapre plaintext password with hashed one

  if (isMatch) {
    // if they match generate cookies
    const accessToken = jwt.sign(
      // create access token
      { userId: userDetails.id },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      // create refresh token
      { userId: userDetails.id },
      process.env.JWT_SECRET!,
      { expiresIn: "14d" }
    );

    const cookieStore = await cookies();

    // store it in cookies
    cookieStore.set("access", accessToken, { httpOnly: true });
    cookieStore.set("refresh", refreshToken, { httpOnly: true });
    return { success: true };
  }
  return { success: false, error: "Password incorrect" };
}

export async function logoutUser() {
  const cookieData = await cookies();
  cookieData.set("access", "", { path: "/" }); // clear their cookies to remove session
  cookieData.set("refresh", "", { path: "/" });
  redirect("/"); // after logout return them to the home page as they are unauthorised
}
