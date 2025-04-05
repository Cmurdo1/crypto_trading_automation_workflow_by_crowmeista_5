import { addLog } from './logs.js';

// Sample bot code templates
const botTemplates = {
    'momentum_bot.py': `# Momentum Trading Bot
import ccxt
import pandas as pd
import numpy as np
import time
from datetime import datetime

# Exchange configuration
exchange = ccxt.binance({
    'apiKey': 'YOUR_API_KEY',
    'secret': 'YOUR_SECRET',
})

# Bot parameters
symbol = 'BTC/USDT'
timeframe = '1h'
lookback_period = 24
momentum_threshold = 3.0
position_size = 0.1  # 10% of available balance

def fetch_ohlcv(symbol, timeframe, limit):
    """Fetch OHLCV data from exchange"""
    try:
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
        df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        return df
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

def calculate_momentum(df):
    """Calculate momentum indicator"""
    df['returns'] = df['close'].pct_change(1)
    df['momentum'] = df['returns'].rolling(window=lookback_period).sum() * 100
    return df

def momentum_strategy(df):
    """Execute momentum trading strategy"""
    if df['momentum'].iloc[-1] > momentum_threshold:
        return 'buy'
    elif df['momentum'].iloc[-1] < -momentum_threshold:
        return 'sell'
    return 'hold'

def execute_trade(action):
    """Execute trade based on strategy signal"""
    try:
        balance = exchange.fetch_balance()
        if action == 'buy':
            usdt_balance = balance['USDT']['free']
            amount = (usdt_balance * position_size) / latest_price
            print(f"Buying {amount} {symbol} at {latest_price}")
            # Uncomment to execute real trade:
            # exchange.create_market_buy_order(symbol, amount)
        elif action == 'sell':
            coin = symbol.split('/')[0]
            coin_balance = balance[coin]['free']
            amount = coin_balance * position_size
            print(f"Selling {amount} {symbol} at {latest_price}")
            # Uncomment to execute real trade:
            # exchange.create_market_sell_order(symbol, amount)
    except Exception as e:
        print(f"Error executing trade: {e}")

# Main trading loop
while True:
    print(f"Fetching data for {symbol}...")
    df = fetch_ohlcv(symbol, timeframe, lookback_period + 5)
    
    if df is not None:
        df = calculate_momentum(df)
        latest_price = df['close'].iloc[-1]
        action = momentum_strategy(df)
        
        print(f"Current price: {latest_price}, Momentum: {df['momentum'].iloc[-1]:.2f}%, Action: {action}")
        
        if action in ['buy', 'sell']:
            execute_trade(action)
    
    # Wait before next iteration
    time.sleep(60)  # Check every minute
`,
    'mean_reversion.py': `# Mean Reversion Trading Bot
import ccxt
import pandas as pd
import numpy as np
import time
from datetime import datetime

# Exchange configuration
exchange = ccxt.binance({
    'apiKey': 'YOUR_API_KEY',
    'secret': 'YOUR_SECRET',
})

# Bot parameters
symbol = 'ETH/USDT'
timeframe = '15m'
lookback_period = 20
std_dev_threshold = 2.0
position_size = 0.1  # 10% of available balance

def fetch_ohlcv(symbol, timeframe, limit):
    """Fetch OHLCV data from exchange"""
    try:
        ohlcv = exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
        df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        return df
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

def calculate_bollinger_bands(df, period=20, std_dev=2):
    """Calculate Bollinger Bands"""
    df['SMA'] = df['close'].rolling(window=period).mean()
    df['STD'] = df['close'].rolling(window=period).std()
    df['upper'] = df['SMA'] + (df['STD'] * std_dev)
    df['lower'] = df['SMA'] - (df['STD'] * std_dev)
    df['%b'] = (df['close'] - df['lower']) / (df['upper'] - df['lower'])
    return df

def mean_reversion_strategy(df):
    """Execute mean reversion strategy"""
    if df['%b'].iloc[-1] < 0:  # Price below lower band
        return 'buy'
    elif df['%b'].iloc[-1] > 1:  # Price above upper band
        return 'sell'
    return 'hold'

def execute_trade(action):
    """Execute trade based on strategy signal"""
    try:
        balance = exchange.fetch_balance()
        if action == 'buy':
            usdt_balance = balance['USDT']['free']
            amount = (usdt_balance * position_size) / latest_price
            print(f"Buying {amount} {symbol} at {latest_price}")
            # Uncomment to execute real trade:
            # exchange.create_market_buy_order(symbol, amount)
        elif action == 'sell':
            coin = symbol.split('/')[0]
            coin_balance = balance[coin]['free']
            amount = coin_balance * position_size
            print(f"Selling {amount} {symbol} at {latest_price}")
            # Uncomment to execute real trade:
            # exchange.create_market_sell_order(symbol, amount)
    except Exception as e:
        print(f"Error executing trade: {e}")

# Main trading loop
while True:
    print(f"Fetching data for {symbol}...")
    df = fetch_ohlcv(symbol, timeframe, lookback_period + 5)
    
    if df is not None:
        df = calculate_bollinger_bands(df, period=lookback_period, std_dev=std_dev_threshold)
        latest_price = df['close'].iloc[-1]
        action = mean_reversion_strategy(df)
        
        print(f"Current price: {latest_price}, %b: {df['%b'].iloc[-1]:.2f}, Action: {action}")
        
        if action in ['buy', 'sell']:
            execute_trade(action)
    
    # Wait before next iteration
    time.sleep(60)  # Check every minute
`
};

