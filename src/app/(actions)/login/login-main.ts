"use server";

import { loginDetailsSchema, passwordChangeSchema } from "@/app/types/login";
import { supabaseAdmin } from "../../lib/supabase/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { refreshAccessToken } from "@/app/utils/refresh-token";

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

  const randomEmailVerificationToken = Math.floor(
    100000 + Math.random() * 900000
  ); // generate random 6 digit number

  await supabaseAdmin.from("email_verifications").insert([
    // insert a row into the email verification table storing the token that will be used to verify
    {
      user_id: userData.id,
      token: randomEmailVerificationToken,
      used: false,
      expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  ]);

  return { success: true, OTP: randomEmailVerificationToken, email: email };
}

export async function validateUser(formData: FormData) {
  const rawEmail = formData.get("email")?.toString();
  const email = rawEmail?.trim().toLowerCase(); // strip email
  const password = formData.get("password")?.toString();

  if (!email || !password)
    // check presence of both fields
    return { success: false, error: "Missing required fields" };

  const { data: lockRow } = await supabaseAdmin
    .from("login_attempts")
    .select("locked_until")
    .eq("email", email)
    .maybeSingle();

  console.log("Lock check for email:", email);
  console.log("Lock row:", lockRow);
  console.log("Current time:", new Date());
  console.log(
    "Locked until:",
    lockRow?.locked_until ? new Date(lockRow.locked_until) : "No lock time"
  );

  if (
    lockRow &&
    lockRow.locked_until &&
    new Date(lockRow.locked_until) > new Date()
  ) {
    const ms = new Date(lockRow.locked_until).getTime() - Date.now();
    const minutes = Math.ceil(ms / 60000);
    console.log("User is locked for", minutes, "minutes");
    return {
      success: false,
      error: `Too many attempts. Try again in ~${minutes} min.`,
    };
  }

  const { data: userDetails, error: userDataError } = await supabaseAdmin // find user with same email to retrieve password to compare
    .from("users")
    .select("password_hash,id,email,twofa_enabled")
    .eq("email", email)
    .maybeSingle();

  if (!userDetails) return { success: false, error: "No user with that email" };

  if (userDataError) return { success: false, error: "Failed to fetch user" };

  const isMatch = await bcrypt.compare(password, userDetails.password_hash); // use bcrypt password compare function to comapre plaintext password with hashed one

  if (!isMatch) {
    // if it isnt a match first we need to add a log to the DB that there was a login failure
    const { error: rpcError } = await supabaseAdmin.rpc(
      "record_login_failure", // record a login failure
      {
        p_email: email,
      }
    );

    if (rpcError) {
      // await supabaseAdmin.from("login_attempts").insert({
      //   // adds a row that locks it until 1 hr later
      //   email,
      //   attempts: 1,
      //   last_attempt_at: new Date().toISOString(),
      //   locked_until: null, // changed from new Date(Date.now() + 60_000).toISOString()
      // });
      console.error("Failed to record login failure:", rpcError);
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

    const randomEmailVerificationToken = Math.floor(
      100000 + Math.random() * 900000
    ); // generate random 6 digit number

    await supabaseAdmin.from("email_verifications").insert([
      // insert a row into the email verification table storing the token that will be used to verify
      {
        user_id: userDetails.id,
        token: randomEmailVerificationToken,
        used: false,
        expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    ]);

    return {
      success: true,
      OTP: randomEmailVerificationToken,
      email: userDetails.email,
      twofa_enabled: userDetails.twofa_enabled,
    };
  }
  return { success: false, error: "Password incorrect" };
}

export async function generateLoginCookies(email?: string) {
  const { data: userDetails, error: userDataError } = await supabaseAdmin
    .from("users")
    .select("password_hash,id,email")
    .eq("email", email)
    .maybeSingle();

  if (!userDetails || userDataError) {
    console.log("User not found or error occurred:", {
      userDetails,
      userDataError,
    });
    return { success: false, error: "User not found" };
  }
  const jti = crypto.randomUUID();

  const accessToken = jwt.sign(
    { userId: userDetails.id },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: userDetails.id, jti: jti },
    process.env.JWT_SECRET!,
    { expiresIn: "14d" }
  );

  const cookieStore = await cookies();

  cookieStore.set("access", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  cookieStore.set("refresh", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  await supabaseAdmin
    .from("refresh_tokens")
    .insert([{ id: jti, user_id: userDetails.id }]);

  return { success: true };
}

export async function logoutUser() {
  const cookieData = await cookies();
  const refreshToken = cookieData.get("refresh")?.value;
  const enc = new TextEncoder();

  cookieData.set("access", "", { path: "/" }); // clear their cookies to remove session
  cookieData.set("refresh", "", { path: "/" });

  if (!refreshToken) {
    redirect("/");
  }

  try {
    const { payload } = await jwtVerify(
      // get payload from jwt
      refreshToken,
      enc.encode(process.env.JWT_SECRET!)
    );
    const jti = payload.jti as string; // use to find id of jwt to set as used
    await supabaseAdmin
      .from("refresh_tokens")
      .update({ revoked: true }) // set as revoked
      .eq("id", jti);
  } catch (err) {
    console.log(err);
  }

  redirect("/"); // after logout return them to the home page as they are unauthorised
}

export async function validatePassword(formData: FormData) {
  const password = formData.get("password")?.toString().trim(); // get the password

  if (!password) return { success: false, error: "Missing required field." };

  const cookieStore = await cookies();
  const token = cookieStore.get("access")?.value; // get access token from cookie store
  console.log(cookieStore);

  let userId: string;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;
    } catch {
      const refreshResult = await refreshAccessToken();
      if (!refreshResult.success) {
        return { success: false, error: "Session Expired" };
      }
      userId = refreshResult.userId!;
    }
  } else {
    const refreshResult = await refreshAccessToken();
    if (!refreshResult) {
      return { success: false, error: "Session expired." };
    }
    userId = refreshResult.userId!;
  }
  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  const isMatch = await bcrypt.compare(password, userData.password_hash);

  if (isMatch) return { success: true };

  return { success: false, error: "Incorrect password." };
}

export async function updatePassword(
  formData: FormData,
  loggedIn: boolean = true,
  email?: string
) {
  const newPassword = formData.get("pass1")?.toString().trim(); // get password 1 and 2
  const confirmPassword = formData.get("pass2")?.toString().trim();

  if (!newPassword || !confirmPassword)
    // check fields are filled
    return { success: false, error: "Missing required fields." };

  if (newPassword !== confirmPassword)
    // check they are equal
    return { success: false, error: "Passwords do not match." };

  const result = passwordChangeSchema.safeParse(newPassword);

  if (!result.success) {
    // check type is correct
    return {
      success: false,
      error: "Password must incl. 1 number, 1 special char and min 8 char.",
    };
  }

  const newSalt = await bcrypt.genSalt(); // generate new salt
  const newHashPassword = await bcrypt.hash(newPassword, newSalt); // encrypt
  if (loggedIn) {
    const cookieData = await cookies();
    const accessToken = cookieData.get("access")?.value; // get cookeis for userId
    let userId: string;
    if (accessToken) {
      // update cookies and get userId
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(accessToken, secret);
        userId = payload.userId as string;
      } catch {
        const refreshResult = await refreshAccessToken();
        if (!refreshResult.success) {
          return { success: false, error: "Session Expired" };
        }
        userId = refreshResult.userId!;
      }
    } else {
      const refreshResult = await refreshAccessToken();
      if (!refreshResult) {
        return { success: false, error: "Session expired." };
      }
      userId = refreshResult.userId!;
    }
    const { error: passwordChangeError } = await supabaseAdmin // update password + get error
      .from("users")
      .update({ password_hash: newHashPassword })
      .eq("id", userId);
    if (passwordChangeError)
      // if error then tell user
      return { success: false, error: "Updating password error." };
  } else {
    if (!email) return { success: false, error: "No email provided." };
    const { error: passwordChangeError } = await supabaseAdmin
      .from("users")
      .update({ password_hash: newHashPassword })
      .eq("email", email);

    if (passwordChangeError) {
      return { success: false, error: "Error updaing password." };
    }
  }

  return { success: true }; // succes = true
}
