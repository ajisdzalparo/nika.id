/**
 * Menu item look shared by the user and admin sidebars (pass to SidebarMenuButton's className).
 * Active item: espresso pill, gold icon, light text. Change it here so both sidebars stay identical.
 */
export const SIDEBAR_NAV_ITEM_CLASS = [
  "h-10 rounded-xl px-3 text-[#3D342A] transition-colors hover:bg-[#EEE2C9]/70 hover:text-[#1F1A14]",
  "[&>svg]:text-[#8E8268] hover:[&>svg]:text-[#1F1A14]",
  "data-[active=true]:bg-[#1F1A14] data-[active=true]:font-medium data-[active=true]:text-[#F6EEDD]",
  "data-[active=true]:shadow-[0_10px_20px_-14px_rgba(26,21,16,.75)] data-[active=true]:hover:bg-[#2B241B]",
  "data-[active=true]:hover:text-[#F6EEDD] [&[data-active=true]>svg]:text-[#D9B56A]",
].join(" ");
