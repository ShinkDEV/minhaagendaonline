-- Create FAQs table for dynamic FAQ management
CREATE TABLE public.faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  popular boolean DEFAULT false,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Anyone can view active FAQs
CREATE POLICY "Anyone can view active FAQs"
ON public.faqs FOR SELECT
USING (active = true);

-- Super admins can view all FAQs (including inactive)
CREATE POLICY "Super admins can view all FAQs"
ON public.faqs FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can manage FAQs
CREATE POLICY "Super admins can manage FAQs"
ON public.faqs FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial FAQs from the hardcoded data
INSERT INTO public.faqs (question, answer, category, tags, popular, sort_order) VALUES
('Como começar a usar o Minha Agenda Online?', 'Bem-vindo! Para começar:

1. **Cadastre seus serviços** - Vá em "Serviços" e adicione o que você oferece com preços e duração
2. **Adicione profissionais** - Em "Profissionais", cadastre sua equipe
3. **Configure horários** - Defina os horários de trabalho de cada profissional
4. **Comece a agendar** - Pronto! Vá em "Agenda" e crie seu primeiro agendamento

💡 Dica: Comece simples e vá adicionando mais informações conforme a necessidade.', 'getting-started', ARRAY['início', 'configuração', 'primeiros passos'], true, 1),

('Qual a diferença entre conta Admin e Profissional?', '**Conta Admin (Dono do Salão):**
- Acesso completo a todas as funcionalidades
- Gerencia clientes, serviços, financeiro e relatórios
- Pode adicionar e remover profissionais
- Controla configurações do sistema

**Conta Profissional:**
- Visualiza sua própria agenda
- Pode criar agendamentos
- Acessa suas comissões
- Não vê dados financeiros gerais

💡 Cada profissional pode ter seu próprio login para acompanhar seus horários.', 'getting-started', ARRAY['permissões', 'usuários', 'acesso'], true, 2),

('Como criar um novo agendamento?', 'Para criar um agendamento:

1. Vá em **Agenda** no menu
2. Clique no botão **"+ Novo Agendamento"**
3. Selecione o **cliente** (ou crie um novo)
4. Escolha o **profissional** que vai atender
5. Selecione os **serviços** desejados
6. Escolha **data e horário**
7. Clique em **Salvar**

✅ O sistema calcula automaticamente o horário de término baseado na duração dos serviços.', 'agenda', ARRAY['agendamento', 'criar', 'novo'], true, 3),

('Como funciona o cálculo de comissões?', 'O sistema calcula automaticamente quando um agendamento é **concluído**:

1. **Valor do serviço** × **% de comissão** = Comissão bruta
2. **Deduções opcionais:**
   - Taxa administrativa (definida nas configurações)
   - Taxa de cartão (quando pago no cartão)
3. **Resultado** = Comissão líquida do profissional

📊 Você pode ver todas as comissões em **Financeiro > Comissões**', 'financial', ARRAY['comissão', 'cálculo', 'pagamento'], true, 4),

('Como entrar em contato com o suporte?', 'Estamos aqui para ajudar! 💬

**Via Chat:**
1. Vá em **Central de Ajuda**
2. Clique em **"Abrir Chat de Suporte"**
3. Fale conosco em tempo real

**Horário de atendimento:**
- Segunda a Sexta: 9h às 18h
- Sábado: 9h às 13h

⏱️ Tempo médio de resposta: menos de 5 minutos!', 'settings', ARRAY['suporte', 'ajuda', 'contato'], true, 5),

('Como cancelar um agendamento?', 'Para cancelar:

1. Clique no agendamento na **Agenda**
2. Na página de detalhes, clique em **"Cancelar"**
3. Informe o **motivo do cancelamento** (opcional)
4. Confirme a ação

⚠️ **Importante:** Agendamentos cancelados ficam registrados no histórico do cliente e nos relatórios para análise.', 'agenda', ARRAY['cancelar', 'desmarcar'], false, 6),

('Como adicionar mais serviços a um agendamento existente?', 'Você pode adicionar serviços enquanto o agendamento estiver **confirmado**:

1. Abra o agendamento clicando nele na Agenda
2. Na seção "Serviços", clique em **"Adicionar"**
3. Selecione os serviços adicionais
4. O sistema atualiza automaticamente o valor total e o horário de término

💡 Ótimo para quando o cliente decide fazer mais serviços durante o atendimento!', 'agenda', ARRAY['serviços', 'adicionar', 'editar'], false, 7),

('O que são os bloqueios de horário?', 'Bloqueios são períodos onde o profissional **não está disponível** para atendimento:

- **Almoço ou pausas**
- **Folgas e férias**
- **Compromissos pessoais**
- **Cursos e treinamentos**

Para criar:
1. Vá em **Profissionais**
2. Clique no profissional
3. Acesse a aba **"Bloqueios"**
4. Adicione o período bloqueado

✅ Bloqueios podem ser recorrentes (ex: toda segunda-feira não trabalha).', 'agenda', ARRAY['bloqueio', 'indisponível', 'folga'], false, 8),

('Como cadastrar um novo cliente?', 'Existem duas formas:

**Forma 1 - Pela página de Clientes:**
1. Vá em **Clientes** no menu
2. Clique em **"+ Novo Cliente"**
3. Preencha nome e dados de contato

**Forma 2 - Durante o agendamento:**
1. Ao criar um agendamento, na seleção de cliente
2. Clique em **"Criar Novo"**
3. Preencha os dados rapidamente

💡 O mínimo necessário é o nome. Você pode completar os dados depois.', 'clients', ARRAY['cliente', 'cadastrar', 'novo'], false, 9),

('Como funciona o sistema de créditos do cliente?', 'Créditos são como um **saldo pré-pago** do cliente:

**Adicionar créditos:**
1. Acesse o perfil do cliente
2. Na seção de créditos, clique em **"Adicionar"**
3. Informe o valor e descrição

**Usar créditos:**
- Ao finalizar um atendimento, você pode abater do saldo
- O sistema registra todas as movimentações

💡 Ótimo para vender pacotes de serviços ou receber adiantado!', 'clients', ARRAY['crédito', 'saldo', 'pré-pago'], false, 10);