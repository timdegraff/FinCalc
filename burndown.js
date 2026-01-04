
import { formatter } from './formatter.js';
import { math, engine } from './utils.js';
import { benefits } from './benefits.js';

export const burndown = {
    init: () => {
        const burndownTab = document.getElementById('tab-burndown');
        burndownTab.innerHTML = `
            <div class="card-container p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                 <div id="burndown-sliders-container" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"></div>
                 <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-white flex items-center gap-2">
                        <i class="fas fa-stairs text-purple-400" style="transform: scaleX(-1);"></i> Retirement Burn-Down Details
                    </h3>
                    <div class="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                        Drag headers to change draw order
                    </div>
                 </div>
                 <div id="burndown-table-container" class="max-h-[75vh] overflow-auto rounded-xl border border-slate-800"></div>
                 <details class="mt-8 group">
                    <summary class="cursor-pointer text-slate-500 hover:text-slate-300 transition-colors list-none flex items-center gap-2">
                        <i class="fas fa-chevron-right group-open:rotate-90 transition-transform"></i> Debug Console
                    </summary>
                    <div id="burndown-debug-container" class="mt-4 p-5 bg-slate-950 rounded-lg font-mono text-xs overflow-auto border border-slate-800"></div>
                 </details>
            </div>
        `;
    },

    load: (data) => {
        burndown.priorityOrder = data?.priority || burndown.defaultPriority;
    },

    scrape: () => {
        return { priority: burndown.priorityOrder };
    },

    defaultPriority: ['cash', 'taxable', 'roth-basis', 'metals', 'crypto', 'heloc', '401k-72t', '401k', 'roth-earnings'],
    
    assetMeta: {
        'cash': { label: 'Checking', color: '#f472b6', growthKey: null, type: 'Cash' },
        'taxable': { label: 'Brokerage', color: '#34d399', growthKey: 'stockGrowth', type: 'Taxable' },
        'roth-basis': { label: 'Roth Basis', color: '#fbbf24', growthKey: 'stockGrowth', type: 'Post-Tax (Roth)' },
        'metals': { label: 'Metals', color: '#eab308', growthKey: 'metalsGrowth', type: 'Metals' },
        'crypto': { label: 'Bitcoin', color: '#f97316', growthKey: 'cryptoGrowth', type: 'Crypto' },
        'heloc': { label: 'HELOC', color: '#ef4444', growthKey: null, type: 'HELOC' },
        '401k-72t': { label: '401k (72t)', color: '#60a5fa', growthKey: 'stockGrowth', type: 'Pre-Tax (401k/IRA)' },
        '401k': { label: '401k Normal', color: '#60a5fa', growthKey: 'stockGrowth', type: 'Pre-Tax (401k/IRA)' },
        'roth-earnings': { label: 'Roth Earnings', color: '#f87171', growthKey: 'stockGrowth', type: 'Post-Tax (Roth)' },
    },

    run: () => {
        const data = window.currentData;
        if (!data || !data.assumptions) return;
        
        if (window.createLinkedAgeSliders) {
            window.createLinkedAgeSliders('burndown-sliders-container', data.assumptions);
        }
        
        const results = burndown.calculate(data);
        document.getElementById('burndown-table-container').innerHTML = burndown.renderTable(results);
        document.getElementById('burndown-debug-container').innerHTML = burndown.renderDebugTable(results);
        
        const headerRow = document.getElementById('burndown-header-row');
        if (headerRow) {
            new Sortable(headerRow, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: (evt) => {
                    burndown.priorityOrder = Array.from(evt.to.children)
                        .map(th => th.dataset.assetKey)
                        .filter(Boolean);
                    window.debouncedAutoSave();
                    burndown.run(); // Rerender immediately
                }
            });
        }
    },

    calculate: (data) => {
        const { assumptions, investments = [], income = [], budget = {}, helocs = [], benefits: benefitsData } = data;
        const inflationRate = (assumptions.inflation || 3) / 100;
        const currentYear = new Date().getFullYear();

        // 1. Initial State Aggregation
        let balances = {
            'cash': investments.filter(i => i.type === 'Cash').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'taxable': investments.filter(i => i.type === 'Taxable').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'roth-basis': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + (math.fromCurrency(i.costBasis) || 0), 0),
            'roth-earnings': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + Math.max(0, math.fromCurrency(i.value) - (math.fromCurrency(i.costBasis) || 0)), 0),
            'metals': investments.filter(i => i.type === 'Metals').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'crypto': investments.filter(i => i.type === 'Crypto').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            '401k': investments.filter(i => i.type === 'Pre-Tax (401k/IRA)').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'heloc': helocs.reduce((s, h) => s + (math.fromCurrency(h.limit) - math.fromCurrency(h.balance)), 0)
        };
        
        let annualBudget = budget.expenses?.reduce((s, x) => s + math.fromCurrency(x.annual), 0) || 0;
        let ssBenefit = (assumptions.ssMonthly || 0) * 12;
        const results = [];

        for (let age = assumptions.currentAge; age <= 100; age++) {
            const year = currentYear + (age - assumptions.currentAge);
            const isRetired = age >= assumptions.retirementAge;
            const yearResult = { age, year, draws: {}, totalDraw: 0, debug: {} };

            // Apply Growth/Inflation (after first year)
            if (age > assumptions.currentAge) {
                annualBudget *= (1 + inflationRate);
                if (age >= assumptions.ssStartAge) ssBenefit *= (1 + inflationRate);
                
                Object.keys(balances).forEach(key => {
                    const meta = burndown.assetMeta[key === '401k' ? '401k' : key];
                    if (meta?.growthKey) {
                        const rate = (assumptions[meta.growthKey] || 0) / 100;
                        if (key === 'roth-basis' || key === 'roth-earnings') {
                            const total = balances['roth-basis'] + balances['roth-earnings'];
                            if (total > 0) {
                                const ratio = balances['roth-basis'] / total;
                                const grown = total * (1 + rate);
                                balances['roth-basis'] = grown * ratio;
                                balances['roth-earnings'] = grown * (1 - ratio);
                            }
                        } else {
                            balances[key] *= (1 + rate);
                        }
                    }
                });
            }

            // Income Logic
            let activeIncome = 0;
            const applicableIncomes = isRetired ? income.filter(i => i.remainsInRetirement) : income;
            applicableIncomes.forEach(inc => {
                let amount = math.fromCurrency(inc.amount) || 0;
                amount -= (math.fromCurrency(inc.writeOffs) || 0);
                if (inc.bonusPct > 0) amount += amount * (inc.bonusPct / 100);
                
                // Growth for active workers
                if (!isRetired) {
                    const yearsWorking = age - assumptions.currentAge;
                    amount *= Math.pow(1 + (inc.increase / 100 || 0), yearsWorking);
                }
                activeIncome += amount;
            });

            const ssYearly = age >= assumptions.ssStartAge ? ssBenefit : 0;
            const totalRetirementIncome = activeIncome + ssYearly;
            
            // Benefits Calculation (SNAP/Medicaid)
            const snapAnnual = isRetired ? burndown.calculateSnapForYear(totalRetirementIncome, benefitsData) : 0;
            const medicaidEligible = burndown.checkMedicaid(totalRetirementIncome, benefitsData);

            // Calculation Sequence
            const netNeed = Math.max(0, annualBudget - totalRetirementIncome - snapAnnual);
            let shortfall = netNeed;

            // Drawdown Priority Loop
            const priorityList = burndown.priorityOrder;
            for (const pKey of priorityList) {
                if (shortfall <= 0) break;

                // Rule-based exclusions
                if (age < 60 && pKey === '401k') continue; // 401k locked < 60
                if (age >= 60 && pKey === '401k-72t') continue; // 72t slot inactive >= 60
                if (age < 60 && pKey === 'roth-earnings') continue; // Roth Earnings locked < 60

                let balanceKey = (pKey === '401k-72t' || pKey === '401k') ? '401k' : pKey;
                if (balances[balanceKey] > 0) {
                    const draw = Math.min(shortfall, balances[balanceKey]);
                    balances[balanceKey] -= draw;
                    yearResult.draws[pKey] = draw;
                    yearResult.totalDraw += draw;
                    shortfall -= draw;
                }
            }

            yearResult.budget = annualBudget;
            yearResult.income = activeIncome;
            yearResult.ss = ssYearly;
            yearResult.snap = snapAnnual;
            yearResult.medicaid = medicaidEligible;
            yearResult.netNeed = netNeed;
            yearResult.balances = { ...balances };
            yearResult.totalAssets = Object.entries(balances).reduce((s, [k, v]) => k === 'heloc' ? s : s + v, 0);
            
            results.push(yearResult);
        }
        return results;
    },

    checkMedicaid: (income, benefitsData) => {
        if (!benefitsData) return false;
        const hhSize = benefitsData.hhSize || 1;
        const fpl = 15060 + ((hhSize - 1) * 5380); // 2024 FPL
        const limit = fpl * 1.38; // MI Healthy Michigan Plan
        return income < limit;
    },

    calculateSnapForYear: (annualIncome, benefitsData) => {
        if (!benefitsData) return 0;
        const { hhSize = 1, snapDeductions = 0, snapDisability = false } = benefitsData;
        const fpl = 15060 + ((hhSize - 1) * 5380);
        const grossLimit = (fpl * (snapDisability ? 2.0 : 1.3));
        if (annualIncome > grossLimit) return 0;
        
        const monthly = annualIncome / 12;
        const stdDed = hhSize <= 3 ? 198 : (hhSize === 4 ? 208 : 244);
        const adjGross = Math.max(0, monthly - stdDed);
        const excessShelter = Math.max(0, (snapDeductions || 0) - (adjGross / 2));
        const netIncome = Math.max(0, adjGross - (snapDisability ? excessShelter : Math.min(excessShelter, 672)));
        
        const maxBenefit = 291 + ((hhSize - 1) * 211);
        const benefit = Math.max(0, maxBenefit - (netIncome * 0.3));
        return (benefit > 0 ? Math.max(benefit, hhSize <= 2 ? 23 : 0) : 0) * 12;
    },

    renderTable: (results) => {
        const priorityKeys = burndown.priorityOrder;
        
        const headers = priorityKeys.map(k => {
            const meta = burndown.assetMeta[k];
            return `
                <th class="p-3 text-right cursor-move drag-handle border-l border-slate-700 whitespace-nowrap" data-asset-key="${k}" style="color: ${meta.color};">
                    <div class="text-[10px] opacity-50 uppercase">${meta.label}</div>
                    ${meta.label.split(' ')[0]}
                </th>`;
        }).join('');

        const rows = results.map(row => {
            const drawCells = priorityKeys.map(k => {
                const draw = row.draws[k] || 0;
                const balance = k === '401k' || k === '401k-72t' ? row.balances['401k'] : row.balances[k];
                const meta = burndown.assetMeta[k];
                const activeStyle = draw > 0 ? `color: ${meta.color}; font-weight: 800;` : 'color: #475569;';
                return `
                    <td class="p-2 text-right border-l border-slate-800/50">
                        <div style="${activeStyle}">${draw > 0 ? formatter.formatCurrency(draw, 0) : '$0'}</div>
                        <div class="text-[9px] text-slate-600">${formatter.formatCurrency(balance, 0)}</div>
                    </td>`;
            }).join('');

            return `
                <tr class="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td class="sticky left-0 bg-slate-900 p-2 text-center font-bold text-slate-400 border-r border-slate-700">${row.age} <span class="text-[10px] block opacity-50">${row.year}</span></td>
                    <td class="p-2 text-right font-mono text-slate-400">${formatter.formatCurrency(row.budget, 0)}</td>
                    <td class="p-2 text-right text-emerald-500 font-bold">${row.snap > 0 ? formatter.formatCurrency(row.snap, 0) : '-'}</td>
                    <td class="p-2 text-center">${row.medicaid ? '<span class="px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 text-[10px] font-bold">YES</span>' : '<span class="text-slate-700 text-[10px]">NO</span>'}</td>
                    <td class="p-2 text-right text-slate-400">${formatter.formatCurrency(row.income, 0)}</td>
                    <td class="p-2 text-right text-slate-400">${formatter.formatCurrency(row.ss, 0)}</td>
                    <td class="p-2 text-right font-bold ${row.netNeed > 0 ? 'text-white' : 'text-slate-700'}">${formatter.formatCurrency(row.netNeed, 0)}</td>
                    ${drawCells}
                    <td class="p-2 text-right font-black border-l border-slate-700 text-purple-400">${formatter.formatCurrency(row.totalDraw, 0)}</td>
                </tr>
            `;
        }).join('');

        return `
            <table class="w-full text-[11px] text-left border-collapse">
                <thead class="sticky top-0 z-20 bg-slate-800 text-slate-400">
                    <tr id="burndown-header-row">
                        <th class="sticky left-0 bg-slate-800 p-3 w-16 border-r border-slate-700">Age</th>
                        <th class="p-3 text-right">Budget</th>
                        <th class="p-3 text-right">SNAP</th>
                        <th class="p-3 text-center">Medicaid</th>
                        <th class="p-3 text-right">Income</th>
                        <th class="p-3 text-right">SS</th>
                        <th class="p-3 text-right">Net Need</th>
                        ${headers}
                        <th class="p-3 text-right border-l border-slate-700">Total Draw</th>
                    </tr>
                </thead>
                <tbody class="bg-slate-900/30">${rows}</tbody>
            </table>
        `;
    },

    renderDebugTable: (results) => {
        let html = `<table class="w-full text-left border-collapse"><thead><tr><th>Age</th><th>Balances</th></tr></thead><tbody>`;
        results.forEach(r => {
            html += `<tr class="border-b border-slate-800"><td>${r.age}</td><td>${JSON.stringify(r.balances)}</td></tr>`;
        });
        return html + `</tbody></table>`;
    }
};
