# Project Gantt Viewer

Uma aplicação web moderna para visualização de cronogramas de projeto no estilo Microsoft Project. **Compatível com arquivos Excel exportados do Microsoft Project for Web e Microsoft Planner**.

![Project Gantt Viewer](https://via.placeholder.com/800x400/0078d4/ffffff?text=Project+Gantt+Viewer)

## 🚀 Características

- **Interface Moderna**: Design responsivo inspirado no Microsoft Project com menu mobile
- **Compatibilidade Total**: Lê arquivos `.xlsx` exportados do **Microsoft Project for Web** e **Microsoft Planner**
- **Duas Visualizações**: Gráfico de Gantt interativo e visualização em tabela completa
- **Hierarquia de Tarefas**: Suporte completo a níveis hierárquicos de tarefas (até 4 níveis)
- **Dependências**: Visualização de dependências entre tarefas com setas conectivas
- **Timeline Inteligente**: Cabeçalho com meses e dias, destacando finais de semana e dia atual
- **Exportação Múltipla**: Exportar como PNG (Gantt) ou CSV (Tabela)
- **Totalmente Responsivo**: Interface adaptável com aviso inteligente para dispositivos móveis
- **Menu Mobile**: Menu hambúrguer para acesso completo em dispositivos móveis
- **Modo Desktop Forçado**: Opção para forçar layout desktop em dispositivos pequenos

## 📋 Funcionalidades

### 📁 Upload de Arquivos
- **Drag & drop** de arquivos Excel (.xlsx)
- **Validação automática** de formato e compatibilidade
- **Feedback visual** durante o processamento
- **Link de exemplo** para download de arquivo de demonstração

### 👁️ Dupla Visualização
- **Visualização Gantt**: Gráfico de Gantt clássico com barras de tarefas e timeline
- **Visualização Tabela**: Tabela completa com filtros, busca e ordenação
- **Alternância fácil** entre modos com botões de toggle

### 🎨 Visualização Gantt
- Lista de tarefas com **hierarquia visual** (até 4 níveis)
- Timeline com **escala de tempo apropriada** (meses e dias)
- **Barras coloridas** por nível hierárquico
- **Indicadores de progresso** dentro das barras
- **Linhas de dependência** com setas conectivas
- **Destaque do dia atual** na timeline

### 📊 Visualização Tabela
- **Tabela completa** com todas as informações do projeto
- **Sistema de busca** em tempo real
- **Filtros por status** e responsável
- **Ordenação** por qualquer coluna
- **Estatísticas do projeto** no rodapé

### 📱 Responsividade Inteligente
- **Detecção automática** de dispositivos móveis reais
- **Menu hambúrguer** para acesso completo em mobile
- **Layout adaptativo** para tablets e smartphones
- **Modo desktop forçado** para dispositivos pequenos
- **Aviso contextual** apenas para dispositivos móveis

### 🔄 Interatividade
- **Scroll sincronizado** entre lista e timeline
- **Hover effects** nas tarefas
- **Tooltips informativos** (planejado)
- **Zoom e pan** na timeline

## 🛠️ Tecnologias

- **Vite**: Build tool rápido e moderno
- **Vanilla JavaScript**: JavaScript puro (ES6+)
- **XLSX.js**: Biblioteca para leitura de arquivos Excel
- **CSS Grid/Flexbox**: Layout responsivo
- **Canvas API**: Exportação de imagens

## 📦 Instalação

### Pré-requisitos
- Node.js 16+ 
- npm ou yarn

### Passos

1. **Clone ou baixe os arquivos do projeto**

2. **Instale as dependências**
```bash
npm install
```

3. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

4. **Acesse a aplicação**
```
http://localhost:3000
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 📊 Formato de Dados Suportado

### 🔗 Fonte dos Arquivos
A aplicação é compatível com arquivos Excel (`.xlsx`) exportados das seguintes plataformas Microsoft:

#### **Microsoft Project for Web**
1. Acesse seu projeto no [Project for Web](https://project.microsoft.com)
2. Vá para **"Cronograma"** ou **"Timeline"**
3. Clique em **"Exportar para Excel"**
4. Faça o download do arquivo `.xlsx`

#### **Microsoft Planner**
1. Acesse seu plano no [Microsoft Planner](https://planner.microsoft.com)
2. Clique no menu **"..."** (três pontos)
3. Selecione **"Exportar plano para Excel"**
4. Faça o download do arquivo `.xlsx`

### 📋 Colunas Reconhecidas
A aplicação reconhece automaticamente as seguintes colunas (em português e inglês):

| Coluna | Português | English | Descrição |
|--------|-----------|---------|-----------|
| **ID** | Número de tarefa | Task Number | Identificador único da tarefa |
| **Hierarquia** | Número do nível hierárquico | Hierarchy Level | Estrutura hierárquica (1, 1.1, 1.1.1, etc.) |
| **Nome** | Nome | Name | Nome/título da tarefa |
| **Responsável** | Atribuída a | Assigned To | Pessoa responsável pela tarefa |
| **Duração** | Duração | Duration | Tempo estimado (ex: "5 dias", "2,5 dias") |
| **Início** | Início | Start | Data de início da tarefa |
| **Fim** | Concluir | Finish | Data de conclusão da tarefa |
| **Dependências** | Depende de | Depends On | IDs das tarefas predecessoras |
| **Progresso** | % concluída | Percent Complete | Percentual de conclusão (0-100%) |

### 📅 Formatos de Data Suportados
- `DD/MM/YYYY` (brasileiro)
- `MM/DD/YYYY` (americano)
- `YYYY-MM-DD` (ISO)
- Datas do Excel (formato numérico)

## 🎨 Personalização

### Cores das Barras
As barras são coloridas automaticamente baseadas no nível hierárquico:

- **Nível 1**: Azul escuro (tarefas principais)
- **Nível 2**: Azul claro (subtarefas)
- **Nível 3**: Verde (tarefas detalhadas)
- **Nível 4**: Laranja (tarefas específicas)

### Configurações
Você pode modificar as configurações no arquivo `src/GanttChart.js`:

```javascript
// Largura de cada dia na timeline
this.dayWidth = 30

// Altura de cada linha de tarefa
this.rowHeight = 40

// Largura da lista de tarefas
this.taskListWidth = 350
```

## 📱 Responsividade Inteligente

A aplicação possui um sistema de responsividade inteligente que se adapta perfeitamente a diferentes dispositivos:

### 🖥️ **Desktop (> 1024px)**
- **Layout completo**: Lista de tarefas e timeline lado a lado
- **Toolbar completa**: Todos os botões visíveis
- **Interação rica**: Hover effects e tooltips completos

### 📱 **Tablet (768px - 1024px)**
- **Layout otimizado**: Colunas ajustadas para melhor visualização
- **Timeline compacta**: Dias mais estreitos (25px vs 30px)
- **Menu adaptativo**: Botões reorganizados

### 📲 **Mobile (< 768px)**
- **Menu hambúrguer**: Acesso completo via menu lateral deslizante
- **Layout empilhado**: Lista de tarefas acima da timeline
- **Timeline mobile**: Colunas ultra-compactas (20px) com scroll horizontal otimizado
- **Detecção inteligente**: Aviso contextual apenas para dispositivos móveis reais

### 🎯 **Aviso Inteligente**
- **Detecção precisa**: Diferencia notebooks de smartphones
- **User Agent + Touch**: Combina múltiplos indicadores para detecção
- **Mensagens contextuais**: Dicas específicas por tipo de dispositivo
- **Modo desktop forçado**: Opção para usar layout completo em qualquer tela

## 🔍 Solução de Problemas

### 📁 **Arquivo não carrega**
- ✅ Verifique se o arquivo é `.xlsx` (formato mais recente)
- ✅ Certifique-se de que foi exportado do **Microsoft Project for Web** ou **Microsoft Planner**
- ✅ Confirme se o arquivo não está corrompido (tente abrir no Excel)
- ✅ Verifique se contém pelo menos as colunas: Nome, Início, Fim

### 📅 **Timeline não aparece**
- ✅ Verifique se as tarefas têm **datas de início e fim** preenchidas
- ✅ Confirme se o formato das datas está correto (DD/MM/YYYY, MM/DD/YYYY ou ISO)
- ✅ Certifique-se de que as datas estão em um intervalo razoável (não muito antigas/futuras)

### 🔗 **Dependências não aparecem**
- ✅ Verifique se a coluna **"Depende de"** ou **"Depends On"** está preenchida
- ✅ Confirme se os IDs das tarefas estão corretos (ex: "1TI,3TI")
- ✅ Certifique-se de que as tarefas referenciadas existem

### 📱 **Problemas de responsividade**
- ✅ Se o aviso aparece indevidamente, verifique o user agent do navegador
- ✅ Para forçar modo desktop, use o botão **"Forçar modo desktop"** no aviso
- ✅ Em dispositivos touch, experimente a orientação paisagem

### 🖥️ **Performance lenta**
- ✅ Para projetos grandes (>200 tarefas), a virtualização é ativada automaticamente
- ✅ Use a **visualização tabela** para navegação rápida em projetos grandes
- ✅ Considere dividir projetos muito grandes em múltiplos arquivos

## 🚀 Roadmap / Extensões Futuras

### 🎯 **Próximas Features**
- [ ] **Tooltips informativos**: Detalhes da tarefa ao passar o mouse
- [ ] **Zoom da timeline**: Controle de escala temporal (dias/semanas/meses)
- [ ] **Filtros avançados**: Por responsável, status, data, etc.
- [ ] **Busca inteligente**: Busca em tempo real por qualquer campo

### 🔧 **Melhorias Técnicas**
- [ ] **Modo de edição inline**: Editar tarefas diretamente na interface
- [ ] **Múltiplos projetos**: Carregar e comparar vários projetos
- [ ] **Exportação PDF**: Gerar relatórios em PDF
- [ ] **Calendário customizável**: Definir feriados e horários de trabalho

### 🌐 **Integrações**
- [ ] **Microsoft Graph API**: Conectar diretamente com Project for Web
- [ ] **Azure DevOps**: Importar work items e sprints
- [ ] **Slack/Teams**: Notificações de marcos e deadlines
- [ ] **SharePoint**: Integração com listas e bibliotecas

### 📊 **Analytics & Relatórios**
- [ ] **Dashboard executivo**: Métricas e KPIs do projeto
- [ ] **Análise de caminho crítico**: Identificar tarefas críticas
- [ ] **Relatórios de progresso**: Acompanhamento temporal
- [ ] **Previsão de entrega**: Machine learning para estimativas

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório ou entre em contato.

---

Desenvolvido com ❤️ para facilitar o gerenciamento visual de projetos.