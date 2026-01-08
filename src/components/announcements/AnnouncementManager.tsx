import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Megaphone, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  active: boolean;
  created_at: string;
}

export function AnnouncementManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
  });

  // Fetch all announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['all-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Announcement[];
    },
  });

  // Fetch read counts per announcement
  const { data: readCounts = {} } = useQuery({
    queryKey: ['announcement-read-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcement_reads')
        .select('announcement_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(r => {
        counts[r.announcement_id] = (counts[r.announcement_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Create announcement
  const createMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; type: string }) => {
      const { error } = await supabase
        .from('announcements')
        .insert({ ...data, created_by: user?.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Anúncio criado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] });
      setShowDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  // Update announcement
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Announcement> }) => {
      const { error } = await supabase
        .from('announcements')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Anúncio atualizado!' });
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] });
      setShowDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  // Delete announcement
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Anúncio excluído!' });
      queryClient.invalidateQueries({ queryKey: ['all-announcements'] });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    },
  });

  const resetForm = () => {
    setFormData({ title: '', content: '', type: 'info' });
    setEditingAnnouncement(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ variant: 'destructive', title: 'Preencha todos os campos' });
      return;
    }

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (announcement: Announcement) => {
    updateMutation.mutate({ 
      id: announcement.id, 
      data: { active: !announcement.active } 
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      default: return Info;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'warning': return <Badge variant="outline" className="text-orange-600 border-orange-600">Aviso</Badge>;
      case 'success': return <Badge variant="outline" className="text-green-600 border-green-600">Sucesso</Badge>;
      default: return <Badge variant="outline" className="text-blue-600 border-blue-600">Info</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Anúncios
        </h3>
        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Anúncio
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : announcements.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum anúncio criado</p>
            <Button className="mt-4" onClick={handleOpenCreate}>
              Criar primeiro anúncio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => {
            const Icon = getTypeIcon(announcement.type);
            return (
              <Card key={announcement.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold truncate">{announcement.title}</span>
                        {getTypeBadge(announcement.type)}
                        {announcement.active ? (
                          <Badge variant="secondary" className="text-green-600">
                            <Eye className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {format(new Date(announcement.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span>{readCounts[announcement.id] || 0} visualizações</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(announcement)}
                      >
                        {announcement.active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? 'Editar Anúncio' : 'Novo Anúncio'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Ex: Nova funcionalidade liberada!"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-600" />
                      Informação
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Sucesso
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      Aviso
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                placeholder="Descreva o anúncio..."
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingAnnouncement ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
