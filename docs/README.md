# Documentação do RideConnect

Esta pasta contém toda a documentação técnica do projeto RideConnect.

## Documentos Disponíveis

### [Sistema Administrativo](./ADMIN_SYSTEM.md)

Documentação completa do sistema administrativo, incluindo:
- Arquitetura e políticas RLS
- Como usar o painel admin
- Estrutura de arquivos
- Segurança e boas práticas
- Troubleshooting

## Estrutura do Projeto

```
ride-connect-your-pack-1/
├── docs/                    # Documentação
│   ├── README.md           # Este arquivo
│   └── ADMIN_SYSTEM.md    # Sistema administrativo
├── src/
│   ├── components/        # Componentes React
│   ├── hooks/             # Hooks customizados
│   ├── pages/             # Páginas da aplicação
│   └── integrations/      # Integrações (Supabase)
└── supabase/
    ├── migrations/        # Migrations do banco
    └── scripts/          # Scripts SQL utilitários
```

## Links Úteis

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Projeto Supabase**: `qrvwebwwzjwqomgfeydt`
- **Painel Admin**: `/admin` (requer role de admin)

## Como Contribuir

1. Leia a documentação relevante antes de fazer alterações
2. Siga os padrões de código estabelecidos
3. Documente novas funcionalidades
4. Teste as alterações antes de fazer commit
