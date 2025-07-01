import { Config } from './Config.js'

/**
 * Classe responsável por processar e transformar dados de tarefas do Excel
 * Converte dados brutos em formato estruturado para o Gantt Chart
 */
export class TaskProcessor {
  constructor() {
    this.errors = []
    this.warnings = []
  }
  
  /**
   * Processa os dados brutos do Excel e retorna informações estruturadas do projeto
   */
  processProjectData(jsonData) {
    this.clearErrors()
    
    try {
      // Validação inicial dos dados
      this.validateInputData(jsonData)
      
      // Extrai informações do projeto (primeiras linhas)
      const projectInfo = this.extractProjectInfo(jsonData)
      
      // Encontra a linha com os headers das tarefas
      const taskHeaderRowIndex = this.findTaskHeaderRow(jsonData)
      
      // Extrai e processa as tarefas
      const tasks = this.extractTasks(jsonData, taskHeaderRowIndex)
      
      // Validação final
      this.validateProcessedData(tasks)
      
      // Calcula datas do projeto baseado nas tarefas
      const projectDates = this.calculateProjectDates(tasks)
      
      return {
        projectInfo: {
          ...projectInfo,
          ...projectDates
        },
        tasks,
        processingInfo: {
          errors: this.errors,
          warnings: this.warnings,
          tasksProcessed: tasks.length
        }
      }
    } catch (error) {
      this.addError('PROCESSING_FAILED', error.message)
      throw new Error(`Falha no processamento: ${error.message}`)
    }
  }