// Initialize VSCode integration
export function initializeVSCodeIntegration(state) {
    // Load Monaco Editor dynamically
    loadMonacoEditor().then(monaco => {
        // Create editor instance
        const editor = monaco.editor.create(state.elements.codeEditor, {
            value: '',
            language: 'python',
            theme: 'vs-dark',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            automaticLayout: true
        });
        
        // Store editor reference in state
        state.vscodeIntegration.editor = editor;
        
        // Populate bot files list
        populateBotFilesList(state);
        
        // Set up editor event listeners
        setupEditorEvents(state);
        
        addLog('VSCode integration initialized', 'system', state);
    }).catch(error => {
        console.error('Failed to load Monaco Editor:', error);
        addLog('Failed to initialize code editor', 'error', state);
    });
}

// Load Monaco Editor
async function loadMonacoEditor() {
    try {
        // Load Monaco Editor from CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs/loader.min.js';
        document.head.appendChild(script);
        
        return new Promise((resolve, reject) => {
            script.onload = () => {
                // Configure RequireJS
                window.require.config({
                    paths: {
                        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs'
                    }
                });
                
                // Load Monaco
                window.require(['vs/editor/editor.main'], () => {
                    resolve(window.monaco);
                });
            };
            script.onerror = reject;
        });
    } catch (error) {
        console.error('Error loading Monaco Editor:', error);
        throw error;
    }
}

// Populate bot files list
function populateBotFilesList(state) {
    const botFilesList = state.elements.botFiles;
    botFilesList.innerHTML = '';
    
    state.vscodeIntegration.botFiles.forEach(file => {
        const fileElement = document.createElement('div');
        fileElement.className = 'bot-file';
        fileElement.innerHTML = `
            <span>${file.name}</span>
            <div class="bot-file-controls">
                <button class="file-action run-file" title="Run Bot">▶</button>
                <button class="file-action delete-file" title="Delete">🗑️</button>
            </div>
        `;
        
        // Set click event to open file
        fileElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('file-action')) {
                openBotFile(state, file.name);
            }
        });
        
        // Add run button event
        fileElement.querySelector('.run-file').addEventListener('click', () => {
            runBotFile(state, file.name);
        });
        
        // Add delete button event
        fileElement.querySelector('.delete-file').addEventListener('click', () => {
            deleteBotFile(state, file.name);
        });
        
        botFilesList.appendChild(fileElement);
    });
}

