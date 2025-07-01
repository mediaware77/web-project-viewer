# Project Gantt Viewer

Uma aplicação web moderna para visualização de cronogramas de projeto no estilo Microsoft Project. Compatível com arquivos `.xlsx` exportados do Project Web.

![Project Gantt Viewer](https://via.placeholder.com/800x400/0078d4/ffffff?text=Project+Gantt+Viewer)

## 🚀 Características

- **Interface Moderna**: Design responsivo inspirado no Microsoft Project
- **Compatibilidade**: Lê arquivos `.xlsx` exportados do Project Web
- **Visualização Gantt**: Gráfico de Gantt interativo com barras de tarefas
- **Hierarquia de Tarefas**: Suporte completo a níveis hierárquicos de tarefas
- **Dependências**: Visualização de dependências entre tarefas
- **Timeline Inteligente**: Cabeçalho com meses e dias, destacando finais de semana
- **Exportação**: Funcionalidade de exportar gráfico como PNG
- **Responsivo**: Interface adaptável para desktop e mobile

## 📋 Funcionalidades

### Upload de Arquivos
- Drag & drop de arquivos Excel
- Validação automática de formato
- Feedback visual durante o processamento

### Visualização
- Lista de tarefas com hierarquia visual
- Timeline com escala de tempo apropriada
- Barras de Gantt coloridas por nível hierárquico
- Indicadores de progresso nas barras
- Linhas de dependência entre tarefas

### Interatividade
- Scroll sincronizado entre lista e timeline
- Hover effects nas tarefas
- Tooltips informativos
- Destaque do dia atual

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

A aplicação reconhece arquivos Excel exportados do Project Web com as seguintes colunas:

- **Número de tarefa**: ID único da tarefa
- **Número do nível hierárquico**: Estrutura hierárquica (ex: 1, 1.1, 1.1.1)
- **Nome**: Nome da tarefa
- **Atribuída a**: Responsável pela tarefa
- **Duração**: Duração estimada (ex: "5 dias", "2,5 dias")
- **Início**: Data de início
- **Concluir**: Data de conclusão
- **Depende de**: IDs das tarefas predecessoras
- **% concluída**: Percentual de conclusão

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

## 📱 Responsividade

A aplicação se adapta automaticamente a diferentes tamanhos de tela:

- **Desktop**: Layout lado a lado (lista + timeline)
- **Tablet**: Layout otimizado com scroll horizontal
- **Mobile**: Layout empilhado para melhor usabilidade

## 🔍 Solução de Problemas

### Arquivo não carrega
- Verifique se o arquivo é .xlsx ou .xls
- Certifique-se de que foi exportado do Project Web
- Verifique se contém as colunas obrigatórias

### Timeline não aparece
- Verifique se as tarefas têm datas de início e fim
- Confirme o formato das datas (DD/MM/YYYY)

### Dependências não aparecem
- Verifique se a coluna "Depende de" está preenchida
- Confirme se os IDs das tarefas estão corretos

## 🚀 Extensões Futuras

- [ ] Modo de edição inline
- [ ] Múltiplos projetos
- [ ] Exportação para PDF
- [ ] Filtros e busca
- [ ] Recursos críticos
- [ ] Calendário customizável
- [ ] Integração com APIs de projeto

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