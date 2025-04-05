// Initial application state
export const initialState = {
    workflowActive: false,
    telegramConnected: false,
    marketData: {
        coins: [],
        totalBalance: 0,
        profitLoss: 0,
        lastUpdated: null
    },
    activeBots: [],
    apiConfig: {
        coinbase: {
            apiKey: '',
            apiSecret: '',
            passphrase: '',
            isConfigured: false
        }
    },
    fundingConfig: {
        availableFunds: 0,
        maxPerTrade: 0,
        riskLevel: 'medium'
    },
    strategies: [
        { 
            id: 1, 
            name: 'Mean Reversion', 
            description: 'Identifies overbought/oversold conditions and trades counter-trend'
        },
        { 
            id: 2, 
            name: 'Momentum Scaling', 
            description: 'Follows strong price trends with incremental position scaling'
        },
        { 
            id: 3, 
            name: 'Volatility Breakout', 
            description: 'Captures significant price movements following periods of low volatility'
        },
        { 
            id: 4, 
            name: 'Range Trading', 
            description: 'Buys at support and sells at resistance within established ranges'
        },
        { 
            id: 5, 
            name: 'Arbitrage', 
            description: 'Exploits price differences between markets'
        }
    ],
    appliedStrategies: [],
    logs: [],
    analysisInterval: null,
    vscodeIntegration: {
        activeFile: null,
        botFiles: [
            { name: 'momentum_bot.py', status: 'idle', language: 'python' },
            { name: 'mean_reversion.py', status: 'idle', language: 'python' },
            { name: 'volatility_bot.py', status: 'idle', language: 'python' }
        ],
        editorContent: ''
    },
    elements: {} // Will store DOM references
};

// Function to update state and trigger UI updates
export function updateState(newState) {
    // Deep merge the new state with the current state
    Object.keys(newState).forEach(key => {
        if (typeof newState[key] === 'object' && newState[key] !== null) {
            initialState[key] = {...initialState[key], ...newState[key]};
        } else {
            initialState[key] = newState[key];
        }
    });
    
    return initialState;
}