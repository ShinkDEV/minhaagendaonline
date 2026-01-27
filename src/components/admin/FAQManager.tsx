import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Star, 
  Eye, 
  EyeOff,
  Loader2,
  HelpCircle,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  popular: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { id: 'getting-started', label: 'Primeiros Passos' },
  { id: 'agenda', label: 'Agenda e Agendamentos' },
  { id: 'clients', label: 'Clientes' },
  { id: 'services', label: 'Serviços' },
  { id: 'financial', label: 'Financeiro e Comissões' },
  { id: 'stock', label: 'Estoque' },
  { id: 'professionals', label: 'Profissionais' },
  { id: 'settings', label: 'Configurações' },
];

export function FAQManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formCategory, setFormCategory] = useState('getting-started');
  const [formTags, setFormTags] = useState('');
  const [formPopular, setFormPopular] = useState(false);
  const [formActive, setFormActive] = useState(true);

  // Fetch FAQs
  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['admin-faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as FAQ[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (faq: { question: string; answer: string; category: string; tags: string[]; popular: boolean; active: boolean; sort_order: number }) => {
      if (editingFAQ) {
        const { error } = await supabase
          .from('faqs')
          .update(faq)
          .eq('id', editingFAQ.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('faqs')
          .insert(faq);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast({ title: editingFAQ ? 'FAQ atualizada!' : 'FAQ criada!' });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast({ title: 'FAQ removida!' });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('faqs')
        .update({ active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  // Toggle popular mutation
  const togglePopularMutation = useMutation({
    mutationFn: async ({ id, popular }: { id: string; popular: boolean }) => {
      const { error } = await supabase
        .from('faqs')
        .update({ popular })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  const openNewDialog = () => {
    setEditingFAQ(null);
    setFormQuestion('');
    setFormAnswer('');
    setFormCategory('getting-started');
    setFormTags('');
    setFormPopular(false);
    setFormActive(true);
    setIsDialogOpen(true);
  };

  const openEditDialog = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setFormCategory(faq.category);
    setFormTags(faq.tags?.join(', ') || '');
    setFormPopular(faq.popular);
    setFormActive(faq.active);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingFAQ(null);
  };

  const handleSave = () => {
    if (!formQuestion.trim() || !formAnswer.trim()) {
      toast({ variant: 'destructive', title: 'Preencha todos os campos obrigatórios' });
      return;
    }

    const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);
    
    saveMutation.mutate({
      question: formQuestion.trim(),
      answer: formAnswer.trim(),
      category: formCategory,
      tags,
      popular: formPopular,
      active: formActive,
      sort_order: editingFAQ?.sort_order || faqs.length + 1,
    });
  };

  // Filter FAQs
  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || faq.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Gerenciar FAQs
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Nova FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFAQ ? 'Editar FAQ' : 'Nova FAQ'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question">Pergunta *</Label>
                <Input
                  id="question"
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="Ex: Como criar um agendamento?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Resposta * (suporta Markdown)</Label>
                <Textarea
                  id="answer"
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="Use **negrito**, *itálico*, listas com - ou 1., etc."
                  rows={10}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="agendamento, criar, novo"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="popular"
                    checked={formPopular}
                    onCheckedChange={setFormPopular}
                  />
                  <Label htmlFor="popular" className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500" />
                    Pergunta Popular
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={formActive}
                    onCheckedChange={setFormActive}
                  />
                  <Label htmlFor="active" className="flex items-center gap-1">
                    {formActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {formActive ? 'Ativa' : 'Inativa'}
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingFAQ ? 'Salvar Alterações' : 'Criar FAQ'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar FAQ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* FAQ List */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Carregando FAQs...
            </div>
          ) : filteredFAQs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma FAQ encontrada
            </div>
          ) : (
            <Accordion type="multiple" className="divide-y divide-border">
              {filteredFAQs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id} className="border-0">
                  <div className="flex items-start gap-2 px-4 py-2">
                    <AccordionTrigger className="flex-1 text-left py-2 hover:no-underline">
                      <div className="flex items-start gap-2 pr-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={faq.active ? '' : 'text-muted-foreground line-through'}>
                              {faq.question}
                            </span>
                            {faq.popular && (
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                            {!faq.active && (
                              <Badge variant="secondary" className="text-xs">Inativa</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(faq.category)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <div className="flex items-center gap-1 pt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => togglePopularMutation.mutate({ id: faq.id, popular: !faq.popular })}
                      >
                        <Star className={`h-4 w-4 ${faq.popular ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleActiveMutation.mutate({ id: faq.id, active: !faq.active })}
                      >
                        {faq.active ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(faq)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja remover esta FAQ?')) {
                            deleteMutation.mutate(faq.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <AccordionContent className="px-4 pb-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm font-sans">
                        {faq.answer}
                      </pre>
                      {faq.tags && faq.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-3 flex-wrap">
                          <span className="text-xs text-muted-foreground">Tags:</span>
                          {faq.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
