import { Config } from './Config.js'

/**
 * Classe responsável por renderizar o gráfico de Gantt
 * Cria visualização interativa com timeline, barras de tarefas e dependências
 * Implementa virtualização para otimizar performance com datasets grandes
 */
export class GanttChart {
  constructor(container, projectData) {
    this.container = container
    this.projectData = projectData
    this.tasks = projectData.tasks
    
    // Configurações do gráfico (vindas do Config)
    this.dayWidth = Config.gantt.dayWidth
    this.rowHeight = Config.gantt.rowHeight
    this.taskListWidth = Config.gantt.taskListWidth
    this.headerHeight = Config.gantt.headerHeight
    
    // Elementos DOM
    this.taskList = null
    this.timeline = null
    this.timelineHeader = null
    this.timelineBody = null
    
    // Dados de timeline
    this.startDate = null
    this.endDate = null
    this.totalDays = 0
    this.days = []
    
    // Virtualização
    this.isVirtualized = this.tasks.length >= Config.virtualization.threshold
    this.visibleRange = { start: 0, end: 0 }
    this.visibleTasks = []
    this.renderQueue = []
    this.isRendering = false
    
    // Scroll debouncing
    this.scrollTimeout = null
    this.lastScrollTime = 0
  }

  /**
   * Renderiza o gráfico completo
   */
  render() {
    console.log(`🎨 Renderizando Gantt Chart: ${this.tasks.length} tarefas`)
    console.log(`   Threshold de virtualização: ${Config.virtualization.threshold}`)
    console.log(`   Virtualização: ${this.isVirtualized ? 'ATIVA' : 'INATIVA'}`)
    
    this.calculateTimeRange()
    this.createStructure()
    
    if (this.isVirtualized) {
      console.log('🚀 Usando renderização virtualizada')
      this.initializeVirtualization()
      this.renderVirtualizedContent()
    } else {
      console.log('⚡ Usando renderização padrão - TODAS as tarefas serão renderizadas')
      this.renderTaskList()
      this.renderTimeline()
      this.renderGanttBars()
      this.renderDependencies()
    }
    
    this.setupScrollSync()
    console.log(`✅ Gantt Chart renderizado: ${this.isVirtualized ? 'Virtualizado' : 'Completo'}`)
  }

