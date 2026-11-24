"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

const TRIGGER_CLASS =
  "group/select border-input bg-white text-foreground data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground hover:border-ring/50 focus-visible:border-ring focus-visible:ring-ring/15 data-[state=open]:border-ring aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex w-fit min-w-0 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm whitespace-nowrap shadow-[0_1px_2px_rgba(26,21,16,.04)] transition-[color,box-shadow,border-color] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-10 data-[size=sm]:h-8 data-[size=sm]:rounded-lg data-[size=sm]:px-2.5 data-[size=sm]:text-xs *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        TRIGGER_CLASS,
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="text-ring size-4 transition-transform duration-200 group-data-[state=open]/select:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "start",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-white text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-xl border border-input shadow-[0_18px_40px_-16px_rgba(26,21,16,.3)]",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        sideOffset={sideOffset}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1.5",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide uppercase", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-secondary focus:text-foreground data-[state=checked]:text-ring data-[state=checked]:font-semibold [&_svg:not([class*='text-'])]:text-ring relative flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-lg py-2 pr-8 pl-3 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className="absolute right-2 flex size-3.5 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

const EMPTY = "__empty__"

const noopSubscribe = () => () => {}

/** Text of the option whose value matches, for the static pre-hydration trigger. */
function findOptionLabel(children: React.ReactNode, current: string): React.ReactNode | undefined {
  let found: React.ReactNode | undefined
  React.Children.forEach(children, (child) => {
    if (found !== undefined || !React.isValidElement(child)) return
    const props = child.props as OptionProps & { children?: React.ReactNode }
    if (child.type === "option" && optionValue(props) === current) found = props.children
    else if (child.type === "optgroup" || child.type === React.Fragment) found = findOptionLabel(props.children, current)
  })
  return found
}

type OptionProps = { value?: string | number; disabled?: boolean; children?: React.ReactNode }

function optionValue(props: OptionProps) {
  const v = props.value ?? (typeof props.children === "string" ? props.children : "")
  return String(v) === "" ? EMPTY : String(v)
}

function renderOptions(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return null
    if (child.type === "optgroup") {
      const { label, children: groupChildren } = child.props as { label?: string; children?: React.ReactNode }
      return (
        <SelectGroup>
          {label && <SelectLabel>{label}</SelectLabel>}
          {renderOptions(groupChildren)}
        </SelectGroup>
      )
    }
    if (child.type === "option") {
      const props = child.props as OptionProps
      return (
        <SelectItem value={optionValue(props)} disabled={props.disabled}>
          {props.children}
        </SelectItem>
      )
    }
    if (child.type === React.Fragment) return renderOptions((child.props as { children?: React.ReactNode }).children)
    return null
  })
}

/**
 * Drop-in replacement for a native <select>: same <option>/<optgroup> children and an
 * onChange that receives `{ target: { value } }`, rendered with the styled Select above.
 * Use this instead of a raw <select> anywhere in the app.
 */
function SelectField({
  value,
  onChange,
  children,
  className,
  size = "default",
  disabled,
  id,
  placeholder,
  "aria-label": ariaLabel,
}: {
  value: string | number | undefined
  onChange: (e: { target: { value: string } }) => void
  children: React.ReactNode
  className?: string
  size?: "sm" | "default"
  disabled?: boolean
  id?: string
  placeholder?: string
  "aria-label"?: string
}) {
  const current = value === undefined || String(value) === "" ? EMPTY : String(value)
  const hydrated = React.useSyncExternalStore(noopSubscribe, () => true, () => false)
  // Radix ids come from React's tree position; rendering the interactive select only after hydration
  // keeps server and client markup identical even when an ancestor renders differently on the server.
  if (!hydrated) {
    return (
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        data-slot="select-trigger"
        data-size={size}
        className={cn(TRIGGER_CLASS, "w-full", className)}
      >
        <span className="line-clamp-1">{findOptionLabel(children, current) ?? placeholder}</span>
        <ChevronDownIcon className="text-ring size-4" />
      </button>
    )
  }
  return (
    <Select value={current} onValueChange={(v) => onChange({ target: { value: v === EMPTY ? "" : v } })} disabled={disabled}>
      <SelectTrigger id={id} size={size} aria-label={ariaLabel} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{renderOptions(children)}</SelectContent>
    </Select>
  )
}

export {
  Select,
  SelectField,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
