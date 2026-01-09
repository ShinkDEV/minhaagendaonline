import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';

export default function Terms() {
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
        <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <p>
            <strong className="text-foreground">Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e usar o serviço Minha Agenda Online, você concorda com estes Termos de Uso. 
              Se você não concordar com qualquer parte destes termos, não deve usar nosso serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Descrição do Serviço</h2>
            <p>
              Minha Agenda Online é uma plataforma de gestão de agendamentos, comissões e financeiro 
              para salões de beleza e profissionais autônomos da área.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Cadastro e Conta</h2>
            <p>
              Para usar nosso serviço, você deve criar uma conta fornecendo informações precisas e completas. 
              Você é responsável por manter a confidencialidade de sua senha e conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Uso Aceitável</h2>
            <p>Você concorda em usar o serviço apenas para fins legais e de acordo com estes termos. É proibido:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Violar qualquer lei ou regulamento aplicável</li>
              <li>Transmitir conteúdo ilegal, prejudicial ou ofensivo</li>
              <li>Tentar acessar sistemas ou dados não autorizados</li>
              <li>Interferir no funcionamento do serviço</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Pagamentos e Assinatura</h2>
            <p>
              Os planos são cobrados mensalmente. Você pode cancelar sua assinatura a qualquer momento. 
              Oferecemos garantia de 7 dias para reembolso após a primeira compra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo e funcionalidades do serviço são de propriedade exclusiva da Minha Agenda Online. 
              Você não pode copiar, modificar ou distribuir qualquer parte do serviço sem autorização.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Limitação de Responsabilidade</h2>
            <p>
              O serviço é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros. 
              Não somos responsáveis por danos indiretos, incidentais ou consequenciais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Modificações</h2>
            <p>
              Podemos modificar estes termos a qualquer momento. Alterações significativas serão comunicadas 
              por email ou através do serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">9. Contato</h2>
            <p>
              Para dúvidas sobre estes termos, entre em contato pelo email: contato@minhaagendaonline.com
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
