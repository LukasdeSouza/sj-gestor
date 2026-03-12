import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageTemplate, MessageTemplatesResponse } from '@/api/models/messageTemplate';
import { fetchUseQuery } from '@/api/services/fetchUseQuery';
import { AuthUser } from '@/api/models/auth';
import Cookies from 'js-cookie';
import { FileText, Settings, Sparkles, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

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
  const [niches, setNiches] = useState<NicheTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNiches();
  }, []);

  const loadNiches = async () => {
    try {
      const response = await fetch('/api/niches');
      const data = await response.json();
      
      if (data.success) {
        setNiches(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar nichos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNiche = (nicheId: string) => {
    navigate(`/nicho-selection`);
  };

  const handleCreateCustom = () => {
    navigate('/templates');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Templates de Mensagem
            </h1>
            <p className="text-gray-600">
              Escolha templates prontos por nicho ou crie seus próprios templates personalizados
            </p>
          </div>

          {/* Templates por Nicho */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Templates Prontos por Nicho</h2>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 mb-3">
                Templates profissionais já configurados com:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-700">
                <div>⏰ Pré-vencimento (D-3)</div>
                <div>📅 No vencimento (D0)</div>
                <div>⚠️ Pós-vencimento (D+3)</div>
                <div>📞 Pós-vencimento (D+7)</div>
              </div>
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
                      Usar este Nicho
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
                  Os templates de nicho estarão disponíveis em breve!
                </p>
              </div>
            )}
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200 my-12"></div>

          {/* Templates Personalizados */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Templates Personalizados</h2>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 mb-3">
                Crie seus próprios templates com mensagens totalmente customizadas.
              </p>
              <div className="flex items-center gap-2 text-green-700">
                <Settings className="w-4 h-4" />
                <span className="text-sm">
                  Controle total sobre o conteúdo e variáveis
                </span>
              </div>
            </div>

            <div className="text-center">
              <Button 
                onClick={handleCreateCustom}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Settings className="w-5 h-5 mr-2" />
                Criar Template Personalizado
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
