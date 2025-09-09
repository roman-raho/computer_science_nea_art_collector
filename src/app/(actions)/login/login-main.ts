"use server";

import { loginDetailsSchema } from "@/app/types/login";
import { supabaseAdmin } from "../../lib/supabase/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

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

  const typeCheck = { email, password };
  const result = loginDetailsSchema.safeParse(typeCheck);

  if (!result.success) {
    return {
      success: false,
      error:
        "Password: 8+ chars, incl. 1 number & 1 special character. Email: valid format.",
    };
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
  const rawEmail = formData.get("email")?.toString();
  const email = rawEmail?.trim().toLowerCase(); // strip email
  const password = formData.get("password")?.toString();

  if (!email || !password)
    // check presence of both fields
    return { success: false, error: "Missing required fields" };

  const { data: lockRow } = await supabaseAdmin // check if email has any locked rows
    .from("login_attempts")
    .select("locked_until")
    .eq("email", email)
    .maybeSingle();

  if (lockRow?.locked_until && new Date(lockRow.locked_until) > new Date()) {
    // if it is locked return false
    const ms = new Date(lockRow.locked_until).getTime() - Date.now();
    const minutes = Math.ceil(ms / 60000);
    return {
      success: false, // return to user how long it is locked for
      error: `Too many attempts. Try again in ~${minutes} min.`,
    };
  }

  const { data: userDetails, error: userDataError } = await supabaseAdmin // find user with same email to retrieve password to compare
    .from("users")
    .select("password_hash,id")
    .eq("email", email)
    .maybeSingle();

  if (!userDetails) return { success: false, error: "No user with that email" };

  if (userDataError) return { success: false, error: "Failed to fetch user" };

  const isMatch = await bcrypt.compare(password, userDetails.password_hash); // use bcrypt password compare function to comapre plaintext password with hashed one

  const jti = crypto.randomUUID();

  if (!isMatch) {
    // if it isnt a match first we need to add a log to the DB that there was a login failure
    const { error: rpcError } = await supabaseAdmin.rpc(
      "record_login_failure", // record a login failure
      {
        p_email: email,
      }
    );

    if (rpcError) {
      await supabaseAdmin.from("login_attempts").insert({
        // adds a row that locks it until 1 hr later
        email,
        attempts: 1,
        last_attempt_at: new Date().toISOString(),
        locked_until: new Date(Date.now() + 60_000).toISOString(),
      });
    }
    return { success: false, error: "Email or password is incorrect." };
  }

  if (isMatch) {
    await supabaseAdmin // on success reset attempts
      .from("login_attempts")
      .update({
        attempts: 0,
        locked_until: null,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("email", email);

    // if they match generate cookies
    const accessToken = jwt.sign(
      // create access token
      { userId: userDetails.id },
      process.env.JWT_SECRET!,
      { expiresIn: "10s" }
    );

    const refreshToken = jwt.sign(
      // create refresh token
      { userId: userDetails.id, jti: jti },
      process.env.JWT_SECRET!,
      { expiresIn: "3m" }
    );

    const cookieStore = await cookies();

    // store it in cookies
    cookieStore.set("access", accessToken, { httpOnly: true });
    cookieStore.set("refresh", refreshToken, { httpOnly: true });

    await supabaseAdmin
      .from("refresh_tokens")
      .insert([{ id: jti, user_id: userDetails.id }]);

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

export async function validatePassword(formData: FormData) {
  const password = formData.get("password")?.toString().trim(); // get the password

  if (!password) return { success: false, error: "Missing required field." };

  const cookieStore = await cookies();
  const token = cookieStore.get("access")?.value; // get access token from cookie store

  if (!token) return { success: false, error: "Invalid cookies." };

  const secret = new TextEncoder().encode(process.env.JWT_SECRET); // get the secret to decode jwt

  const { payload } = await jwtVerify(token, secret); // get the data from the jwt (specifically the user_id)

  const userId = payload.userId as string; // get user id

  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single(); // lookup user in table to access password

  const isMatch = await bcrypt.compare(password, userData.password_hash); // check password matches

  if (isMatch) return { success: true }; // if does return success
}

// export async function changePassword(formData: FormData) {
//   const pass = formData.get("pass1")?.toString().trim();
//   const passConfirm = formData.get("pass2")?.toString().trim();

//   if (!pass || !passConfirm)
//     return { success: false, error: "Missing required fields" };
// }
