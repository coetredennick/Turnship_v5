import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-purple-600 text-white shadow-soft-md hover:bg-purple-700 hover:shadow-soft-lg hover:-translate-y-0.5",
        destructive:
          "bg-red-600 text-white shadow-soft-md hover:bg-red-700 hover:shadow-soft-lg hover:-translate-y-0.5",
        outline:
          "border border-gray-200 bg-white text-gray-700 shadow-soft-sm hover:bg-gray-50 hover:shadow-soft-md hover:-translate-y-0.5",
        secondary:
          "bg-orange-500 text-white shadow-soft-md hover:bg-orange-600 hover:shadow-soft-lg hover:-translate-y-0.5",
        ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        link: "text-purple-600 underline-offset-4 hover:underline",
        pill: "bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full shadow-soft-md hover:shadow-soft-lg hover:-translate-y-0.5 px-6",
        success: "bg-green-600 text-white shadow-soft-md hover:bg-green-700 hover:shadow-soft-lg hover:-translate-y-0.5",
        warning: "bg-orange-500 text-white shadow-soft-md hover:bg-orange-600 hover:shadow-soft-lg hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }