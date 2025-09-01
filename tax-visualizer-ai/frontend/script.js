const apiBase = 'http://localhost:8000';

// UI helpers: spinner and toast
function showSpinner(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'inline-block';
}
function hideSpinner(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}
function showToast(message, timeout = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'toast';
    div.textContent = message;
    container.appendChild(div);
    setTimeout(() => { div.remove(); }, timeout);
}

function setButtonsDisabled(disabled) {
    ['calc-btn', 'compare-btn', 'download-btn', 'chat-send'].forEach(id => {
        const b = document.getElementById(id);
        if (b) b.disabled = disabled;
    });
}

document.getElementById('calc-btn').onclick = async () => {
    const data = getFormData();
    if (isNaN(data.income) || data.income < 0) {
        showToast('Please enter a valid non-negative income.');
        return;
    }
    setButtonsDisabled(true);
    showSpinner('calc-spinner');
    let result;
    try {
        const res = await fetch(apiBase + '/calculate_tax', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Calculate API returned ' + res.status);
        result = await res.json();
        drawChart(result);
    } catch (err) {
        console.error('Error calculating tax:', err);
        showToast('Failed to calculate tax. Check server connection.');
        setButtonsDisabled(false);
        hideSpinner('calc-spinner');
        return;
    }
    try {
        // Professional context for chatbot
        const context = `User Income: ₹${data.income}\n\nOld Regime:\n  - Taxable Income: ₹${result.old_regime.taxable_income}\n  - Tax Payable: ₹${result.old_regime.tax}\n  - Deduction: ₹${result.old_regime.deductions}\n\nNew Regime:\n  - Taxable Income: ₹${result.new_regime.taxable_income}\n  - Tax Payable: ₹${result.new_regime.tax}\n  - Deduction: ₹${result.new_regime.deductions}\n`;
        const prompt = `You are a professional Indian tax assistant. Given the following user data and tax calculation results, provide a clear, concise summary, highlight which regime is more beneficial, and offer any suggestions for tax saving.\n\n${context}`;
        const aiRes = await fetch(apiBase + '/ask_ai', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({query: '', context: prompt, calculation_context: lastCalculation || result})
        });
        if (!aiRes.ok) throw new Error('AI API returned ' + aiRes.status);
        const aiData = await aiRes.json();
        appendChat('AI', aiData.response);
    } catch (err) {
        console.error('AI error:', err);
        showToast('Failed to get AI response.');
    } finally {
        hideSpinner('calc-spinner');
        setButtonsDisabled(false);
    }
};

