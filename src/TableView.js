import { Config } from './Config.js'

/**
 * Classe responsável por renderizar a visualização em tabela dos dados do projeto
 * Oferece uma visão tabular dos dados com funcionalidades de filtro, busca e ordenação
 */
export class TableView {
  constructor(container, projectData) {
    this.container = container
    this.projectData = projectData
    this.tasks = projectData.tasks
    this.filteredTasks = [...this.tasks]
    
    // Estado dos filtros
    this.filters = {
      search: '',
      assignedTo: '',
      bucket: '',
      status: 'all' // all, completed, in-progress, not-started
    }
    
    // Estado da ordenação
    this.sorting = {
      column: 'hierarchyLevel',
      direction: 'asc'
    }
  }

  /**
   * Renderiza a visualização completa da tabela
   */
  render() {
    console.log(`📊 Renderizando Table View: ${this.tasks.length} tarefas`)
    
    this.container.innerHTML = `
      <div class="table-view">
        <div class="table-toolbar">
          ${this.renderToolbar()}
        </div>
        <div class="table-container">
          <div class="table-wrapper">
            ${this.renderTable()}
          </div>
        </div>
      </div>
      <div class="table-footer" id="tableFooter">
        ${this.renderFooter()}
      </div>
    `
    
    this.setupEventListeners()
    console.log('✅ Table View renderizada')
  }

  /**
   * Remove o footer quando a tabela for destruída
   */
  destroy() {
    const footer = document.getElementById('tableFooter')
    if (footer) {
      footer.remove()
    }
  }

  /**
   * Renderiza a barra de ferramentas com filtros e busca
   */
  renderToolbar() {
    const uniqueAssignees = [...new Set(this.tasks.map(task => task.assignedTo).filter(a => a))]
    const uniqueBuckets = [...new Set(this.tasks.map(task => task.bucket || '').filter(b => b))]
    
    return `
      <div class="toolbar-section">
        <div class="search-section">
          <input type="text" 
                 id="searchInput" 
                 placeholder="Buscar por nome da tarefa..." 
                 value="${this.filters.search}"
                 class="search-input">
        </div>
        <div class="filter-section">
          <select id="assignedToFilter" class="filter-select">
            <option value="">Todos os responsáveis</option>
            ${uniqueAssignees.map(assignee => 
              `<option value="${assignee}" ${this.filters.assignedTo === assignee ? 'selected' : ''}>${assignee}</option>`
            ).join('')}
          </select>
          
          <select id="bucketFilter" class="filter-select">
            <option value="">Todas as categorias</option>
            ${uniqueBuckets.map(bucket => 
              `<option value="${bucket}" ${this.filters.bucket === bucket ? 'selected' : ''}>${bucket}</option>`
            ).join('')}
          </select>
          
          <select id="statusFilter" class="filter-select">
            <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>Todos os status</option>
            <option value="completed" ${this.filters.status === 'completed' ? 'selected' : ''}>Concluídas (100%)</option>
            <option value="in-progress" ${this.filters.status === 'in-progress' ? 'selected' : ''}>Em andamento</option>
            <option value="not-started" ${this.filters.status === 'not-started' ? 'selected' : ''}>Não iniciadas (0%)</option>
          </select>
        </div>
        <div class="action-section">
          <button id="exportCsvBtn" class="btn secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>
    `
  }

  /**
   * Renderiza a tabela principal
   */
  renderTable() {
    return `
      <table class="project-table">
        <thead>
          <tr>
            ${this.renderTableHeader()}
          </tr>
        </thead>
        <tbody>
          ${this.renderTableBody()}
        </tbody>
      </table>
    `
  }

  /**
   * Renderiza o cabeçalho da tabela
   */
  renderTableHeader() {
    const columns = [
      { key: 'taskNumber', label: 'Nº', sortable: true },
      { key: 'hierarchyLevel', label: 'Hierarquia', sortable: true },
      { key: 'name', label: 'Nome da Tarefa', sortable: true },
      { key: 'assignedTo', label: 'Responsável', sortable: true },
      { key: 'duration', label: 'Duração', sortable: true },
      { key: 'startDate', label: 'Início', sortable: true },
      { key: 'endDate', label: 'Conclusão', sortable: true },
      { key: 'dependsOn', label: 'Dependências', sortable: false },
      { key: 'percentComplete', label: 'Progresso', sortable: true },
      { key: 'bucket', label: 'Categoria', sortable: true }
    ]

    return columns.map(col => {
      const sortIcon = this.getSortIcon(col.key)
      const sortClass = col.sortable ? 'sortable' : ''
      return `
        <th class="table-header ${sortClass}" data-column="${col.key}">
          ${col.label}
          ${col.sortable ? sortIcon : ''}
        </th>
      `
    }).join('')
  }

