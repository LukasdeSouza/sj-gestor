import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageTemplate, MessageTemplatesResponse } from '@/api/models/messageTemplate';
import { fetchUseQuery } from '@/api/services/fetchUseQuery';
import { AuthUser } from '@/api/models/auth';
import Cookies from 'js-cookie';
import { FileText, Settings, Sparkles, ArrowRight } from 'lucide-react';

interface NicheTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  templates: Array<{
    id: string;
    type: string;
    days_offset: number;
    subject: string;
    content: string;
  }>;
}

export default function TemplatesUnified() {
  const [activeTab, setActiveTab] = useState('personalizados');
  const [niches, setNiches] = useState<NicheTemplate[]>([]);
  const [customTemplates, setCustomTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar templates de nicho
      const nichesResponse = await fetch('/api/niches');
      const nichesData = await nichesResponse.json();
      
      if (nichesData.success) {
        setNiches(nichesData.data);
      }

      // Carregar templates personalizados
      const user = Cookies.get('user');
      const parsedUser: AuthUser = user ? JSON.parse(user) : null;
      
      if (parsedUser?.id) {
        const templatesResponse = await fetchUseQuery<{
          user_id: string;
          page: number;
          limit: number;
        }, MessageTemplatesResponse>({
          route: '/message_templates',
          method: 'GET',
          data: { user_id: parsedUser.id, page: 1, limit: 50 },
        });
        
        if (templatesResponse?.templates) {
          setCustomTemplates(templatesResponse.templates);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNiche = (nicheId: string) => {
    navigate(`/nicho-selection`);
  };

  const handleManageCustom = () => {
    // Navegar para a página de templates personalizados original
    window.location.href = '/templates';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Central de Templates
          </h1>
          <p className="text-gray-600">
            Escolha entre templates prontos por nicho ou crie seus próprios templates personalizados
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="nichos" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Templates por Nicho
            </TabsTrigger>
            <TabsTrigger value="personalizados" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Templates Personalizados
            </TabsTrigger>
          </TabsList>

          {/* Templates por Nicho */}
          <TabsContent value="nichos" className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Templates Prontos por Nicho</h3>
              </div>
              <p className="text-blue-800 text-sm mb-3">
                Escolha um nicho e use templates profissionais já configurados para:
              </p>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Pré-vencimento (D-3)</li>
                <li>• No vencimento (D0)</li>
                <li>• Pós-vencimento (D+3, D+7)</li>
              </ul>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {niches.map((niche) => (
                <Card key={niche.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="text-4xl">{niche.icon}</div>
                      <Badge variant="secondary">
                        {niche.templates.length} templates
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{niche.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">{niche.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      {niche.templates.slice(0, 2).map((template, index) => (
                        <div key={template.id} className="text-xs text-gray-500">
                          <span className="font-medium">
                            {template.type === 'pre_vencimento' && '⏰'}
                            {template.type === 'vencimento' && '📅'}
                            {template.type === 'pos_vencimento' && '⚠️'}
                          </span>
                          {' '}
                          {template.subject}
                        </div>
                      ))}
                      {niche.templates.length > 2 && (
                        <div className="text-xs text-gray-400">
                          +{niche.templates.length - 2} templates...
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={() => handleSelectNiche(niche.id)}
                      className="w-full"
                      variant="outline"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Escolher Nicho
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {niches.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum nicho disponível
                </h3>
                <p className="text-gray-600">
                  Os templates de nicho serão em breve!
                </p>
              </div>
            )}
          </TabsContent>

          {/* Templates Personalizados */}
          <TabsContent value="personalizados" className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Templates Personalizados</h3>
              </div>
              <p className="text-green-800 text-sm mb-3">
                Crie seus próprios templates com mensagens totalmente customizadas para seus clientes.
              </p>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-green-600" />
                <span className="text-green-800 text-sm">
                  Controle total sobre o conteúdo e variáveis
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 mb-4">
                      {template.content?.substring(0, 100)}
                      {template.content && template.content.length > 100 && '...'}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        Personalizado
                      </Badge>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = '/templates'}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Gerenciar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button 
                onClick={handleManageCustom}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Settings className="w-5 h-5 mr-2" />
                Gerenciar Templates Personalizados
              </Button>
            </div>

            {customTemplates.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum template personalizado
                </h3>
                <p className="text-gray-600 mb-4">
                  Comece criando seu primeiro template personalizado
                </p>
                <Button onClick={handleManageCustom}>
                  <FileText className="w-4 h-4 mr-2" />
                  Criar Template
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
