import { logout } from "@/app/auth/actions";
import { getSessionUser } from "@/lib/supabase/user";

/** Signed-in email + log out button. Render inside <Suspense>. */
export async function UserMenu() {
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden text-muted sm:inline">{user.email}</span>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-lg border border-border px-3 py-1.5 font-medium hover:bg-background"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
