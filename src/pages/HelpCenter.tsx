import { useState, useMemo, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FAQFeedback } from '@/components/FAQFeedback';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  Calendar, 
  Users, 
  DollarSign, 
  Settings, 
  Scissors, 
  Package, 
  HelpCircle,
  MessageCircle,
  BookOpen,
  Lightbulb,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  Bell,
  Info,
  AlertTriangle,
  Megaphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Declare Crisp on window
declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

function initCrisp(websiteId: string) {
  if (typeof window !== 'undefined' && websiteId) {
    if (window.$crisp) {
      window.$crisp.push(['do', 'chat:show']);
      window.$crisp.push(['do', 'chat:open']);
      return;
    }

    window.$crisp = [];
    window.CRISP_WEBSITE_ID = websiteId;

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    script.onload = () => {
      if (window.$crisp) {
        window.$crisp.push(['do', 'chat:open']);
      }
    };
    document.head.appendChild(script);
  }
}

function hideCrisp() {
  if (typeof window !== 'undefined' && window.$crisp) {
    window.$crisp.push(['do', 'chat:hide']);
  }
}

function reopenCrisp() {
  if (typeof window !== 'undefined' && window.$crisp) {
    window.$crisp.push(['do', 'chat:show']);
    window.$crisp.push(['do', 'chat:open']);
  }
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  popular?: boolean;
}

interface Category {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const categories: Category[] = [
  {
    id: 'getting-started',
    title: 'Primeiros Passos',
    description: 'Como começar a usar o sistema',
    icon: Sparkles,
    color: 'from-violet-500 to-purple-500'
  },
  {
    id: 'agenda',
    title: 'Agenda e Agendamentos',
    description: 'Gerenciar horários e compromissos',
    icon: Calendar,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'clients',
    title: 'Clientes',
    description: 'Cadastro e gestão de clientes',
    icon: Users,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'services',
    title: 'Serviços',
    description: 'Configurar serviços e preços',
    icon: Scissors,
    color: 'from-orange-500 to-amber-500'
  },
  {
    id: 'financial',
    title: 'Financeiro e Comissões',
    description: 'Controle financeiro e pagamentos',
    icon: DollarSign,
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'stock',
    title: 'Estoque',
    description: 'Gerenciar produtos e inventário',
    icon: Package,
    color: 'from-teal-500 to-cyan-500'
  },
  {
    id: 'professionals',
    title: 'Profissionais',
    description: 'Equipe e permissões',
    icon: Users,
    color: 'from-indigo-500 to-violet-500'
  },
  {
    id: 'settings',
    title: 'Configurações',
    description: 'Personalizar o sistema',
    icon: Settings,
    color: 'from-gray-500 to-slate-500'
  }
];

const quickActions = [
  {
    title: 'Criar Agendamento',
    description: 'Agende um novo atendimento',
    icon: Calendar,
    link: '/appointments/new'
  },
  {
    title: 'Novo Cliente',
    description: 'Cadastre um cliente',
    icon: Users,
    link: '/clients'
  },
  {
    title: 'Ver Agenda',
    description: 'Confira os horários',
    icon: Clock,
    link: '/agenda'
  }
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Crisp support
  const [crispLoading, setCrispLoading] = useState(false);
  const [crispError, setCrispError] = useState<string | null>(null);
  const [crispActive, setCrispActive] = useState(false);

  // Fetch announcements from database
  const { data: announcements, isLoading: announcementsLoading } = useQuery({
    queryKey: ['announcements-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch FAQs from database
  const { data: faqsFromDB = [], isLoading: faqsLoading } = useQuery({
    queryKey: ['faqs-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as FAQItem[];
    }
  });

  const loadCrispChat = async () => {
    if (crispActive) return;
    setCrispLoading(true);
    setCrispError(null);
    try {
      const { data, error } = await supabase.functions.invoke('get-crisp-config');
      if (error) {
        setCrispError('Erro ao carregar o chat de suporte');
        return;
      }
      if (data?.websiteId) {
        initCrisp(data.websiteId);
        setCrispActive(true);
      } else {
        setCrispError('Configuração do chat não encontrada');
      }
    } catch {
      setCrispError('Erro ao inicializar o chat');
    } finally {
      setCrispLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      hideCrisp();
    };
  }, []);

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAnnouncementBadge = (type: string) => {
    switch (type) {
      case 'warning':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Aviso</Badge>;
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Novidade</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Importante</Badge>;
      default:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Info</Badge>;
    }
  };

  const filteredFAQs = useMemo(() => {
    let items = faqsFromDB;

    if (selectedCategory) {
      items = items.filter(item => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        item =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query) ||
          (item.tags || []).some(tag => tag.toLowerCase().includes(query))
      );
    }

    return items;
  }, [searchQuery, selectedCategory, faqsFromDB]);

  const popularFAQs = useMemo(() => 
    faqsFromDB.filter(item => item.popular),
    [faqsFromDB]
  );

  const renderAnswer = (answer: string) => {
    // Configure DOMPurify to only allow safe formatting tags
    const sanitizeConfig = {
      ALLOWED_TAGS: ['strong', 'em', 'b', 'i'],
      ALLOWED_ATTR: []
    };

    return answer.split('\n').map((line, index) => {
      // Handle bold text with markdown syntax
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Sanitize the formatted content to prevent XSS
      const sanitizedContent = DOMPurify.sanitize(formattedLine, sanitizeConfig);
      
      if (line.startsWith('- ')) {
        const sanitizedListItem = DOMPurify.sanitize(formattedLine.slice(2), sanitizeConfig);
        return (
          <li key={index} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: sanitizedListItem }} />
        );
      }
      if (/^\d+\./.test(line)) {
        const sanitizedNumberedItem = DOMPurify.sanitize(formattedLine.replace(/^\d+\.\s*/, ''), sanitizeConfig);
        return (
          <li key={index} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: sanitizedNumberedItem }} />
        );
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return (
        <p key={index} className="mb-1" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
      );
    });
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent py-12 md:py-16">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          <div className="container relative mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <BookOpen className="h-4 w-4" />
                Central de Ajuda
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Como podemos ajudar?
              </h1>
              <p className="text-muted-foreground text-lg mb-8">
                Encontre respostas rápidas, tutoriais e dicas para usar o sistema
              </p>
              
