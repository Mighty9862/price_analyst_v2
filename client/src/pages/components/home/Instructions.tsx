import { m } from "framer-motion";

export const Instructions = () => {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="from-blue-25 mt-12 rounded-2xl border border-blue-100 bg-gradient-to-r to-blue-50 p-8"
    >
      <h3 className="mb-6 text-center text-2xl font-semibold text-blue-900">
        Как работает анализ цен?
      </h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="p-4 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <span className="font-bold">1</span>
          </div>
          <h4 className="mb-2 font-semibold text-blue-900">Скачайте шаблон</h4>
          <p className="text-md text-blue-700">
            Получите готовый файл Excel с правильной структурой для заполнения
          </p>
        </div>
        <div className="p-4 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <span className="font-bold">2</span>
          </div>
          <h4 className="mb-2 font-semibold text-blue-900">Заполните данные</h4>
          <p className="text-md text-blue-700">
            Внесите информацию о товарах: штрих-коды и количество
          </p>
        </div>
        <div className="p-4 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <span className="font-bold">3</span>
          </div>
          <h4 className="mb-2 font-semibold text-blue-900">Получите анализ</h4>
          <p className="text-md text-blue-700">
            Система автоматически подберет поставщиков с лучшими ценами
          </p>
        </div>
      </div>
    </m.div>
  );
};