  /**
   * Renderiza o corpo da tabela
   */
  renderTableBody() {
    if (this.filteredTasks.length === 0) {
      return `
        <tr>
          <td colspan="10" class="no-data">
            Nenhuma tarefa encontrada com os filtros aplicados
          </td>
        </tr>
      `
    }

    return this.filteredTasks.map(task => this.renderTableRow(task)).join('')
  }

  /**
   * Renderiza uma linha da tabela
   */
  renderTableRow(task) {
    const level = task.level || 1
    const indentation = (level - 1) * 20
    const startDateStr = task.startDate ? this.formatDate(task.startDate) : '-'
    const endDateStr = task.endDate ? this.formatDate(task.endDate) : '-'
    
    return `
      <tr class="table-row level-${level}" data-task-id="${task.id}">
        <td class="task-number">${task.taskNumber}</td>
        <td class="hierarchy-level">${task.hierarchyLevel}</td>
        <td class="task-name">
          <div class="task-name-content" style="padding-left: ${indentation}px;">
            <span class="level-indicator level-${level}"></span>
            ${task.name}
          </div>
        </td>
        <td class="assigned-to">${task.assignedTo || '-'}</td>
        <td class="duration">${task.durationText || '-'}</td>
        <td class="start-date">${startDateStr}</td>
        <td class="end-date">${endDateStr}</td>
        <td class="dependencies">${this.formatDependencies(task.dependsOn)}</td>
        <td class="progress">
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${task.percentComplete}%"></div>
            </div>
            <span class="progress-text">${task.percentComplete}%</span>
          </div>
        </td>
        <td class="bucket">${task.bucket || '-'}</td>
      </tr>
    `
  }

  /**
   * Renderiza o rodapé com estatísticas
   */
  renderFooter() {
    const total = this.filteredTasks.length
    const completed = this.filteredTasks.filter(task => task.percentComplete === 100).length
    const inProgress = this.filteredTasks.filter(task => task.percentComplete > 0 && task.percentComplete < 100).length
    const notStarted = this.filteredTasks.filter(task => task.percentComplete === 0).length
    
    return `
      <div class="table-stats">
        <span class="stat-item">Total: <strong>${total}</strong></span>
        <span class="stat-item">Concluídas: <strong>${completed}</strong></span>
        <span class="stat-item">Em andamento: <strong>${inProgress}</strong></span>
        <span class="stat-item">Não iniciadas: <strong>${notStarted}</strong></span>
        <span class="stat-item">Showing ${this.filteredTasks.length} of ${this.tasks.length} tarefas</span>
      </div>
    `
  }

