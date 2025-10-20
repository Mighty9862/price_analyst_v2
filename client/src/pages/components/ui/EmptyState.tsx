import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  variant?: "default" | "info" | "warning" | "success";
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  icon,
  action,
  variant = "default",
  className = "",
}: EmptyStateProps) => {
  const variantStyles = {
    default: {
      container: "border-blue-200 bg-blue-50",
      title: "text-blue-900",
      description: "text-blue-700",
    },
    info: {
      container: "border-blue-200 bg-blue-50",
      title: "text-blue-900",
      description: "text-blue-700",
    },
    warning: {
      container: "border-amber-200 bg-amber-50",
      title: "text-amber-900",
      description: "text-amber-700",
    },
    success: {
      container: "border-green-200 bg-green-50",
      title: "text-green-900",
      description: "text-green-700",
    },
  };

  const styles = variantStyles[variant];

  // Дефолтная иконка в зависимости от варианта
  const defaultIcon = {
    default: (
      <svg
        className="h-12 w-12 text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    info: (
      <svg
        className="h-12 w-12 text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
    ),
    warning: (
      <svg
        className="h-12 w-12 text-amber-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    ),
    success: (
      <svg
        className="h-12 w-12 text-green-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  const displayIcon = icon || defaultIcon[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-8 text-center ${styles.container} ${className}`}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-4 flex justify-center"
      >
        {displayIcon}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`mb-2 text-lg font-semibold ${styles.title}`}
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`mb-4 ${styles.description}`}
      >
        {description}
      </motion.p>

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
};
