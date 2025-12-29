import Cookies from "js-cookie";

// Pega o valor de um cookie
export function getCookie(name: string): string | undefined {
  return Cookies.get(name);
}

// Define um cookie
export function setCookie(name: string, value: string, options?: Cookies.CookieAttributes) {
  Cookies.set(name, value, options);
}

// Deleta um cookie
export function deleteCookie(name: string) {
  Cookies.remove(name);
}
