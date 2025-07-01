/**
 * Componente para gerenciar avisos de resolução e modo responsivo
 */
export class ResponsiveWarning {
  constructor() {
    this.isDesktopMode = false
    this.warningShown = false
    this.minDesktopWidth = 1024
    this.minDesktopHeight = 600  // Reduzido para não afetar notebooks
    this.mobileThreshold = 768   // Limite real para mobile
  }

  /**
   * Verifica se deve mostrar o aviso de resolução
   */
  shouldShowWarning() {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // Detecta se é um dispositivo móvel real
    const isMobileDevice = this.isMobileDevice()
    const isSmallScreen = screenWidth <= this.mobileThreshold
    
    // Só mostra aviso em dispositivos móveis ou telas muito pequenas
    return (isMobileDevice || (isSmallScreen && screenHeight < 500)) && 
           !this.warningShown && 
           !this.isDesktopMode
  }

  /**
   * Detecta se é um dispositivo móvel real baseado em user agent e características
   */
  isMobileDevice() {
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobileUA = /mobile|android|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent)
    
    // Detecta também pela orientação e touch
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const hasOrientationChange = 'onorientationchange' in window
    
    // É considerado mobile se tem user agent mobile E (touch OU orientation change)
    return isMobileUA && (hasTouchScreen || hasOrientationChange)
  }

  /**
   * Retorna uma descrição amigável do dispositivo atual
   */
  getDeviceDescription() {
    const width = window.innerWidth
    const height = window.innerHeight
    const userAgent = navigator.userAgent.toLowerCase()
    
    let deviceType = 'Desktop'
    if (this.isMobileDevice()) {
      if (/ipad/.test(userAgent)) {
        deviceType = 'iPad'
      } else if (/iphone/.test(userAgent)) {
        deviceType = 'iPhone'
      } else if (/android/.test(userAgent)) {
        deviceType = width > 600 ? 'Tablet Android' : 'Smartphone Android'
      } else {
        deviceType = 'Dispositivo móvel'
      }
    }
    
    const orientation = width > height ? 'paisagem' : 'retrato'
    return `${deviceType} (${width}x${height}, ${orientation})`
  }

  /**
   * Retorna texto de ajuda contextual baseado no dispositivo
   */
  getHelpText() {
    const width = window.innerWidth
    const height = window.innerHeight
    const isPortrait = height > width
    
    if (this.isMobileDevice()) {
      if (isPortrait && width < 500) {
        return 'Dica: Gire seu dispositivo para paisagem para uma melhor experiência'
      } else if (width >= 500) {
        return 'Experiência otimizada para tablets e desktops'
      } else {
        return 'Para melhor visualização, use um dispositivo com tela maior'
      }
    } else {
      return 'Use o zoom do navegador se necessário para ajustar a visualização'
    }
  }

  /**
   * Mostra o modal de aviso de resolução
   */
  showResolutionWarning() {
    if (this.shouldShowWarning()) {
      this.renderWarningModal()
      this.warningShown = true
    }
  }

  /**
   * Renderiza o modal de aviso
   */
  renderWarningModal() {
    const overlay = document.createElement('div')
    overlay.className = 'resolution-warning-overlay'
    overlay.innerHTML = `
      <div class="resolution-warning-modal">
        <svg class="warning-icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        
        <h2 class="resolution-warning-title">Visualização otimizada para desktop</h2>
        
        <p class="resolution-warning-message">
          Para aproveitar melhor os recursos do visualizador Gantt, recomendamos usar em dispositivos com telas maiores. 
          Em dispositivos móveis, a experiência pode ser limitada devido ao espaço da tela.
        </p>
        
        <div class="resolution-warning-details">
          <strong>Recomendado:</strong> Desktop ou tablet em modo paisagem<br>
          <strong>Dispositivo atual:</strong> ${this.getDeviceDescription()}
        </div>
        
        <div class="resolution-warning-actions">
          <button class="btn warning-primary" id="continueAnyway">
            Continuar assim mesmo
          </button>
          <button class="btn warning-secondary" id="useDesktopMode">
            Forçar modo desktop
          </button>
        </div>
        
        <div class="resolution-info">
          <svg class="resolution-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9,12l2,2 4,-4"/>
          </svg>
          ${this.getHelpText()}
        </div>
      </div>
    `

    document.body.appendChild(overlay)
    this.setupWarningEventListeners(overlay)
  }

  /**
   * Configura os event listeners do modal de aviso
   */
  setupWarningEventListeners(overlay) {
    const continueBtn = overlay.querySelector('#continueAnyway')
    const desktopModeBtn = overlay.querySelector('#useDesktopMode')

    continueBtn.addEventListener('click', () => {
      this.hideWarningModal(overlay)
    })

    desktopModeBtn.addEventListener('click', () => {
      this.enableDesktopMode()
      this.hideWarningModal(overlay)
    })

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.parentNode) {
        this.hideWarningModal(overlay)
      }
    })

    // Fechar clicando fora do modal
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hideWarningModal(overlay)
      }
    })
  }

  /**
   * Esconde o modal de aviso
   */
  hideWarningModal(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay)
    }
  }

  /**
   * Ativa o modo desktop forçado
   */
  enableDesktopMode() {
    this.isDesktopMode = true
    document.body.classList.add('desktop-mode-forced')
    this.showDesktopModeIndicator()
    
    // Aplica zoom se necessário
    this.applyDesktopModeStyles()
  }

  /**
   * Aplica estilos do modo desktop
   */
  applyDesktopModeStyles() {
    const style = document.createElement('style')
    style.id = 'desktop-mode-styles'
    style.textContent = `
      .desktop-mode-forced {
        min-width: ${this.minDesktopWidth}px;
        overflow-x: auto;
      }
      
      .desktop-mode-forced .gantt-container {
        min-width: ${this.minDesktopWidth - 50}px;
      }
      
      .desktop-mode-forced .toolbar {
        min-width: ${this.minDesktopWidth - 50}px;
      }
      
      @media (max-width: ${this.minDesktopWidth}px) {
        .desktop-mode-forced .gantt-container {
          flex-direction: row !important;
        }
        
        .desktop-mode-forced .task-list {
          width: 350px !important;
          max-height: none !important;
        }
        
        .desktop-mode-forced .toolbar {
          flex-direction: row !important;
          align-items: center !important;
        }
        
        .desktop-mode-forced .toolbar-actions {
          justify-content: flex-end !important;
        }
      }
    `
    document.head.appendChild(style)
  }

  /**
   * Mostra o indicador de modo desktop
   */
  showDesktopModeIndicator() {
    const indicator = document.createElement('div')
    indicator.className = 'desktop-mode-indicator'
    indicator.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M10 16l4-4-4-4"/>
      </svg>
      Modo Desktop
    `
    
    document.body.appendChild(indicator)
  }

  /**
   * Verifica se a orientação mudou (para dispositivos móveis)
   */
  handleOrientationChange() {
    setTimeout(() => {
      if (this.shouldShowWarning() && !this.isDesktopMode) {
        this.showResolutionWarning()
      }
    }, 100)
  }

  /**
   * Inicializa o sistema de avisos
   */
  init() {
    // Verifica imediatamente
    if (this.shouldShowWarning()) {
      // Aguarda um pouco para garantir que a página carregou
      setTimeout(() => {
        this.showResolutionWarning()
      }, 1000)
    }

    // Monitora mudanças de orientação
    window.addEventListener('orientationchange', () => {
      this.handleOrientationChange()
    })

    // Monitora redimensionamento da janela
    window.addEventListener('resize', () => {
      // Debounce para evitar muitos eventos
      clearTimeout(this.resizeTimeout)
      this.resizeTimeout = setTimeout(() => {
        if (this.shouldShowWarning() && !this.isDesktopMode) {
          this.showResolutionWarning()
        }
      }, 500)
    })
  }

  /**
   * Desabilita o modo desktop
   */
  disableDesktopMode() {
    this.isDesktopMode = false
    document.body.classList.remove('desktop-mode-forced')
    
    // Remove estilos do modo desktop
    const style = document.getElementById('desktop-mode-styles')
    if (style) {
      style.remove()
    }
    
    // Remove indicador
    const indicator = document.querySelector('.desktop-mode-indicator')
    if (indicator) {
      indicator.remove()
    }
  }
}