import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

export function NichoSelection() {
  const [niches, setNiches] = useState<NicheTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
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

  const handleNicheSelect = (nicheId: string) => {
    setSelectedNiche(nicheId === selectedNiche ? null : nicheId);
    setPreviewTemplate(null);
  };

  const handlePreviewTemplate = async (templateId: string) => {
    try {
      const variables = {
        nome: "João Silva",
        valor: "R$ 99,90",
        vencimento: "15/03/2024",
        chave_pix: "joao@pix.com.br",
        academia: "Academia Fit",
        nome_clinica: "Clínica Saúde",
        escola: "Escola Futuro",
        aluno: "Pedro Silva"
      };

      const response = await fetch(`/api/niches/templates/${templateId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables })
      });

      const data = await response.json();
      
      if (data.success) {
        setPreviewTemplate(data.data);
      }
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    }
  };

  const handleSetupNiche = async () => {
    if (!selectedNiche) return;

    try {
      const response = await fetch(`/api/niches/user123/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nicheIds: [selectedNiche],
          customizations: {}
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Nicho configurado com ${data.data.total_templates} templates!`);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Erro ao configurar nicho:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando nichos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Escolha seu Nicho de Negócio
          </h1>
          <p className="text-gray-600">
            Selecione o nicho que melhor descreve seu negócio para usar templates prontos
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {niches.map((niche) => (
            <div
              key={niche.id}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all ${
                selectedNiche === niche.id
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : 'hover:shadow-lg'
              }`}
              onClick={() => handleNicheSelect(niche.id)}
            >
              <div className="text-4xl mb-4 text-center">{niche.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {niche.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">{niche.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {niche.templates.length} templates
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedNiche === niche.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedNiche === niche.id ? 'Selecionado' : 'Selecionar'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {selectedNiche && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Templates do Nicho
            </h3>
            
            <div className="space-y-4">
              {niches
                .find(n => n.id === selectedNiche)
                ?.templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{template.subject}</h4>
                        <p className="text-sm text-gray-500">
                          {template.type === 'pre_vencimento' && '⏰ Pré-vencimento'}
                          {template.type === 'vencimento' && '📅 No vencimento'}
                          {template.type === 'pos_vencimento' && '⚠️ Pós-vencimento'}
                          {' - '}D{template.days_offset}
                        </p>
                      </div>
                      <button
                        onClick={() => handlePreviewTemplate(template.id)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200"
                      >
                        Preview
                      </button>
                    </div>
                    
                    {previewTemplate?.template_info?.type === template.type && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <h5 className="font-medium text-gray-900 mb-2">
                          Preview: {previewTemplate.subject}
                        </h5>
                        <pre className="whitespace-pre-wrap text-sm text-gray-700">
                          {previewTemplate.content}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {selectedNiche && (
          <div className="text-center">
            <button
              onClick={handleSetupNiche}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Configurar Nicho Selecionado
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
