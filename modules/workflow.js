import { addLog } from './logs.js';
import { updateTargetCoins, updateActiveStrategies, updateDashboardStats } from './ui.js';
import { updateCharts } from './charts.js';

// Simulate market analysis
export function simulateMarketAnalysis(state) {
    addLog('Running market analysis...', 'analysis', state);
    
    // Simulate finding new target coins
    const possibleCoins = [
        { symbol: 'BTC', name: 'Bitcoin' },
        { symbol: 'ETH', name: 'Ethereum' },
        { symbol: 'XRP', name: 'Ripple' },
        { symbol: 'ADA', name: 'Cardano' },
        { symbol: 'SOL', name: 'Solana' },
        { symbol: 'DOT', name: 'Polkadot' },
        { symbol: 'DOGE', name: 'Dogecoin' },
        { symbol: 'AVAX', name: 'Avalanche' },
        { symbol: 'LINK', name: 'Chainlink' },
        { symbol: 'MATIC', name: 'Polygon' }
    ];
    
    // Clear existing coins occasionally
    if (Math.random() > 0.7) {
        state.marketData.coins = [];
    }
    
    // Add 3-5 coins
    const targetCoinCount = 3 + Math.floor(Math.random() * 3);
    
    while (state.marketData.coins.length < targetCoinCount) {
        const randomCoin = possibleCoins[Math.floor(Math.random() * possibleCoins.length)];
        
        // Check if coin already exists
        if (!state.marketData.coins.find(c => c.symbol === randomCoin.symbol)) {
            const coin = {
                ...randomCoin,
                price: 10 + Math.random() * 1000,
                trend: (Math.random() * 10) - 3 // Random trend -3% to +7%
            };
            
            state.marketData.coins.push(coin);
            addLog(`Added ${coin.symbol} to target list based on pattern analysis`, 'analysis', state);
        }
    }
    
    // Update strategies
    state.appliedStrategies = [];
    
    // Apply 2-4 strategies
    const strategyCount = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < strategyCount; i++) {
        const randomStrategy = state.strategies[Math.floor(Math.random() * state.strategies.length)];
        const randomCoin = state.marketData.coins[Math.floor(Math.random() * state.marketData.coins.length)];
        
        state.appliedStrategies.push({
            ...randomStrategy,
            coinSymbol: randomCoin.symbol,
            description: randomStrategy.description
        });
        
        addLog(`Applied ${randomStrategy.name} strategy to ${randomCoin.symbol}`, 'analysis', state);
    }
    
    // Update active bots
    const botsToCreate = Math.floor(Math.random() * 3);
    
    for (let i = 0; i < botsToCreate; i++) {
        const randomCoin = state.marketData.coins[Math.floor(Math.random() * state.marketData.coins.length)];
        const randomStrategy = state.strategies[Math.floor(Math.random() * state.strategies.length)];
        
        const bot = {
            id: Date.now() + i,
            coin: randomCoin.symbol,
            strategy: randomStrategy.name,
            status: 'active',
            startTime: new Date().toISOString()
        };
        
        state.activeBots.push(bot);
        addLog(`Started new trading bot for ${bot.coin} using ${bot.strategy}`, 'trade', state);
    }
    
    // Simulate trades
    if (state.activeBots.length > 0 && Math.random() > 0.3) {
        const randomBot = state.activeBots[Math.floor(Math.random() * state.activeBots.length)];
        const randomCoin = state.marketData.coins.find(c => c.symbol === randomBot.coin);
        
        if (randomCoin) {
            const isBuy = Math.random() > 0.5;
            const amount = (0.1 + Math.random() * 0.9).toFixed(5);
            const price = randomCoin.price;
            const value = (amount * price).toFixed(2);
            
            if (isBuy) {
                executeTrade(state, 'buy', randomCoin, amount).then(result => {
                    if (result) {
                        addLog(`BOT #${randomBot.id}: BUY ${amount} ${randomCoin.symbol} @ $${price.toFixed(2)} = $${value}`, 'trade', state);
                    }
                });
            } else {
                const profitPercent = ((Math.random() * 6) - 1.5).toFixed(2);
                executeTrade(state, 'sell', randomCoin, amount).then(result => {
                    if (result) {
                        addLog(`BOT #${randomBot.id}: SELL ${amount} ${randomCoin.symbol} @ $${price.toFixed(2)} = $${value} (${profitPercent}%)`, 'trade', state);
                    }
                });
            }
        }
    }
    
    // Simulate balance changes
    const balanceChange = (Math.random() * 200) - 50;
    state.marketData.totalBalance += balanceChange;
    state.marketData.profitLoss += balanceChange;
    
    // Occasionally simulate an error
    if (Math.random() > 0.9) {
        const errorTypes = [
            'API rate limit exceeded',
            'Connection timeout when accessing exchange API',
            'Insufficient balance for trade',
            'Order placement failed',
            'Strategy calculation error'
        ];
        
        const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        addLog(`ERROR: ${randomError}`, 'error', state);
    }
    
    // Update UI
    updateDashboardStats(state);
    updateTargetCoins(state);
    updateActiveStrategies(state);
    updateCharts(state);
}

