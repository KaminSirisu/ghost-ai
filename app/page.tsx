import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const signInPath = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in";

export default async function Home() {
  const { userId } = await auth();

  redirect(userId ? "/editor" : signInPath);
}
