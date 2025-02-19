import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"


const searchBarVariants = cva(
  "flex items-center border transition-colors focus-within:ring-1",
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
      width: {
        full: "w-full",
        auto: "w-auto",
        sm: "w-64",
        md: "w-96",
        lg: "w-[750px]",
        xl: "w-[900px]",
      },
      position: {
        static: "",
        fixed: "fixed z-50",
        sticky: "sticky z-50",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      radius: "md",
      width: "full",
      position: "static",
    },
  }
)

export interface SearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "width">,
    VariantProps<typeof searchBarVariants> {
  iconClassName?: string
  containerClassName?: string
  inputClassName?: string
  placeholderClassName?: string
  top?: string
  left?: string
  right?: string
  bottom?: string
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ 
    className,
    variant,
    size,
    radius,
    width,
    position,
    iconClassName,
    containerClassName,
    inputClassName,
    placeholderClassName,
    top,
    left,
    right,
    bottom,
    ...props 
  }, ref) => {
    const positionStyles = position !== 'static' ? {
      top,
      left,
      right,
      bottom,
    } : {}

    return (
      <div 
        className={cn(
          searchBarVariants({ variant, size, radius, width, position }), 
          containerClassName
        )}
        style={positionStyles}
      >
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
