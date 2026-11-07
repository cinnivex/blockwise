"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNext } from "@/lib/safe-next";

export type AuthState = { error?: string; message?: string; email?: string };

const NOT_CONFIGURED: AuthState = {
  error: "Supabase isn't connected yet. Add your keys to .env.local first.",
};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Turn Supabase's error text into something friendlier. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match. Try again.";
  if (m.includes("email not confirmed")) return "Confirm your email first — check your inbox for the link we sent.";
  if (m.includes("already registered")) return "An account with that email already exists. Try logging in.";
  if (m.includes("password")) return message;
  if (m.includes("rate limit")) return "Too many attempts. Wait a minute and try again.";
  return "Something went wrong. Please try again.";
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;

  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: friendly(error.message), email };

  redirect(safeNext(formData.get("next")));
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;

  const name = field(formData, "name");
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and a password.", email };
  if (password.length < 8) return { error: "Use at least 8 characters for your password.", email };

  const h = await headers();
  const origin =
    h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: name ? { full_name: name } : undefined,
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });
  if (error) return { error: friendly(error.message), email };

  // If "Confirm email" is turned off in Supabase, the user is logged in already.
  if (data.session) redirect("/dashboard");

  return {
    message: `Almost there! We sent a confirmation link to ${email}. Click it to finish signing up.`,
    email,
  };
}

export async function logout() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
