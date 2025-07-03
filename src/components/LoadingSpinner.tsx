
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LoadingSpinner = ({ size = "md", className = "" }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-16 h-16"
  };

  const spinnerClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-4", 
    lg: "w-16 h-16 border-4"
  };

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center`}>
      <div 
        className={`${spinnerClasses[size]} border-purple-300 border-t-purple-600 rounded-full animate-spin`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;
