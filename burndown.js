
import { formatter } from './formatter.js';
import { math, engine } from './utils.js';

export const burndown = {
    init: () => {
        const container = document.getElementById('tab-burndown');
        container.innerHTML = `
            <div class="card-container p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-white flex items-center gap-2">
                        <i class="fas fa-stairs text-purple-400" style="transform: scaleX(-1);"></i> Michigan 2026 Strategy Burn-Down
                    </h3>
                    <div class="text-[10px] text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                        Priority order is used to fill "Need" after Taxable Ceiling is met
                    </div>
                </div>
                <div id="burndown-table-container" class="max-h-[85vh] overflow-auto rounded-xl border border-slate-800"></div>
            </div>
        `;
    },

    load: (data) => {
        burndown.priorityOrder = data?.priority || ['cash', 'roth-basis', 'heloc', 'taxable', '401k', 'roth-earnings'];
    },

    scrape: () => ({ priority: burndown.priorityOrder }),

    assetMeta: {
        'cash': { label: 'Checking', color: '#f472b6', growthKey: null, taxable: false },
        'taxable': { label: 'Brokerage', color: '#34d399', growthKey: 'stockGrowth', taxable: true },
        'roth-basis': { label: 'Roth Basis', color: '#fbbf24', growthKey: 'stockGrowth', taxable: false },
        'heloc': { label: 'HELOC', color: '#ef4444', growthKey: null, taxable: false },
        '401k': { label: 'Pre-Tax', color: '#60a5fa', growthKey: 'stockGrowth', taxable: true },
        'roth-earnings': { label: 'Roth Gains', color: '#f87171', growthKey: 'stockGrowth', taxable: false },
    },

    run: () => {
        const data = window.currentData;
        if (!data || !data.assumptions) return;
        const results = burndown.calculate(data);
        document.getElementById('burndown-table-container').innerHTML = burndown.renderTable(results);
    },

    calculate: (data) => {
        const { assumptions, investments = [], income = [], budget = {}, helocs = [] } = data;
        const inflationRate = (assumptions.inflation || 3) / 100;
        const filingStatus = assumptions.filingStatus || 'Single';
        const magiCeilingMult = parseFloat(assumptions.benefitCeiling) || 1.38;
        const currentYear = new Date().getFullYear();

        // Initial Balances
        let bal = {
            'cash': investments.filter(i => i.type === 'Cash').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'taxable': investments.filter(i => i.type === 'Taxable').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'roth-basis': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + (math.fromCurrency(i.costBasis) || 0), 0),
            'roth-earnings': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + Math.max(0, math.fromCurrency(i.value) - (math.fromCurrency(i.costBasis) || 0)), 0),
            '401k': investments.filter(i => i.type === 'Pre-Tax (401k/IRA)').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'heloc': helocs.reduce((s, h) => s + (math.fromCurrency(h.limit) - math.fromCurrency(h.balance)), 0)
        };

        const fpl2026Base = filingStatus === 'Single' ? 16060 : 21710;
        let annualBudget = budget.expenses?.reduce((s, x) => s + math.fromCurrency(x.annual), 0) || 0;
        let ssBenefit = (assumptions.ssMonthly || 0) * 12;
        
        const results = [];
        for (let age = assumptions.currentAge; age <= 110; age++) {
            if (age > (parseFloat(document.getElementById('input-projection-end')?.value) || 100)) break;
            
            const isRetired = age >= assumptions.retirementAge;
            const yearResult = { age, year: currentYear + (age - assumptions.currentAge), draws: {}, totalDraw: 0 };
            
            // FPL Growth
            const fpl = fpl2026Base * Math.pow(1 + inflationRate, age - assumptions.currentAge);
            const magiLimit = fpl * magiCeilingMult;

            // Passive Income Calculation (Rental/Depreciation logic)
            let taxableIncome = 0;
            let nonTaxableIncome = 0;
            const activeIncomes = isRetired ? income.filter(i => i.remainsInRetirement) : income;
            
            activeIncomes.forEach(inc => {
                let amt = math.fromCurrency(inc.amount);
                if (inc.isMonthly) amt *= 12;
                amt -= (math.fromCurrency(inc.writeOffs) * (inc.writeOffsMonthly ? 12 : 1));
                
                const yearsWorked = Math.max(0, age - assumptions.currentAge);
                amt *= Math.pow(1 + (inc.increase / 100 || 0), yearsWorked);

                if (inc.nonTaxable || (inc.taxFreeUntil && age <= inc.taxFreeUntil)) {
                    nonTaxableIncome += amt;
                } else {
                    taxableIncome += amt;
                }
            });

            const ssYearly = (age >= assumptions.ssStartAge) ? ssBenefit * Math.pow(1 + inflationRate, Math.max(0, age - assumptions.ssStartAge)) : 0;
            taxableIncome += ssYearly; 

            // Taxation
            const tax = engine.calculateTax(taxableIncome, filingStatus);
            const netCashIn = taxableIncome + nonTaxableIncome - tax;
            const shortfall = Math.max(0, annualBudget - netCashIn);
            let remainingNeed = shortfall;

            // Strategy: Fill to MAGI Limit with taxable, then switch to non-taxable
            const taxableHeadroom = Math.max(0, magiLimit - taxableIncome);
            
            // Priority Pass 1: Taxable Draw (Up to Limit)
            if (taxableHeadroom > 0 && remainingNeed > 0) {
                const pList = ['taxable', '401k'];
                for (const pk of pList) {
                    if (remainingNeed <= 0) break;
                    const canDraw = Math.min(bal[pk], taxableHeadroom, remainingNeed);
                    bal[pk] -= canDraw;
                    yearResult.draws[pk] = (yearResult.draws[pk] || 0) + canDraw;
                    remainingNeed -= canDraw;
                    taxableIncome += canDraw; // Increases MAGI
                }
            }

            // Priority Pass 2: Non-Taxable filling (Roth Basis, Cash, HELOC)
            const ntPriority = ['cash', 'roth-basis', 'heloc', 'roth-earnings'];
            for (const pk of ntPriority) {
                if (remainingNeed <= 0) break;
                const canDraw = Math.min(bal[pk], remainingNeed);
                bal[pk] -= canDraw;
                yearResult.draws[pk] = (yearResult.draws[pk] || 0) + canDraw;
                remainingNeed -= canDraw;
            }

            // Fallback: If still need, take taxable and blow the ceiling
            if (remainingNeed > 0) {
                const pList = ['taxable', '401k'];
                for (const pk of pList) {
                    if (remainingNeed <= 0) break;
                    const canDraw = Math.min(bal[pk], remainingNeed);
                    bal[pk] -= canDraw;
                    yearResult.draws[pk] = (yearResult.draws[pk] || 0) + canDraw;
                    remainingNeed -= canDraw;
                    taxableIncome += canDraw;
                }
            }

            yearResult.magi = taxableIncome;
            yearResult.isMedicaid = taxableIncome < fpl * 1.38;
            yearResult.isSilver = taxableIncome < fpl * 2.5 && !yearResult.isMedicaid;
            yearResult.balances = { ...bal };
            yearResult.budget = annualBudget;
            yearResult.netWorth = Object.values(bal).reduce((a, b) => a + b, 0);
            results.push(yearResult);

            // Annual Growth
            annualBudget *= (1 + inflationRate);
            Object.keys(bal).forEach(k => {
                if (burndown.assetMeta[k]?.growthKey) bal[k] *= (1 + assumptions[burndown.assetMeta[k].growthKey]/100);
            });
        }
        return results;
    },

    renderTable: (results) => {
        const keys = ['cash', 'taxable', 'roth-basis', '401k', 'roth-earnings', 'heloc'];
        const headerCells = keys.map(k => `<th class="p-3 text-right" style="color: ${burndown.assetMeta[k].color}">${burndown.assetMeta[k].label}</th>`).join('');
        
        const rows = results.map(r => {
            const draws = keys.map(k => `
                <td class="p-2 text-right border-l border-slate-800/50">
                    <div class="${r.draws[k] > 0 ? 'text-white font-bold' : 'text-slate-600'}">${formatter.formatCurrency(r.draws[k] || 0, 0)}</div>
                    <div class="text-[8px] opacity-40">${formatter.formatCurrency(r.balances[k], 0)}</div>
                </td>
            `).join('');

            let benefitBadge = `<span class="text-[9px] text-slate-700">PRIVATE</span>`;
            if (r.isMedicaid) benefitBadge = `<span class="px-2 py-0.5 rounded bg-blue-900/40 text-blue-400 text-[9px] font-bold">MEDICAID</span>`;
            else if (r.isSilver) benefitBadge = `<span class="px-2 py-0.5 rounded bg-purple-900/40 text-purple-400 text-[9px] font-bold">SILVER</span>`;

            return `
                <tr class="border-b border-slate-800/50 hover:bg-slate-800/20 text-[10px]">
                    <td class="p-2 text-center font-bold border-r border-slate-700">${r.age}</td>
                    <td class="p-2 text-right text-slate-500">${formatter.formatCurrency(r.budget, 0)}</td>
                    <td class="p-2 text-right font-black text-emerald-400">${formatter.formatCurrency(r.magi, 0)}</td>
                    <td class="p-2 text-center">${benefitBadge}</td>
                    ${draws}
                    <td class="p-2 text-right font-black border-l border-slate-700 text-teal-400">${formatter.formatCurrency(r.netWorth, 0)}</td>
                </tr>
            `;
        }).join('');

        return `
            <table class="w-full text-left border-collapse">
                <thead class="sticky top-0 bg-slate-800 text-slate-500 uppercase text-[9px] tracking-wider z-20">
                    <tr>
                        <th class="p-3 border-r border-slate-700">Age</th>
                        <th class="p-3 text-right">Budget</th>
                        <th class="p-3 text-right">MAGI (Income)</th>
                        <th class="p-3 text-center">Benefit</th>
                        ${headerCells}
                        <th class="p-3 text-right border-l border-slate-700">Net Worth</th>
                    </tr>
                </thead>
                <tbody class="bg-slate-900/30">${rows}</tbody>
            </table>
        `;
    }
};
