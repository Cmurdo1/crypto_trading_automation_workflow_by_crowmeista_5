import { addLog } from './logs.js';

// Initialize UI elements and store references
export function initializeUI(state) {
    // Store DOM element references
    state.elements = {
        statusIndicator: document.getElementById('status-indicator'),
        statusText: document.getElementById('status-text'),
        totalBalance: document.getElementById('total-balance'),
        profitLoss: document.getElementById('profit-loss'),
        activeBots: document.getElementById('active-bots'),
        lastAnalysis: document.getElementById('last-analysis'),
        startWorkflow: document.getElementById('start-workflow'),
        stopWorkflow: document.getElementById('stop-workflow'),
        telegramConnect: document.getElementById('telegram-connect'),
        telegramModal: document.getElementById('telegram-modal'),
        closeModalBtn: document.querySelector('.close-btn'),
        telegramQr: document.getElementById('telegram-qr'),
        copyCodeBtn: document.getElementById('copy-code'),
        activationCode: document.getElementById('activation-code'),
        targetCoins: document.getElementById('target-coins'),
        activeStrategies: document.getElementById('active-strategies'),
        logContainer: document.getElementById('log-container'),
        logFilter: document.getElementById('log-filter'),
        clearLogs: document.getElementById('clear-logs'),
        priceChart: document.getElementById('price-chart'),
        activityChart: document.getElementById('activity-chart')
    };

    // Add missing element references for market data and editor controls
    state.elements = {
        ...state.elements,
        marketDataBody: document.getElementById('market-data-body'),
        exchangeSelect: document.getElementById('exchange-select'),
        timeframeSelect: document.getElementById('timeframe-select'),
        refreshData: document.getElementById('refresh-data'),
        lastUpdateTime: document.getElementById('last-update-time'),
        botFiles: document.getElementById('bot-files'),
        codeEditor: document.getElementById('code-editor'),
        saveBotFile: document.getElementById('save-bot-file'),
        runBotFile: document.getElementById('run-bot-file'),
        newBotFile: document.getElementById('new-bot-file')
    };

    // Add funds display element
    const fundsDisplay = document.createElement('div');
    fundsDisplay.className = 'stat-card';
    fundsDisplay.innerHTML = `
        <h3>Available Funds</h3>
        <p id="available-funds-display">$0.00</p>
    `;

    // Add it to market stats if it exists
    const marketStats = document.querySelector('.market-stats');
    if (marketStats) {
        marketStats.appendChild(fundsDisplay);
        state.elements.availableFundsDisplay = document.getElementById('available-funds-display');
    }

    // Initialize with system log
    addLog('System initialized. Waiting to start workflow...', 'system', state);

    // Initialize activation code
    if (state.elements.activationCode) {
        state.elements.activationCode.textContent = generateActivationCode();
    }

    // Ensure all required elements are present
    validateRequiredElements(state);
}

// Generate random activation code
export function generateActivationCode() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';

    // Generate 4 groups of 4 characters
    for (let group = 0; group < 3; group++) {
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (group < 2) code += '-';
    }

    return code;
}

// Update dashboard stats
export function updateDashboardStats(state) {
    state.elements.totalBalance.textContent = '$' + state.marketData.totalBalance.toFixed(2);
    state.elements.profitLoss.textContent = (state.marketData.profitLoss >= 0 ? '+$' : '-$') + Math.abs(state.marketData.profitLoss).toFixed(2);
    state.elements.profitLoss.style.color = state.marketData.profitLoss >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
    state.elements.activeBots.textContent = state.activeBots.length;

    // Add available funds to display
    if (state.elements.availableFundsDisplay) {
        state.elements.availableFundsDisplay.textContent = '$' + state.fundingConfig.availableFunds.toFixed(2);
    }

    const now = new Date();
    state.elements.lastAnalysis.textContent = now.toTimeString().split(' ')[0];
}

