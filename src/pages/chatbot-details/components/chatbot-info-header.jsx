import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ChatbotTile from "./chatbot-tile";
import UpdateChatbotDialog from "./update-chatbot-dialog";

const ChatbotInfoHeader = ({ chatbot }) => {
  const [updateOpen, setUpdateOpen] = useState(false);

  return (
    <>
      <div className="flex justify-between shrink-0 gap-3 px-4 py-4 lg:px-5">
        <div className="flex min-w-0 flex-1 gap-4">
          <ChatbotTile
            chatbot={chatbot}
            className="size-12 shrink-0 rounded-2xl"
          />
          <div className="min-w-0">
            <h1 className="truncate font-bold text-foreground">
              {chatbot.name}
            </h1>
            {chatbot.businessType && (
              <span className="text-xs font-medium text-muted-foreground">
                {chatbot.businessType}
              </span>
            )}
            <p className="mt-1 line-clamp-4 max-w-2xl text-xs text-muted-foreground leading-5">
              {chatbot.description || "No description yet."}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Chatbot options">
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setUpdateOpen(true)} className="text-xs">
              <Pencil className="size-3" />
              Update chatbot
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setUpdateOpen(true)} className="text-xs text-red-500 hover:!text-red-500">
              <Trash2 className="size-3 text-red-500" />
              Delete Chatbot
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <UpdateChatbotDialog
        chatbot={chatbot}
        open={updateOpen}
        setOpen={setUpdateOpen}
      />
    </>
  );
};

export default ChatbotInfoHeader;
