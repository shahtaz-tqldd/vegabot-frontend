import { useMemo, useState } from "react";
import { Bot, Plus, Search } from "lucide-react";

import Pagination from "@/components/table/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListChatbotsQuery } from "@/features/chatbot/chatbotApiSlice";
import useTitle from "@/hooks/useTitle";
import ChatbotCard from "./components/chatbot-card";
import CreateChatbotDialog from "./components/create-chatbot-dialog";

const PAGE_SIZE = 9;
const LIST_PAGE_SIZE = 100; // API maximum — search/pagination stay client-side.

const ChatbotsPage = () => {
  useTitle("Chatbots");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError } = useListChatbotsQuery({
    page: 1,
    page_size: LIST_PAGE_SIZE,
  });

  const chatbots = useMemo(() => data?.chatbots ?? [], [data]);
  const totalCount = data?.meta?.count ?? chatbots.length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return chatbots;

    return chatbots.filter(
      (chatbot) =>
        chatbot.name.toLowerCase().includes(query) ||
        (chatbot.description || "").toLowerCase().includes(query),
    );
  }, [chatbots, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <section>
      <div className="flbx flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chatbots</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount} agent{totalCount === 1 ? "" : "s"} in this workspace —
            pick one to configure and chat with.
          </p>
        </div>

        <div className="flx gap-3">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search chatbots"
              className="w-56 rounded-xl pl-10 md:w-72"
            />
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            New chatbot
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
          <p className="text-sm text-muted-foreground">Loading chatbots…</p>
        </div>
      ) : isError ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
          <span className="center size-14 rounded-2xl bg-primary/10 text-primary">
            <Bot size={26} />
          </span>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            Couldn't load chatbots
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Something went wrong while fetching your agents. Please try again.
          </p>
        </div>
      ) : visible.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((chatbot) => (
            <ChatbotCard key={chatbot.id ?? chatbot.slug} chatbot={chatbot} />
          ))}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
          <span className="center size-14 rounded-2xl bg-primary/10 text-primary">
            <Bot size={26} />
          </span>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            {search ? "No chatbots match your search" : "No chatbots yet"}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {search
              ? `Nothing found for “${search}”. Try a different name or keyword.`
              : "Create your first agent — add knowledge on the left, then test it live on the right."}
          </p>
          {!search && (
            <Button className="mt-5" onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              Create chatbot
            </Button>
          )}
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of {filtered.length}
          </p>
          <Pagination
            page={currentPage}
            setPage={setPage}
            total={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}

      <CreateChatbotDialog open={createOpen} setOpen={setCreateOpen} />
    </section>
  );
};

export default ChatbotsPage;
