import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const searchBarVariants = cva(
  "flex items-center w-full border transition-colors focus-within:ring-1",
  {
    variants: {
      variant: {
        default: "bg-white border-gray-200 focus-within:border-primary focus-within:ring-primary",
        ghost: "bg-transparent border-transparent",
        outline: "bg-transparent border-input",
        secondary: "bg-secondary border-secondary",
      },
      size: {
        default: "h-10 text-sm",
        sm: "h-8 text-xs",
        lg: "h-12 text-base",
        xl: "h-14 text-lg",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      radius: "md",
    },
  }
)

export interface SearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof searchBarVariants> {
  iconClassName?: string
  containerClassName?: string
  inputClassName?: string
  placeholderClassName?: string
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ 
    className,
    variant,
    size,
    radius,
    iconClassName,
    containerClassName,
    inputClassName,
    placeholderClassName,
    ...props 
  }, ref) => {
    return (
      <div className={cn(searchBarVariants({ variant, size, radius }), containerClassName)}>
        <Search className={cn(
          "ml-3 shrink-0",
          size === "sm" && "size-3",
          size === "default" && "size-4",
          size === "lg" && "size-5",
          size === "xl" && "size-6",
          iconClassName
        )} />
        <input
          type="search"
          className={cn(
            "flex-1 bg-transparent px-3 py-2 text-inherit",
            "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            inputClassName,
            placeholderClassName && `placeholder:${placeholderClassName}`,
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
SearchBar.displayName = "SearchBar"

export { SearchBar, searchBarVariants }
