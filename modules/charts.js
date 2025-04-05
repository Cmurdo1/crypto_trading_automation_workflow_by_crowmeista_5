// Initialize charts
export function initializeCharts(state) {
    // Price Chart
    const priceCtx = state.elements.priceChart.getContext('2d');
    state.priceChartInstance = new Chart(priceCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'BTC Price',
                data: [],
                borderColor: '#2962ff',
                backgroundColor: 'rgba(41, 98, 255, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#adb5bd'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#adb5bd'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e9ecef'
                    }
                }
            }
        }
    });

    // Activity Chart
    const activityCtx = state.elements.activityChart.getContext('2d');
    state.activityChartInstance = new Chart(activityCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Buy Orders',
                data: [],
                backgroundColor: 'rgba(0, 200, 83, 0.7)'
            }, {
                label: 'Sell Orders',
                data: [],
                backgroundColor: 'rgba(255, 61, 0, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#adb5bd'
                    }
                },
                y: {
                    stacked: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#adb5bd'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e9ecef'
                    }
                }
            }
        }
    });
}

// Update charts with new data
export function updateCharts(state) {
    // Update price chart
    if (state.priceChartInstance) {
        // Add current timestamp
        const now = new Date();
        const timeString = now.toTimeString().split(' ')[0].substring(0, 5);
        
        if (state.priceChartInstance.data.labels.length > 20) {
            state.priceChartInstance.data.labels.shift();
            state.priceChartInstance.data.datasets[0].data.shift();
        }
        
        state.priceChartInstance.data.labels.push(timeString);
        
        // Simulate BTC price
        const lastPrice = state.priceChartInstance.data.datasets[0].data.length > 0 
            ? state.priceChartInstance.data.datasets[0].data[state.priceChartInstance.data.datasets[0].data.length - 1]
            : 30000 + Math.random() * 1000;
            
        const change = (Math.random() - 0.5) * 200;
        const newPrice = lastPrice + change;
        
        state.priceChartInstance.data.datasets[0].data.push(newPrice);
        state.priceChartInstance.update();
    }
    
    // Update activity chart
    if (state.activityChartInstance) {
        if (state.activityChartInstance.data.labels.length > 12) {
            state.activityChartInstance.data.labels.shift();
            state.activityChartInstance.data.datasets[0].data.shift();
            state.activityChartInstance.data.datasets[1].data.shift();
        }
        
        // Get hour
        const hour = new Date().getHours();
        state.activityChartInstance.data.labels.push(hour + ':00');
        
        // Random trade activity
        const buyVolume = Math.floor(Math.random() * 8);
        const sellVolume = Math.floor(Math.random() * 6);
        
        state.activityChartInstance.data.datasets[0].data.push(buyVolume);
        state.activityChartInstance.data.datasets[1].data.push(sellVolume);
        
        state.activityChartInstance.update();
    }
}

// Update chart with real market data
export function updateChartWithRealData(state, coins) {
    if (!state.priceChartInstance || coins.length === 0) return;
    
    // Get primary coin for chart (e.g., BTC)
    const primaryCoin = coins.find(coin => coin.symbol === 'BTC') || coins[0];
    
    // Update chart title
    state.priceChartInstance.data.datasets[0].label = `${primaryCoin.symbol} Price`;
    
    // For a real implementation, we would fetch historical data
    // Here we'll simulate it based on current price
    const currentPrice = primaryCoin.price;
    
    // Generate simulated historical data points
    const historicalPrices = [];
    const timestamps = [];
    
    // Generate 20 data points going back in time
    for (let i = 19; i >= 0; i--) {
        // Random fluctuation around current price with trend
        const volatility = currentPrice * 0.05; // 5% volatility
        const trend = primaryCoin.trend / 100; // Use 24h trend as direction
        const timeOffset = i * 30; // 30 minutes between points
        
        // Calculate price with some randomness but following trend
        const randomFactor = (Math.random() - 0.5) * 2;
        const trendFactor = 1 + (trend * (i / 19)) + (randomFactor * 0.01);
        const price = currentPrice * trendFactor;
        
        // Add data point
        historicalPrices.unshift(price);
        
        // Create timestamp
        const timestamp = new Date();
        timestamp.setMinutes(timestamp.getMinutes() - timeOffset);
        timestamps.unshift(timestamp.toTimeString().substring(0, 5));
    }
    
    // Update chart data
    state.priceChartInstance.data.labels = timestamps;
    state.priceChartInstance.data.datasets[0].data = historicalPrices;
    state.priceChartInstance.update();
}