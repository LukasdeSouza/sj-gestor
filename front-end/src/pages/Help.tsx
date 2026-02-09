import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Package, CreditCard, MessageSquare, Smartphone, HelpCircle, FileText, Wallet, User, MessageCircleQuestion, LifeBuoy, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import Cookies from "js-cookie";
import { AuthUser } from "@/api/models/auth";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Help() {
  const user = Cookies.get("user");
  const parsedUser: AuthUser = user ? JSON.parse(user) : null;
  const isAdmin = parsedUser?.group?.name === 'ADMIN';
  const isClient = parsedUser?.group?.name === 'USUARIO_CLIENTE';

  // Estado para controlar qual seção está aberta no mobile
  const [mobileOpenSection, setMobileOpenSection] = useState<string>("general");

  const toggleMobileSection = (id: string) => {
    setMobileOpenSection(current => current === id ? "" : id);
  };

  // Definição do conteúdo para reutilização nas visualizações Desktop e Mobile
  const sections = [
    {
      id: "general",
      label: "Geral",
      icon: HelpCircle,
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao SJ Gestor</CardTitle>
            <CardDescription>Visão geral do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              O SJ Gestor é uma plataforma completa para gerenciamento de cobranças recorrentes e avulsas, 
              com foco em automação via WhatsApp.
            </p>
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  Acompanhe métricas importantes como total de clientes, produtos, recebimentos do dia e do mês.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Navegação</h3>
                <p className="text-sm text-muted-foreground">
                  Utilize o menu lateral para acessar todas as funcionalidades do sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "faq",
      label: "FAQ",
      icon: MessageCircleQuestion,
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
            <CardDescription>Respostas para as dúvidas mais comuns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Como resetar minha senha?</h3>
              <p className="text-sm text-muted-foreground">
                Caso tenha esquecido sua senha, vá para a tela de login e clique no link "Esqueceu sua senha?". 
                Você receberá um e-mail com instruções para criar uma nova senha.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">O WhatsApp desconectou, o que fazer?</h3>
              <p className="text-sm text-muted-foreground">
                Acesse o menu <strong>WhatsApp</strong>. Se o status estiver desconectado, clique no botão para conectar 
                e escaneie o QR Code novamente com o seu celular. Certifique-se de que o celular esteja com internet.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Como funcionam as cobranças automáticas?</h3>
              <p className="text-sm text-muted-foreground">
                O sistema verifica diariamente os clientes que possuem data de vencimento próxima. Se o cliente estiver 
                dentro do período configurado e o WhatsApp estiver conectado, o sistema enviará a mensagem baseada no 
                template padrão selecionado.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Posso alterar meu plano?</h3>
              <p className="text-sm text-muted-foreground">
                Sim. Acesse o menu do usuário (clicando no seu nome na barra lateral) e selecione "Alterar plano" ou 
                vá diretamente para a página de Planos se disponível no menu.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Como cadastro uma chave PIX?</h3>
              <p className="text-sm text-muted-foreground">
                Vá até o menu <strong>Chaves PIX</strong>, clique em "Nova Chave", selecione o tipo (CPF, Email, etc.) 
                e digite a chave. Essa chave será enviada nas mensagens de cobrança para facilitar o pagamento.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "clients",
      label: "Clientes",
      icon: Users,
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Clientes</CardTitle>
            <CardDescription>Como cadastrar e gerenciar seus clientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Users className="w-4 h-4" /> Cadastrar Cliente
                </h3>
                <p className="text-muted-foreground mt-1">
                  Vá até a página de <strong>Clientes</strong> e clique no botão <strong>"Novo Cliente"</strong>. 
                  Preencha os dados obrigatórios (Nome e Telefone). O telefone deve conter DDD.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Registrar Pagamento
                </h3>
                <p className="text-muted-foreground mt-1">
                  Na lista de clientes, clique no ícone de ações (três pontos ou botões de ação) e selecione 
                  <strong>"Registrar Pagamento"</strong>. Informe o valor e a data. Isso atualizará o status financeiro do cliente.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Histórico
                </h3>
                <p className="text-muted-foreground mt-1">
                  Clique sobre um cliente na tabela para ver detalhes completos e o histórico de pagamentos realizados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "products",
      label: "Produtos",
      icon: Package,
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Produtos e Serviços</CardTitle>
            <CardDescription>Catálogo de itens cobráveis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Gerenciando Produtos</h3>
              <p className="text-muted-foreground mt-1">
                Acesse a aba <strong>Produtos</strong> para cadastrar seus serviços ou itens de venda. 
                Defina nome, descrição e valor padrão. Esses produtos podem ser selecionados ao criar cobranças para clientes.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "pix",
      label: "Financeiro",
      icon: CreditCard,
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Chaves PIX</CardTitle>
            <CardDescription>Configuração para recebimentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Cadastrar Chaves</h3>
              <p className="text-muted-foreground mt-1">
                Em <strong>Chaves PIX</strong>, cadastre as chaves que você utiliza para receber pagamentos (CPF, CNPJ, Email, Telefone ou Aleatória).
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Uso nas Mensagens</h3>
              <p className="text-muted-foreground mt-1">
                As chaves cadastradas são enviadas automaticamente nas mensagens de cobrança via WhatsApp, facilitando o pagamento pelo cliente (Copia e Cola).
              </p>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "templates",
      label: "Templates",
      icon: FileText,
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Templates de Mensagem</CardTitle>
            <CardDescription>Personalização das cobranças</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Criando Modelos</h3>
              <p className="text-muted-foreground mt-1">
                Crie mensagens personalizadas para diferentes momentos (aviso de vencimento, cobrança de atraso, agradecimento).
              </p>
            </div>
            <div className="bg-muted p-4 rounded-md">
              <h4 className="font-semibold text-sm mb-2">Variáveis Disponíveis:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><code>{`{{nome}}`}</code> - Nome do cliente</li>
                <li><code>{`{{valor}}`}</code> - Valor da cobrança</li>
                <li><code>{`{{vencimento}}`}</code> - Data de vencimento</li>
                <li><code>{`{{pix}}`}</code> - Chave PIX padrão</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: Smartphone,
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Integração WhatsApp</CardTitle>
            <CardDescription>Conexão e automação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Como Conectar</h3>
              <ol className="list-decimal list-inside text-muted-foreground mt-2 space-y-2">
                <li>Acesse a página <strong>WhatsApp</strong>.</li>
                <li>Insira o número do telefone que fará os envios.</li>
                <li>Clique em <strong>Conectar</strong> e aguarde a geração do QR Code.</li>
                <li>No seu celular, abra o WhatsApp, vá em "Aparelhos Conectados" e escaneie o código na tela.</li>
              </ol>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold text-lg">Status da Conexão</h3>
              <p className="text-muted-foreground mt-1">
                Verifique sempre se o status está como "Conectado" para garantir que as mensagens automáticas sejam enviadas.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "whatsapp-issues",
      label: "Problemas WhatsApp",
      icon: AlertTriangle,
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Resolução de Problemas com WhatsApp</CardTitle>
            <CardDescription>Soluções para problemas comuns de conexão e envio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Não estou conseguindo conectar meu Whatsapp</h3>
              <p className="text-sm text-muted-foreground">
                Remova a conexão do seu aparelho de Whatsapp e tente fazer a conexão novamente na plataforma com o seu número no formato correto (xx) 9xxxx-xxxx
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Fiz a conexão mas na plataforma não aparece que foi conectado</h3>
              <p className="text-sm text-muted-foreground">
                Aguarde o whatsapp fazer a sincronização do seu dispositivo, o status aparece direto no seu whatsapp no telefone, após a sincronização se não resolver recarregue a tela, se mesmo assim não resolver entre em contato com o Suporte informando seu email de acesso
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Dificuldade de conexão com Whatsapp Business</h3>
              <p className="text-sm text-muted-foreground">
                Seu número é whatsapp business e não está conectando? Tente remover conexão caso já tenha se conectado alguma vez e se conectar denovo. Se nunca fez nenhuma conexão tente outro número que não seja business ou entre em contato com o suporte informando o seu email cadastrado.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Fiz a desconexão e não consigo me conectar denovo</h3>
              <p className="text-sm text-muted-foreground">
                Entre em contato com o suporte informando o seu e-mail, pode ser que sua sessão anterior não foi completamente desconectada.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Fiz a conexão mas a mensagem não chegou no telefone do cliente</h3>
              <p className="text-sm text-muted-foreground">
                Confira se o telefone está no formato correto, (xx) 9xxxx-xxxx, caso não esteja no formato correto, favor corrigir. Caso não funcione, remova o cliente e cadastre novamente com os dados obrigatórios e aguarde.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Quais os horários de disparo de mensagem?</h3>
              <p className="text-sm text-muted-foreground">
                Pela manhã apartir das 8hr até as 10hr, a tarde apartir das 15hr as 17 e a noite apartir das 20 até as 22hr, este gap de horário é pela quantidade de disparos precisar serem espaçadas para evitar bloqueio do whatsapp com disparo continuo de mensagens.
              </p>
            </div>
            <div className="flex justify-center pt-4">
              <Button 
                onClick={() => window.open("https://wa.me/5511999999999", "_blank")} 
                className="gap-2"
                size="lg"
              >
                <LifeBuoy className="h-5 w-5" />
                Falar com Suporte
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    },
    ...(isClient ? [{
      id: "payments",
      label: "Pagamentos",
      icon: Wallet,
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>Gerencie sua assinatura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Minhas Faturas</h3>
              <p className="text-muted-foreground mt-1">
                Acesse a aba <strong>Pagamentos</strong> para visualizar o histórico de pagamentos da sua assinatura.
                Você pode ver o status de cada fatura, baixar comprovantes e verificar datas de aprovação.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }] : []),
    ...(isAdmin ? [{
      id: "users",
      label: "Usuários & Gerenciamento",
      icon: User,
      content: (
        <Card>
          <CardHeader>
            <CardTitle>Gestão de Usuários & Pagamentos</CardTitle>
            <CardDescription>Administração do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">Gerenciar Usuários</h3>
              <p className="text-muted-foreground mt-1">
                Acesse a aba <strong>Usuários</strong> para visualizar todos os usuários cadastrados no sistema.
                Você pode editar informações, alterar planos e monitorar o status das assinaturas.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Aprovação de Pagamentos</h3>
              <p className="text-muted-foreground mt-1">
                Na aba de Usuários, utilize a visualização de <strong>Pagamentos</strong> para aprovar ou rejeitar
                comprovantes de pagamento enviados pelos clientes via PIX.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }] : [])
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Central de Ajuda</h1>
          <p className="text-muted-foreground">Tutoriais, guias e perguntas frequentes</p>
        </div>

        {/* Desktop View: Tabs */}
        <div className="hidden md:block">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0 justify-start mb-6">
              {sections.map((section) => (
                <TabsTrigger 
                  key={section.id} 
                  value={section.id}
                  className={`group data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-4 py-2 border bg-card ${section.id === 'whatsapp-issues' ? 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' : ''}`}
                >
                  <section.icon className={`h-4 w-4 ${section.id === 'whatsapp-issues' ? 'text-orange-600 dark:text-orange-400 group-data-[state=active]:text-primary-foreground' : ''}`} />
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {sections.map((section) => (
              <TabsContent key={section.id} value={section.id} className="mt-0">
                {section.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Mobile View: Accordion-style list */}
        <div className="md:hidden space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="border rounded-lg bg-card text-card-foreground shadow-sm">
              <button
                onClick={() => toggleMobileSection(section.id)}
                className="flex items-center justify-between w-full p-4 font-medium transition-all hover:bg-accent/50 rounded-t-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${section.id === 'whatsapp-issues' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-primary/10 text-primary'}`}>
                    <section.icon className="h-5 w-5" />
                  </div>
                  <span>{section.label}</span>
                </div>
                {mobileOpenSection === section.id ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {mobileOpenSection === section.id && (
                <div className="p-4 pt-0 border-t animate-in slide-in-from-top-2 duration-200">
                  <div className="pt-4">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}