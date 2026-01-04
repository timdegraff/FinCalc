
import { math } from './utils.js';

let chartInstance = null;

export const projection = {
    run: (data) => {
        const { assumptions, investments = [], income = [], budget = {} } = data;
        const currentYear = new Date().getFullYear();
        const duration = 100 - assumptions.currentAge;
        
        let assets = investments.reduce((s, x) => s + math.fromCurrency(x.value), 0);
        const growthRate = (assumptions.stockGrowth || 7) / 100;
        const inflationRate = (assumptions.inflation || 3) / 100;
        
        const labels = [];
        const dataPoints = [];
        
        for (let i = 0; i <= duration; i++) {
            const age = assumptions.currentAge + i;
            const year = currentYear + i;
            labels.push(`${age} (${year})`);
            dataPoints.push(assets);
            
            // Compound
            assets *= (1 + growthRate);
            
            // Add Savings if not retired
            if (age < assumptions.retirementAge) {
                const totalIncome = income.reduce((s, x) => s + math.fromCurrency(x.amount), 0);
                const annualSavings = (budget.savings?.reduce((s, x) => s + math.fromCurrency(x.annual), 0) || 0);
                assets += annualSavings;
            }
        }
        
        renderChart(labels, dataPoints);
    }
};

function renderChart(labels, data) {
    const ctx = document.getElementById('projection-chart')?.getContext('2d');
    if (!ctx) return;

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Net Worth Projection',
                data: data,
                borderColor: '#2dd4bf',
                backgroundColor: 'rgba(45, 212, 191, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    ticks: { color: '#64748b', callback: (v) => math.toCurrency(v, true) },
                    grid: { color: 'rgba(51, 65, 85, 0.5)' }
                },
                x: {
                    ticks: { color: '#64748b', maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
                    grid: { display: false }
                }
            }
        }
    });
}
