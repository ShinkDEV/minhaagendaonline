import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Plus, Phone, Mail } from 'lucide-react';

const mockClients = [
  { id: 1, name: 'Maria Silva', phone: '(11) 99999-0001', email: 'maria@email.com', lastVisit: '15/01/2026' },
  { id: 2, name: 'João Santos', phone: '(11) 99999-0002', email: 'joao@email.com', lastVisit: '14/01/2026' },
  { id: 3, name: 'Paula Costa', phone: '(11) 99999-0003', email: 'paula@email.com', lastVisit: '10/01/2026' },
  { id: 4, name: 'Fernanda Lima', phone: '(11) 99999-0004', email: 'fernanda@email.com', lastVisit: '08/01/2026' },
  { id: 5, name: 'Carlos Oliveira', phone: '(11) 99999-0005', email: 'carlos@email.com', lastVisit: '05/01/2026' },
];

export default function Clientes() {
  const [search, setSearch] = useState('');

  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.phone.includes(search)
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <AppLayout title="Clientes">
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Clients List */}
        <div className="space-y-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground">{client.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Última visita: {client.lastVisit}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum cliente encontrado
          </div>
        )}

        {/* FAB */}
        <Button
          size="lg"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </AppLayout>
  );
}
