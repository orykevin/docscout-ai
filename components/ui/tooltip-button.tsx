import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { Button, buttonVariants } from "./button";
import { VariantProps } from "class-variance-authority";

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const ToolTipButton = ({
  tooltip,
  children,
  tooltipProps,
  ...props
}: {
  tooltip: React.ReactNode;
  children: React.ReactNode;
  tooltipProps?: React.ComponentProps<typeof TooltipContent>;
} & ButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" {...tooltipProps}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

export default ToolTipButton;
