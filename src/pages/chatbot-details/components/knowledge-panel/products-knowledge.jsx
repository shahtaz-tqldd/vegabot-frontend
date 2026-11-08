import { useState } from "react";
import { Package, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { removeProduct } from "@/mocks/chatbots";
import UploadProductsDialog from "./upload-products-dialog";

const ProductsKnowledge = ({ chatbot, onChange }) => {
  const [uploadOpen, setUploadOpen] = useState(false);

  const handleRemove = (product) => {
    removeProduct(chatbot.slug, product.id);
    onChange();
    toast.success(`Removed “${product.name}”`);
  };

  const products = chatbot.knowledge.products;

  return (
    <div className="space-y-5">
      <Button className="w-full rounded-xl" onClick={() => setUploadOpen(true)}>
        <Upload size={16} />
        Upload Products
      </Button>

      {products.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-11 pl-4 text-[11px] font-bold uppercase tracking-wide">
                  Product
                </TableHead>
                <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wide">
                  Price
                </TableHead>
                <TableHead className="h-11 text-[11px] font-bold uppercase tracking-wide">
                  Stock
                </TableHead>
                <TableHead className="h-11 pr-3 text-right text-[11px] font-bold uppercase tracking-wide">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="border-border/70">
                  <TableCell className="py-3 pl-4 pr-2">
                    <div className="flx gap-2.5">
                      <span className="center size-8 shrink-0 rounded-lg bg-primary/10 text-primary">
                        <Package size={14} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-foreground">
                          {product.name}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {product.sku || "No SKU"} · {product.category}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 text-[13px] font-semibold">
                    ${product.price}
                  </TableCell>
                  <TableCell className="px-2">
                    {product.stock > 0 ? (
                      <span className="text-[13px] text-muted-foreground">
                        {product.stock}
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-500">
                        Out of stock
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 pl-2 pr-3 text-right">
                    <button
                      type="button"
                      aria-label={`Remove ${product.name}`}
                      onClick={() => handleRemove(product)}
                      className="center size-8 rounded-full text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
          <span className="center mx-auto size-11 rounded-2xl bg-primary/10 text-primary">
            <Package size={20} />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">
            No products yet
          </p>
          <p className="mx-auto mt-1 max-w-64 text-xs text-muted-foreground">
            Upload the spreadsheet template — one row per product is all it
            takes.
          </p>
        </div>
      )}

      <UploadProductsDialog
        open={uploadOpen}
        setOpen={setUploadOpen}
        chatbot={chatbot}
        onChange={onChange}
      />
    </div>
  );
};

export default ProductsKnowledge;
