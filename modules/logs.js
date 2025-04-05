// Add log entry
export function addLog(text, type = 'system', state) {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0];
    
    const log = {
        time: timeString,
        text: text,
        type: type
    };
    
    state.logs.unshift(log); // Add to beginning
    
    // Keep logs limited to recent ones
    if (state.logs.length > 100) {
        state.logs.pop();
    }
    
    updateLogs(state);
    
    return log;
}

// Update logs display
export function updateLogs(state) {
    const filter = state.elements.logFilter.value;
    
    state.elements.logContainer.innerHTML = '';
    
    state.logs.forEach(log => {
        if (filter === 'all' || filter === log.type) {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${log.type}-log`;
            
            const timeSpan = document.createElement('span');
            timeSpan.className = 'log-time';
            timeSpan.textContent = log.time;
            
            const textSpan = document.createElement('span');
            textSpan.className = 'log-text';
            textSpan.textContent = log.text;
            
            logEntry.appendChild(timeSpan);
            logEntry.appendChild(textSpan);
            
            state.elements.logContainer.appendChild(logEntry);
        }
    });
}