import './style.css'
import { ProjectManager } from './src/ProjectManager.js'

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app')
  const projectManager = new ProjectManager(app)
  projectManager.init()
})