  /**
   * Configura os event listeners
   */
  setupEventListeners() {
    // Busca
    const searchInput = document.getElementById('searchInput')
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value
        this.applyFilters()
      })
    }

    // Filtros
    const filterSelects = ['assignedToFilter', 'bucketFilter', 'statusFilter']
    filterSelects.forEach(filterId => {
      const select = document.getElementById(filterId)
      if (select) {
        select.addEventListener('change', (e) => {
          const filterKey = filterId.replace('Filter', '')
          this.filters[filterKey === 'assignedTo' ? 'assignedTo' : filterKey === 'bucket' ? 'bucket' : 'status'] = e.target.value
          this.applyFilters()
        })
      }
    })

    // Ordenação
    const headers = document.querySelectorAll('.table-header.sortable')
    headers.forEach(header => {
      header.addEventListener('click', () => {
        const column = header.dataset.column
        this.handleSort(column)
      })
    })

    // Export CSV
    const exportBtn = document.getElementById('exportCsvBtn')
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportToCSV()
      })
    }
  }

  /**
   * Aplica todos os filtros às tarefas
   */
  applyFilters() {
    this.filteredTasks = this.tasks.filter(task => {
      // Filtro de busca
      if (this.filters.search) {
        const searchTerm = this.filters.search.toLowerCase()
        if (!task.name.toLowerCase().includes(searchTerm)) {
          return false
        }
      }

      // Filtro por responsável
      if (this.filters.assignedTo && task.assignedTo !== this.filters.assignedTo) {
        return false
      }

      // Filtro por bucket/categoria
      if (this.filters.bucket && (task.bucket || '') !== this.filters.bucket) {
        return false
      }

      // Filtro por status
      if (this.filters.status !== 'all') {
        switch (this.filters.status) {
          case 'completed':
            if (task.percentComplete !== 100) return false
            break
          case 'in-progress':
            if (task.percentComplete === 0 || task.percentComplete === 100) return false
            break
          case 'not-started':
            if (task.percentComplete !== 0) return false
            break
        }
      }

      return true
    })

    this.applySorting()
    this.updateTable()
  }

  /**
   * Aplica ordenação às tarefas filtradas
   */
  applySorting() {
    this.filteredTasks.sort((a, b) => {
      let aValue = a[this.sorting.column]
      let bValue = b[this.sorting.column]

      // Tratamento especial para diferentes tipos de dados
      if (this.sorting.column === 'startDate' || this.sorting.column === 'endDate') {
        aValue = aValue ? new Date(aValue) : new Date(0)
        bValue = bValue ? new Date(bValue) : new Date(0)
      } else if (this.sorting.column === 'percentComplete' || this.sorting.column === 'duration') {
        aValue = parseFloat(aValue) || 0
        bValue = parseFloat(bValue) || 0
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue ? bValue.toLowerCase() : ''
      }

      let comparison = 0
      if (aValue > bValue) comparison = 1
      else if (aValue < bValue) comparison = -1

      return this.sorting.direction === 'asc' ? comparison : -comparison
    })
  }

  /**
   * Manipula a ordenação por coluna
   */
  handleSort(column) {
    if (this.sorting.column === column) {
      this.sorting.direction = this.sorting.direction === 'asc' ? 'desc' : 'asc'
    } else {
      this.sorting.column = column
      this.sorting.direction = 'asc'
    }

    this.applySorting()
    this.updateTable()
  }

  /**
   * Atualiza apenas o corpo da tabela e rodapé
   */
  updateTable() {
    const tbody = document.querySelector('.project-table tbody')
    const footer = document.querySelector('.table-footer')
    
    if (tbody) {
      tbody.innerHTML = this.renderTableBody()
    }
    
    if (footer) {
      footer.innerHTML = this.renderFooter()
    }

    // Atualiza ícones de ordenação
    this.updateSortIcons()
  }

  /**
   * Atualiza os ícones de ordenação no cabeçalho
   */
  updateSortIcons() {
    const headers = document.querySelectorAll('.table-header.sortable')
    headers.forEach(header => {
      const column = header.dataset.column
      const icon = header.querySelector('.sort-icon')
      if (icon) {
        icon.innerHTML = this.getSortIcon(column)
      }
    })
  }

  /**
   * Retorna o ícone de ordenação apropriado
   */
  getSortIcon(column) {
    if (this.sorting.column !== column) {
      return '<span class="sort-icon">↕️</span>'
    }
    return this.sorting.direction === 'asc' 
      ? '<span class="sort-icon">↑</span>' 
      : '<span class="sort-icon">↓</span>'
  }

  /**
   * Formata uma data para exibição
   */
  formatDate(date) {
    if (!date) return '-'
    
    if (typeof date === 'string') {
      const parsed = new Date(date)
      return isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('pt-BR')
    }
    
    return date.toLocaleDateString('pt-BR')
  }

  /**
   * Formata as dependências para exibição
   */
  formatDependencies(dependsOn) {
    if (!dependsOn) return '-'
    
    // Remove sufixos TI e limpa a string
    const deps = dependsOn
      .split(/[,;]/)
      .map(dep => dep.trim().replace(/TI$/, ''))
      .filter(dep => dep.length > 0)
    
    return deps.length > 0 ? deps.join(', ') : '-'
  }

  /**
   * Exporta os dados filtrados para CSV
   */
  exportToCSV() {
    const headers = [
      'Número da Tarefa',
      'Hierarquia',
      'Nome',
      'Responsável',
      'Duração',
      'Início',
      'Conclusão',
      'Dependências',
      'Progresso (%)',
      'Categoria'
    ]

    const rows = this.filteredTasks.map(task => [
      task.taskNumber,
      task.hierarchyLevel,
      task.name,
      task.assignedTo || '',
      task.durationText || '',
      this.formatDate(task.startDate),
      this.formatDate(task.endDate),
      this.formatDependencies(task.dependsOn),
      task.percentComplete,
      task.bucket || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Criar e baixar o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `${this.projectData.projectInfo.name || 'projeto'}_tarefas.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log('📊 CSV exportado com sucesso')
  }
}