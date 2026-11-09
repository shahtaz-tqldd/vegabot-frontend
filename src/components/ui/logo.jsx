import { Logo } from "@/assets/icons/logo";
import React from "react";
import { Link } from "react-router-dom";

const AppLogo = () => {
  return (
    <Link className="flx gap-2" to={"/"}>
      <Logo className="size-10" />
      <div>
        <h2 className="text-lg font-bold text-primary">vegabot</h2>
        <p className="text-[11px] text-muted-foreground">AI Chatbot Assistant</p>
      </div>
    </Link>
  );
};

export default AppLogo;
