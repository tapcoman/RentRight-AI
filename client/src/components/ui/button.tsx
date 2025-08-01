import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#EC7134] to-[#E35F1E] text-white font-medium shadow-md hover:shadow-lg hover:from-[#E35F1E] hover:to-[#D55D20] focus:ring-[#EC7134]/20 disabled:opacity-50 disabled:shadow-none",
        destructive:
          "bg-gradient-to-r from-red-500 to-red-600 text-white font-medium shadow-md hover:shadow-lg hover:from-red-600 hover:to-red-700 focus:ring-red-500/20 disabled:opacity-50 disabled:shadow-none",
        outline:
          "border-2 border-[#EC7134]/20 bg-white text-[#EC7134] font-medium hover:bg-[#EC7134]/5 hover:border-[#EC7134]/40 focus:ring-[#EC7134]/20 shadow-sm hover:shadow-md disabled:opacity-50 disabled:hover:bg-white",
        secondary:
          "bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 focus:ring-gray-200/40 shadow-sm hover:shadow-md disabled:opacity-50",
        ghost: "text-gray-700 font-medium hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-200/40 disabled:opacity-50",
        link: "text-[#EC7134] font-medium underline-offset-4 hover:underline focus:ring-[#EC7134]/20 disabled:opacity-50",
        success: "bg-gradient-to-r from-green-500 to-green-600 text-white font-medium shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 focus:ring-green-500/20 disabled:opacity-50 disabled:shadow-none",
        premium: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-md hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:ring-purple-500/20 disabled:opacity-50 disabled:shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-8 px-3 py-1.5 text-xs",
        lg: "h-12 px-8 py-3 text-base",
        xl: "h-14 px-10 py-4 text-lg",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-12 w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText = "Loading...", children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            {loadingText}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
