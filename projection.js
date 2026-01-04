
import { math, engine, assetColors } from './utils.js';

let chartInstance = null;
let isRealDollars = false;

export const projection = {
    load: (settings) => {
        if (!settings) return;
        isRealDollars = !!settings.isRealDollars;
        const realBtn = document.getElementById('toggle-projection-real');
        if (realBtn) {
            realBtn.classList.toggle('text-blue-400', isRealDollars);
            realBtn.classList.toggle('border-blue-500', isRealDollars);
        }
    },

    scrape: () => {
        return { isRealDollars };
    },

    run: (data) => {
        const { assumptions, investments = [], realEstate = [], otherAssets = [], budget = {} } = data;
        const currentYear = new Date().getFullYear();
        const endAge = parseFloat(document.getElementById('input-projection-end')?.value) || 75;
        const duration = endAge - assumptions.currentAge;

        const realBtn = document.getElementById('toggle-projection-real');
        if (realBtn && !realBtn.dataset.init) {
            realBtn.dataset.init = "true";
            realBtn.onclick = () => {
                isRealDollars = !isRealDollars;
                realBtn.classList.toggle('text-blue-400', isRealDollars);
                realBtn.classList.toggle('border-blue-500', isRealDollars);
                projection.run(window.currentData);
                window.debouncedAutoSave(); // Save state change
            };
        }
        
        // Buckets for Chart Display (Spendable Assets) - 529 removed per request
        let buckets = {
            'Cash': investments.filter(i => i.type === 'Cash').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Brokerage': investments.filter(i => i.type === 'Taxable').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Pre-Tax': investments.filter(i => i.type === 'Pre-Tax (401k/IRA)').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Post-Tax': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Crypto': investments.filter(i => i.type === 'Crypto').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Metals': investments.filter(i => i.type === 'Metals').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'HSA': investments.filter(i => i.type === 'HSA').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'Real Estate': realEstate.reduce((s, r) => s + (math.fromCurrency(r.value) - math.fromCurrency(r.mortgage)), 0),
            'Other': otherAssets.reduce((s, o) => s + (math.fromCurrency(o.value) - math.fromCurrency(o.loan)), 0)
        };

        // 529 handled as a "hidden" background asset for Net Worth only
        let hidden529 = investments.filter(i => i.type === '529 Plan').reduce((s, i) => s + math.fromCurrency(i.value), 0);

        const stockGrowth = (assumptions.stockGrowth || 7) / 100;
        const cryptoGrowth = (assumptions.cryptoGrowth || 15) / 100;
        const metalsGrowth = (assumptions.metalsGrowth || 4) / 100;
        const realEstateGrowth = (assumptions.realEstateGrowth || 3) / 100;
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
            
            const inflationFactor = Math.pow(1 + inflationRate, i);
            
            Object.keys(buckets).forEach((key, idx) => {
                let nominalValue = buckets[key];
                let displayValue = isRealDollars ? (nominalValue / inflationFactor) : nominalValue;
                datasets[idx].data.push(displayValue);
                
                // Growth logic
                if (key === 'Brokerage' || key === 'Pre-Tax' || key === 'Post-Tax' || key === 'HSA') buckets[key] *= (1 + stockGrowth);
                else if (key === 'Crypto') buckets[key] *= (1 + cryptoGrowth);
                else if (key === 'Metals') buckets[key] *= (1 + metalsGrowth);
                else if (key === 'Real Estate') buckets[key] *= (1 + realEstateGrowth);
                else if (key === 'Cash') buckets[key] *= (1 + (inflationRate * 0.5));
            });

            // Growth for hidden 529
            hidden529 *= (1 + stockGrowth);

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
                    stacked: true, 
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
