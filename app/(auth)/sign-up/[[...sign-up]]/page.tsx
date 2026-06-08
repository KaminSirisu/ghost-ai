import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";

const signInPath = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in";
const signUpPath = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up";

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUp routing="path" path={signUpPath} signInUrl={signInPath} />
    </AuthShell>
  );
}
