"use server";

import SidebarClient from "./sidebar_client";
import { checkSignedIn } from "@/app/(actions)/login/session";

export default async function Sidebar() {
  const session = await checkSignedIn();
  return <SidebarClient isAuthed={!!session} />;
}


