import { X } from "lucide-react"
import type { ImageAttachment } from "../types"
import { Button } from "./Button"

interface Props {
  images: ImageAttachment[]
  onRemove: (id: string) => void
}

export function ImagePreview({ images, onRemove }: Props) {
  if (images.length === 0) return null

  return (
    <div className="mb-2 flex gap-2 overflow-x-auto px-1">
      {images.map((image) => (
        <div
          key={image.id}
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]"
        >
          <img
            src={image.dataUrl}
            alt={image.name}
            className="h-full w-full object-cover"
          />

          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => onRemove(image.id)}
            className="absolute right-1 top-1 size-5 rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="删除图片"
          >
            <X size={12} />
          </Button>
        </div>
      ))}
    </div>
  )
}