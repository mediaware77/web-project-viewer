import * as XLSX from 'xlsx'
import { GanttChart } from './GanttChart.js'
import { TableView } from './TableView.js'
import { TaskProcessor } from './TaskProcessor.js'
import { Config } from './Config.js'
import { ResponsiveWarning } from './ResponsiveWarning.js'
import { MobileMenu } from './MobileMenu.js'

/**
 * Classe principal que gerencia a aplicação de visualização de projetos
 * Responsável por coordenar upload de arquivos, processamento de dados e renderização
 */
export class ProjectManager {
  constructor(container) {
    this.container = container
    this.ganttChart = null
    this.tableView = null
    this.taskProcessor = new TaskProcessor()
    this.projectData = null
    this.currentView = 'gantt' // 'gantt' ou 'table'
    this.responsiveWarning = new ResponsiveWarning()
    this.mobileMenu = new MobileMenu()
  }

  /**
   * Inicializa a aplicação
   */
  init() {
    this.render()
    this.setupEventListeners()
    this.responsiveWarning.init()
  }

  /**
   * Renderiza a interface inicial da aplicação
   */
  render() {
    this.container.innerHTML = `
      <div class="app-header">
        <h1 class="app-title">Project Gantt Viewer</h1>
        <p class="app-subtitle">Visualizador de cronogramas de projeto compatível com Microsoft Project</p>
      </div>
      
      <div class="upload-container">
        <div class="upload-area" id="uploadArea">
          <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <h3 class="upload-title">Carregar Arquivo de Projeto</h3>
          <p class="upload-subtitle">
            Arraste e solte seu arquivo .xlsx exportado do Project Web ou clique para selecionar
          </p>
          <button class="upload-button" id="uploadButton">
            Selecionar Arquivo
          </button>
          <input type="file" id="fileInput" class="file-input" accept=".xlsx,.xls">
        </div>
      </div>
      
      <div class="sample-download-fixed">
        <a href="https://github.com/mediaware77/web-project-viewer/releases/download/sample/amostra.xlsx" 
           class="sample-link-small" 
           download="amostra.xlsx">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Baixar exemplo de arquivo exportado do MS Planner / MS Project Web
        </a>
      </div>
    `
  }

