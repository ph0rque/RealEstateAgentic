/**
 * IPC handlers for the agentic report generation feature.
 * These handlers are the sole interface between the renderer process
 * and the backend report generation agent.
 */

import { BrowserWindow, ipcMain } from 'electron'
import { getOpenAIClient } from '../../lib/openai/client'
import { generateReport } from '../services/agents/report-agent/graph'

/**
 * Registers all IPC handlers for the report generation functionality.
 */
export function registerReportHandlers() {
  // Handler to start the report generation process
  ipcMain.handle(
    'reports:generate',
    async (
      event,
      fileArrayBuffers: ArrayBuffer[],
      reportId: string
    ): Promise<{ success: boolean; error?: string }> => {
      // First, check if the OpenAI client is available.
      if (!getOpenAIClient()) {
        const errorMsg =
          'OpenAI client is not initialized. Please ensure the API key is set correctly in the environment.'
        console.error(errorMsg)
        return { success: false, error: errorMsg }
      }

      // Get the window that sent the request
      const mainWindow = BrowserWindow.fromWebContents(event.sender)
      if (!mainWindow) {
        const errorMsg = 'Could not find the main window to send progress updates.'
        console.error(errorMsg)
        return { success: false, error: errorMsg }
      }

      try {
        // We start the generation but don't wait for it.
        // The function will send progress updates on its own.
        const fileBuffers = fileArrayBuffers.map(ab => Buffer.from(ab))
        generateReport(event, fileBuffers, reportId)
        
        console.log('Report generation started for ID:', reportId)
        return { success: true }
      } catch (error) {
        console.error('Failed to start report generation:', error)
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred'
        return { success: false, error: errorMessage }
      }
    }
  )

  // Example of a handler that might be used for other report-related actions
  ipcMain.on('reports:cancel', (_event, reportId: string) => {
    console.log('Cancellation requested for report ID:', reportId)
    // Here you would add logic to stop the agent's execution
  })
} 