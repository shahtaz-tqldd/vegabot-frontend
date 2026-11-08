import React from "react";
import AppLogo from "../ui/logo";
import UserMenu from "../shared/user-menu";

const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <AppLogo />
        <UserMenu />
      </div>
    </header>
  );
};

export default Header;
