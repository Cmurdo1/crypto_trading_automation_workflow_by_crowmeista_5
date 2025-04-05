import { initializeUI } from './modules/ui.js';
import { setupEventListeners } from './modules/events.js';
import { initializeCharts } from './modules/charts.js';
import { loadMarketData } from './modules/marketData.js';
import { initializeVSCodeIntegration } from './modules/vscode.js';
import { initialState } from './modules/state.js';

// Global state - kept minimal in this file
const state = initialState;

// Initialize application
function initApp() {
    console.log('Initializing application...');
    
    // Initialize UI
    initializeUI(state);
    
    // Setup event listeners
    setupEventListeners(state);
    
    // Initialize charts
    initializeCharts(state);
    
    // Load initial market data
    loadMarketData(state);
    
    // Initialize VSCode integration
    initializeVSCodeIntegration(state);
}

// Start the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);

// Export state for other modules
export { state };