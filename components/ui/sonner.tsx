"use client"

import {
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconLoader2,
  IconX,
} from "@tabler/icons-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/** Small round icon badge shown at the start of every toast. */
const badge = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: (
          <span className={`${badge} bg-[#F4EAD3] text-[#8A6424]`}>
            <IconCheck className="size-4" stroke={2.4} />
          </span>
        ),
        info: (
          <span className={`${badge} bg-[#EFE9DE] text-[#5E5446]`}>
            <IconInfoCircle className="size-4" stroke={2} />
          </span>
        ),
        warning: (
          <span className={`${badge} bg-[#FBEFD9] text-[#B4741A]`}>
            <IconAlertTriangle className="size-4" stroke={2} />
          </span>
        ),
        error: (
          <span className={`${badge} bg-[#FBE7E2] text-[#B3412E]`}>
            <IconX className="size-4" stroke={2.2} />
          </span>
        ),
        loading: (
          <span className={`${badge} bg-[#F4EAD3] text-[#8A6424]`}>
            <IconLoader2 className="size-4 animate-spin" stroke={2} />
          </span>
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "!w-full !max-w-[380px] !items-center !gap-3 !rounded-2xl !border !border-[#E9DDC6] !bg-[#FFFDF9] !px-4 !py-3.5 !text-[#1F1A14] !shadow-[0_18px_40px_-18px_rgba(90,64,24,0.35)]",
          icon: "!m-0 !h-7 !w-7",
          title: "!text-[13.5px] !font-medium !leading-snug !text-[#1F1A14]",
          description: "!mt-0.5 !text-xs !leading-relaxed !text-[#6B5F50]",
          actionButton: "!rounded-full !bg-[#1F1A14] !px-3 !text-xs !font-medium !text-[#F6EEDD]",
          cancelButton: "!rounded-full !bg-[#F4EDDF] !px-3 !text-xs !text-[#40372B]",
          closeButton: "!border-[#E9DDC6] !bg-[#FFFDF9] !text-[#6B5F50]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
