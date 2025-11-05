import { z } from 'zod';

// Regex para validar número de telefone brasileiro
// Aceita: +5511999998888, 5511999998888, 11999998888, 1199998888
const brazilianPhoneRegex = /^(\+?55)?(\d{2})(\d{4,5})(\d{4})$/;

export const phoneSchema = z.string()
  .min(1, { message: "Telefone é obrigatório" })
  .refine((val) => {
    // Remove espaços, parênteses, traços
    const cleaned = val.replace(/[\s()-]/g, '');
    return brazilianPhoneRegex.test(cleaned);
  }, {
    message: "Telefone inválido. Use o formato: (11) 99999-9999 ou 11999999999"
  });

export const validateBrazilianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s()-]/g, '');
  return brazilianPhoneRegex.test(cleaned);
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove tudo que não é número
  const cleaned = phone.replace(/\D/g, '');
  
  // Formata conforme o tamanho
  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  } else if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } else {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  }
};

export const normalizePhoneToE164 = (phone: string): string => {
  // Remove tudo que não é número
  const cleaned = phone.replace(/\D/g, '');
  
  // Adiciona +55 se não tiver código de país
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `+55${cleaned}`;
  } else if (cleaned.length === 12 || cleaned.length === 13) {
    return `+${cleaned}`;
  }
  
  return phone;
};
