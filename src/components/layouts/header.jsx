import React from "react";
import AppLogo from "../ui/logo";
import UserMenu from "../shared/user-menu";
import NotificationsMenu from "../shared/notifications-menu";
import { useNotifications } from "@/features/notifications/useNotifications";

const Header = () => {
  useNotifications();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <AppLogo />
        <div className="flx gap-2">
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