// Open bot file in editor
function openBotFile(state, fileName) {
    // Set active file
    state.vscodeIntegration.activeFile = fileName;
    
    // Get file content from templates
    const fileContent = botTemplates[fileName] || '# New Bot File';
    
    // Set editor content
    state.vscodeIntegration.editor.setValue(fileContent);
    
    // Set editor language based on file extension
    const fileExtension = fileName.split('.').pop();
    state.vscodeIntegration.editor.updateOptions({
        language: fileExtension === 'py' ? 'python' : 'javascript'
    });
    
    addLog(`Opened bot file: ${fileName}`, 'system', state);
}

// Run bot file
function runBotFile(state, fileName) {
    addLog(`Running bot: ${fileName}`, 'system', state);
    
    // Simulate bot running
    setTimeout(() => {
        addLog(`Bot ${fileName} connected to exchange`, 'system', state);
    }, 500);
    
    setTimeout(() => {
        addLog(`Bot ${fileName} analyzing market data...`, 'analysis', state);
    }, 1500);
    
    setTimeout(() => {
        const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const coin = fileName.includes('momentum') ? 'BTC' : 'ETH';
        const amount = (Math.random() * 0.1).toFixed(4);
        const price = coin === 'BTC' ? 30000 + Math.random() * 2000 : 2000 + Math.random() * 200;
        
        addLog(`${fileName}: ${action} ${amount} ${coin} @ $${price.toFixed(2)}`, 'trade', state);
    }, 3000);
}

// Delete bot file
function deleteBotFile(state, fileName) {
    // Confirm delete
    if (confirm(`Are you sure you want to delete ${fileName}?`)) {
        // Remove from state
        state.vscodeIntegration.botFiles = state.vscodeIntegration.botFiles.filter(file => file.name !== fileName);
        
        // If this was the active file, clear editor
        if (state.vscodeIntegration.activeFile === fileName) {
            state.vscodeIntegration.activeFile = null;
            state.vscodeIntegration.editor.setValue('');
        }
        
        // Update files list
        populateBotFilesList(state);
        
        addLog(`Deleted bot file: ${fileName}`, 'system', state);
    }
}

// Create new bot file
function createNewBotFile(state) {
    const fileName = prompt('Enter new bot file name (e.g., custom_bot.py):');
    
    if (fileName) {
        // Add to state
        state.vscodeIntegration.botFiles.push({
            name: fileName,
            status: 'idle',
            language: fileName.endsWith('.py') ? 'python' : 'javascript'
        });
        
        // Update files list
        populateBotFilesList(state);
        
        // Open the new file
        openBotFile(state, fileName);
        
        addLog(`Created new bot file: ${fileName}`, 'system', state);
    }
}

// Set up editor event listeners
function setupEditorEvents(state) {
    // Save button
    state.elements.saveBotFile.addEventListener('click', () => {
        if (state.vscodeIntegration.activeFile) {
            // Get editor content
            const content = state.vscodeIntegration.editor.getValue();
            
            // In a real app, this would save to a server
            // Here we'll just save to our template store
            botTemplates[state.vscodeIntegration.activeFile] = content;
            
            addLog(`Saved changes to ${state.vscodeIntegration.activeFile}`, 'system', state);
        } else {
            alert('No file is currently open');
        }
    });
    
    // Run button
    state.elements.runBotFile.addEventListener('click', () => {
        if (state.vscodeIntegration.activeFile) {
            runBotFile(state, state.vscodeIntegration.activeFile);
        } else {
            alert('No file is currently open');
        }
    });
    
    // New bot file button
    state.elements.newBotFile.addEventListener('click', () => {
        createNewBotFile(state);
    });
}