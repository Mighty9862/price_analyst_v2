import { m } from "framer-motion";

export const HeroSection = () => {
  return (
    <div className="mb-16 text-center">
      <m.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mb-4 text-4xl font-bold text-blue-900 md:text-5xl"
      >
        Анализ цен поставщиков
      </m.h1>
      <m.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="mx-auto max-w-2xl text-lg text-blue-700 md:text-xl"
      >
        Получите лучшие цены на товары от проверенных поставщиков в несколько
        кликов
      </m.p>
    </div>
  );
};
