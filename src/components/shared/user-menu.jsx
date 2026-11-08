import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { userLoggedOut } from "@/features/auth/authSlice";
import useAuth from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";

const UserMenu = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const fullName = user?.name || "Demo user";
  const email = user?.email || "";

  const handleLogout = () => {
    dispatch(userLoggedOut());
    navigate("/login", { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open account menu"
          className="center rounded-full border border-border bg-card p-1 outline-none transition hover:border-primary/40 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            <User className="size-4"/>
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-2xl p-2 shadow-xl"
      >
        <div className="px-3 py-2.5">
          <p className="truncate text-sm font-semibold text-foreground">
            {fullName}
          </p>
          {email && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {email}
            </p>
          )}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="rounded-xl px-3 py-2.5"
          onSelect={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun /> : <Moon />}
          {isDark ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="rounded-xl px-3 py-2.5"
          onSelect={handleLogout}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
