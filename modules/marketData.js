import { addLog } from './logs.js';
import { updateDashboardStats, updateTargetCoins } from './ui.js';
import { updateChartWithRealData } from './charts.js';

// Load market data from cryptocurrency API
export async function loadMarketData(state) {
    try {
        addLog('Fetching live market data...', 'system', state);
        
        // Get selected exchange
        const exchange = state.elements.exchangeSelect.value;
        
        if (exchange === 'coinbase' && state.apiConfig.coinbase.apiKey) {
            return loadCoinbaseData(state);
        }
        
        // API endpoint for CoinGecko
        const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h';
        
        // Fetch data
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process the data
        const processedCoins = data.map(coin => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            price: coin.current_price,
            trend: coin.price_change_percentage_24h || 0,
            volume: coin.total_volume,
            marketCap: coin.market_cap,
            image: coin.image
        }));
        
        // Update state with live data
        state.marketData.coins = processedCoins;
        state.marketData.lastUpdated = new Date();
        
        // Populate market data table
        populateMarketTable(state, processedCoins);
        
        // Update chart with real data
        updateChartWithRealData(state, processedCoins);
        
        // Update UI
        updateTargetCoins(state);
        updateDashboardStats(state);
        
        addLog(`Successfully loaded data for ${processedCoins.length} coins from ${exchange}`, 'system', state);
        
    } catch (error) {
        addLog(`Error fetching market data: ${error.message}`, 'error', state);
        console.error('Market data fetch error:', error);
    }
}

// Populate the market data table
function populateMarketTable(state, coins) {
    const tableBody = state.elements.marketDataBody;
    tableBody.innerHTML = '';
    
    coins.slice(0, 15).forEach(coin => {
        const row = document.createElement('tr');
        
        // Coin cell with icon and name
        const coinCell = document.createElement('td');
        coinCell.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${coin.image}" width="24" height="24" alt="${coin.symbol}">
                <div>
                    <div>${coin.symbol}</div>
                    <div style="font-size: 0.8rem; color: var(--text-medium);">${coin.name}</div>
                </div>
            </div>
        `;
        
        // Price cell
        const priceCell = document.createElement('td');
        priceCell.textContent = `$${coin.price.toFixed(2)}`;
        
        // 24h change cell
        const changeCell = document.createElement('td');
        const isPositive = coin.trend >= 0;
        changeCell.textContent = `${isPositive ? '+' : ''}${coin.trend.toFixed(2)}%`;
        changeCell.style.color = isPositive ? 'var(--success-color)' : 'var(--danger-color)';
        
        // Volume cell
        const volumeCell = document.createElement('td');
        volumeCell.textContent = `$${formatNumber(coin.volume)}`;
        
        // Market cap cell
        const marketCapCell = document.createElement('td');
        marketCapCell.textContent = `$${formatNumber(coin.marketCap)}`;
        
        // Action cell with analyze button
        const actionCell = document.createElement('td');
        const analyzeButton = document.createElement('button');
        analyzeButton.className = 'small-btn';
        analyzeButton.textContent = 'Analyze';
        analyzeButton.addEventListener('click', () => {
            addLog(`Starting deep analysis of ${coin.symbol}...`, 'analysis', state);
            // This would trigger a detailed coin analysis
        });
        actionCell.appendChild(analyzeButton);
        
        // Add all cells to row
        row.appendChild(coinCell);
        row.appendChild(priceCell);
        row.appendChild(changeCell);
        row.appendChild(volumeCell);
        row.appendChild(marketCapCell);
        row.appendChild(actionCell);
        
        tableBody.appendChild(row);
    });
}

// Load data from Coinbase Pro API
async function loadCoinbaseData(state) {
    try {
        addLog('Fetching live Coinbase market data...', 'system', state);
        
        // Using Coinbase API
        const { apiKey, apiSecret, passphrase } = state.apiConfig.coinbase;
        
        // Fetch account balances
        const accountsResponse = await fetchCoinbaseAuthEndpoint(
            '/accounts',
            'GET',
            apiKey,
            apiSecret,
            passphrase
        );
        
        if (!accountsResponse.ok) {
            throw new Error(`Coinbase API error: ${accountsResponse.status}`);
        }
        
        const accounts = await accountsResponse.json();
        
        // Calculate total balance
        let totalBalance = 0;
        const activeAccounts = accounts.filter(account => parseFloat(account.balance) > 0);
        
        // Fetch current prices for all currencies
        const tickersResponse = await fetch('https://api.exchange.coinbase.com/products/stats');
        const tickers = await tickersResponse.json();
        
        // Process account data
        const processedCoins = await Promise.all(activeAccounts.map(async account => {
            const currency = account.currency;
            
            // Get current price
            const productResponse = await fetch(`https://api.exchange.coinbase.com/products/${currency}-USD/stats`);
            let price = 0;
            let trend = 0;
            
            if (productResponse.ok) {
                const productStats = await productResponse.json();
                price = parseFloat(productStats.last);
                trend = ((price - parseFloat(productStats.open)) / parseFloat(productStats.open)) * 100;
            }
            
            const balance = parseFloat(account.balance);
            const usdValue = balance * price;
            totalBalance += usdValue;
            
            return {
                id: currency.toLowerCase(),
                symbol: currency,
                name: currency,
                price: price,
                trend: trend,
                volume: 0,
                marketCap: 0,
                balance: balance,
                usdValue: usdValue
            };
        }));
        
        // Update state with live data
        state.marketData.coins = processedCoins;
        state.marketData.totalBalance = totalBalance;
        state.marketData.lastUpdated = new Date();
        
        // Populate market data table with real balances
        populateMarketTable(state, processedCoins);
        
        // Update chart with real data
        updateChartWithRealData(state, processedCoins);
        
        // Update UI
        updateTargetCoins(state);
        updateDashboardStats(state);
        
        addLog(`Successfully loaded live data for ${processedCoins.length} coins from Coinbase`, 'system', state);
        return true;
        
    } catch (error) {
        addLog(`Error fetching Coinbase data: ${error.message}`, 'error', state);
        console.error('Coinbase data fetch error:', error);
        return false;
    }
}

// Authenticate and fetch from Coinbase API
async function fetchCoinbaseAuthEndpoint(endpoint, method, apiKey, apiSecret, passphrase) {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = `/api/v3${endpoint}`;
    
    // Create signature (in a real app this would be done server-side for security)
    const message = timestamp + method + path;
    
    // Note: In a production app, HMAC signing should be done server-side
    // This is a simplified example
    const signature = await generateSignature(message, apiSecret);
    
    return fetch(`https://api.exchange.coinbase.com${path}`, {
        method,
        headers: {
            'CB-ACCESS-KEY': apiKey,
            'CB-ACCESS-SIGN': signature,
            'CB-ACCESS-TIMESTAMP': timestamp.toString(),
            'CB-ACCESS-PASSPHRASE': passphrase,
            'Content-Type': 'application/json'
        }
    });
}

// Generate HMAC signature (simplified - would be done server-side)
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

// Format large numbers with K, M, B suffixes
function formatNumber(num) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    }
    if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    }
    if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toFixed(2);
}