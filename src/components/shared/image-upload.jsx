import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useWatch } from "react-hook-form";

import { ImagePlus, Trash2 } from "lucide-react";
import { useFilePreviews } from "@/lib/file-handle";

const SingleImageUploadTile = ({
  control,
  setValue,
  name,
  urlName,
  title,
  className = "",
}) => {
  const inputRef = useRef(null);
  const imageUrl = useWatch({ control, name: urlName });
  const imageFiles = useWatch({ control, name });
  const previews = useFilePreviews(imageFiles);
  const activeImage = previews[0]?.url || imageUrl;

  const openPicker = () => inputRef.current?.click();

  const updateImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setValue(name, [file], { shouldDirty: true });
    setValue(urlName, "", { shouldDirty: true });
  };

  const removeImage = () => {
    setValue(name, null, { shouldDirty: true });
    setValue(urlName, "", { shouldDirty: true });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={className}>
      <div
        className={`relative aspect-[16/9] overflow-hidden rounded-xl border ${
          activeImage
            ? "border-slate-200 bg-white"
            : "border-dashed border-slate-300 bg-white"
        }`}
      >
        {activeImage ? (
          <>
            <img
              src={activeImage}
              alt={`${title} preview`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-3 bottom-3 flex justify-end flex gap-2">
              <Button
                type="button"
                size="sm"
                className="bg-white text-slate-800 shadow-sm hover:bg-slate-100"
                onClick={openPicker}
              >
                <ImagePlus size={15} />
                Change
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeImage}
              >
                <Trash2 size={15} />
                Remove
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            className="flex h-full w-full flex-col items-center justify-center px-4 text-center text-slate-500 transition hover:bg-primary/5 hover:text-primary"
          >
            <ImagePlus size={26} />
            <span className="mt-2 text-sm font-semibold text-slate-800">
              Upload Cover
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={updateImage}
      />
    </div>
  );
};

export default SingleImageUploadTile;
