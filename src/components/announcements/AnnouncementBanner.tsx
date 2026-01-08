import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Megaphone, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success';
  created_at: string;
}

export function AnnouncementBanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Fetch active announcements
  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Announcement[];
    },
    enabled: !!user,
  });

  // Fetch user's read receipts
  const { data: readAnnouncements = [] } = useQuery({
    queryKey: ['announcement-reads', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map(r => r.announcement_id);
    },
    enabled: !!user?.id,
  });

  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async (announcementId: string) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('announcement_reads')
        .insert({ announcement_id: announcementId, user_id: user.id });
      
      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement-reads'] });
    },
  });

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
    markAsRead.mutate(id);
  };

  // Filter unread announcements
  const unreadAnnouncements = announcements.filter(
    a => !readAnnouncements.includes(a.id) && !dismissedIds.includes(a.id)
  );

  if (unreadAnnouncements.length === 0) return null;

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-orange-500/10 border-orange-500/30',
          icon: AlertTriangle,
          iconColor: 'text-orange-500',
        };
      case 'success':
        return {
          bg: 'bg-green-500/10 border-green-500/30',
          icon: CheckCircle,
          iconColor: 'text-green-500',
        };
      default:
        return {
          bg: 'bg-primary/10 border-primary/30',
          icon: Megaphone,
          iconColor: 'text-primary',
        };
    }
  };

  return (
    <div className="space-y-2">
      {unreadAnnouncements.map((announcement) => {
        const styles = getTypeStyles(announcement.type);
        const Icon = styles.icon;

        return (
          <Card key={announcement.id} className={`border ${styles.bg}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${styles.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{announcement.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {announcement.content}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleDismiss(announcement.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
