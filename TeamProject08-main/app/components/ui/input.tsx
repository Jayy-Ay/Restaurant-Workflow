import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";
import multiIcon from "~/assets/icons/select.svg";
import { UserIcon } from "~/assets/icons/user-icon";

const inputVariants = cva(
  "flex relative items-center pr-1 justify-center shadow-sa shadowHover w-full rounded-lg border border-black/5 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none rtl:pl-1 rtl:pr-0",
  {
    variants: {
      variant: {
        default: "",
        money: "pl-3",
      },
      btnSize: {
        default: "h-8 w-64",
        sm: "",
        lg: "h-10 w-64",
      },
    },
    defaultVariants: {
      variant: "default",
      btnSize: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  icon?: keyof typeof icons;
}

const icons = {
  multi: <img src={multiIcon} />,
  user: <UserIcon />,
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, btnSize, icon, type, ...props }, ref) => {
    const IconComponent = icon ? icons[icon] : null;
    return (
      <div className={cn(inputVariants({ variant, btnSize, className }))}>
        {variant === "money" && <span>£</span>}
        <input
          type={type}
          className="h-full w-full rounded-lg bg-transparent py-1 pl-3 pr-2 outline-none placeholder:text-black/40 disabled:cursor-auto disabled:opacity-70 rtl:pl-2 rtl:pr-3"
          ref={ref}
          {...props}
        />
        <div className="flex h-6 w-6 items-center justify-center">
          {IconComponent}
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