document.getElementById('compare-btn').onclick = async () => {
    const data = getFormData();
    if (isNaN(data.income) || data.income < 0) {
        showToast('Please enter a valid non-negative income.');
        return;
    }
    setButtonsDisabled(true);
    showSpinner('compare-spinner');
    try {
        const res = await fetch(apiBase + '/calculate_tax', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Calculate API returned ' + res.status);
        const result = await res.json();
        drawChart(result);
    } catch (err) {
        console.error('Error comparing regimes:', err);
        showToast('Failed to compare regimes.');
    } finally {
        hideSpinner('compare-spinner');
        setButtonsDisabled(false);
    }
};

document.getElementById('download-btn').onclick = async () => {
    const data = getFormData();
    if (isNaN(data.income) || data.income < 0) {
        showToast('Please enter a valid non-negative income.');
        return;
    }
    setButtonsDisabled(true);
    showSpinner('download-spinner');
    try {
        const res = await fetch(apiBase + '/download_report', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Report API returned ' + res.status);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tax_report.pdf';
        a.click();
    } catch (err) {
        console.error('Error downloading report:', err);
        showToast('Failed to download report.');
    } finally {
        hideSpinner('download-spinner');
        setButtonsDisabled(false);
    }
};

document.getElementById('chat-send').onclick = async () => {
    const input = document.getElementById('chat-input');
    const msg = input.value;
    if (!msg) return;
    appendChat('You', msg);
    input.value = '';
    const res = await fetch(apiBase + '/ask_ai', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({query: msg, calculation_context: lastCalculation})
    });
    const data = await res.json();
    appendChat('AI', data.response);
};

function getFormData() {
    return {
    income: Number(document.getElementById('income').value) || 0
    };
}

let taxChartInstance = null;
// persist last successful calculation so AI can reference it
let lastCalculation = null;
function saveLastCalculation(calc) {
    try {
        localStorage.setItem('lastCalculation', JSON.stringify(calc));
    } catch (e) {
        console.warn('Could not save lastCalculation', e);
    }
}

function loadLastCalculation() {
    try {
        const s = localStorage.getItem('lastCalculation');
        return s ? JSON.parse(s) : null;
    } catch (e) {
        console.warn('Could not load lastCalculation', e);
        return null;
    }
}
function drawChart(result) {
    const ctx = document.getElementById('taxChart').getContext('2d');
    // Prepare data for Chart.js
    const barLabels = ['Total Income', 'Deduction', 'Taxable Income', 'Tax Payable'];
    const barKeys = ['total_income', 'deductions', 'taxable_income', 'tax'];
    const oldReg = result.old_regime || {};
    const newReg = result.new_regime || {};
    const oldData = barKeys.map(k => Number(oldReg[k]) || 0);
    const newData = barKeys.map(k => Number(newReg[k]) || 0);

    // Destroy previous chart instance if exists
    if (taxChartInstance) {
        taxChartInstance.destroy();
    }

    taxChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: barLabels,
            datasets: [
                {
                    label: 'Old Regime',
                    data: oldData,
                    backgroundColor: 'rgba(76, 175, 80, 0.8)',
                    borderColor: 'rgba(39, 174, 96, 1)',
                    borderWidth: 1
                },
                {
                    label: 'New Regime',
                    data: newData,
                    backgroundColor: 'rgba(33, 150, 243, 0.8)',
                    borderColor: 'rgba(41, 128, 185, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 14 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'end',
                    color: '#222',
                    font: {
                        weight: 'bold',
                        size: 13
                    },
                    formatter: function(value) {
                        return '₹' + value.toLocaleString('en-IN');
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 13 },
                        maxRotation: 30,
                        minRotation: 20
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        },
                        font: { size: 13 }
                    }
                }
            },
            barPercentage: 0.6,
            categoryPercentage: 0.5
        },
    plugins: window.ChartDataLabels ? [window.ChartDataLabels] : []
    });

    // Update summary blocks
    document.getElementById('summary-old').innerHTML = `<b>Old Regime</b><br>Total income: ₹${result.old_regime.total_income}<br>Deduction: ₹${result.old_regime.deductions}<br>Taxable income: ₹${result.old_regime.taxable_income}<br>Tax payable: ₹${result.old_regime.tax}`;
    document.getElementById('summary-new').innerHTML = `<b>New Regime</b><br>Total income: ₹${result.new_regime.total_income}<br>Deduction: ₹${result.new_regime.deductions}<br>Taxable income: ₹${result.new_regime.taxable_income}<br>Tax payable: ₹${result.new_regime.tax}`;
    // store for AI context
    lastCalculation = result;
    // persist to localStorage so context survives reloads
    saveLastCalculation(result);
}

function appendChat(sender, msg) {
    const log = document.getElementById('chat-log');
    const div = document.createElement('div');
    div.textContent = `${sender}: ${msg}`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
}

// On load, restore last calculation and render chart
(function() {
    const saved = loadLastCalculation();
    if (saved) {
        lastCalculation = saved;
        try { drawChart(saved); } catch (e) { console.warn('Could not draw saved chart', e); }
        showToast('Restored previous calculation');
    }
})();

// Clear saved context button
const clearBtn = document.getElementById('clear-saved');
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        try {
            localStorage.removeItem('lastCalculation');
            lastCalculation = null;
            // clear summaries and chart
            document.getElementById('summary-old').innerHTML = '';
            document.getElementById('summary-new').innerHTML = '';
            if (taxChartInstance) { taxChartInstance.destroy(); taxChartInstance = null; }
            showToast('Saved context cleared');
        } catch (e) {
            console.warn('Could not clear saved context', e);
            showToast('Could not clear saved context');
        }
    });
}
