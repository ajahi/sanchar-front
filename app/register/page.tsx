import { redirect } from 'next/navigation';

// Shareable signup URL; the form lives on /login.
export default function RegisterPage() {
  redirect('/login?mode=signup');
}
