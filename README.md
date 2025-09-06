# Finmoni API

Uma API financeira construída com NestJS, Prisma e PostgreSQL, totalmente containerizada com Docker.

## 📋 Pré-requisitos

- Docker
- Docker Compose
- Git

## 🚀 Configuração Inicial

### 1. Clone e Configure o Projeto

```bash
# Clone o repositório
git clone <seu-repositorio>
cd finmoni-api

# Copie o arquivo de ambiente
cp .env.example .env
```

### 2. Inicie a Aplicação

```bash
# Subir todos os serviços (banco + aplicação)
docker-compose up -d
```

### 3. Verifique se Funcionou

- **API**: http://localhost:3000
- **Banco**: localhost:5433
- **Status**: `docker-compose ps`

## 🔧 Comandos Essenciais

### **Gerenciamento Básico**

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f app

# Ver status dos containers
docker-compose ps

# Parar todos os serviços
docker-compose down

# Reiniciar apenas a aplicação
docker-compose restart app
```

### **Desenvolvimento no Dia a Dia**

```bash
# Ver logs da aplicação (para acompanhar mudanças)
docker-compose logs -f app

# Rebuild após mudanças no package.json
docker-compose build app
docker-compose up -d

# Limpar volumes (cuidado: apaga dados do banco)
docker-compose down -v
```

## 🗄️ Comandos do Banco de Dados (Prisma)

### **Executar Comandos Prisma**

```bash
# Gerar Prisma Client após mudanças no schema
docker-compose exec app npx prisma generate

# Aplicar mudanças no banco (development)
docker-compose exec app npx prisma db push

# Criar e aplicar migration
docker-compose exec app npx prisma migrate dev --name nome_da_migration

# Abrir Prisma Studio (interface visual do banco)
docker-compose exec app npx prisma studio
```

### **Exemplo de Workflow com Banco**

```bash
# 1. Editar prisma/schema.prisma (adicionar models)
# 2. Gerar client
docker-compose exec app npx prisma generate

# 3. Aplicar no banco
docker-compose exec app npx prisma db push
```

## 💻 Desenvolvimento

### **Como Funciona o Hot Reload**

1. **Edite** qualquer arquivo `.ts`
2. **Salve** o arquivo
3. **Aguarde** o log mostrar restart (2-3 segundos)
4. **Recarregue** o browser manualmente (F5)

### **Estrutura de Desenvolvimento**

```
src/
├── prisma/          # Configuração do Prisma
├── modules/         # Seus módulos (criar conforme necessário)
├── app.module.ts    # Módulo principal
└── main.ts          # Bootstrap da aplicação
```

### **Adicionando Novos Módulos**

```bash
# Executar comando NestJS dentro do container
docker-compose exec app npx nest generate module users
docker-compose exec app npx nest generate controller users
docker-compose exec app npx nest generate service users
```

## 🔍 Troubleshooting

### **Problemas Comuns**

#### **Porta já em uso**
```bash
# Verificar quem está usando a porta
lsof -i :3000
lsof -i :5433

# Mudar porta no docker-compose.yml se necessário
```

#### **Container não inicia**
```bash
# Ver logs de erro
docker-compose logs app
docker-compose logs postgres

# Rebuild forçado
docker-compose build --no-cache app
```

#### **Erro de permissão/volumes**
```bash
# Parar tudo e limpar
docker-compose down -v
docker system prune -f

# Subir novamente
docker-compose up -d
```

#### **Mudanças não aparecem**
```bash
# 1. Verificar se o container reiniciou
docker-compose logs -f app

# 2. Verificar se o arquivo foi salvo
# 3. Recarregar o browser manualmente

# 4. Se não funcionar, restart manual
docker-compose restart app
```

### **Banco de Dados não Conecta**

```bash
# Verificar se postgres está rodando
docker-compose ps

# Testar conexão
docker-compose exec app npx prisma db push

# Verificar variáveis de ambiente
docker-compose exec app printenv | grep DATABASE_URL
```

## 📦 Comandos de Limpeza

```bash
# Parar e remover containers
docker-compose down

# Remover containers + volumes (CUIDADO: apaga dados)
docker-compose down -v

# Limpeza geral do Docker
docker system prune -f

# Rebuild completo
docker-compose build --no-cache
docker-compose up -d
```

## 🛠️ Scripts Disponíveis

```bash
# Dentro do container (docker-compose exec app <comando>)
npm run start:dev      # Modo desenvolvimento
npm run start:prod     # Modo produção  
npm run build          # Build da aplicação
npm run lint           # Executar linting
npm run format         # Formatar código
npm run test           # Executar testes

# Prisma
npx prisma generate    # Gerar client
npx prisma db push     # Aplicar schema no banco
npx prisma migrate dev # Criar migration
npx prisma studio      # Interface visual
```

## 🔐 Variáveis de Ambiente

### **Arquivo .env**
```env
# Database
DATABASE_URL="postgresql://finmoni:finmoni123@postgres:5432/finmoni_db?schema=public"

# Application
NODE_ENV=development
PORT=3000

# JWT (quando implementar autenticação)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
```

### **Para Produção**
- Altere credenciais do banco
- Configure `NODE_ENV=production`
- Use secrets seguros para JWT

## 📚 Workflow Típico de Desenvolvimento

### **Início do Dia**
```bash
# 1. Subir a aplicação
docker-compose up -d

# 2. Acompanhar logs
docker-compose logs -f app
```

### **Durante o Desenvolvimento**
```bash
# Editar código → Salvar → Aguardar restart → Recarregar browser
# Ver logs: docker-compose logs -f app
```

### **Mudanças no Banco**
```bash
# 1. Editar prisma/schema.prisma
# 2. Aplicar: docker-compose exec app npx prisma db push
# 3. Gerar client: docker-compose exec app npx prisma generate
```

### **Final do Dia**
```bash
# Parar aplicação (mantém dados)
docker-compose down
```

## 🆘 Comandos de Emergência

```bash
# Aplicação não responde
docker-compose restart app

# Banco de dados corrompido
docker-compose down -v
docker-compose up -d

# Reset completo
docker-compose down -v
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

## 📖 Próximos Passos

1. **Adicionar Models**: Edite `prisma/schema.prisma`
2. **Criar Módulos**: Use `npx nest generate`
3. **Implementar Autenticação**: JWT + Guards
4. **Testes**: Configure Jest para testes unitários
5. **Deploy**: Configure Docker para produção

## 🤝 Contribuição

1. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
2. Desenvolva usando Docker: `docker-compose up -d`
3. Teste suas mudanças
4. Commit: `git commit -m "Adiciona nova funcionalidade"`
5. Push: `git push origin feature/nova-funcionalidade`

## 📞 Suporte

- **Logs**: `docker-compose logs -f app`
- **Status**: `docker-compose ps`
- **Rebuild**: `docker-compose build app`

---

**Lembre-se**: Sempre use Docker! Evite instalar Node.js localmente para manter consistência. 🐳