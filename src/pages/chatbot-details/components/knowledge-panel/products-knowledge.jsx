import { toast } from "sonner";
import { useState } from "react";
import { Package, Store, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmBadge } from "@/components/ui/badge";
import {
  useDisableProductsMutation,
  useListProductsQuery,
} from "@/features/knowledge/knowledgeApiSlice";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import UploadProductsDialog from "./upload-products-dialog";

const ProductsKnowledge = ({ chatbot }) => {
  const [uploadOpen, setUploadOpen] = useState(false);

  const {
    data: productsData,
    isLoading,
    isError,
    refetch,
  } = useListProductsQuery({ chatbot: chatbot.slug });

  const [disableProducts, { isLoading: isDisabling }] =
    useDisableProductsMutation();

  const products = productsData?.products ?? [];

  // Disabling removes the product (and its vectors) from search.
  const handleDisable = async (product) => {
    try {
      await disableProducts({
        chatbot: chatbot.slug,
        products: [product.id],
      }).unwrap();
      toast.success(`Disabled “${product.name}”`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Failed to disable “${product.name}”`));
    }
  };

  return (
    <div className="space-y-5">
      <Button className="w-full rounded-xl" onClick={() => setUploadOpen(true)}>
        <Upload size={16} />
        Upload Products
      </Button>

      {isLoading ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">Loading products…</p>
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-foreground">
            Couldn't load products
          </p>
          <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={refetch}>
            Try again
          </Button>
        </div>
      ) : products.length > 0 ? (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="flx group rounded-2xl border border-border bg-background px-3.5 py-3 transition hover:border-primary/40"
            >
              <span className="center size-9 shrink-0 rounded-xl bg-primary/10 text-primary">
                <Package size={15} />
              </span>

              <div className="min-w-0 flex-1 px-3">
                <p className="truncate text-sm font-semibold text-foreground">
                  {product.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {product.sku || "No SKU"} · {product.category || "General"}
                </p>
              </div>

              <div className="flx shrink-0 gap-2">
                {product.status === "processing" && (
                  <EmBadge variant="primary-accent" size="xs">
                    <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                    Training
                  </EmBadge>
                )}
                {product.status === "failed" && (
                  <EmBadge
                    variant="transparent"
                    size="xs"
                    className="bg-red-500/10 text-red-500"
                  >
                    Failed
                  </EmBadge>
                )}
                <span className="text-sm font-bold text-foreground">
                  {product.price === 0
                    ? "Free"
                    : `${product.currency} ${product.price}`}
                </span>
                <button
                  type="button"
                  aria-label={`Disable ${product.name}`}
                  disabled={isDisabling}
                  onClick={() => handleDisable(product)}
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
            <Store size={20} />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">
            No products yet
          </p>
          <p className="mx-auto mt-1 max-w-64 text-xs text-muted-foreground">
            Import the spreadsheet template — one row per product is all it
            takes.
          </p>
        </div>
      )}

      <UploadProductsDialog
        open={uploadOpen}
        setOpen={setUploadOpen}
        chatbotSlug={chatbot.slug}
      />
    </div>
  );
};

export default ProductsKnowledge;
