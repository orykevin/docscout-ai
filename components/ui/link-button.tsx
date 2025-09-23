import React from "react";
import { ButtonProps } from "./tooltip-button";
import { Button } from "./button";
import Link from "next/link";

const LinkButton = ({
  buttonProps,
  children,
  ...props
}: {
  buttonProps?: ButtonProps;
  children: React.ReactNode;
} & React.ComponentProps<typeof Link>) => {
  return (
    <Button asChild {...buttonProps}>
      <Link {...props}>{children}</Link>
    </Button>
  );
};

export default LinkButton;
