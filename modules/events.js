import { addLog } from './logs.js';
import { updateLogs } from './logs.js';
import { generateActivationCode, updateConnectionStatus } from './ui.js';
import { loadMarketData } from './marketData.js';
import { updateCharts } from './charts.js';
import { simulateMarketAnalysis } from './workflow.js';

// Set up all event listeners
export function setupEventListeners(state) {
    // Safely add event listeners only if elements exist
    const addSafeEventListener = (elementId, event, handler) => {
        const element = state.elements[elementId];
        if (element && typeof element.addEventListener === 'function') {
            element.addEventListener(event, handler);
        }
    };

    // Workflow control buttons
    addSafeEventListener('startWorkflow', 'click', () => startWorkflow(state));
    addSafeEventListener('stopWorkflow', 'click', () => stopWorkflow(state));
    
    // Telegram connection
    addSafeEventListener('telegramConnect', 'click', function() {
        if (state.elements.telegramModal) {
            state.elements.telegramModal.style.display = 'block';
            generateTelegramQR();
        }
    });
    
    // Close modal
    addSafeEventListener('closeModalBtn', 'click', function() {
        if (state.elements.telegramModal) {
            state.elements.telegramModal.style.display = 'none';
        }
    });
    
    // Click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target === state.elements.telegramModal) {
            state.elements.telegramModal.style.display = 'none';
        }
    });
    
    // Copy activation code
    addSafeEventListener('copyCodeBtn', 'click', function() {
        if (state.elements.activationCode) {
            navigator.clipboard.writeText(state.elements.activationCode.textContent)
                .then(() => {
                    if (state.elements.copyCodeBtn) {
                        state.elements.copyCodeBtn.textContent = 'Copied!';
                        setTimeout(() => {
                            state.elements.copyCodeBtn.textContent = 'Copy';
                        }, 2000);
                    }
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                });
        }
    });
    
    // Log filter change
    addSafeEventListener('logFilter', 'change', () => updateLogs(state));
    
    // Clear logs
    addSafeEventListener('clearLogs', 'click', function() {
        state.logs = [];
        updateLogs(state);
        addLog('Logs cleared', 'system', state);
    });
    
    // Market data refresh
    addSafeEventListener('refreshData', 'click', () => loadMarketData(state));
    
    // Exchange selection change
    addSafeEventListener('exchangeSelect', 'change', () => loadMarketData(state));
    
    // Timeframe selection change
    addSafeEventListener('timeframeSelect', 'change', () => loadMarketData(state));
    
    // API configuration
    const saveApiConfigBtn = document.getElementById('save-api-config');
    if (saveApiConfigBtn) {
        saveApiConfigBtn.addEventListener('click', () => saveApiConfig(state));
    }
    
    // Funding configuration
    const saveFundingConfigBtn = document.getElementById('save-funding-config');
    if (saveFundingConfigBtn) {
        saveFundingConfigBtn.addEventListener('click', () => saveFundingConfig(state));
    }

    // Payment method selection
    addSafeEventListener('crypto-payment', 'change', () => showPaymentForm('crypto'));
    addSafeEventListener('bank-payment', 'change', () => showPaymentForm('bank'));
    addSafeEventListener('card-payment', 'change', () => showPaymentForm('card'));
    
    // Copy deposit address
    addSafeEventListener('copy-address', 'click', copyDepositAddress);
    
    // Process deposit
    addSafeEventListener('process-deposit', 'click', () => processDeposit(state));
}

// Start workflow
function startWorkflow(state) {
    if (state.workflowActive) return;
    
    addLog('Starting automated trading workflow', 'system', state);
    
    state.workflowActive = true;
    updateConnectionStatus(state, true);
    
    state.elements.startWorkflow.disabled = true;
    state.elements.stopWorkflow.disabled = false;
    
    // Initialize with first analysis
    simulateMarketAnalysis(state);
    
    // Set interval for regular analysis (every 30 seconds)
    state.analysisInterval = setInterval(() => simulateMarketAnalysis(state), 30000);
    
    // Also update charts more frequently
    state.chartsInterval = setInterval(() => updateCharts(state), 5000);
}