              {/* Search */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por palavras-chave... (ex: agendamento, comissão, cliente)"
                  className="pl-12 pr-4 py-6 text-lg rounded-xl shadow-lg border-0 bg-card"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedCategory(null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Quick Actions */}
          {!searchQuery && !selectedCategory && (
            <div className="mb-12">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Ações Rápidas
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <a
                    key={action.title}
                    href={action.link}
                    className="group flex flex-col items-center p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-3 group-hover:scale-110 transition-transform">
                      <action.icon className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-sm text-center">{action.title}</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">{action.description}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Popular Questions */}
          {!searchQuery && !selectedCategory && (
            <div className="mb-12">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Perguntas Populares
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {popularFAQs.map((faq) => (
                  <Card 
                    key={faq.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary/50"
                    onClick={() => {
                      setSelectedCategory(faq.category);
                      setExpandedItems([faq.id]);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-start gap-2">
                        <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        {faq.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {faq.answer.split('\n')[0].replace(/\*\*/g, '')}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className="text-xs">
                          {categories.find(c => c.id === faq.category)?.title}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {!searchQuery && (
            <div className="mb-12">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                {selectedCategory ? 'Categorias' : 'Explorar por Categoria'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {categories.map((category) => {
                  const isActive = selectedCategory === category.id;
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(isActive ? null : category.id)}
                      className={cn(
                        "relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 text-left overflow-hidden group",
                        isActive 
                          ? "border-primary bg-primary/5 shadow-md" 
                          : "border-border bg-card hover:border-primary/30 hover:shadow-md"
                      )}
                    >
                      <div className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br",
                        category.color,
                        "opacity-5"
                      )} />
                      <div className={cn(
                        "p-2 rounded-lg mb-3 bg-gradient-to-br",
                        category.color,
                        "text-white"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-sm">{category.title}</span>
                      <span className="text-xs text-muted-foreground mt-1 line-clamp-2">{category.description}</span>
                      {isActive && (
                        <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                          Ativo
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedCategory && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  onClick={() => setSelectedCategory(null)}
                >
                  ← Ver todas as categorias
                </Button>
              )}
            </div>
          )}

          {/* Atualizações / Announcements */}
          {!searchQuery && !selectedCategory && (
            <div className="mb-12">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                Atualizações
              </h2>
              {announcementsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : announcements && announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <Card key={announcement.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4 p-4">
                        <div className="shrink-0 mt-0.5">
                          {getAnnouncementIcon(announcement.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-sm">{announcement.title}</h3>
                            {getAnnouncementBadge(announcement.type)}
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {announcement.content}
                          </p>
                          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(announcement.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Bell className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhuma atualização no momento</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Novidades e comunicados importantes aparecerão aqui
                  </p>
                </Card>
              )}
            </div>
          )}
          {(searchQuery || selectedCategory) && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {searchQuery ? (
                    <>
                      <Search className="h-5 w-5 text-primary" />
                      Resultados da busca
                    </>
                  ) : (
                    <>
                      {(() => {
                        const cat = categories.find(c => c.id === selectedCategory);
                        const Icon = cat?.icon || HelpCircle;
                        return <Icon className="h-5 w-5 text-primary" />;
                      })()}
                      {categories.find(c => c.id === selectedCategory)?.title}
                    </>
                  )}
                </h2>
                <Badge variant="secondary">
                  {filteredFAQs.length} {filteredFAQs.length === 1 ? 'resultado' : 'resultados'}
                </Badge>
              </div>

              {filteredFAQs.length > 0 ? (
                <Card>
                  <Accordion 
                    type="multiple" 
                    value={expandedItems}
                    onValueChange={setExpandedItems}
                    className="divide-y"
                  >
                    {filteredFAQs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id} className="border-0">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                          <div className="flex items-start gap-3 text-left">
                            <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span className="font-medium">{faq.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4">
                          <div className="pl-8 prose prose-sm dark:prose-invert max-w-none">
                            {renderAnswer(faq.answer)}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-4 pl-8">
                            {faq.tags.map(tag => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-primary/10"
                                onClick={() => setSearchQuery(tag)}
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                          <FAQFeedback faqId={faq.id} />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Nenhum resultado encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Tente usar outras palavras-chave ou explore as categorias
                  </p>
                  <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}>
                    Limpar busca
                  </Button>
                </Card>
              )}
            </div>
          )}

          {/* Contact Support Section */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Chat de Suporte
              </CardTitle>
              <CardDescription>
                Não encontrou o que procurava? Fale conosco em tempo real!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {crispLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Carregando chat...</span>
                </div>
              ) : crispError ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-destructive opacity-50" />
                  <p className="text-destructive mb-4">{crispError}</p>
                  <Button variant="outline" onClick={loadCrispChat}>
                    Tentar novamente
                  </Button>
                </div>
              ) : crispActive ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="font-medium text-lg">Chat ativo!</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Clique no ícone de chat no canto inferior direito da tela
                  </p>
                  <Button variant="outline" onClick={reopenCrisp}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Reabrir Chat
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
                  <div className="text-center md:text-left">
                    <p className="font-medium">Precisa de ajuda personalizada?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Nossa equipe está disponível para tirar suas dúvidas
                    </p>
                  </div>
                  <Button size="lg" onClick={loadCrispChat}>
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Abrir Chat de Suporte
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