  /**
   * Calcula o intervalo de tempo do projeto
   */
  calculateTimeRange() {
    let minDate = null
    let maxDate = null

    // Encontra datas mínima e máxima
    this.tasks.forEach(task => {
      if (task.startDate) {
        if (!minDate || task.startDate < minDate) {
          minDate = task.startDate
        }
      }
      if (task.endDate) {
        if (!maxDate || task.endDate > maxDate) {
          maxDate = task.endDate
        }
      }
    })

    // Se não encontrou datas nas tarefas, usa datas do projeto
    if (!minDate && this.projectData.projectInfo.calculatedStartDate) {
      minDate = this.projectData.projectInfo.calculatedStartDate
    }
    if (!maxDate && this.projectData.projectInfo.calculatedEndDate) {
      maxDate = this.projectData.projectInfo.calculatedEndDate
    }

    // Fallback para data atual se não encontrou nada
    if (!minDate) {
      minDate = new Date()
      minDate.setDate(minDate.getDate() - 30)
    }
    if (!maxDate) {
      maxDate = new Date()
      maxDate.setDate(maxDate.getDate() + 90)
    }

    // Adiciona margem
    this.startDate = new Date(minDate)
    this.startDate.setDate(this.startDate.getDate() - 7)
    
    this.endDate = new Date(maxDate)
    this.endDate.setDate(this.endDate.getDate() + 14)

    // Calcula total de dias e gera array de dias
    this.totalDays = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24))
    this.generateDaysArray()
  }

  /**
   * Gera array com todos os dias do período
   */
  generateDaysArray() {
    this.days = []
    const currentDate = new Date(this.startDate)
    
    for (let i = 0; i < this.totalDays; i++) {
      this.days.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        dayOfWeek: currentDate.getDay(),
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
        isToday: this.isToday(currentDate)
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  /**
   * Verifica se a data é hoje
   */
  isToday(date) {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  /**
   * Cria a estrutura HTML do gráfico
   */
  createStructure() {
    this.container.innerHTML = `
      <div class="task-list" id="taskList">
        <div class="task-list-header">Tarefas do Projeto</div>
        <div class="task-list-body" id="taskListBody"></div>
      </div>
      
      <div class="timeline-container" id="timelineContainer">
        <div class="timeline-header" id="timelineHeader"></div>
        <div class="timeline-body" id="timelineBody"></div>
      </div>
    `

    this.taskList = document.getElementById('taskList')
    this.timeline = document.getElementById('timelineContainer')
    this.timelineHeader = document.getElementById('timelineHeader')
    this.timelineBody = document.getElementById('timelineBody')
  }

  /**
   * Renderiza a lista de tarefas
   */
  renderTaskList() {
    const taskListBody = document.getElementById('taskListBody')
    
    // Usa batching para datasets grandes
    if (this.tasks.length > Config.performance.batchSize) {
      this.renderTaskListBatched(taskListBody)
    } else {
      this.renderTaskListDirect(taskListBody)
    }
  }

  /**
   * Renderização direta para datasets pequenos
   */
  renderTaskListDirect(container) {
    const tasksHTML = this.tasks.map(task => `
      <div class="task-item" data-task-id="${task.id}" title="${task.name}">
        <span class="task-hierarchy">${task.hierarchyLevel}</span>
        <span class="task-name level-${task.level}">${task.name}</span>
        <span class="task-duration">${task.durationText}</span>
      </div>
    `).join('')

    container.innerHTML = tasksHTML
    
    // Debug: confirma quantas tarefas foram renderizadas
    console.log(`📋 TaskList renderizada: ${this.tasks.length} tarefas`)
    console.log(`   Primeira: ${this.tasks[0]?.hierarchyLevel} - ${this.tasks[0]?.name}`)
    console.log(`   Última: ${this.tasks[this.tasks.length - 1]?.hierarchyLevel} - ${this.tasks[this.tasks.length - 1]?.name}`)
  }

  /**
   * Renderização em lotes para datasets grandes
   */
  renderTaskListBatched(container) {
    container.innerHTML = '' // Limpa container
    
    const fragments = []
    const batchSize = Config.performance.batchSize
    
    // Processa em lotes
    for (let i = 0; i < this.tasks.length; i += batchSize) {
      const batch = this.tasks.slice(i, i + batchSize)
      const fragment = document.createDocumentFragment()
      
      batch.forEach(task => {
        const taskElement = document.createElement('div')
        taskElement.className = 'task-item'
        taskElement.dataset.taskId = task.id
        taskElement.title = task.name
        taskElement.innerHTML = `
          <span class="task-hierarchy">${task.hierarchyLevel}</span>
          <span class="task-name level-${task.level}">${task.name}</span>
          <span class="task-duration">${task.durationText}</span>
        `
        fragment.appendChild(taskElement)
      })
      
      fragments.push(fragment)
    }
    
    // Adiciona fragments de forma assíncrona
    this.appendFragmentsBatched(container, fragments)
  }

  /**
   * Adiciona fragments em lotes usando requestAnimationFrame
   */
  appendFragmentsBatched(container, fragments, callback = null) {
    if (fragments.length === 0) {
      if (callback) callback()
      return
    }
    
    const processNextBatch = () => {
      const startTime = performance.now()
      
      while (fragments.length > 0 && (performance.now() - startTime) < Config.performance.maxRenderTime) {
        const fragment = fragments.shift()
        container.appendChild(fragment)
      }
      
      if (fragments.length > 0) {
        requestAnimationFrame(processNextBatch)
      } else if (callback) {
        // Executa callback quando todos os fragments foram inseridos
        callback()
      }
    }
    
    requestAnimationFrame(processNextBatch)
  }

  /**
   * Renderiza o cabeçalho e corpo da timeline
   */
  renderTimeline() {
    this.renderTimelineHeader()
    this.renderTimelineRows()
    this.ensureHeightSynchronization()
  }

  /**
   * Garante sincronização de altura entre task-list-body e timeline-body
   */
  ensureHeightSynchronization() {
    const totalHeight = this.tasks.length * this.rowHeight
    const taskListBody = document.getElementById('taskListBody')
    
    // Define altura mínima para ambos os painéis
    if (this.timelineBody) {
      this.timelineBody.style.minHeight = `${totalHeight}px`
    }
    
    if (taskListBody) {
      taskListBody.style.minHeight = `${totalHeight}px`
    }
    
    // Log para debug em casos de muitas tarefas
    if (this.tasks.length > 100) {
      console.log(`🔧 Sincronização de altura: ${this.tasks.length} tarefas × ${this.rowHeight}px = ${totalHeight}px`)
    }
  }

  /**
   * Renderiza o cabeçalho da timeline (meses e dias)
   */
  renderTimelineHeader() {
    // Agrupa dias por mês
    const monthGroups = this.groupDaysByMonth()
    
    // Renderiza meses
    const monthsHTML = monthGroups.map(group => `
      <div class="month-header" style="width: ${group.days * this.dayWidth}px;">
        ${this.getMonthName(group.month)} ${group.year}
      </div>
    `).join('')

    // Renderiza dias
    const daysHTML = this.days.map(day => `
      <div class="day-header ${day.isWeekend ? 'weekend' : ''} ${day.isToday ? 'today' : ''}" 
           style="width: ${this.dayWidth}px;">
        ${day.day}
      </div>
    `).join('')

    this.timelineHeader.innerHTML = `
      <div class="timeline-months">${monthsHTML}</div>
      <div class="timeline-days">${daysHTML}</div>
    `
    
    // Define largura mínima do header para scroll horizontal
    const totalWidth = this.totalDays * this.dayWidth
    this.timelineHeader.style.minWidth = `${totalWidth}px`
  }

  /**
   * Agrupa dias por mês para o cabeçalho
   */
  groupDaysByMonth() {
    const groups = []
    let currentGroup = null

    this.days.forEach(day => {
      if (!currentGroup || currentGroup.month !== day.month || currentGroup.year !== day.year) {
        currentGroup = {
          month: day.month,
          year: day.year,
          days: 1
        }
        groups.push(currentGroup)
      } else {
        currentGroup.days++
      }
    })

    return groups
  }

  /**
   * Retorna nome do mês
   */
  getMonthName(monthIndex) {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ]
    return months[monthIndex]
  }

  /**
   * Renderiza as linhas da timeline
   */
  renderTimelineRows() {
    // Usa batching para datasets grandes
    if (this.tasks.length > Config.performance.batchSize) {
      this.renderTimelineRowsBatched()
    } else {
      this.renderTimelineRowsDirect()
    }
    
    // Define largura total e altura sincronizada
    const totalWidth = this.totalDays * this.dayWidth
    const totalHeight = this.tasks.length * this.rowHeight
    this.timelineBody.style.minWidth = `${totalWidth}px`
    this.timelineBody.style.minHeight = `${totalHeight}px`
    
    // Sincroniza altura da lista de tarefas no modo padrão
    const taskListBody = document.getElementById('taskListBody')
    if (taskListBody) {
      taskListBody.style.minHeight = `${totalHeight}px`
    }
  }

  /**
   * Renderização direta das linhas da timeline
   */
  renderTimelineRowsDirect() {
    const rowsHTML = this.tasks.map((task, index) => {
      const daysHTML = this.days.map(day => `
        <div class="day-cell ${day.isWeekend ? 'weekend' : ''} ${day.isToday ? 'today' : ''}"></div>
      `).join('')

      return `
        <div class="timeline-row" data-task-id="${task.id}" style="height: ${this.rowHeight}px;">
          ${daysHTML}
        </div>
      `
    }).join('')

    this.timelineBody.innerHTML = rowsHTML
  }

  /**
   * Renderização em lotes das linhas da timeline
   */
  renderTimelineRowsBatched() {
    this.timelineBody.innerHTML = '' // Limpa container
    
    const fragments = []
    const batchSize = Config.performance.batchSize
    
    // Pre-computa HTML dos dias para reutilização
    const daysCellsHTML = this.days.map(day => `
      <div class="day-cell ${day.isWeekend ? 'weekend' : ''} ${day.isToday ? 'today' : ''}"></div>
    `).join('')
    
    // Processa em lotes
    for (let i = 0; i < this.tasks.length; i += batchSize) {
      const batch = this.tasks.slice(i, i + batchSize)
      const fragment = document.createDocumentFragment()
      
      batch.forEach(task => {
        const rowElement = document.createElement('div')
        rowElement.className = 'timeline-row'
        rowElement.dataset.taskId = task.id
        rowElement.style.height = `${this.rowHeight}px`
        rowElement.innerHTML = daysCellsHTML
        fragment.appendChild(rowElement)
      })
      
      fragments.push(fragment)
    }
    
    // Adiciona fragments de forma assíncrona e define altura após inserção
    this.appendFragmentsBatched(this.timelineBody, fragments, () => {
      // Callback para definir altura após inserção dos fragments
      const totalHeight = this.tasks.length * this.rowHeight
      this.timelineBody.style.minHeight = `${totalHeight}px`
      
      // Sincroniza altura da lista de tarefas
      const taskListBody = document.getElementById('taskListBody')
      if (taskListBody) {
        taskListBody.style.minHeight = `${totalHeight}px`
      }
    })
  }

  /**
   * Renderiza as barras do gráfico de Gantt
   */
  renderGanttBars() {
    // Filtra tarefas com datas válidas
    const tasksWithDates = this.tasks
      .map((task, index) => ({ task, index }))
      .filter(({ task }) => task.startDate && task.endDate)
    
    // Usa batching para datasets grandes
    if (tasksWithDates.length > Config.performance.batchSize) {
      this.renderGanttBarsBatched(tasksWithDates)
    } else {
      this.renderGanttBarsDirect(tasksWithDates)
    }
  }

  /**
   * Renderização direta das barras de Gantt
   */
  renderGanttBarsDirect(tasksWithDates) {
    tasksWithDates.forEach(({ task, index }) => {
      this.createGanttBar(task, index)
    })
    
    // Debug: confirma quantas barras foram renderizadas
    console.log(`📊 Barras de Gantt renderizadas: ${tasksWithDates.length} de ${this.tasks.length} tarefas`)
    if (tasksWithDates.length > 0) {
      const firstTask = tasksWithDates[0].task
      const lastTask = tasksWithDates[tasksWithDates.length - 1].task
      console.log(`   Primeira barra: ${firstTask.hierarchyLevel} - ${firstTask.name}`)
      console.log(`   Última barra: ${lastTask.hierarchyLevel} - ${lastTask.name}`)
    }
  }

  /**
   * Renderização em lotes das barras de Gantt
   */
  renderGanttBarsBatched(tasksWithDates) {
    const batchSize = Config.performance.batchSize
    let currentIndex = 0
    
    const processBatch = () => {
      const startTime = performance.now()
      
      while (currentIndex < tasksWithDates.length && (performance.now() - startTime) < Config.performance.maxRenderTime) {
        const { task, index } = tasksWithDates[currentIndex]
        this.createGanttBar(task, index)
        currentIndex++
      }
      
      if (currentIndex < tasksWithDates.length) {
        requestAnimationFrame(processBatch)
      }
    }
    
    requestAnimationFrame(processBatch)
  }

  /**
   * Cria uma barra de Gantt para uma tarefa
   */
  createGanttBar(task, rowIndex) {
    const startX = this.getDatePosition(task.startDate)
    const endX = this.getDatePosition(task.endDate)
    const width = Math.max(endX - startX + this.dayWidth, this.dayWidth)

    const progressWidth = (width * task.percentComplete) / 100

    const bar = document.createElement('div')
    bar.className = `gantt-bar level-${task.level}`
    bar.style.left = `${startX}px`
    bar.style.width = `${width}px`
    bar.dataset.taskId = task.id
    
    bar.innerHTML = `
      <div class="gantt-bar-progress" style="width: ${progressWidth}px;"></div>
      <div class="gantt-bar-content">${task.name}</div>
    `

    // Adiciona tooltip
    bar.title = `${task.name}\nInício: ${this.formatDate(task.startDate)}\nFim: ${this.formatDate(task.endDate)}\nDuração: ${task.durationText}\nProgresso: ${task.percentComplete}%`

    // Adiciona evento de clique
    bar.addEventListener('click', () => this.onTaskClick(task))

    // Adiciona à linha correspondente
    const timelineRow = this.timelineBody.children[rowIndex]
    timelineRow.appendChild(bar)
  }

  /**
   * Calcula a posição X de uma data na timeline
   */
  getDatePosition(date) {
    const daysDiff = Math.floor((date - this.startDate) / (1000 * 60 * 60 * 24))
    return daysDiff * this.dayWidth
  }

  /**
   * Formata data para exibição
   */
  formatDate(date) {
    return date.toLocaleDateString('pt-BR')
  }

  /**
   * Renderiza linhas de dependência
   */
  renderDependencies() {
    // Cria SVG para as linhas de dependência
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('class', 'dependency-line')
    svg.style.position = 'absolute'
    svg.style.top = '0'
    svg.style.left = '0'
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.style.pointerEvents = 'none'
    svg.style.zIndex = '3'

    // Adiciona definição da seta
    svg.innerHTML = `
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#605e5c" />
        </marker>
      </defs>
    `

    this.timelineBody.appendChild(svg)

    // Desenha linhas de dependência
    this.tasks.forEach((task, taskIndex) => {
      if (task.dependencies.length > 0) {
        task.dependencies.forEach(depId => {
          const depTask = this.tasks.find(t => t.id === depId)
          const depIndex = this.tasks.indexOf(depTask)
          
          if (depTask && depIndex !== -1) {
            this.drawDependencyLine(svg, depIndex, taskIndex, depTask, task)
          }
        })
      }
    })
  }

  /**
   * Desenha uma linha de dependência entre duas tarefas
   */
  drawDependencyLine(svg, fromIndex, toIndex, fromTask, toTask) {
    if (!fromTask.endDate || !toTask.startDate) return

    const fromX = this.getDatePosition(fromTask.endDate) + this.dayWidth
    const fromY = (fromIndex + 0.5) * this.rowHeight
    
    const toX = this.getDatePosition(toTask.startDate)
    const toY = (toIndex + 0.5) * this.rowHeight

    // Cria linha em L
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    const midX = fromX + 20
    
    path.setAttribute('d', `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`)
    path.setAttribute('class', 'dependency-arrow')
    
    svg.appendChild(path)
  }

  /**
   * Sincroniza scroll entre lista de tarefas e timeline
   */
  setupScrollSync() {
    const taskListBody = document.getElementById('taskListBody')
    const timelineContainer = document.getElementById('timelineContainer')
    
    if (!taskListBody || !this.timelineBody || !timelineContainer) {
      console.warn('⚠️ Elementos para sincronização de scroll não encontrados')
      return
    }
    
    // Flag para evitar loop infinito de sincronização
    let syncInProgress = false
    
    // Scroll vertical do timeline-body sincroniza com task-list-body
    this.timelineBody.addEventListener('scroll', () => {
      if (syncInProgress) return
      syncInProgress = true
      
      // Sincroniza scroll vertical
      taskListBody.scrollTop = this.timelineBody.scrollTop
      
      // Atualiza viewport virtual se ativado
      if (this.isVirtualized) {
        this.updateVirtualViewport()
      }
      
      syncInProgress = false
    })

    // Scroll vertical do task-list-body sincroniza com timeline-body
    taskListBody.addEventListener('scroll', () => {
      if (syncInProgress) return
      syncInProgress = true
      
      this.timelineBody.scrollTop = taskListBody.scrollTop
      
      // Atualiza viewport virtual se ativado
      if (this.isVirtualized) {
        this.updateVirtualViewport()
      }
      
      syncInProgress = false
    })
    
    // Scroll horizontal do timeline-container (não precisa sincronização adicional, 
    // pois o header faz parte do mesmo container e acompanha automaticamente)
  }

  /**
   * Manipula clique em tarefa
   */
  onTaskClick(task) {
    console.log('Tarefa clicada:', task)
    // Aqui pode ser implementada funcionalidade adicional como modal de detalhes
  }

  /**
   * Exporta o gráfico como PNG
   */
  exportAsPNG() {
    // Cria canvas temporário
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Define dimensões
    const totalWidth = this.taskListWidth + (this.totalDays * this.dayWidth)
    const totalHeight = 120 + (this.tasks.length * this.rowHeight) // 120 = header height
    
    canvas.width = totalWidth
    canvas.height = totalHeight
    
    // Configurações de desenho
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, totalWidth, totalHeight)
    
    // Desenha título
    ctx.fillStyle = '#323130'
    ctx.font = 'bold 16px Segoe UI'
    ctx.fillText(this.projectData.projectInfo.name, 20, 30)
    
    // Implementação básica de exportação
    try {
      // Desenha cabeçalho da lista de tarefas
      ctx.fillStyle = '#f8f9fa'
      ctx.fillRect(0, 60, this.taskListWidth, 60)
      
      ctx.fillStyle = '#323130'
      ctx.font = '14px Segoe UI'
      ctx.fillText('Tarefas do Projeto', 12, 85)
      
      // Desenha timeline header
      ctx.fillRect(this.taskListWidth, 60, this.totalDays * this.dayWidth, 60)
      
      // Desenha tarefas e barras
      this.tasks.forEach((task, index) => {
        const y = 120 + (index * this.rowHeight)
        
        // Desenha nome da tarefa
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, y, this.taskListWidth, this.rowHeight)
        
        ctx.fillStyle = '#323130'
        ctx.font = '13px Segoe UI'
        const taskText = `${task.hierarchyLevel} ${task.name}`
        ctx.fillText(taskText.substring(0, 40), 12, y + 25)
        
        // Desenha barra de Gantt se houver datas
        if (task.startDate && task.endDate) {
          const startX = this.taskListWidth + this.getDatePosition(task.startDate)
          const endX = this.taskListWidth + this.getDatePosition(task.endDate)
          const width = Math.max(endX - startX + this.dayWidth, this.dayWidth)
          
          // Define cor baseada no nível
          const colors = ['#0078d4', '#00bcf2', '#00cc6a', '#ff9500']
          ctx.fillStyle = colors[Math.min(task.level - 1, 3)]
          ctx.fillRect(startX, y + 8, width, 24)
          
          // Desenha texto da barra
          ctx.fillStyle = '#ffffff'
          ctx.font = '11px Segoe UI'
          const barText = task.name.substring(0, Math.floor(width / 8))
          ctx.fillText(barText, startX + 8, y + 22)
        }
      })
      
      // Cria link para download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${this.projectData.projectInfo.name || 'projeto'}-gantt.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      })
      
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('Erro ao exportar o gráfico')
    }
  }

  /**
   * Inicializa o sistema de virtualização
   */
  initializeVirtualization() {
    this.calculateVisibleRange()
    this.createVirtualContainer()
  }

  /**
   * Calcula o range de tarefas visíveis baseado na viewport
   */
  calculateVisibleRange() {
    const containerHeight = this.container.clientHeight - this.headerHeight
    const visibleRows = Math.ceil(containerHeight / this.rowHeight)
    const bufferRows = Config.virtualization.bufferSize
    const scrollTop = this.timelineBody?.scrollTop || 0

    this.visibleRange = {
      start: Math.max(0, Math.floor(scrollTop / this.rowHeight) - bufferRows),
      end: Math.min(this.tasks.length, Math.floor(scrollTop / this.rowHeight) + visibleRows + bufferRows)
    }

    this.visibleTasks = this.tasks.slice(this.visibleRange.start, this.visibleRange.end)
    
    // Debug da virtualização
    console.log('🔍 Virtualização - calculateVisibleRange:', {
      containerHeight,
      visibleRows,
      bufferRows,
      scrollTop,
      totalTasks: this.tasks.length,
      visibleRange: this.visibleRange,
      visibleTasksCount: this.visibleTasks.length
    })
  }

  /**
   * Cria container virtual para scroll
   */
  createVirtualContainer() {
    const totalHeight = this.tasks.length * this.rowHeight
    const taskListBody = document.getElementById('taskListBody')
    
    // Sincroniza altura para ambos os painéis
    if (this.timelineBody) {
      this.timelineBody.style.height = `${totalHeight}px`
      this.timelineBody.style.position = 'relative'
    }
    
    if (taskListBody) {
      taskListBody.style.height = `${totalHeight}px`
      taskListBody.style.position = 'relative'
    }
  }

  /**
   * Renderiza conteúdo virtualizado
   */
  renderVirtualizedContent() {
    this.renderVirtualizedTaskList()
    this.renderVirtualizedTimeline()
    this.renderVirtualizedGanttBars()
    this.renderVirtualizedDependencies()
    this.ensureHeightSynchronization()
  }

  /**
   * Renderiza lista de tarefas virtualizada
   */
  renderVirtualizedTaskList() {
    const taskListBody = document.getElementById('taskListBody')
    if (!taskListBody) return

    // Calcula offset para posicionamento
    const offsetY = this.visibleRange.start * this.rowHeight
    const totalHeight = this.tasks.length * this.rowHeight

    // Renderiza apenas tarefas visíveis
    const tasksHTML = this.visibleTasks.map((task, index) => `
      <div class="task-item" data-task-id="${task.id}" title="${task.name}" style="position: absolute; top: ${offsetY + (index * this.rowHeight)}px; height: ${this.rowHeight}px;">
        <span class="task-hierarchy">${task.hierarchyLevel}</span>
        <span class="task-name level-${task.level}">${task.name}</span>
        <span class="task-duration">${task.durationText}</span>
      </div>
    `).join('')

    taskListBody.innerHTML = tasksHTML
    taskListBody.style.height = `${totalHeight}px`
    taskListBody.style.position = 'relative'
  }

  /**
   * Renderiza timeline virtualizada
   */
  renderVirtualizedTimeline() {
    this.renderTimelineHeader()
    this.renderVirtualizedTimelineRows()
  }

  /**
   * Renderiza linhas da timeline virtualizadas
   */
  renderVirtualizedTimelineRows() {
    const offsetY = this.visibleRange.start * this.rowHeight
    const totalHeight = this.tasks.length * this.rowHeight

    const rowsHTML = this.visibleTasks.map((task, index) => {
      const daysHTML = this.days.map(day => `
        <div class="day-cell ${day.isWeekend ? 'weekend' : ''} ${day.isToday ? 'today' : ''}"></div>
      `).join('')

      return `
        <div class="timeline-row" data-task-id="${task.id}" 
             style="position: absolute; top: ${offsetY + (index * this.rowHeight)}px; height: ${this.rowHeight}px;">
          ${daysHTML}
        </div>
      `
    }).join('')

    this.timelineBody.innerHTML = rowsHTML
    this.timelineBody.style.height = `${totalHeight}px`
    this.timelineBody.style.position = 'relative'
    
    // Define largura total
    const totalWidth = this.totalDays * this.dayWidth
    this.timelineBody.style.minWidth = `${totalWidth}px`
    
    // Sincroniza altura da lista de tarefas
    const taskListBody = document.getElementById('taskListBody')
    if (taskListBody) {
      taskListBody.style.height = `${totalHeight}px`
    }
  }

  /**
   * Renderiza barras de Gantt virtualizadas
   */
  renderVirtualizedGanttBars() {
    this.visibleTasks.forEach((task, index) => {
      if (task.startDate && task.endDate) {
        this.createVirtualizedGanttBar(task, index)
      }
    })
  }

  /**
   * Cria barra de Gantt virtualizada
   */
  createVirtualizedGanttBar(task, visibleIndex) {
    const startX = this.getDatePosition(task.startDate)
    const endX = this.getDatePosition(task.endDate)
    const width = Math.max(endX - startX + this.dayWidth, this.dayWidth)
    const progressWidth = (width * task.percentComplete) / 100

    const bar = document.createElement('div')
    bar.className = `gantt-bar level-${task.level}`
    bar.style.left = `${startX}px`
    bar.style.width = `${width}px`
    bar.style.position = 'absolute'
    bar.style.top = `${(this.visibleRange.start + visibleIndex) * this.rowHeight + 8}px`
    bar.dataset.taskId = task.id
    
    bar.innerHTML = `
      <div class="gantt-bar-progress" style="width: ${progressWidth}px;"></div>
      <div class="gantt-bar-content">${task.name}</div>
    `

    bar.title = `${task.name}\\nInício: ${this.formatDate(task.startDate)}\\nFim: ${this.formatDate(task.endDate)}\\nDuração: ${task.durationText}\\nProgresso: ${task.percentComplete}%`
    bar.addEventListener('click', () => this.onTaskClick(task))

    this.timelineBody.appendChild(bar)
  }

  /**
   * Renderiza dependências virtualizadas
   */
  renderVirtualizedDependencies() {
    // Cria SVG para as linhas de dependência
    const existingSvg = this.timelineBody.querySelector('.dependency-line')
    if (existingSvg) {
      existingSvg.remove()
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('class', 'dependency-line')
    svg.style.position = 'absolute'
    svg.style.top = '0'
    svg.style.left = '0'
    svg.style.width = '100%'
    svg.style.height = `${this.tasks.length * this.rowHeight}px`
    svg.style.pointerEvents = 'none'
    svg.style.zIndex = '3'

    svg.innerHTML = `
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#605e5c" />
        </marker>
      </defs>
    `

    this.timelineBody.appendChild(svg)

    // Desenha apenas dependências visíveis
    this.visibleTasks.forEach((task, visibleIndex) => {
      if (task.dependencies.length > 0) {
        task.dependencies.forEach(depId => {
          const depTask = this.tasks.find(t => t.id === depId)
          const depIndex = this.tasks.indexOf(depTask)
          
          if (depTask && depIndex !== -1) {
            this.drawDependencyLine(svg, depIndex, this.visibleRange.start + visibleIndex, depTask, task)
          }
        })
      }
    })
  }

  /**
   * Atualiza viewport virtual baseado no scroll
   */
  updateVirtualViewport() {
    if (!this.isVirtualized) return

    const now = performance.now()
    if (now - this.lastScrollTime < Config.performance.debounceTime) return

    this.lastScrollTime = now

    // Debounce para evitar muitas atualizações
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
    }

    this.scrollTimeout = setTimeout(() => {
      this.calculateVisibleRange()
      this.renderVirtualizedContent()
    }, Config.performance.debounceTime)
  }

  /**
   * Otimiza renderização usando requestAnimationFrame
   */
  scheduleRender(renderFunc) {
    if (this.isRendering) return

    this.isRendering = true
    requestAnimationFrame(() => {
      const startTime = performance.now()
      
      renderFunc()
      
      const endTime = performance.now()
      if (endTime - startTime > Config.performance.maxRenderTime) {
        console.warn(`Renderização demorou ${endTime - startTime}ms`)
      }
      
      this.isRendering = false
    })
  }
}
    