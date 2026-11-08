import { useState } from "react";
import { CalendarClock, Trash2, Upload, Wrench } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmBadge } from "@/components/ui/badge";
import { removeService } from "@/mocks/chatbots";
import UploadServicesDialog from "./upload-services-dialog";

const ServicesKnowledge = ({ chatbot, onChange }) => {
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleRemove = (service) => {
    removeService(chatbot.slug, service.id);
    onChange();
    toast.success(`Removed “${service.name}”`);
  };

  const services = chatbot.knowledge.services;

  return (
    <div className="space-y-5">
      <Button className="w-full rounded-xl" onClick={() => setUploadOpen(true)}>
        <Upload size={16} />
        Add Services
      </Button>

      {services.length > 0 ? (
        <div className="space-y-2">
          {services.map((service) => (
            <div
              key={service.id}
              className="flx group rounded-2xl border border-border bg-background px-3.5 py-3 transition hover:border-primary/40"
            >
              <span className="center size-9 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-600">
                <Wrench size={15} />
              </span>

              <div className="min-w-0 flex-1 px-3">
                <p className="truncate text-sm font-semibold text-foreground">
                  {service.name}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {service.description || "No description"}
                </p>
              </div>

              <div className="flx shrink-0 gap-2">
                <span className="text-sm font-bold text-foreground">
                  {service.price === 0 ? "Free" : `$${service.price}`}
                </span>
                <EmBadge variant="primary-accent" size="xs">
                  <CalendarClock size={11} />
                  {service.durationMinutes}m
                </EmBadge>
                <button
                  type="button"
                  aria-label={`Remove ${service.name}`}
                  onClick={() => handleRemove(service)}
                  className="center size-8 rounded-full text-muted-foreground opacity-0 transition hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
          <span className="center mx-auto size-11 rounded-2xl bg-primary/10 text-primary">
            <Wrench size={20} />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">
            No services yet
          </p>
          <p className="mx-auto mt-1 max-w-64 text-xs text-muted-foreground">
            Import from the template or add services manually.
          </p>
        </div>
      )}

      <UploadServicesDialog
        open={uploadOpen}
        setOpen={setUploadOpen}
        chatbot={chatbot}
        onChange={onChange}
      />
    </div>
  );
};

export default ServicesKnowledge;
