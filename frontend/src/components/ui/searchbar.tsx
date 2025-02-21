import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./command"
import { Button } from "./button"

export interface Suggestion {
  id: string
  text: string
  url?: string
}

interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  suggestions?: Suggestion[]
  onSuggestionClick?: (suggestion: Suggestion) => void
  onSearch?: (value: string) => void
  className?: string
  inputClassName?: string
  suggestionsClassName?: string
  size?: "default" | "sm" | "lg"
  variant?: "default" | "ghost" | "outline"
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({
    suggestions = [],
    onSuggestionClick,
    onSearch,
    className,
    inputClassName,
    suggestionsClassName,
    size = "default",
    variant = "default",
    placeholder,
    value,
    onChange,
    ...props
  }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [selected, setSelected] = React.useState(-1)
    const [inputValue, setInputValue] = React.useState(value?.toString() || "")
    const commandRef = React.useRef<HTMLDivElement>(null)

    // Update input value when value prop changes
    React.useEffect(() => {
      setInputValue(value?.toString() || "")
    }, [value])

    // Close suggestions when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (commandRef.current && !commandRef.current.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setOpen(false)
        return
      }

      if (!open || suggestions.length === 0) {
        if (e.key === "Enter") {
          e.preventDefault()
          onSearch?.(inputValue.trim())
          setOpen(false)
        }
        return
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault() // Prevent cursor movement
          setSelected((prev) => (prev >= suggestions.length - 1 ? 0 : prev + 1))
          break

        case "ArrowUp":
          e.preventDefault() // Prevent cursor movement
          setSelected((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
          break

        case "Enter":
          e.preventDefault()
          if (selected >= 0) {
            onSuggestionClick?.(suggestions[selected])
            setOpen(false)
            setSelected(-1)
          } else {
            onSearch?.(inputValue.trim())
            setOpen(false)
          }
          break
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInputValue(value)
      setOpen(value.length >= 2)
      onChange?.(e)
    }

    const containerClasses = cn(
      "relative w-full group",
      size === "sm" && "max-w-sm",
      size === "default" && "max-w-md",
      size === "lg" && "max-w-lg",
      className
    )

    const inputClasses = cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
      "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
      "placeholder:text-muted-foreground focus-visible:outline-none",
      "transition-all duration-300 ease-in-out",
      "pl-10",
      "focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-ring",
      "group-hover:border-ring/50",
      variant === "ghost" && "border-none shadow-none hover:bg-accent/50",
      variant === "outline" && [
        "border-2",
        "shadow-sm",
        "hover:shadow-md",
        "transition-shadow"
      ],
      size === "sm" && "h-8 text-xs rounded-md",
      size === "lg" && "h-12 text-base px-4 rounded-lg",
      size === "default" && "rounded-md",
      inputClassName
    )

    return (
      <div className={containerClasses} ref={commandRef}>
        <div className="relative">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
            "transition-transform duration-200",
            "group-focus-within:scale-110 group-hover:scale-105",
            size === "sm" && "h-3 w-3",
            size === "default" && "h-4 w-4",
            size === "lg" && "h-5 w-5"
          )} />
          <input
            {...props}
            ref={ref}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={inputClasses}
          />
        </div>

        {open && suggestions.length > 0 && (
          <div className={cn(
            "absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden",
            "rounded-lg border bg-popover shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
            "transition-all duration-200",
            suggestionsClassName
          )}>
            <div className="p-1">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  onClick={() => {
                    onSuggestionClick?.(suggestion)
                    setOpen(false)
                  }}
                  onMouseEnter={() => setSelected(index)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm",
                    "transition-all duration-200 ease-in-out",
                    "hover:bg-accent/50 hover:text-accent-foreground",
                    selected === index && [
                      "bg-accent text-accent-foreground",
                      "shadow-sm",
                      "scale-[0.98]"
                    ]
                  )}
                >
                  {suggestion.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)

SearchBar.displayName = "SearchBar"

export { SearchBar }
