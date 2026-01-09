import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Minha Agenda Online</span>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <p>
            <strong className="text-foreground">Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Introdução</h2>
            <p>
              A Minha Agenda Online respeita sua privacidade e está comprometida em proteger seus dados pessoais. 
              Esta política descreve como coletamos, usamos e protegemos suas informações.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Dados Coletados</h2>
            <p>Coletamos os seguintes tipos de informações:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-foreground">Dados de cadastro:</strong> nome, email, telefone</li>
              <li><strong className="text-foreground">Dados do salão:</strong> nome do estabelecimento, endereço</li>
              <li><strong className="text-foreground">Dados de clientes:</strong> informações cadastradas por você sobre seus clientes</li>
              <li><strong className="text-foreground">Dados de uso:</strong> informações sobre como você usa o serviço</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Como Usamos Seus Dados</h2>
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Fornecer e manter o serviço</li>
              <li>Processar pagamentos e assinaturas</li>
              <li>Enviar comunicações importantes sobre o serviço</li>
              <li>Melhorar e personalizar sua experiência</li>
              <li>Fornecer suporte ao cliente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Compartilhamento de Dados</h2>
            <p>
              Não vendemos seus dados pessoais. Podemos compartilhar informações com:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Processadores de pagamento para processar transações</li>
              <li>Provedores de infraestrutura para manter o serviço</li>
              <li>Autoridades legais quando exigido por lei</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Segurança dos Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados, 
              incluindo criptografia, controle de acesso e monitoramento de segurança.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Seus Direitos</h2>
            <p>Você tem direito a:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incorretos</li>
              <li>Solicitar exclusão de seus dados</li>
              <li>Exportar seus dados</li>
              <li>Revogar consentimento a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Retenção de Dados</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para fornecer o serviço. 
              Após cancelamento, seus dados são excluídos em até 30 dias, exceto quando retenção é exigida por lei.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Cookies</h2>
            <p>
              Usamos cookies essenciais para manter sua sessão e preferências. 
              Não usamos cookies de rastreamento de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">9. Alterações</h2>
            <p>
              Podemos atualizar esta política periodicamente. Alterações significativas serão comunicadas 
              por email ou através do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">10. Contato</h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, 
              entre em contato pelo email: privacidade@minhaagendaonline.com
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Minha Agenda Online. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
