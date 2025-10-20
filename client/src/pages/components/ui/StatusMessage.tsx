import { m } from "framer-motion";
import SuccessIcon from "./icons/SuccessIcon";

interface StatusMessageProps {
  message: string;
  success: boolean | null;
}

export const StatusMessage = ({ message, success }: StatusMessageProps) => {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-6 rounded-xl p-4 mb-4 text-center ${
        success === true
          ? "border border-green-200 bg-green-50 text-green-800"
          : success === false
            ? "border border-red-200 bg-red-50 text-red-800"
            : "border border-blue-200 bg-blue-50 text-blue-800"
      }`}
    >
      {success === true ? (
        <div className="flex items-center justify-center">
          <SuccessIcon />
          <span className="ml-2 font-medium">{message}</span>
        </div>
      ) : (
        <span className="font-medium">{message}</span>
      )}
    </m.div>
  );
};
