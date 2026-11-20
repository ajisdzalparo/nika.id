"use client"

import {
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
  IconLoader2,
  IconX,
} from "@tabler/icons-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A45C]/20 text-[#C9A45C]">
            <IconCheck className="size-3.5" stroke={2.4} />
          </span>
        ),
        info: (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[#F3EBDD]">
            <IconInfoCircle className="size-3.5" stroke={2} />
          </span>
        ),
        warning: (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
            <IconAlertTriangle className="size-3.5" stroke={2} />
          </span>
        ),
        error: (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-400/20 text-rose-300">
            <IconX className="size-3.5" stroke={2.2} />
          </span>
        ),
        loading: <IconLoader2 className="size-4 animate-spin text-[#C9A45C]" stroke={2} />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-full !border !border-[#2E2A23] !bg-[#15130F] !px-4 !py-3 !text-[#F3EBDD] !shadow-[0_18px_40px_-14px_rgba(21,19,15,0.45)] !gap-2.5",
          title: "!text-[13px] !font-medium !tracking-wide !text-[#F3EBDD]",
          description: "!text-xs !text-[#B8AD9A]",
          actionButton: "!rounded-full !bg-[#C9A45C] !text-[#15130F] !text-xs !font-medium",
          cancelButton: "!rounded-full !bg-[#2E2A23] !text-[#F3EBDD] !text-xs",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
