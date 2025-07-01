# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Project Gantt Viewer** - a modern web application for visualizing project timelines in Microsoft Project style. It reads `.xlsx` files exported from Project Web and renders interactive Gantt charts.

## Development Commands

```bash
# Start development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Core Classes

- **ProjectManager** (`src/ProjectManager.js`) - Main orchestrator that handles file upload, coordinates data processing, and manages UI state transitions
- **TaskProcessor** (`src/TaskProcessor.js`) - Data processing engine that parses Excel files and transforms raw data into structured task objects with hierarchies and dependencies
- **GanttChart** (`src/GanttChart.js`) - Rendering engine that creates the interactive Gantt visualization with timeline, task bars, and dependency lines

### Data Flow

1. User uploads Excel file → ProjectManager handles file validation and processing
2. ProjectManager uses TaskProcessor to parse Excel data into structured format
3. TaskProcessor extracts project info, maps columns, creates task objects, and processes dependencies
4. ProjectManager renders project view and initializes GanttChart
5. GanttChart calculates timeline, renders task list, timeline header, bars, and dependencies

### Key Technical Details

- **File Processing**: Uses XLSX.js library to parse Excel files with support for multiple date formats
- **Hierarchy Support**: Tasks support up to 4 hierarchical levels (1, 1.1, 1.1.1, 1.1.1.1)
- **Dependency System**: Parses dependency strings like "3TI,5TI" and creates bidirectional dependency relationships
- **Responsive Layout**: CSS Grid/Flexbox with synchronized scrolling between task list and timeline
- **Export Functionality**: Canvas API integration for PNG export

### Configuration

Key configuration values in GanttChart:
- `dayWidth = 30` - Timeline day column width
- `rowHeight = 40` - Task row height
- `taskListWidth = 350` - Task list panel width

### Expected Excel File Format

The application expects Excel files exported from Project Web with these columns:
- Número de tarefa / Task Number
- Número do nível hierárquico / Hierarchy Level
- Nome / Name
- Atribuída a / Assigned To
- Duração / Duration
- Início / Start
- Concluir / Finish
- Depende de / Depends On
- % concluída / Percent Complete

## Portuguese Language Support

The application is primarily in Portuguese (Brazil) with bilingual column header support for Excel parsing. UI text and error messages are in Portuguese.