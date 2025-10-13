import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSetAtom } from "jotai";
import { useForm } from "react-hook-form";
import axios from "axios";
import Button from "../ui/Button";
import { isAdminAtom, isAuthAtom, userAtom } from "@/store/authStore";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuthFormData {
  inn: string;
  fullName: string;
  phone: string;
  password: string;
  confirmPassword?: string;
}

interface AuthResponse {
  token: string;
  role: "USER" | "ADMIN";
}

function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setUser = useSetAtom(userAtom);
  const setIsAuth = useSetAtom(isAuthAtom);
  const setIsAdmin = useSetAtom(isAdminAtom);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    trigger,
  } = useForm<AuthFormData>({
    mode: "onChange",
    defaultValues: {
      inn: "",
      fullName: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const API_URL = import.meta.env.VITE_API_URL;

  // Для валидации подтверждения пароля
  const watchPassword = watch("password");

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { phone: data.phone, password: data.password }
        : {
            inn: data.inn,
            fullName: data.fullName,
            phone: data.phone,
            password: data.password,
          };

      const response = await axios.post<AuthResponse>(
        `${API_URL}${endpoint}`,
        payload,
      );

      const { token, role } = response.data;

      // Сохраняем данные в хранилище
      setUser({
        token,
        role,
      });
      setIsAuth(true);
      setIsAdmin(role === "ADMIN");

      onClose();
      reset();
    } catch (error: any) {
      console.error("Ошибка авторизации:", error);
      setError(
        error.response?.data?.message ||
          (isLogin ? "Ошибка входа" : "Ошибка регистрации"),
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = async () => {
    // Валидируем форму перед переключением режима
    const isValid = await trigger();
    if (!isValid) {
      // Если есть ошибки, просто переключаем режим
      setIsLogin(!isLogin);
      setError("");
      return;
    }

    setIsLogin(!isLogin);
    setError("");
  };

  // Валидация ИНН (12 цифр для ИП/ФЛ, 10 для юрлиц)
  const validateInn = (value: string) => {
    if (!value) return "ИНН обязателен для заполнения";
    const cleanedValue = value.replace(/\D/g, "");
    if (![10, 12].includes(cleanedValue.length)) {
      return "ИНН должен содержать 10 или 12 цифр";
    }
    if (!/^\d+$/.test(cleanedValue)) {
      return "ИНН должен содержать только цифры";
    }
    return true;
  };

  // Валидация телефона
  const validatePhone = (value: string) => {
    if (!isLogin && !value) return "Телефон обязателен для заполнения";
    if (value) {
      const cleanedValue = value.replace(/\D/g, "");
      if (cleanedValue.length < 10) {
        return "Некорректный номер телефона";
      }
    }
    return true;
  };

  // Валидация пароля
  const validatePassword = (value: string) => {
    if (!value) return "Пароль обязателен для заполнения";
    if (value.length < 6) {
      return "Пароль должен содержать минимум 6 символов";
    }
    return true;
  };

  // Валидация подтверждения пароля
  const validateConfirmPassword = (value: string | undefined) => {
    if (!isLogin && value !== watchPassword) {
      return "Пароли не совпадают";
    }
    return true;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Затемнение фона */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Модальное окно */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md rounded-2xl border border-blue-100 bg-white p-8 shadow-xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-blue-400 hover:text-blue-600"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-blue-900">
                {isLogin ? "Вход в систему" : "Регистрация"}
              </h2>
              <p className="mt-2 text-blue-600">
                {isLogin
                  ? "Введите данные для входа"
                  : "Заполните форму для регистрации"}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Поле телефона */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-blue-700"
                >
                  Телефон *
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register("phone", {
                    required: "Телефон обязателен для заполнения",
                    validate: validatePhone,
                  })}
                  placeholder="+7 (XXX) XXX-XX-XX"
                  className={`bg-blue-25 w-full rounded-lg border px-4 py-3 text-blue-900 placeholder-blue-400 focus:ring-2 focus:outline-none ${
                    errors.phone
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Поле пароля */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-blue-700"
                >
                  Пароль *
                </label>
                <input
                  id="password"
                  type="password"
                  {...register("password", {
                    required: "Пароль обязателен для заполнения",
                    validate: validatePassword,
                  })}
                  placeholder="Введите пароль (мин. 6 символов)"
                  className={`bg-blue-25 w-full rounded-lg border px-4 py-3 text-blue-900 placeholder-blue-400 focus:ring-2 focus:outline-none ${
                    errors.password
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Дополнительные поля для регистрации */}
              {!isLogin && (
                <>
                  {/* Поле название */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-medium text-blue-700"
                    >
                      Название организации *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      {...register("fullName", {
                        required:
                          "Название организации обязательно для заполнения",
                        minLength: {
                          value: 2,
                          message:
                            "Название организации должно содержать минимум 2 символа",
                        },
                      })}
                      placeholder="Введите название организации"
                      className={`bg-blue-25 w-full rounded-lg border px-4 py-3 text-blue-900 placeholder-blue-400 focus:ring-2 focus:outline-none ${
                        errors.fullName
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* Поле ИНН */}
                  <div>
                    <label
                      htmlFor="inn"
                      className="mb-2 block text-sm font-medium text-blue-700"
                    >
                      ИНН *
                    </label>
                    <input
                      id="inn"
                      type="text"
                      {...register("inn", {
                        required: "ИНН обязателен для заполнения",
                        validate: validateInn,
                      })}
                      placeholder="Введите ИНН (10 или 12 цифр)"
                      className={`bg-blue-25 w-full rounded-lg border px-4 py-3 text-blue-900 placeholder-blue-400 focus:ring-2 focus:outline-none ${
                        errors.inn
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                    />
                    {errors.inn && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.inn.message}
                      </p>
                    )}
                  </div>

                  {/* Подтверждение пароля */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-medium text-blue-700"
                    >
                      Подтверждение пароля *
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      {...register("confirmPassword", {
                        required: "Подтверждение пароля обязательно",
                        validate: validateConfirmPassword,
                      })}
                      placeholder="Повторите пароль"
                      className={`bg-blue-25 w-full rounded-lg border px-4 py-3 text-blue-900 placeholder-blue-400 focus:ring-2 focus:outline-none ${
                        errors.confirmPassword
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Сообщение об ошибке */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-red-200 bg-red-50 p-3"
                >
                  <p className="text-sm text-red-800">{error}</p>
                </motion.div>
              )}

              {/* Кнопка отправки */}
              <Button disabled={loading} className="w-full">
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
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
                    {isLogin ? "Вход..." : "Регистрация..."}
                  </span>
                ) : isLogin ? (
                  "Войти"
                ) : (
                  "Зарегистрироваться"
                )}
              </Button>
            </form>

            {/* Переключение между входом и регистрацией */}
            <div className="mt-6 text-center">
              <button
                onClick={switchMode}
                className="text-blue-600 hover:text-blue-800 hover:underline"
                type="button"
              >
                {isLogin
                  ? "Нет аккаунта? Зарегистрироваться"
                  : "Уже есть аккаунт? Войти"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default AuthModal;
