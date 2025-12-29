import { cn } from "@/lib/utils";

interface SpinnerLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  color?: string;
}

export default function SpinnerLoading({ className, color, ...props }: SpinnerLoadingProps) {

  const spinnerColor = color ?? "text-secondary";

  return (
    <div className={cn("w-full flex justify-center items-center", className)} {...props}>
      <div className="w-full flex justify-center my-2">
        <svg
          className={cn(`animate-spin -ml-1 mr-3 h-10 w-10 ${spinnerColor}`)}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    </div>
  );
}