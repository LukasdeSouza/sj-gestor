import { MercadoPagoConfig } from 'mercadopago';

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
if (!accessToken) {
  console.warn('[MercadoPago] MERCADO_PAGO_ACCESS_TOKEN não definido.');
}

// Cliente singleton do SDK v2
export const mpClient = new MercadoPagoConfig({ accessToken });

// Reexporta classes úteis do SDK v2 para uso nos controllers
export { Preference, Payment } from 'mercadopago';