// Update target coins display
export function updateTargetCoins(state) {
    state.elements.targetCoins.innerHTML = '';

    if (state.marketData.coins.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'empty-placeholder';
        placeholder.textContent = 'No target coins selected yet';
        state.elements.targetCoins.appendChild(placeholder);
        return;
    }

    state.marketData.coins.forEach(coin => {
        const coinCard = document.createElement('div');
        coinCard.className = 'coin-card';

        const coinIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        coinIcon.setAttribute('class', 'coin-icon');
        coinIcon.setAttribute('viewBox', '0 0 24 24');
        coinIcon.setAttribute('width', '32');
        coinIcon.setAttribute('height', '32');

        const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        iconPath.setAttribute('d', 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5v2h2v-2h1a2.5 2.5 0 002.5-2.5c0-.826-.41-1.5-1.2-1.9l-2.6-1.1c-.39-.2-.7-.64-.7-1a.5.5 0 01.5-.5h4v-2h-2V7h-2v2h-1a2.5 2.5 0 00-2.5 2.5c0 .826.41 1.5 1.2 1.9l2.6 1.1c.39.2.7.64.7 1a.5.5 0 01-.5.5h-4z');
        iconPath.setAttribute('fill', '#' + ((Math.random() * 0xffffff) << 0).toString(16).padStart(6, '0'));

        coinIcon.appendChild(iconPath);

        const coinName = document.createElement('div');
        coinName.className = 'coin-name';
        coinName.textContent = coin.symbol;

        const coinPrice = document.createElement('div');
        coinPrice.className = 'coin-price';
        coinPrice.textContent = '$' + coin.price.toFixed(2);

        const coinTrend = document.createElement('div');
        coinTrend.className = `coin-trend ${coin.trend > 0 ? 'trend-up' : 'trend-down'}`;
        coinTrend.textContent = (coin.trend > 0 ? '+' : '') + coin.trend.toFixed(2) + '%';

        coinCard.appendChild(coinIcon);
        coinCard.appendChild(coinName);
        coinCard.appendChild(coinPrice);
        coinCard.appendChild(coinTrend);

        state.elements.targetCoins.appendChild(coinCard);
    });
}

// Update active strategies display
export function updateActiveStrategies(state) {
    state.elements.activeStrategies.innerHTML = '';

    if (state.appliedStrategies.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'empty-placeholder';
        placeholder.textContent = 'No active strategies';
        state.elements.activeStrategies.appendChild(placeholder);
        return;
    }

    state.appliedStrategies.forEach(strategy => {
        const strategyItem = document.createElement('div');
        strategyItem.className = 'strategy-item';

        const strategyHeader = document.createElement('div');
        strategyHeader.className = 'strategy-header';

        const strategyName = document.createElement('div');
        strategyName.className = 'strategy-name';
        strategyName.textContent = strategy.name;

        const strategyStatus = document.createElement('div');
        strategyStatus.className = 'strategy-status status-active';
        strategyStatus.textContent = 'Active';

        strategyHeader.appendChild(strategyName);
        strategyHeader.appendChild(strategyStatus);

        const strategyDetails = document.createElement('div');
        strategyDetails.className = 'strategy-details';
        strategyDetails.textContent = `Running on ${strategy.coinSymbol} - ${strategy.description}`;

        strategyItem.appendChild(strategyHeader);
        strategyItem.appendChild(strategyDetails);

        state.elements.activeStrategies.appendChild(strategyItem);
    });
}

// Update connection status UI
export function updateConnectionStatus(state, isConnected) {
    if (isConnected) {
        state.elements.statusIndicator.parentElement.classList.add('connected');
        state.elements.statusText.textContent = 'Connected';
    } else {
        state.elements.statusIndicator.parentElement.classList.remove('connected');
        state.elements.statusText.textContent = 'Disconnected';
    }
}

// Add validation function to check required elements
function validateRequiredElements(state) {
    const requiredElements = [
        'statusIndicator',
        'statusText',
        'totalBalance',
        'profitLoss',
        'activeBots',
        'lastAnalysis',
        'startWorkflow',
        'stopWorkflow',
        'telegramConnect',
        'telegramModal',
        'closeModalBtn',
        'telegramQr',
        'copyCodeBtn',
        'activationCode',
        'targetCoins',
        'activeStrategies',
        'logContainer',
        'logFilter',
        'clearLogs',
        'priceChart',
        'activityChart',
        'marketDataBody',
        'exchangeSelect',
        'timeframeSelect',
        'refreshData',
        'lastUpdateTime',
        'botFiles',
        'codeEditor',
        'saveBotFile',
        'runBotFile',
        'newBotFile',
        'availableFundsDisplay'
    ];

    const missingElements = requiredElements.filter(elementId => !state.elements[elementId]);

    if (missingElements.length > 0) {
        console.warn('Missing DOM elements:', missingElements);

        // Create placeholder elements for missing ones to prevent errors
        missingElements.forEach(elementId => {
            if (!state.elements[elementId]) {
                state.elements[elementId] = {
                    // Stub common methods/properties
                    addEventListener: () => {},
                    removeEventListener: () => {},
                    style: {},
                    classList: {
                        add: () => {},
                        remove: () => {},
                        toggle: () => {}
                    },
                    parentElement: {
                        classList: {
                            add: () => {},
                            remove: () => {}
                        }
                    }
                };
            }
        });
    }
}