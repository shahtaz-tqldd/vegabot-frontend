import { Logo } from "@/assets/icons/logo";
import React from "react";

const ChatbotProfile = ({
  logo = null,
  name = "",
  size = 8,
  color = "#f76f1b",
}) => {
  return (
    <div>
      {logo ? (
        <img
          src={logo}
          alt={name}
          className={`size-${size} shrink-0 rounded-2xl object-cover`}
        />
      ) : (
        <div className="bg-orange-500/10 p-2 rounded-xl">
          <Logo className={`size-${size}`} fill={color} />
        </div>
      )}
    </div>
  );
};

export default ChatbotProfile;