// Execute a trade
export async function executeTrade(state, action, coin, amount) {
    if (!state.apiConfig.coinbase.isConfigured) {
        addLog("Cannot execute trade: API not configured", "error", state);
        return false;
    }

    try {
        const { apiKey, apiSecret, passphrase } = state.apiConfig.coinbase;
        
        // Ensure we have sufficient funds for the trade
        if (action === 'buy' && amount * coin.price > state.fundingConfig.availableFunds) {
            addLog(`Insufficient funds for ${action} order of ${amount} ${coin.symbol}`, "error", state);
            return false;
        }
        
        // Check if amount exceeds max per trade
        if (amount * coin.price > state.fundingConfig.maxPerTrade) {
            addLog(`Trade amount exceeds maximum per trade limit`, "warning", state);
            amount = state.fundingConfig.maxPerTrade / coin.price;
        }
        
        // Prepare order parameters
        const orderParams = {
            type: 'market',
            side: action,
            product_id: `${coin.symbol}-USD`,
            size: amount.toString()
        };
        
        // Execute live trade
        const response = await fetchCoinbaseAuthEndpoint(
            '/orders',
            'POST',
            apiKey,
            apiSecret,
            passphrase,
            orderParams
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Order failed: ${errorData.message || response.statusText}`);
        }
        
        const orderData = await response.json();
        
        // Update available funds
        if (action === 'buy') {
            state.fundingConfig.availableFunds -= (amount * coin.price);
        } else {
            state.fundingConfig.availableFunds += (amount * coin.price);
        }
        
        addLog(`Successfully placed ${action.toUpperCase()} order for ${amount} ${coin.symbol} @ $${coin.price.toFixed(2)}`, "trade", state);
        
        // Update UI
        updateDashboardStats(state);
        
        return true;
    } catch (error) {
        addLog(`Trade execution error: ${error.message}`, "error", state);
        console.error('Trade execution error:', error);
        return false;
    }
}

// Helper function for Coinbase API calls
async function fetchCoinbaseAuthEndpoint(endpoint, method, apiKey, apiSecret, passphrase, body = null) {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = `/api/v3${endpoint}`;
    
    // Create signature
    let message = timestamp + method + path;
    if (body) {
        message += JSON.stringify(body);
    }
    
    // This would be done server-side in production
    const signature = await generateSignature(message, apiSecret);
    
    const options = {
        method,
        headers: {
            'CB-ACCESS-KEY': apiKey,
            'CB-ACCESS-SIGN': signature,
            'CB-ACCESS-TIMESTAMP': timestamp.toString(),
            'CB-ACCESS-PASSPHRASE': passphrase,
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    return fetch(`https://api.exchange.coinbase.com${path}`, options);
}

// Generate signature (simplified - in production this should be server-side)
async function generateSignature(message, secret) {
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);
    const secretBuffer = encoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
        'raw',
        secretBuffer,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        messageBuffer
    );
    
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}