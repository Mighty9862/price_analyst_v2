export const validateInn = (value: string): string | true => {
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

export const validatePhone = (value: string): string | true => {
  if (!value) return "Телефон обязателен для заполнения";
  const cleanedValue = value.replace(/\D/g, "");
  if (cleanedValue.length < 10) {
    return "Некорректный номер телефона";
  }
  return true;
};

export const validatePassword = (value: string): string | true => {
  if (!value) return "Пароль обязателен для заполнения";
  if (value.length < 6) {
    return "Пароль должен содержать минимум 6 символов";
  }
  return true;
};
