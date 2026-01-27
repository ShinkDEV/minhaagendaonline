# Regras para Desenvolvimento da Aplicação

Este documento descreve a stack tecnológica utilizada na aplicação e as diretrizes para o uso de bibliotecas, visando manter a consistência e a qualidade do código.

## 🚀 Stack Tecnológica

*   **Vite + React**: Framework principal para construção da interface do usuário.
*   **TypeScript**: Linguagem de programação para garantir tipagem estática e robustez.
*   **Tailwind CSS**: Framework CSS para estilização rápida e responsiva.
*   **shadcn/ui & Radix UI**: Biblioteca de componentes UI pré-construídos e acessíveis.
*   **Supabase**: Backend-as-a-Service para autenticação, banco de dados e funções de borda (Edge Functions).
*   **React Router**: Para gerenciamento de rotas na aplicação.
*   **TanStack Query (React Query)**: Para gerenciamento de estado assíncrono e cache de dados.
*   **date-fns**: Biblioteca para manipulação e formatação de datas.
*   **lucide-react**: Biblioteca de ícones.
*   **sonner**: Para notificações de toast.
*   **recharts**: Para visualização de dados em gráficos.
*   **Cloudflare Workers**: Para deploy de funções de borda (Edge Functions).

## 📚 Regras de Uso de Bibliotecas

Para garantir a consistência e a manutenibilidade do projeto, siga estas regras ao escolher e usar bibliotecas:

*   **Componentes UI**: Utilize preferencialmente os componentes do **shadcn/ui** (que são construídos sobre **Radix UI**). Se um componente necessário não existir no shadcn/ui, crie um novo componente customizado usando Tailwind CSS.
*   **Estilização**: **Sempre** utilize **Tailwind CSS** para estilização. Evite CSS customizado ou outros frameworks CSS.
*   **Roteamento**: Use **React Router** para todas as definições de rotas, mantendo-as centralizadas em `src/App.tsx`.
*   **Gerenciamento de Estado Assíncrono**: Para todas as operações de busca, mutação e cache de dados, utilize **TanStack Query (React Query)**.
*   **Backend**: Todas as interações com o backend (autenticação, banco de dados, armazenamento de arquivos, funções de borda) devem ser feitas através do **Supabase**.
*   **Manipulação de Datas**: Utilize **date-fns** para todas as operações de formatação, cálculo e comparação de datas.
*   **Ícones**: Use **lucide-react** para todos os ícones na aplicação.
*   **Notificações**: Para exibir mensagens de feedback ao usuário (sucesso, erro, informação), utilize a biblioteca **sonner** para toasts.
*   **Gráficos**: Para visualização de dados em gráficos, utilize **recharts**.
*   **Corte de Imagens**: Para funcionalidades de corte de imagens, utilize **react-easy-crop**.
*   **Funções de Borda**: As funções de borda devem ser desenvolvidas para **Cloudflare Workers** e integradas via Supabase Edge Functions.