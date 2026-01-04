
import { math, engine } from './utils.js';

let chartInstance = null;
let isLogScale = false;

const assetColors = {
    'Cash': '#f472b6',
    'Brokerage': '#34d399',
    'Pre-Tax': '#60a5fa',
    'Post-Tax': '#fbbf24',
    'Crypto': '#f59e0b',
    'Metals': '#94a3b8',
    'Real Estate': '#8b5cf6',
    'Other': '#64748b'
};

export const projection = {
    run: (data) => {
        const { assumptions, investments = [], realEstate = [], otherAssets = [], budget = {} } = data;
        const currentYear = new Date().getFullYear();
        const endAge = parseFloat(document.getElementById('input-projection-end')?.value) || 100;
        const duration = endAge - assumptions.currentAge;

        // Init toggle if not done
        const logBtn = document.getElementById('toggle-log-scale');
        if (logBtn && !logBtn.dataset.init) {
            logBtn.dataset.init = "true";
            logBtn.onclick = () => {
                isLogScale = !isLogScale;
                logBtn.classList.toggle('text-blue-400', isLogScale);
                logBtn.classList.toggle('border-blue-500', isLogScale);
                projection.run(window.currentData);
            };
        }
        
        let buckets = {
            'Cash': investments.filter(i => i.type === 'Cash').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Brokerage': investments.filter(i => i.type === 'Taxable').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Pre-Tax': investments.filter(i => i.type === 'Pre-Tax (401k/IRA)').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Post-Tax': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Crypto': investments.filter(i => i.type === 'Crypto').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Metals': investments.filter(i => i.type === 'Metals').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Real Estate': realEstate.reduce((s, r) => s + math.fromCurrency(r.value), 0),
            'Other': otherAssets.reduce((s, o) => s + math.fromCurrency(o.value), 0)
        };

        const stockGrowth = (assumptions.stockGrowth || 7) / 100;
        const cryptoGrowth = (assumptions.cryptoGrowth || 15) / 100;
        const metalsGrowth = (assumptions.metalsGrowth || 4) / 100;
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
                
                // Growth mapping
                if (key === 'Brokerage' || key === 'Pre-Tax' || key === 'Post-Tax') buckets[key] *= (1 + stockGrowth);
                else if (key === 'Crypto') buckets[key] *= (1 + cryptoGrowth);
                else if (key === 'Metals') buckets[key] *= (1 + metalsGrowth);
                else if (key === 'Real Estate') buckets[key] *= (1 + (inflationRate + 0.01));
                else if (key === 'Cash') buckets[key] *= (1 + (inflationRate * 0.5));
                else if (key === 'Other') { /* 0% Growth as per request */ }
            });

            if (age < assumptions.retirementAge) {
                const summaries = engine.calculateSummaries(data);
                buckets['Pre-Tax'] += summaries.total401kContribution;
                buckets['Brokerage'] += (budget.savings?.reduce((s, x) => s + math.fromCurrency(x.annual), 0) || 0);
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
            interaction: { mode: 'index', intersect: false },
            plugins: { 
                legend: { display: true, position: 'bottom', labels: { color: '#64748b', font: { size: 10 } } },
                tooltip: {
                    backgroundColor: '#0f172a',
                    callbacks: { label: (c) => `${c.dataset.label}: ${math.toCurrency(c.parsed.y)}` }
                }
            },
            scales: {
                y: { 
                    stacked: !isLogScale, 
                    type: isLogScale ? 'logarithmic' : 'linear',
                    ticks: { 
                        color: '#64748b', 
                        font: { size: 10 }, 
                        callback: (v) => math.toCurrency(v, true) 
                    }, 
                    grid: { color: 'rgba(51, 65, 85, 0.2)' } 
                },
                x: { ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 12 }, grid: { display: false } }
            }
        }
    });
}
