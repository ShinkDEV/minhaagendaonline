

# Plano: Corrigir o Salvamento da Foto do Profissional

## Problema Identificado

A foto está sendo enviada com sucesso para o Cloudflare R2, mas **não está sendo salva no banco de dados**. 

O motivo: a edge function usa o token do usuário logado para atualizar a tabela `professionals`, mas as políticas de segurança (RLS) só permitem que **admins** façam UPDATE nessa tabela. Quando um profissional (não-admin) tenta atualizar sua própria foto, a atualização é bloqueada silenciosamente pela RLS.

## Solução

Modificar a edge function para usar o `SUPABASE_SERVICE_ROLE_KEY` na atualização do banco de dados. Isso é seguro porque:
1. A função já valida que o usuário é o próprio profissional OU um admin
2. O SERVICE_ROLE bypassa a RLS apenas após essa validação

## Mudanças Necessárias

### 1. Atualizar a Edge Function `upload-professional-avatar`

Criar um segundo cliente Supabase usando a chave de serviço para realizar o UPDATE:

```typescript
// Criar cliente admin para operações que bypassam RLS
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Usar supabaseAdmin para o UPDATE (após validação de permissão)
const { error: updateError } = await supabaseAdmin
  .from('professionals')
  .update({ avatar_url: avatarUrl })
  .eq('id', professionalId);
```

### 2. Verificar Secret Disponível

O secret `SUPABASE_SERVICE_ROLE_KEY` já está configurado no projeto.

## Resumo Técnico

| Etapa | Descrição |
|-------|-----------|
| Validação | Mantém validação com token do usuário (quem é, permissões) |
| Atualização DB | Usa SERVICE_ROLE_KEY para bypassar RLS após validação |
| Segurança | A validação manual garante que só o próprio profissional ou admin pode atualizar |

## Arquivos a Modificar

- `supabase/functions/upload-professional-avatar/index.ts` - Adicionar cliente admin e usar para UPDATE

