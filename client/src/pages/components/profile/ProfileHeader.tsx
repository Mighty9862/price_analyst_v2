import { m } from "framer-motion";
import Button from "../ui/Button";

interface ProfileHeaderProps {
  onNavigateHome: () => void;
}

export const ProfileHeader = ({ onNavigateHome }: ProfileHeaderProps) => {
  return (
    <div className="mb-8 text-center">
      <m.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mb-4 text-4xl font-bold text-blue-900 md:text-5xl"
      >
        Личный кабинет
      </m.h1>
      <m.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="mb-6 text-lg text-blue-700 md:text-xl"
      >
        История ваших запросов на анализ цен
      </m.p>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Button onClick={onNavigateHome}>Перейти на главную страницу</Button>
      </div>
    </div>
  );
};
