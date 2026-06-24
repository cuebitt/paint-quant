import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants";

const Button = React.forwardRef<
  HTMLElement,
  ButtonPrimitive.Props & VariantProps<typeof buttonVariants>
>(function Button({ className, variant = "default", size = "default", ...props }, ref) {
  return (
    <ButtonPrimitive
      // @ts-expect-error -- preact/react type mismatch for @base-ui/react props
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
});

export { Button };
