import type { SupplierInfo } from "@/types/analysis.type";

export const parseSupplierInfo = (
  supplierString: string | null,
): SupplierInfo | null => {
  if (!supplierString) return null;

  try {
    const parts = supplierString.split(",").map((part) => part.trim());
    if (parts.length === 0) return null;

    let name = parts[0];
    let inn = "";
    let address = "";
    let phone = "";
    let email = "";

    // Проверка ИНН (10-12 цифр)
    if (parts.length > 1 && /^\d{10,12}$/.test(parts[1])) {
      inn = parts[1];
    }

    // Поиск email
    const emailIndex = parts.findIndex((part) => part.includes("@"));
    if (emailIndex !== -1) {
      email = parts[emailIndex];
    }

    // Поиск телефонов
    const phonePattern = /^[78]\s?\(\d{3}\)\s?\d{3}[- ]?\d{2}[- ]?\d{2}$/;
    const phones = parts.filter((part) => phonePattern.test(part));

    if (phones.length > 0) {
      phone = phones.join(", ");
    }

    let addressStartIndex = inn ? 2 : 1;
    let addressEndIndex = emailIndex !== -1 ? emailIndex : parts.length;

    if (phones.length > 0) {
      const firstPhoneIndex = parts.findIndex((part) =>
        phonePattern.test(part),
      );
      // Ограничиваем адрес до первого телефона
      addressEndIndex = Math.min(addressEndIndex, firstPhoneIndex);
    }

    if (addressEndIndex > addressStartIndex) {
      address = parts.slice(addressStartIndex, addressEndIndex).join(", ");
    }

    return { name, inn, address, phone, email };
  } catch (error) {
    console.error("Ошибка парсинга информации о поставщике:", error);
    return {
      name: supplierString,
      inn: "",
      address: "",
      phone: "",
      email: "",
    };
  }
};