  /**
   * Extrai informações básicas do projeto das primeiras linhas
   */
  extractProjectInfo(jsonData) {
    const info = {}
    
    // Processa as primeiras linhas em busca de informações do projeto
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i]
      if (row && row.length >= 2) {
        const key = row[0]?.toString().toLowerCase()
        const value = row[1]?.toString()
        
        if (key?.includes('nome do projeto') || key?.includes('project name')) {
          info.name = value || 'Projeto Sem Nome'
        } else if (key?.includes('proprietário') || key?.includes('owner')) {
          info.owner = value
        } else if (key?.includes('data de início') || key?.includes('start date')) {
          info.startDate = this.parseDate(value)
        } else if (key?.includes('data de término') || key?.includes('end date')) {
          info.endDate = this.parseDate(value)
        } else if (key?.includes('duração') || key?.includes('duration')) {
          info.duration = value
        }
      }
    }
    
    return {
      name: info.name || 'Projeto Sem Nome',
      owner: info.owner || '',
      startDate: info.startDate || '',
      endDate: info.endDate || '',
      duration: info.duration || ''
    }
  }

  /**
   * Encontra a linha que contém os headers das tarefas
   */
  findTaskHeaderRow(jsonData) {
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (row && row.length > 0) {
        const firstCell = row[0]?.toString().toLowerCase()
        if (firstCell?.includes('número de tarefa') || 
            firstCell?.includes('task number') ||
            firstCell?.includes('id')) {
          return i
        }
      }
    }
    
    this.addError('HEADER_NOT_FOUND', 'Headers das tarefas não encontrados no arquivo')
    return -1
  }

  /**
   * Extrai e processa todas as tarefas do projeto
   */
  extractTasks(jsonData, headerRowIndex) {
    if (headerRowIndex === -1) {
      throw new Error('Headers das tarefas não encontrados')
    }

    const headers = jsonData[headerRowIndex]
    const tasks = []
    let processedRows = 0
    let skippedRows = 0

    // Mapeia índices das colunas importantes
    const columnMap = this.mapColumns(headers)
    
    // Debug: mostra mapeamento das colunas
    console.log('🔍 Headers encontrados:', headers)
    console.log('🎯 Mapeamento de colunas:', columnMap)
    
    // Valida mapeamento de colunas
    this.validateColumnMapping(columnMap)

    // Processa cada linha de tarefa
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      
      // Pula linhas vazias
      if (!row || !row[columnMap.taskNumber]) {
        skippedRows++
        continue
      }

      try {
        const task = this.createTaskFromRow(row, columnMap, i + 1)
        if (task) {
          tasks.push(task)
          processedRows++
        } else {
          skippedRows++
        }
      } catch (error) {
        this.addError('TASK_PROCESSING_ERROR', `Erro na linha ${i + 1}: ${error.message}`)
        skippedRows++
      }
    }

    this.addWarning('PROCESSING_SUMMARY', `${processedRows} tarefas processadas, ${skippedRows} linhas ignoradas`)

    // Processa dependências
    this.processDependencies(tasks)

    // Debug final: estatísticas completas
    console.log('📊 PROCESSAMENTO COMPLETO:')
    console.log(`   Total de linhas no Excel: ${jsonData.length}`)
    console.log(`   Linha de headers: ${headerRowIndex + 1}`)
    console.log(`   Linhas de dados: ${jsonData.length - headerRowIndex - 1}`)
    console.log(`   Tarefas processadas: ${processedRows}`)
    console.log(`   Linhas ignoradas: ${skippedRows}`)
    console.log(`   Primeira tarefa: ${tasks[0]?.hierarchyLevel} - ${tasks[0]?.name}`)
    console.log(`   Última tarefa: ${tasks[tasks.length - 1]?.hierarchyLevel} - ${tasks[tasks.length - 1]?.name}`)

    return tasks
  }

  /**
   * Mapeia as colunas baseado nos headers
   */
  mapColumns(headers) {
    const map = {}
    
    // Define padrões específicos para cada coluna (mais específicos primeiro)
    const columnPatterns = {
      taskNumber: [
        /^número de tarefa$/i,
        /^task number$/i,
        /^id$/i
      ],
      hierarchyLevel: [
        /número do nível hierárquico/i,
        /hierarchy level/i,
        /nível hierárquico/i,
        /nivel hierarquico/i
      ],
      name: [
        /^nome$/i,
        /^name$/i,
        /^task name$/i
      ],
      assignedTo: [
        /atribuída a/i,
        /assigned to/i,
        /responsavel/i
      ],
      duration: [
        /^duração$/i,
        /^duration$/i
      ],
      start: [
        /^início$/i,
        /^start$/i,
        /^inicio$/i
      ],
      finish: [
        /^concluir$/i,
        /^finish$/i,
        /^end$/i,
        /^fim$/i
      ],
      dependsOn: [
        /^depende de$/i,
        /^depends on$/i,
        /^predecessors$/i
      ],
      percentComplete: [
        /^% concluída$/i,
        /^percent complete$/i,
        /^% complete$/i,
        /^progresso$/i
      ],
      bucket: [
        /^bucket$/i,
        /^categoria$/i,
        /^category$/i
      ]
    }
    
    headers.forEach((header, index) => {
      if (!header) return
      
      const headerStr = header.toString().trim()
      
      // Testa cada padrão para encontrar correspondência exata
      for (const [columnKey, patterns] of Object.entries(columnPatterns)) {
        // Só mapeia se ainda não foi mapeado
        if (map[columnKey] === undefined) {
          for (const pattern of patterns) {
            if (pattern.test(headerStr)) {
              map[columnKey] = index
              break
            }
          }
        }
      }
    })

    return map
  }

  /**
   * Cria um objeto de tarefa a partir de uma linha do Excel
   */
  createTaskFromRow(row, columnMap, rowNumber) {
    // Debug: mostra dados de mais tarefas para diagnóstico
    if (rowNumber <= 5 || rowNumber % 20 === 0 || rowNumber >= 130) {
      console.log(`📋 Linha ${rowNumber}:`, row.slice(0, 10))
      console.log(`   taskNumber[${columnMap.taskNumber}]:`, row[columnMap.taskNumber])
      console.log(`   name[${columnMap.name}]:`, row[columnMap.name])
      console.log(`   hierarchyLevel[${columnMap.hierarchyLevel}]:`, row[columnMap.hierarchyLevel])
    }
    
    const taskNumber = row[columnMap.taskNumber]?.toString()?.trim()
    const name = row[columnMap.name]?.toString()?.trim()
    
    if (!taskNumber || !name) {
      this.addWarning('INVALID_TASK', `Linha ${rowNumber}: tarefa sem número ou nome válido`)
      return null
    }

    const hierarchyLevel = row[columnMap.hierarchyLevel]?.toString() || '1'
    const level = this.calculateHierarchyLevel(hierarchyLevel)
    
    // Parse de datas com validação
    const startDate = this.parseDate(row[columnMap.start]?.toString())
    const endDate = this.parseDate(row[columnMap.finish]?.toString())
    
    // Validação de consistência de datas
    if (startDate && endDate && startDate > endDate) {
      this.addWarning('DATE_INCONSISTENCY', `Linha ${rowNumber}: data de início posterior à data de fim`)
    }

    return {
      id: taskNumber,
      taskNumber: taskNumber,
      hierarchyLevel: hierarchyLevel,
      level: level,
      name: name,
      assignedTo: row[columnMap.assignedTo]?.toString()?.trim() || '',
      duration: this.parseDuration(row[columnMap.duration]?.toString()),
      durationText: row[columnMap.duration]?.toString() || '',
      startDate: startDate,
      endDate: endDate,
      dependsOn: row[columnMap.dependsOn]?.toString() || '',
      percentComplete: this.parsePercentage(row[columnMap.percentComplete]?.toString()),
      bucket: row[columnMap.bucket]?.toString()?.trim() || '',
      dependencies: [],
      dependents: [],
      rowNumber: rowNumber
    }
  }

  /**
   * Calcula o nível hierárquico baseado na numeração
   */
  calculateHierarchyLevel(hierarchyLevel) {
    if (!hierarchyLevel) return 1
    
    const dots = (hierarchyLevel.match(/\./g) || []).length
    return Math.min(dots + 1, 4) // Máximo 4 níveis
  }

  /**
   * Processa as dependências entre tarefas
   */
  processDependencies(tasks) {
    const taskMap = new Map()
    
    // Cria mapa de tarefas para busca rápida
    tasks.forEach(task => {
      taskMap.set(task.id, task)
    })

    // Processa dependências
    tasks.forEach(task => {
      if (task.dependsOn) {
        const dependencies = this.parseDependencies(task.dependsOn)
        
        dependencies.forEach(depId => {
          const depTask = taskMap.get(depId)
          if (depTask) {
            task.dependencies.push(depTask.id)
            depTask.dependents.push(task.id)
          }
        })
      }
    })
  }

  /**
   * Analisa string de dependências (ex: "3TI,5TI")
   */
  parseDependencies(dependsOnStr) {
    if (!dependsOnStr) return []
    
    return dependsOnStr
      .split(/[,;]/)
      .map(dep => dep.trim().replace(/TI$/, ''))
      .filter(dep => dep.length > 0)
  }

  /**
   * Converte string de data para formato padrão
   */
  parseDate(dateStr) {
    if (!dateStr) return null
    
    try {
      // Tenta diferentes formatos de data
      const formats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
        /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
      ]

      for (const format of formats) {
        const match = dateStr.match(format)
        if (match) {
          let day, month, year
          
          if (format === formats[0]) { // DD/MM/YYYY
            [, day, month, year] = match
          } else { // YYYY-MM-DD
            [, year, month, day] = match
          }
          
          const date = new Date(year, month - 1, day)
          if (!isNaN(date.getTime())) {
            return date
          }
        }
      }
      
      // Fallback: tenta criar data diretamente
      const date = new Date(dateStr)
      return isNaN(date.getTime()) ? null : date
      
    } catch (error) {
      return null
    }
  }

  /**
   * Converte string de duração para número de dias
   */
  parseDuration(durationStr) {
    if (!durationStr) return 0
    
    // Remove espaços e converte para minúsculo
    const str = durationStr.toLowerCase().replace(/\s+/g, ' ')
    
    // Procura por padrões de duração
    const patterns = [
      /(\d+(?:[,.]5)?)\s*dias?/, // "5 dias", "2,5 dias"
      /(\d+(?:[,.]5)?)\s*d/, // "5d", "2.5d"
      /(\d+(?:[,.]5)?)\s*horas?/, // "8 horas" (converte para dias)
      /(\d+(?:[,.]5)?)\s*h/, // "8h"
    ]

    for (const pattern of patterns) {
      const match = str.match(pattern)
      if (match) {
        let value = parseFloat(match[1].replace(',', '.'))
        
        // Se for em horas, converte para dias (8h = 1 dia)
        if (pattern.source.includes('hora') || pattern.source.includes('h')) {
          value = value / 8
        }
        
        return value
      }
    }

    return 0
  }

  /**
   * Converte string de porcentagem para número
   */
  parsePercentage(percentStr) {
    if (!percentStr || percentStr === '') return 0
    
    // Remove espaços e converte para string
    const str = percentStr.toString().trim()
    
    // Procura por padrões de porcentagem
    const patterns = [
      /(\d+(?:[,.]?\d+)?)\s*%/,           // "40%", "29,5%", "100 %"
      /^(\d+(?:[,.]?\d+)?)$/,             // "40", "29.5" (números puros)
      /(\d+(?:[,.]?\d+)?)\s*percent/i     // "40 percent"
    ]
    
    for (const pattern of patterns) {
      const match = str.match(pattern)
      if (match) {
        // Converte vírgula para ponto para parseFloat
        const numStr = match[1].replace(',', '.')
        const value = parseFloat(numStr)
        
        if (!isNaN(value)) {
          return Math.min(Math.max(value, 0), 100)
        }
      }
    }
    
    return 0
  }

  /**
   * Calcula datas do projeto baseado nas tarefas
   */
  calculateProjectDates(tasks) {
    if (tasks.length === 0) {
      return { calculatedStartDate: null, calculatedEndDate: null }
    }

    let minStart = null
    let maxEnd = null

    tasks.forEach(task => {
      if (task.startDate) {
        if (!minStart || task.startDate < minStart) {
          minStart = task.startDate
        }
      }
      
      if (task.endDate) {
        if (!maxEnd || task.endDate > maxEnd) {
          maxEnd = task.endDate
        }
      }
    })

    return {
      calculatedStartDate: minStart,
      calculatedEndDate: maxEnd
    }
  }

  /**
   * Limpa erros e warnings acumulados
   */
  clearErrors() {
    this.errors = []
    this.warnings = []
  }

  /**
   * Adiciona um erro à lista de erros
   */
  addError(code, message) {
    this.errors.push({
      code,
      message,
      timestamp: new Date()
    })
  }

  /**
   * Adiciona um warning à lista de warnings
   */
  addWarning(code, message) {
    this.warnings.push({
      code,
      message,
      timestamp: new Date()
    })
  }

  /**
   * Valida os dados de entrada
   */
  validateInputData(jsonData) {
    if (!jsonData || !Array.isArray(jsonData)) {
      throw new Error('Dados de entrada inválidos')
    }

    if (jsonData.length === 0) {
      throw new Error('Arquivo Excel vazio')
    }

    if (jsonData.length < 5) {
      this.addWarning('SMALL_DATASET', 'Arquivo com poucos dados')
    }
  }

  /**
   * Valida o mapeamento de colunas
   */
  validateColumnMapping(columnMap) {
    const requiredColumns = ['taskNumber', 'name']
    const missingColumns = requiredColumns.filter(col => columnMap[col] === undefined)
    
    if (missingColumns.length > 0) {
      throw new Error(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`)
    }

    const recommendedColumns = ['start', 'finish', 'duration']
    const missingRecommended = recommendedColumns.filter(col => columnMap[col] === undefined)
    
    if (missingRecommended.length > 0) {
      this.addWarning('MISSING_RECOMMENDED_COLUMNS', 
        `Colunas recomendadas não encontradas: ${missingRecommended.join(', ')}`)
    }
  }

  /**
   * Valida os dados processados
   */
  validateProcessedData(tasks) {
    if (!tasks || tasks.length === 0) {
      throw new Error(Config.errors.messages.noTasks)
    }

    // Valida duplicatas de ID
    const ids = tasks.map(task => task.id)
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
    
    if (duplicateIds.length > 0) {
      this.addError('DUPLICATE_IDS', `IDs de tarefas duplicados: ${duplicateIds.join(', ')}`)
    }

    // Valida hierarquia
    this.validateTaskHierarchy(tasks)

    // Estatísticas
    const tasksWithDates = tasks.filter(task => task.startDate && task.endDate).length
    const tasksWithoutDates = tasks.length - tasksWithDates
    
    if (tasksWithoutDates > 0) {
      this.addWarning('TASKS_WITHOUT_DATES', 
        `${tasksWithoutDates} tarefas sem datas válidas`)
    }
  }

  /**
   * Valida a hierarquia das tarefas
   */
  validateTaskHierarchy(tasks) {
    const hierarchyLevels = tasks.map(task => task.hierarchyLevel)
    const invalidHierarchy = hierarchyLevels.filter(level => {
      return !/^\d+(\.\d+)*$/.test(level)
    })

    if (invalidHierarchy.length > 0) {
      this.addWarning('INVALID_HIERARCHY', 
        `Níveis hierárquicos inválidos encontrados: ${invalidHierarchy.slice(0, 5).join(', ')}`)
    }
  }

  /**
   * Retorna resumo dos erros e warnings
   */
  getProcessingSummary() {
    return {
      hasErrors: this.errors.length > 0,
      hasWarnings: this.warnings.length > 0,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings
    }
  }
}