// Stop workflow
function stopWorkflow(state) {
    if (!state.workflowActive) return;
    
    addLog('Stopping automated trading workflow', 'system', state);
    
    state.workflowActive = false;
    updateConnectionStatus(state, false);
    
    state.elements.startWorkflow.disabled = false;
    state.elements.stopWorkflow.disabled = true;
    
    clearInterval(state.analysisInterval);
    clearInterval(state.chartsInterval);
}

// Generate Telegram QR Code
function generateTelegramQR() {
    // Simple SVG QR code generation for demo purposes
    const qrSvg = document.getElementById('telegram-qr');
    qrSvg.innerHTML = '';
    
    // Create a basic QR code pattern (this is just for visual representation)
    const cellSize = 8;
    const qrSize = 20;
    
    for (let i = 0; i < qrSize; i++) {
        for (let j = 0; j < qrSize; j++) {
            // Random QR pattern (this would be a real QR code in production)
            if (Math.random() > 0.7 || 
                // Border elements
                (i < 3 && j < 3) || // Top-left corner
                (i < 3 && j > qrSize - 4) || // Top-right corner
                (i > qrSize - 4 && j < 3)) { // Bottom-left corner
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', j * cellSize);
                rect.setAttribute('y', i * cellSize);
                rect.setAttribute('width', cellSize);
                rect.setAttribute('height', cellSize);
                rect.setAttribute('fill', '#000');
                qrSvg.appendChild(rect);
            }
        }
    }
}

function saveApiConfig(state) {
    const apiKey = document.getElementById('coinbase-api-key').value.trim();
    const apiSecret = document.getElementById('coinbase-api-secret').value.trim();
    const passphrase = document.getElementById('coinbase-passphrase').value.trim();
    const apiStatus = document.getElementById('api-status');
    
    if (!apiKey || !apiSecret || !passphrase) {
        apiStatus.textContent = 'Error: All fields are required';
        apiStatus.className = 'config-status status-error';
        return;
    }
    
    // Save API configuration
    state.apiConfig = state.apiConfig || {};
    state.apiConfig.coinbase = {
        apiKey,
        apiSecret,
        passphrase,
        isConfigured: true
    };
    
    // Test connection
    testApiConnection(state).then(success => {
        if (success) {
            apiStatus.textContent = 'API Successfully Configured';
            apiStatus.className = 'config-status status-configured';
            addLog('Coinbase API successfully configured', 'system', state);
            
            // Clear input fields for security
            document.getElementById('coinbase-api-key').value = '';
            document.getElementById('coinbase-api-secret').value = '';
            document.getElementById('coinbase-passphrase').value = '';
            
            // Get initial market data
            loadMarketData(state);
        } else {
            state.apiConfig.coinbase.isConfigured = false;
            apiStatus.textContent = 'Connection Failed: Check credentials';
            apiStatus.className = 'config-status status-error';
        }
    });
}

async function testApiConnection(state) {
    try {
        const { apiKey, apiSecret, passphrase } = state.apiConfig.coinbase;
        
        // Test API by fetching account information
        const response = await fetchCoinbaseAuthEndpoint(
            '/accounts',
            'GET',
            apiKey,
            apiSecret,
            passphrase
        );
        
        return response.ok;
    } catch (error) {
        console.error('API connection test failed:', error);
        return false;
    }
}

