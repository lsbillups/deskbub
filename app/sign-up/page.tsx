import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
      <SignUp />
    </div>
  );
}
