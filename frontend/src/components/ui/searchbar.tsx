import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const searchBarVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-10",
        sm: "h-9 px-2 rounded-sm",
        lg: "h-11 px-8 rounded-lg",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface SearchBarProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof searchBarVariants> {}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          type="search"
          className={cn(searchBarVariants({ size, className }), "w-full")}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
SearchBar.displayName = "SearchBar"

export { SearchBar, searchBarVariants }