function saveFundingConfig(state) {
    const availableFunds = parseFloat(document.getElementById('available-funds').value);
    const maxPerTrade = parseFloat(document.getElementById('max-per-trade').value);
    const riskLevel = document.getElementById('risk-level').value;
    const fundingStatus = document.getElementById('funding-status');
    
    if (isNaN(availableFunds) || isNaN(maxPerTrade) || availableFunds <= 0 || maxPerTrade <= 0) {
        fundingStatus.textContent = 'Error: Please enter valid amounts';
        fundingStatus.className = 'config-status status-error';
        return;
    }
    
    if (maxPerTrade > availableFunds) {
        fundingStatus.textContent = 'Error: Max per trade cannot exceed available funds';
        fundingStatus.className = 'config-status status-error';
        return;
    }
    
    // Save funding configuration
    state.fundingConfig = {
        availableFunds,
        maxPerTrade,
        riskLevel
    };
    
    fundingStatus.textContent = 'Funding Successfully Configured';
    fundingStatus.className = 'config-status status-configured';
    
    addLog(`Funding configured: $${availableFunds} available with $${maxPerTrade} max per trade`, 'system', state);
    // updateDashboardStats(state); // This function is not defined in the plan
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

// Generate signature for Coinbase API
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

function showPaymentForm(type) {
    // Hide all forms
    document.querySelectorAll('.payment-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Show selected form
    const selectedForm = document.getElementById(`${type}-payment-form`);
    if (selectedForm) {
        selectedForm.classList.add('active');
    }
    
    // Generate QR code for crypto deposits
    if (type === 'crypto') {
        generateDepositQR();
    }
}

function generateDepositQR() {
    const qrContainer = document.getElementById('crypto-qr');
    qrContainer.innerHTML = '';
    
    // Create basic QR code visualization (similar to telegram QR)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '200');
    
    // Create a simple pattern (this would be a real QR code in production)
    for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
            if (Math.random() > 0.7) {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', j * 10);
                rect.setAttribute('y', i * 10);
                rect.setAttribute('width', 8);
                rect.setAttribute('height', 8);
                rect.setAttribute('fill', '#000');
                svg.appendChild(rect);
            }
        }
    }
    
    qrContainer.appendChild(svg);
}

function copyDepositAddress() {
    const address = document.getElementById('deposit-address');
    if (address) {
        navigator.clipboard.writeText(address.textContent)
            .then(() => {
                const copyBtn = document.getElementById('copy-address');
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy address:', err);
            });
    }
}

async function processDeposit(state) {
    const depositAmount = parseFloat(document.getElementById('deposit-amount').value);
    const depositStatus = document.getElementById('deposit-status');
    
    if (!depositAmount || depositAmount <= 0) {
        depositStatus.textContent = 'Please enter a valid deposit amount';
        depositStatus.className = 'config-status status-error';
        return;
    }
    
    depositStatus.textContent = 'Processing deposit...';
    depositStatus.className = 'config-status';
    
    try {
        // Get selected payment method
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        
        // Process deposit based on payment method
        let success = false;
        
        switch (paymentMethod) {
            case 'bank':
                success = await processBankTransfer(depositAmount);
                break;
            case 'card':
                success = await processCardPayment(depositAmount);
                break;
            case 'crypto':
                success = await processCryptoDeposit(depositAmount);
                break;
        }
        
        if (success) {
            // Update available funds
            state.fundingConfig.availableFunds += depositAmount;
            
            depositStatus.textContent = 'Deposit successful!';
            depositStatus.className = 'config-status status-configured';
            
            // Update UI
            // updateDashboardStats(state); // This function is not defined in the plan
            addLog(`Successfully deposited $${depositAmount.toFixed(2)}`, 'system', state);
        } else {
            throw new Error('Deposit processing failed');
        }
    } catch (error) {
        depositStatus.textContent = `Deposit failed: ${error.message}`;
        depositStatus.className = 'config-status status-error';
        addLog(`Deposit failed: ${error.message}`, 'error', state);
    }
}

async function processBankTransfer(amount) {
    // This would integrate with your banking API
    // For now, we'll simulate the process
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(true);
        }, 2000);
    });
}

async function processCardPayment(amount) {
    // This would integrate with your payment processor
    // For now, we'll simulate the process
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(true);
        }, 2000);
    });
}

async function processCryptoDeposit(amount) {
    // This would watch for incoming transactions
    // For now, we'll simulate the process
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(true);
        }, 2000);
    });
}