  /**
   * Configura os event listeners para upload de arquivos
   */
  setupEventListeners() {
    const uploadArea = document.getElementById('uploadArea')
    const uploadButton = document.getElementById('uploadButton')
    const fileInput = document.getElementById('fileInput')

    // Click no botão de upload
    uploadButton.addEventListener('click', () => {
      fileInput.click()
    })

    // Click na área de upload
    uploadArea.addEventListener('click', (e) => {
      if (e.target !== uploadButton) {
        fileInput.click()
      }
    })

    // Seleção de arquivo
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileUpload(e.target.files[0])
      }
    })

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault()
      uploadArea.classList.add('dragover')
    })

    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault()
      uploadArea.classList.remove('dragover')
    })

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault()
      uploadArea.classList.remove('dragover')
      
      const files = e.dataTransfer.files
      if (files.length > 0 && this.isValidFile(files[0])) {
        this.handleFileUpload(files[0])
      }
    })
  }

  /**
   * Valida se o arquivo é do tipo correto
   */
  isValidFile(file) {
    console.log('Validando arquivo:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Verifica tamanho do arquivo
    if (file.size > Config.file.maxSize) {
      this.showError(Config.errors.messages.fileTooBig)
      return false
    }

    // Verifica extensão (mais confiável que MIME type)
    const isValidExtension = Config.file.supportedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext))
    
    // Verifica tipo MIME (pode não estar disponível em alguns browsers)
    const isValidType = file.type && Config.file.supportedTypes.includes(file.type)
    
    const isValid = isValidType || isValidExtension
    
    if (!isValid) {
      console.log('Arquivo inválido:', {
        extensions: Config.file.supportedExtensions,
        types: Config.file.supportedTypes
      })
    }
    
    return isValid
  }

  /**
   * Processa o upload do arquivo
   */
  async handleFileUpload(file) {
    console.log('Iniciando processamento do arquivo:', file.name)
    
    if (!this.isValidFile(file)) {
      console.log('Arquivo inválido')
      this.showError(Config.errors.messages.fileInvalid)
      return
    }

    this.showLoading()

    try {
      console.log('Processando arquivo Excel...')
      const projectData = await this.processExcelFile(file)
      console.log('Dados do projeto processados:', {
        tasks: projectData.tasks.length,
        hasWarnings: projectData.processingInfo?.warnings?.length > 0
      })
      
      this.projectData = projectData
      
      console.log('Renderizando view do projeto...')
      this.renderProjectView()
      
      // Sempre mostra informações de processamento (warnings + performance)
      console.log('Mostrando informações de processamento...')
      this.showProcessingWarnings(projectData.processingInfo?.warnings || [])
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      
      // Mostra erro específico se disponível
      const errorMessage = error.message.includes('Falha no processamento') 
        ? error.message 
        : Config.errors.messages.processingError
        
      this.showError(errorMessage)
    }
  }

  /**
   * Processa o arquivo Excel e extrai os dados do projeto
   */
  async processExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, {
            type: 'array',
            cellStyles: true,
            cellDates: true
          })

          // Pega a primeira planilha
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          
          // Converte para JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            raw: false,
            dateNF: 'dd/mm/yyyy'
          })

          // Processa os dados usando TaskProcessor
          const projectData = this.taskProcessor.processProjectData(jsonData)
          
          // Adiciona informações de processamento
          const processingSummary = this.taskProcessor.getProcessingSummary()
          projectData.processingInfo = {
            ...projectData.processingInfo,
            ...processingSummary
          }
          
          resolve(projectData)
          
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Renderiza a visualização do projeto
   */
  renderProjectView() {
    const { projectInfo, tasks } = this.projectData

    this.container.innerHTML = `
      <div class="app-header">
        <h1 class="app-title">Project Gantt Viewer</h1>
        <p class="app-subtitle">Visualizador de cronogramas de projeto</p>
      </div>
      
      <div class="project-view">
        <div class="toolbar">
          <div class="project-info">
            <h2 class="project-name">${projectInfo.name}</h2>
            <p class="project-details">
              ${projectInfo.duration} • ${projectInfo.startDate} a ${projectInfo.endDate} • ${tasks.length} tarefas
            </p>
          </div>
          <div class="toolbar-actions">
            <div class="view-toggle">
              <button class="btn toggle ${this.currentView === 'gantt' ? 'active' : ''}" id="ganttViewBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="2"/>
                  <rect x="3" y="8" width="12" height="2"/>
                  <rect x="3" y="12" width="15" height="2"/>
                  <rect x="3" y="16" width="9" height="2"/>
                </svg>
                Gantt
              </button>
              <button class="btn toggle ${this.currentView === 'table' ? 'active' : ''}" id="tableViewBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="9" x2="15" y2="9"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="3"/>
                </svg>
                Tabela
              </button>
            </div>
            <button class="btn" id="newFileBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              Novo Arquivo
            </button>
            <button class="btn primary" id="exportBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17,8 12,3 7,8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Exportar
            </button>
          </div>
          <button class="mobile-menu-toggle" id="mobileMenuToggle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="view-container" id="viewContainer">
          <!-- A visualização será renderizada aqui -->
        </div>
      </div>
    `

    // Configura event listeners da toolbar
    document.getElementById('newFileBtn').addEventListener('click', () => {
      this.render()
      this.setupEventListeners()
    })

    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportProject()
    })

    // Event listeners para toggle de visualização
    document.getElementById('ganttViewBtn').addEventListener('click', () => {
      this.switchToView('gantt')
    })

    document.getElementById('tableViewBtn').addEventListener('click', () => {
      this.switchToView('table')
    })

    // Configura o menu mobile
    this.setupMobileMenu()

    // Event listener para o botão do menu mobile
    document.getElementById('mobileMenuToggle').addEventListener('click', () => {
      this.mobileMenu.toggle()
    })

    // Renderiza a visualização inicial
    this.renderCurrentView()
  }

  /**
   * Exporta o projeto como imagem PNG ou CSV dependendo da visualização
   */
  exportProject() {
    if (this.currentView === 'gantt' && this.ganttChart) {
      this.ganttChart.exportAsPNG()
    } else if (this.currentView === 'table' && this.tableView) {
      this.tableView.exportToCSV()
    }
  }

  /**
   * Exibe mensagem de loading
   */
  showLoading() {
    const uploadContainer = document.querySelector('.upload-container')
    uploadContainer.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p style="margin-left: 16px;">Processando arquivo...</p>
      </div>
    `
  }

  /**
   * Exibe mensagem de erro
   */
  showError(message) {
    const uploadContainer = document.querySelector('.upload-container')
    
    // Se não existe upload-container, cria um na estrutura atual
    let container = uploadContainer
    if (!container) {
      // Procura por project-view ou usa container principal
      const projectView = document.querySelector('.project-view')
      if (projectView) {
        // Substitui project-view por upload-container
        projectView.outerHTML = '<div class="upload-container"></div>'
        container = document.querySelector('.upload-container')
      } else {
        container = this.container
      }
    }
    
    container.innerHTML = `
      <div class="error-message">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <div class="error-content">
          <strong>Erro no processamento:</strong>
          <p>${message}</p>
        </div>
      </div>
      <div class="upload-area" id="uploadArea">
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7,10 12,15 17,10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <h3 class="upload-title">Carregar Arquivo de Projeto</h3>
        <p class="upload-subtitle">
          Arraste e solte seu arquivo .xlsx exportado do Project Web ou clique para selecionar
        </p>
        <button class="upload-button" id="uploadButton">
          Tentar Novamente
        </button>
        <input type="file" id="fileInput" class="file-input" accept=".xlsx,.xls">
      </div>
    `
    
    // Reconfigurar event listeners
    this.setupEventListeners()
  }

  /**
   * Mostra warnings de processamento e informações de performance
   */
  showProcessingWarnings(warnings) {
    const viewContainer = document.getElementById('viewContainer')
    if (!viewContainer || !viewContainer.parentNode) {
      console.warn('Container de visualização não encontrado para mostrar warnings')
      return
    }

    // Gera informações de performance
    const taskCount = this.projectData.tasks.length
    const isVirtualized = taskCount >= Config.virtualization.threshold
    const batchEnabled = taskCount > Config.performance.batchSize
    
    const performanceInfo = `
      <div class="performance-section">
        <h4>💡 Melhorias de Performance Ativas:</h4>
        <ul class="performance-list">
          <li>📊 ${taskCount} tarefas processadas</li>
          <li>${isVirtualized ? '🚀 Virtualização: ATIVA (renderização inteligente)' : '⚡ Renderização: Padrão'}</li>
          <li>${batchEnabled ? '📦 Processamento em lotes: ATIVO' : '🔄 Processamento: Direto'}</li>
          <li>⚙️ Configurações centralizadas: ATIVAS</li>
        </ul>
      </div>
    `

    // Gera lista de warnings se existirem
    const warningsList = warnings && warnings.length > 0 
      ? warnings.map(warning => `<li><strong>${warning.code}:</strong> ${warning.message}</li>`).join('')
      : ''
    
    const warningsSection = warnings && warnings.length > 0 
      ? `<div class="warnings-section">
           <h4>⚠️ Avisos de Processamento:</h4>
           <ul class="warning-list">${warningsList}</ul>
         </div>`
      : ''

    const totalItems = (warnings?.length || 0) + 1 // +1 para performance info
    
    const warningDiv = document.createElement('div')
    warningDiv.className = 'processing-warnings'
    warningDiv.innerHTML = `
      <div class="warning-header">
        <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>Informações de Processamento (${totalItems} ${totalItems === 1 ? 'item' : 'itens'})</span>
        <button class="toggle-warnings" onclick="this.parentElement.parentElement.classList.toggle('expanded')">
          Ver detalhes
        </button>
      </div>
      <div class="warning-content">
        ${performanceInfo}
        ${warningsSection}
      </div>
    `

    // Insere antes do container de visualização
    viewContainer.parentNode.insertBefore(warningDiv, viewContainer)
  }

  /**
   * Configura o menu mobile com as ações disponíveis
   */
  setupMobileMenu() {
    // Remove o menu anterior se existir
    this.mobileMenu.destroy()
    
    // Renderiza o novo menu
    this.mobileMenu.render()

    // Define as ações do menu
    const menuActions = [
      {
        category: 'view',
        html: `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="2"/>
            <rect x="3" y="8" width="12" height="2"/>
            <rect x="3" y="12" width="15" height="2"/>
            <rect x="3" y="16" width="9" height="2"/>
          </svg>
          Visualização Gantt
        `,
        className: this.currentView === 'gantt' ? 'primary' : '',
        onClick: () => this.switchToView('gantt')
      },
      {
        category: 'view',
        html: `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="9" x2="15" y2="9"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="3"/>
          </svg>
          Visualização Tabela
        `,
        className: this.currentView === 'table' ? 'primary' : '',
        onClick: () => this.switchToView('table')
      },
      {
        category: 'export',
        html: `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Exportar ${this.currentView === 'table' ? 'CSV' : 'PNG'}
        `,
        className: 'primary',
        onClick: () => this.exportProject()
      },
      {
        category: 'other',
        html: `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
          Carregar Novo Arquivo
        `,
        className: '',
        onClick: () => {
          this.render()
          this.setupEventListeners()
        }
      }
    ]

    this.mobileMenu.addButtons(menuActions)
  }


  /**
   * Alterna para uma visualização específica
   */
  switchToView(viewType) {
    if (this.currentView === viewType) return
    
    console.log(`🔄 Alternando para visualização: ${viewType}`)
    this.currentView = viewType
    
    // Atualiza estado dos botões
    this.updateToggleButtons()
    
    // Renderiza a nova visualização
    this.renderCurrentView()
  }

  /**
   * Renderiza a visualização atual
   */
  renderCurrentView() {
    const viewContainer = document.getElementById('viewContainer')
    if (!viewContainer) {
      console.error('Container de visualização não encontrado')
      return
    }

    // Limpa a visualização anterior
    if (this.tableView && this.tableView.destroy) {
      this.tableView.destroy()
    }
    
    // Limpa o container
    viewContainer.innerHTML = ''
    
    if (this.currentView === 'gantt') {
      console.log('🎨 Renderizando Gantt Chart')
      this.ganttChart = new GanttChart(viewContainer, this.projectData)
      this.ganttChart.render()
    } else if (this.currentView === 'table') {
      console.log('📊 Renderizando Table View')
      this.tableView = new TableView(viewContainer, this.projectData)
      this.tableView.render()
    }
  }

  /**
   * Atualiza o estado visual dos botões de toggle
   */
  updateToggleButtons() {
    const ganttBtn = document.getElementById('ganttViewBtn')
    const tableBtn = document.getElementById('tableViewBtn')
    
    if (ganttBtn && tableBtn) {
      ganttBtn.classList.toggle('active', this.currentView === 'gantt')
      tableBtn.classList.toggle('active', this.currentView === 'table')
    }
  }
}