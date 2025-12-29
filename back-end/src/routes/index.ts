import logRoutes from "../middlewares/logRoutesMiddleware";
import subscriptionAdmin from "./SubscriptionAdminRouter";
import { Application, Request, Response } from "express";
import messageTemplates from "./MessageTemplateRouter";
import clientPayments from "./ClientPaymentsRouter";
import stripeWebhook from "./StripeWebhookRouter";
import stripePortal from "./StripePortalRouter";
import subscription from "./SubscriptionRouter";
import pixSubscription from "./PixSubscriptionRouter";
import dashboard from "./DashboardRouter";
import whatsApp from "./whatsappRouter";
import checkout from "./CheckoutRouter";
import products from "./ProductRouter";
import webhooks from "./WebhookRouter";
import pixKeys from "./PixKeysRouter";
import clients from "./ClientsRouter";
import groups from "./GroupRouter";
import plans from "./PlansRouter";
import users from "./UserRouter";
import auth from "./AuthRouter";
import { startSendDueMessagesCron } from "../cron/sendDueMessages";
import cron from 'node-cron';

const routes = (app: Application) => {

  app.use(logRoutes);

  app.route("/").get((req: Request, res: Response): void => {
    res.status(200).send({ message: "Bem vindo a API de cadastro de usuários." });
  });

  app.use(
    whatsApp,
    auth,
    clients,
    clientPayments,
    products,
    pixKeys,
    messageTemplates,
    dashboard,
    groups,
    checkout,
    webhooks,
    stripeWebhook,
    stripePortal,
    plans,
    subscription,
    pixSubscription,
    subscriptionAdmin,
    users
  );

  // Executa diariamente às 08:00 e 09:00 no horário de Brasília
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Disparo 08:00 (America/Sao_Paulo)');
    await startSendDueMessagesCron();
  }, { timezone: 'America/Sao_Paulo' });

  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Disparo 09:00 (America/Sao_Paulo)');
    await startSendDueMessagesCron();
  }, { timezone: 'America/Sao_Paulo' });
};

export default routes;
