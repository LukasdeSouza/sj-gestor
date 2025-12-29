export function emailValidate(email: string): boolean {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

export function normalizePhone(phone: string) {
  // remove tudo que não é número
  phone = phone.replace(/\D/g, "");

  // Se tiver 11 dígitos (ex: 69992661119), talvez tenha um 9 extra
  if (phone.length === 11 && phone.startsWith("9", 2)) {
    // remove o 9 depois do DDD
    phone = phone.slice(0, 2) + phone.slice(3);
  }

  // se ainda tiver mais de 10 dígitos, usa só os últimos 10
  if (phone.length > 10) {
    phone = phone.slice(-10);
  }

  return phone;
}

export function formatBRL(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}