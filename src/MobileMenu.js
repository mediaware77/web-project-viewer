/**
 * Componente para gerenciar o menu mobile responsivo
 */
export class MobileMenu {
  constructor() {
    this.isOpen = false
    this.menu = null
    this.overlay = null
  }

  /**
   * Renderiza o menu mobile
   */
  render() {
    // Cria o overlay
    this.overlay = document.createElement('div')
    this.overlay.className = 'mobile-menu-overlay'
    
    // Cria o menu
    this.menu = document.createElement('div')
    this.menu.className = 'mobile-menu'
    this.menu.innerHTML = `
      <div class="mobile-menu-header">
        <h3 class="mobile-menu-title">Menu</h3>
        <button class="mobile-menu-close" id="closeMobileMenu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      
      <div class="mobile-menu-content">
        <div class="mobile-menu-section">
          <h3>Visualização</h3>
          <div class="mobile-menu-actions" id="viewActions">
            <!-- Botões de visualização serão inseridos aqui -->
          </div>
        </div>
        
        <div class="mobile-menu-section">
          <h3>Exportar</h3>
          <div class="mobile-menu-actions" id="exportActions">
            <!-- Botões de exportação serão inseridos aqui -->
          </div>
        </div>
        
        <div class="mobile-menu-section">
          <h3>Outros</h3>
          <div class="mobile-menu-actions" id="otherActions">
            <!-- Outros botões serão inseridos aqui -->
          </div>
        </div>
      </div>
    `

    document.body.appendChild(this.overlay)
    document.body.appendChild(this.menu)

    this.setupEventListeners()
  }

  /**
   * Configura os event listeners do menu
   */
  setupEventListeners() {
    // Fechar menu
    const closeBtn = this.menu.querySelector('#closeMobileMenu')
    closeBtn.addEventListener('click', () => this.close())

    // Fechar ao clicar no overlay
    this.overlay.addEventListener('click', () => this.close())

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close()
      }
    })
  }

  /**
   * Adiciona botões ao menu
   */
  addButtons(actions) {
    const viewActions = this.menu.querySelector('#viewActions')
    const exportActions = this.menu.querySelector('#exportActions')
    const otherActions = this.menu.querySelector('#otherActions')

    actions.forEach(action => {
      const button = document.createElement('button')
      button.className = `btn ${action.className || ''}`
      button.innerHTML = action.html
      button.addEventListener('click', (e) => {
        action.onClick(e)
        this.close() // Fecha o menu após a ação
      })

      // Categoriza o botão
      if (action.category === 'view') {
        viewActions.appendChild(button)
      } else if (action.category === 'export') {
        exportActions.appendChild(button)
      } else {
        otherActions.appendChild(button)
      }
    })
  }

  /**
   * Abre o menu
   */
  open() {
    this.isOpen = true
    this.menu.classList.add('open')
    this.overlay.classList.add('open')
    document.body.style.overflow = 'hidden'
  }

  /**
   * Fecha o menu
   */
  close() {
    this.isOpen = false
    this.menu.classList.remove('open')
    this.overlay.classList.remove('open')
    document.body.style.overflow = ''
  }

  /**
   * Alterna o estado do menu
   */
  toggle() {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  /**
   * Remove o menu do DOM
   */
  destroy() {
    if (this.menu && this.menu.parentNode) {
      this.menu.parentNode.removeChild(this.menu)
    }
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay)
    }
    document.body.style.overflow = ''
  }

  /**
   * Atualiza o conteúdo do menu
   */
  updateContent(actions) {
    // Limpa o conteúdo atual
    this.menu.querySelector('#viewActions').innerHTML = ''
    this.menu.querySelector('#exportActions').innerHTML = ''
    this.menu.querySelector('#otherActions').innerHTML = ''

    // Adiciona os novos botões
    this.addButtons(actions)
  }
}