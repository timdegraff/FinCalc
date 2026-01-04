
import { formatter } from './formatter.js';
import { math, engine } from './utils.js';

export const burndown = {
    init: () => {
        const container = document.getElementById('tab-burndown');
        container.innerHTML = `
            <div class="flex flex-col gap-6">
                <!-- Strategy Control Bar -->
                <div class="card-container p-6 bg-slate-800 rounded-2xl border border-slate-700">
                    <div class="flex flex-wrap items-center justify-between gap-6 mb-6">
                        <div class="flex items-center gap-4">
                            <h3 class="text-xl font-bold text-white flex items-center gap-2">
                                <i class="fas fa-microchip text-purple-400"></i> Strategy Engine
                            </h3>
                            <div class="h-8 w-[1px] bg-slate-700"></div>
                            <button id="btn-optimize-draw" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2">
                                <i class="fas fa-magic"></i> OPTIMIZE FOR BENEFITS
                            </button>
                        </div>
                        
                        <div class="flex items-center gap-6 bg-slate-900/50 p-2 rounded-xl border border-slate-700">
                            <div class="flex items-center gap-3 px-2">
                                <span class="text-[10px] font-bold text-slate-500 uppercase">Budget Source:</span>
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" id="toggle-budget-sync" checked class="w-4 h-4 accent-blue-500">
                                    <span class="text-xs text-slate-300">Sync from Tab</span>
                                </label>
                            </div>
                            <div id="manual-budget-input-container" class="hidden flex items-center gap-2 border-l border-slate-700 pl-4">
                                <span class="text-[10px] font-bold text-slate-500 uppercase">Fixed Spend:</span>
                                <input type="text" id="input-manual-budget" placeholder="$50,000" class="bg-transparent border-b border-slate-600 outline-none text-teal-400 font-bold text-xs w-24 text-right">
                            </div>
                        </div>
                    </div>

                    <div id="burndown-live-sliders" class="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <!-- Sliders populated by JS -->
                    </div>
                </div>

                <!-- Priority Reordering -->
                <div class="card-container p-4 bg-slate-800 rounded-2xl border border-slate-700">
                    <div class="flex items-center gap-4">
                        <span class="text-[10px] font-bold text-slate-500 uppercase">Draw Priority:</span>
                        <div id="draw-priority-list" class="flex flex-wrap gap-2">
                            <!-- Draggable items -->
                        </div>
                        <span class="text-[9px] text-slate-600 italic ml-auto">* Drag to reorder manually</span>
                    </div>
                </div>

                <!-- Main Table -->
                <div class="card-container p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <div id="burndown-table-container" class="max-h-[70vh] overflow-auto rounded-xl border border-slate-800"></div>
                </div>
            </div>
        `;
        burndown.attachListeners();
    },

    attachListeners: () => {
        const syncToggle = document.getElementById('toggle-budget-sync');
        syncToggle.onchange = (e) => {
            document.getElementById('manual-budget-input-container').classList.toggle('hidden', e.target.checked);
            burndown.run();
        };

        document.getElementById('input-manual-budget').oninput = () => burndown.run();

        document.getElementById('btn-optimize-draw').onclick = () => {
            burndown.optimize();
            burndown.run();
        };
    },

    load: (data) => {
        burndown.priorityOrder = data?.priority || ['cash', 'roth-basis', 'heloc', 'taxable', '401k', 'roth-earnings'];
    },

    scrape: () => ({ 
        priority: burndown.priorityOrder,
        manualBudget: math.fromCurrency(document.getElementById('input-manual-budget')?.value || 0),
        useSync: document.getElementById('toggle-budget-sync')?.checked ?? true
    }),

    assetMeta: {
        'cash': { label: 'Checking', color: '#f472b6', growthKey: null, taxable: false },
        'taxable': { label: 'Brokerage', color: '#34d399', growthKey: 'stockGrowth', taxable: true },
        'roth-basis': { label: 'Roth Basis', color: '#fbbf24', growthKey: 'stockGrowth', taxable: false },
        'heloc': { label: 'HELOC', color: '#ef4444', growthKey: null, taxable: false },
        '401k': { label: 'Pre-Tax', color: '#60a5fa', growthKey: 'stockGrowth', taxable: true },
        'roth-earnings': { label: 'Roth Gains', color: '#f87171', growthKey: 'stockGrowth', taxable: false },
    },

    optimize: () => {
        // Benefit Optimization Logic: 
        // 1. We want to fill the "Taxable Headroom" (Standard Deduction + Medicaid Ceiling) using taxable assets.
        // 2. We then want to fill the "Shortfall" using non-taxable assets.
        // So we keep 401k/Taxable at the end of the order, BUT the engine logic handles the ceiling 
        // if we flag them as "ceiling-restricted".
        // Simplest heuristic: Non-taxable assets should be used SECOND if ceiling is hit.
        burndown.priorityOrder = ['cash', 'roth-basis', 'heloc', 'taxable', '401k', 'roth-earnings'];
    },

    run: () => {
        const data = window.currentData;
        if (!data || !data.assumptions) return;
        
        // Populate local sliders if empty
        const sliderContainer = document.getElementById('burndown-live-sliders');
        if (sliderContainer && sliderContainer.innerHTML.trim() === '') {
            const controls = { 
                retirementAge: 'Retirement Age', 
                stockGrowth: 'Stock Growth (%)', 
                inflation: 'Inflation (%)',
                helocRate: 'HELOC Rate (%)'
            };
            Object.entries(controls).forEach(([key, label]) => {
                const val = data.assumptions[key];
                const div = document.createElement('div');
                div.className = 'space-y-2';
                div.innerHTML = `
                    <label class="flex justify-between font-bold text-[10px] uppercase text-slate-500">${label} <span class="text-blue-400 font-black">${val}</span></label>
                    <input type="range" data-live-id="${key}" value="${val}" min="0" max="100" step="0.5" class="input-range">
                `;
                div.querySelector('input').oninput = (e) => {
                    const newVal = parseFloat(e.target.value);
                    div.querySelector('span').textContent = newVal;
                    data.assumptions[key] = newVal; // Update live
                    burndown.run();
                };
                sliderContainer.appendChild(div);
            });
        }

        // Render Priority Badges
        const priorityList = document.getElementById('draw-priority-list');
        priorityList.innerHTML = burndown.priorityOrder.map(k => `
            <div data-pk="${k}" class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[10px] font-bold cursor-move flex items-center gap-2" style="color: ${burndown.assetMeta[k].color}">
                <i class="fas fa-grip-vertical opacity-30"></i> ${burndown.assetMeta[k].label}
            </div>
        `).join('');

        if (!burndown.sortable) {
            burndown.sortable = new Sortable(priorityList, {
                animation: 150,
                onEnd: () => {
                    burndown.priorityOrder = Array.from(priorityList.children).map(el => el.dataset.pk);
                    burndown.run();
                }
            });
        }

        const results = burndown.calculate(data);
        document.getElementById('burndown-table-container').innerHTML = burndown.renderTable(results);
    },

    calculate: (data) => {
        const { assumptions, investments = [], income = [], budget = {}, helocs = [] } = data;
        const state = burndown.scrape();
        
        const inflationRate = (assumptions.inflation || 3) / 100;
        const filingStatus = assumptions.filingStatus || 'Single';
        const magiCeilingMult = parseFloat(assumptions.benefitCeiling) || 1.38;
        const helocInterestRate = (parseFloat(assumptions.helocRate) || 8.5) / 100;
        const currentYear = new Date().getFullYear();

        // Initial Balances & Gain Ratios
        let taxValue = investments.filter(i => i.type === 'Taxable').reduce((s, i) => s + math.fromCurrency(i.value), 0);
        // Cost Basis Fallback: If 0, assume today's value is basis.
        let taxBasis = investments.filter(i => i.type === 'Taxable').reduce((s, i) => {
            const b = math.fromCurrency(i.costBasis);
            return s + (b === 0 ? math.fromCurrency(i.value) : b);
        }, 0);
        
        let bal = {
            'cash': investments.filter(i => i.type === 'Cash').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'taxable': taxValue,
            'roth-basis': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + (math.fromCurrency(i.costBasis) || 0), 0),
            'roth-earnings': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + Math.max(0, math.fromCurrency(i.value) - (math.fromCurrency(i.costBasis) || 0)), 0),
            '401k': investments.filter(i => i.type === 'Pre-Tax (401k/IRA)').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'heloc': 0 
        };
        const helocLimit = helocs.reduce((s, h) => s + math.fromCurrency(h.limit), 0);

        const fpl2026Base = filingStatus === 'Single' ? 16060 : 21710;
        let baseAnnualBudget = state.useSync ? (budget.expenses?.reduce((s, x) => s + math.fromCurrency(x.annual), 0) || 0) : state.manualBudget;
        let ssBenefit = (assumptions.ssMonthly || 0) * 12;
        
        const results = [];
        const duration = (parseFloat(document.getElementById('input-projection-end')?.value) || 100) - assumptions.currentAge;

        for (let i = 0; i <= duration; i++) {
            const age = assumptions.currentAge + i;
            const isRetired = age >= assumptions.retirementAge;
            const yearResult = { age, year: currentYear + i, draws: {}, totalDraw: 0 };
            
            const fpl = fpl2026Base * Math.pow(1 + inflationRate, i);
            const magiLimit = fpl * magiCeilingMult;

            const annualHelocInterest = bal['heloc'] * helocInterestRate;
            let currentYearBudget = baseAnnualBudget * Math.pow(1 + inflationRate, i) + annualHelocInterest;

            let taxableIncome = 0;
            let nonTaxableIncome = 0;
            const activeIncomes = isRetired ? income.filter(i => i.remainsInRetirement) : income;
            
            activeIncomes.forEach(inc => {
                let amt = math.fromCurrency(inc.amount);
                if (inc.isMonthly) amt *= 12;
                amt -= (math.fromCurrency(inc.writeOffs) * (inc.writeOffsMonthly ? 12 : 1));
                amt *= Math.pow(1 + (inc.increase / 100 || 0), i);
                if (inc.nonTaxable || (inc.taxFreeUntil && age <= inc.taxFreeUntil)) nonTaxableIncome += amt;
                else taxableIncome += amt;
            });

            const ssYearly = (age >= assumptions.ssStartAge) ? ssBenefit * Math.pow(1 + inflationRate, Math.max(0, age - assumptions.ssStartAge)) : 0;
            taxableIncome += ssYearly; 

            const tax = engine.calculateTax(taxableIncome, filingStatus);
            const netCashIn = taxableIncome + nonTaxableIncome - tax;
            const shortfall = Math.max(0, currentYearBudget - netCashIn);
            let remainingNeed = shortfall;

            // STRATEGIC PASS: Fill up to ceiling with MAGI-impacting assets
            const headroom = Math.max(0, magiLimit - taxableIncome);
            if (headroom > 0 && remainingNeed > 0) {
                // Try 401k first (100% impact)
                let draw401k = Math.min(bal['401k'], headroom, remainingNeed);
                bal['401k'] -= draw401k;
                yearResult.draws['401k'] = draw401k;
                remainingNeed -= draw401k;
                taxableIncome += draw401k;
                
                // Try Taxable (Partial impact based on growth)
                if (remainingNeed > 0 && taxableIncome < magiLimit) {
                    const gainRatio = taxValue > 0 ? (taxValue - taxBasis) / taxValue : 1;
                    const rHeadroom = magiLimit - taxableIncome;
                    const maxForMagi = gainRatio > 0 ? rHeadroom / gainRatio : remainingNeed;
                    const canDrawTaxable = Math.min(bal['taxable'], remainingNeed, maxForMagi);
                    
                    bal['taxable'] -= canDrawTaxable;
                    taxBasis -= (canDrawTaxable * (taxBasis / taxValue || 1));
                    taxValue -= canDrawTaxable;
                    
                    yearResult.draws['taxable'] = (yearResult.draws['taxable'] || 0) + canDrawTaxable;
                    remainingNeed -= canDrawTaxable;
                    taxableIncome += (canDrawTaxable * gainRatio);
                }
            }

            // PRIORITY PASS: Spend remaining need based on user priority list
            burndown.priorityOrder.forEach(pk => {
                if (remainingNeed <= 0) return;
                const isHeloc = pk === 'heloc';
                const limit = isHeloc ? (helocLimit - bal['heloc']) : bal[pk];
                const canDraw = Math.min(limit, remainingNeed);
                
                if (isHeloc) bal['heloc'] += canDraw;
                else bal[pk] -= canDraw;
                
                yearResult.draws[pk] = (yearResult.draws[pk] || 0) + canDraw;
                remainingNeed -= canDraw;

                // Handle MAGI for assets not used in strategic pass but appearing in priority list
                if (pk === '401k') taxableIncome += canDraw;
                if (pk === 'taxable') {
                    const gainRatio = taxValue > 0 ? (taxValue - taxBasis) / taxValue : 1;
                    taxableIncome += (canDraw * gainRatio);
                }
            });

            yearResult.magi = taxableIncome;
            yearResult.isMedicaid = taxableIncome < fpl * 1.38;
            yearResult.isSilver = taxableIncome < fpl * 2.5 && !yearResult.isMedicaid;
            yearResult.balances = { ...bal };
            yearResult.budget = currentYearBudget;
            yearResult.netWorth = (bal['cash'] + bal['taxable'] + bal['roth-basis'] + bal['roth-earnings'] + bal['401k']) - bal['heloc'];
            results.push(yearResult);

            // Annual Growth
            const growthFactor = (1 + (assumptions.stockGrowth / 100));
            bal['taxable'] *= growthFactor;
            taxValue = bal['taxable']; 
            bal['401k'] *= growthFactor;
            bal['roth-basis'] *= growthFactor;
            bal['roth-earnings'] *= growthFactor;
        }
        return results;
    },

    renderTable: (results) => {
        const keys = burndown.priorityOrder;
        const headerCells = keys.map(k => `<th class="p-3 text-right" style="color: ${burndown.assetMeta[k].color}">${burndown.assetMeta[k].label}</th>`).join('');
        
        const rows = results.map(r => {
            const draws = keys.map(k => {
                const isHeloc = k === 'heloc';
                const amt = r.draws[k] || 0;
                const balance = r.balances[k];
                const balColor = isHeloc && balance > 0 ? 'text-red-400' : 'opacity-40';
                return `
                    <td class="p-2 text-right border-l border-slate-800/50">
                        <div class="${amt > 0 ? (isHeloc ? 'text-red-400' : 'text-white') + ' font-bold' : 'text-slate-600'}">${formatter.formatCurrency(amt, 0)}</div>
                        <div class="text-[8px] ${balColor}">${formatter.formatCurrency(balance, 0)}</div>
                    </td>
                `;
            }).join('');

            let benefitBadge = `<span class="text-[9px] text-slate-700">PRIVATE</span>`;
            if (r.isMedicaid) benefitBadge = `<span class="px-2 py-0.5 rounded bg-blue-900/40 text-blue-400 text-[9px] font-bold tracking-tighter">MEDICAID</span>`;
            else if (r.isSilver) benefitBadge = `<span class="px-2 py-0.5 rounded bg-purple-900/40 text-purple-400 text-[9px] font-bold tracking-tighter">SILVER</span>`;

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
                        <th class="p-3 text-right">MAGI</th>
                        <th class="p-3 text-center">Plan</th>
                        ${headerCells}
                        <th class="p-3 text-right border-l border-slate-700">Net Worth</th>
                    </tr>
                </thead>
                <tbody class="bg-slate-900/30">${rows}</tbody>
            </table>
        `;
    }
};
