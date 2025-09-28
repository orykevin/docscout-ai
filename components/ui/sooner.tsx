"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        unstyled: true,
        classNames: {
          default:
            "bg-zinc-50 text-zinc-900 p-3 rounded-md flex items-center gap-3",
          error: "!bg-red-100 !text-red-800",
          success: "!bg-green-100 !text-green-800",
          warning: "!bg-yellow-100 !text-orange-600",
          info: "bg-blue-400",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
