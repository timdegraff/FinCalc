
import { math } from './utils.js';

let chartInstance = null;

const assetColors = {
    'Cash': '#f472b6',
    'Taxable': '#34d399',
    'Pre-Tax (401k/IRA)': '#60a5fa',
    'Post-Tax (Roth)': '#fbbf24',
    'Real Estate': '#8b5cf6',
    'Other': '#94a3b8'
};

export const projection = {
    run: (data) => {
        const { assumptions, investments = [], realEstate = [], income = [], budget = {} } = data;
        const currentYear = new Date().getFullYear();
        const endAge = parseFloat(document.getElementById('input-projection-end')?.value) || 100;
        const duration = endAge - assumptions.currentAge;
        
        // Initialize buckets
        let buckets = {
            'Cash': investments.filter(i => i.type === 'Cash').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Taxable': investments.filter(i => i.type === 'Taxable').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Pre-Tax (401k/IRA)': investments.filter(i => i.type === 'Pre-Tax (401k/IRA)').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Post-Tax (Roth)': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Real Estate': realEstate.reduce((s, r) => s + math.fromCurrency(r.value), 0)
        };

        const growthRate = (assumptions.stockGrowth || 7) / 100;
        const inflationRate = (assumptions.inflation || 3) / 100;
        
        const labels = [];
        const datasets = Object.keys(buckets).map(key => ({
            label: key,
            data: [],
            backgroundColor: assetColors[key] || '#ccc',
            borderColor: 'transparent',
            fill: true,
            pointRadius: 0
        }));
        
        for (let i = 0; i <= duration; i++) {
            const age = assumptions.currentAge + i;
            labels.push(`${age} (${currentYear + i})`);
            
            Object.keys(buckets).forEach((key, idx) => {
                datasets[idx].data.push(buckets[key]);
                
                // Growth
                // Real estate usually grows at inflation or slightly above, but for simplicity here we use stock growth
                // except for Cash which we assume grows at 0% real (i.e., inflation).
                if (key !== 'Cash') {
                    buckets[key] *= (1 + growthRate);
                } else {
                    buckets[key] *= (1 + (inflationRate * 0.5)); // Cash usually earns some interest
                }
            });

            // Add Savings if not retired
            if (age < assumptions.retirementAge) {
                // Split savings based on 401k vs other
                const annual401k = engine.calculateSummaries(data).total401kContribution;
                const otherSavings = (budget.savings?.reduce((s, x) => s + math.fromCurrency(x.annual), 0) || 0);
                
                buckets['Pre-Tax (401k/IRA)'] += annual401k;
                buckets['Taxable'] += otherSavings; // Assume non-401k savings go to taxable brokerage
            }
        }
        
        renderChart(labels, datasets);
    }
};

function renderChart(labels, datasets) {
    const ctx = document.getElementById('projection-chart')?.getContext('2d');
    if (!ctx) return;

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: true, position: 'bottom', labels: { color: '#64748b', boxWidth: 12, font: { size: 10 } } },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#0f172a',
                    titleColor: '#fff',
                    bodyColor: '#94a3b8',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${math.toCurrency(context.parsed.y)}`
                    }
                }
            },
            scales: {
                y: {
                    stacked: true,
                    ticks: { color: '#64748b', font: { size: 10 }, callback: (v) => math.toCurrency(v, true) },
                    grid: { color: 'rgba(51, 65, 85, 0.3)' }
                },
                x: {
                    ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 },
                    grid: { display: false }
                }
            }
        }
    });
}
