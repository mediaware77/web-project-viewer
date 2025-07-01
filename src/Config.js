/**
 * Configurações centralizadas da aplicação
 * Centraliza todos os valores de configuração para facilitar manutenção
 */
export const Config = {
  // Configurações do Gantt Chart
  gantt: {
    dayWidth: 30,           // Largura de cada dia na timeline
    rowHeight: 40,          // Altura de cada linha de tarefa
    taskListWidth: 350,     // Largura do painel de lista de tarefas
    headerHeight: 120,      // Altura do cabeçalho da timeline
    marginDays: {
      before: 7,           // Dias de margem antes do projeto
      after: 14            // Dias de margem após o projeto
    }
  },

  // Configurações de virtualização
  virtualization: {
    enabled: true,         // Habilita virtualização para datasets grandes
    threshold: 200,        // Número mínimo de tarefas para ativar virtualização (aumentado para não interferir)
    bufferSize: 20,        // Número de itens extras para renderizar fora da viewport
    chunkSize: 50          // Tamanho do chunk para renderização em lotes
  },

  // Configurações de performance
  performance: {
    batchSize: 50,         // Tamanho do lote para operações em batch
    debounceTime: 16,      // Tempo de debounce para scroll (60fps)
    maxRenderTime: 16      // Tempo máximo de renderização por frame (ms)
  },

  // Configurações de export
  export: {
    canvas: {
      backgroundColor: '#ffffff',
      titleFont: 'bold 16px Segoe UI',
      headerFont: '14px Segoe UI',
      taskFont: '13px Segoe UI',
      barFont: '11px Segoe UI'
    },
    colors: {
      levels: ['#0078d4', '#00bcf2', '#00cc6a', '#ff9500'],
      text: '#323130',
      background: '#f8f9fa'
    }
  },

  // Configurações de UI
  ui: {
    colors: {
      primary: '#0078d4',
      secondary: '#106ebe',
      text: '#323130',
      textSecondary: '#605e5c',
      background: '#f5f5f5',
      surface: '#ffffff',
      border: '#d1d1d1',
      success: '#00cc6a',
      warning: '#ff9500',
      error: '#d13438'
    },
    animations: {
      duration: 300,        // Duração padrão das animações (ms)
      easing: 'ease'        // Easing padrão
    }
  },

  // Configurações de arquivo
  file: {
    maxSize: 50 * 1024 * 1024,  // 50MB em bytes
    supportedTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ],
    supportedExtensions: ['.xlsx', '.xls']
  },

  // Configurações de formatação
  formatting: {
    locale: 'pt-BR',
    dateFormat: 'dd/mm/yyyy',
    monthNames: [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ]
  },

  // Configurações de erro
  errors: {
    maxRetries: 3,
    retryDelay: 1000,
    messages: {
      fileInvalid: 'Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)',
      fileTooBig: 'Arquivo muito grande. Limite: 50MB',
      processingError: 'Erro ao processar o arquivo. Verifique se é um arquivo válido do Project Web.',
      exportError: 'Erro ao exportar o gráfico',
      noTasks: 'Nenhuma tarefa encontrada no arquivo',
      invalidFormat: 'Formato de arquivo não suportado'
    }
  }
}