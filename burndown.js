
import { formatter } from './formatter.js';
import { math, engine, assetColors } from './utils.js';

let isRealDollars = false;

export const burndown = {
    init: () => {
        const container = document.getElementById('tab-burndown');
        container.innerHTML = `
            <div class="flex flex-col gap-6">
                <!-- Strategy Control Bar -->
                <div class="card-container p-6 bg-slate-800 rounded-2xl border border-slate-700">
                    <div class="flex flex-wrap items-center justify-between gap-6 mb-6">
                        <div class="flex items-center gap-4">
                            <h3 class="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter">
                                <i class="fas fa-microchip text-purple-400"></i> Strategy Engine
                            </h3>
                            <div class="h-8 w-[1px] bg-slate-700"></div>
                            
                            <!-- Rule 72t Toggle -->
                            <label class="flex items-center gap-3 px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-700 cursor-pointer group">
                                <input type="checkbox" id="toggle-rule-72t" class="w-4 h-4 accent-purple-500">
                                <div class="flex flex-col">
                                    <span class="label-std text-slate-300 group-hover:text-purple-400 transition-colors">72(t) SEPP Bridge</span>
                                    <span class="text-[8px] text-slate-600 uppercase font-black">Avoids 10% Penalty</span>
                                </div>
                            </label>

                            <button id="btn-optimize-draw" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2">
                                <i class="fas fa-magic"></i> OPTIMIZE FOR BENEFITS
                            </button>
                            
                            <button id="toggle-burndown-real" class="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl label-std font-black text-slate-400 hover:text-white transition-all flex items-center gap-2">
                                <i class="fas fa-sync"></i> Real Dollars
                            </button>
                        </div>
                        
                        <div class="flex items-center gap-6 bg-slate-900/50 p-2 rounded-xl border border-slate-700">
                            <div class="flex items-center gap-3 px-2">
                                <span class="label-std text-slate-500">Budget Source:</span>
                                <label class="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" id="toggle-budget-sync" checked class="w-4 h-4 accent-blue-500">
                                    <span class="text-xs text-slate-300 font-bold uppercase tracking-widest">Sync</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div id="burndown-live-sliders" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                        <!-- Sliders populated by JS -->
                    </div>
                </div>

                <!-- Priority Reordering -->
                <div class="card-container p-4 bg-slate-800 rounded-2xl border border-slate-700">
                    <div class="flex items-center gap-4">
                        <span class="label-std text-slate-500">Draw Priority:</span>
                        <div id="draw-priority-list" class="flex flex-wrap gap-2">
                            <!-- Draggable items -->
                        </div>
                        <span class="text-[9px] text-slate-600 italic ml-auto">* Drag to reorder</span>
                    </div>
                </div>

                <!-- Main Table -->
                <div class="card-container p-6 bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                    <div id="burndown-table-container" class="max-h-[70vh] overflow-auto rounded-xl border border-slate-800 mono-numbers"></div>
                </div>
            </div>
        `;
        burndown.attachListeners();
    },

    attachListeners: () => {
        const seppToggle = document.getElementById('toggle-rule-72t');
        if (seppToggle) {
            seppToggle.onchange = () => { burndown.run(); window.debouncedAutoSave(); };
        }
        const syncToggle = document.getElementById('toggle-budget-sync');
        if (syncToggle) {
            syncToggle.onchange = (e) => { burndown.run(); window.debouncedAutoSave(); };
        }
        const optBtn = document.getElementById('btn-optimize-draw');
        if (optBtn) {
            optBtn.onclick = () => { burndown.optimize(); burndown.run(); window.debouncedAutoSave(); };
        }
        const realBtn = document.getElementById('toggle-burndown-real');
        if (realBtn) {
            realBtn.onclick = () => {
                isRealDollars = !isRealDollars;
                realBtn.classList.toggle('text-blue-400', isRealDollars);
                realBtn.classList.toggle('border-blue-500', isRealDollars);
                burndown.run();
                window.debouncedAutoSave();
            };
        }
    },

    load: (data) => {
        burndown.priorityOrder = data?.priority || ['cash', 'taxable', 'roth-basis', 'heloc', '401k', 'roth-earnings', 'crypto', 'metals', 'hsa'];
        isRealDollars = !!data?.isRealDollars;
        const seppToggle = document.getElementById('toggle-rule-72t');
        if (seppToggle) seppToggle.checked = !!data?.useSEPP;
        
        const realBtn = document.getElementById('toggle-burndown-real');
        if (realBtn) {
            realBtn.classList.toggle('text-blue-400', isRealDollars);
            realBtn.classList.toggle('border-blue-500', isRealDollars);
        }
        const syncToggle = document.getElementById('toggle-budget-sync');
        if (syncToggle && data?.useSync !== undefined) syncToggle.checked = data.useSync;
    },

    scrape: () => {
        const syncToggle = document.getElementById('toggle-budget-sync');
        const seppToggle = document.getElementById('toggle-rule-72t');
        return { 
            priority: burndown.priorityOrder,
            useSync: syncToggle?.checked ?? true,
            useSEPP: seppToggle?.checked ?? false,
            isRealDollars
        };
    },

    assetMeta: {
        'cash': { label: 'Cash', short: 'Cash', color: assetColors['Cash'] },
        'taxable': { label: 'Taxable Brokerage', short: 'Brokerage', color: assetColors['Taxable'] },
        'roth-basis': { label: 'Roth Basis', short: 'Roth Basis', color: assetColors['Post-Tax (Roth)'] },
        'heloc': { label: 'HELOC', short: 'HELOC', color: assetColors['HELOC'] },
        '401k': { label: '401k/IRA', short: '401k/IRA', color: assetColors['Pre-Tax (401k/IRA)'] },
        'roth-earnings': { label: 'Roth Gains', short: 'Roth Gains', color: assetColors['Roth Gains'] },
        'crypto': { label: 'Bitcoin', short: 'Bitcoin', color: assetColors['Crypto'] },
        'metals': { label: 'Metals', short: 'Metals', color: assetColors['Metals'] },
        'hsa': { label: 'HSA', short: 'HSA', color: assetColors['HSA'] }
    },

    optimize: () => {
        burndown.priorityOrder = ['cash', 'taxable', 'roth-basis', 'heloc', '401k', 'roth-earnings', 'crypto', 'metals', 'hsa'];
    },

    run: () => {
        const data = window.currentData;
        if (!data || !data.assumptions) return;
        
        const sliderContainer = document.getElementById('burndown-live-sliders');
        if (sliderContainer && sliderContainer.innerHTML.trim() === '') {
            const sliderConfigs = [
                { key: 'currentAge', label: 'Current Age', min: 18, max: 100, step: 1 },
                { key: 'retirementAge', label: 'Retire Age', min: 18, max: 100, step: 1 },
                { key: 'stockGrowth', label: 'Stocks APY %', min: 0, max: 15, step: 0.5 },
                { key: 'cryptoGrowth', label: 'Bitcoin %', min: 0, max: 50, step: 1 },
                { key: 'metalsGrowth', label: 'Metals %', min: 0, max: 15, step: 1 },
                { key: 'inflation', label: 'Inflation %', min: 0, max: 10, step: 0.1 }
            ];
            sliderConfigs.forEach(({ key, label, min, max, step }) => {
                let val = data.assumptions[key] || 0;
                const div = document.createElement('div');
                div.className = 'space-y-1';
                div.innerHTML = `
                    <label class="flex justify-between label-std text-slate-500">${label} <span class="text-blue-400 font-black mono-numbers">${val}</span></label>
                    <input type="range" data-live-id="${key}" data-id="${key}" value="${val}" min="${min}" max="${max}" step="${step}" class="input-range">
                `;
                sliderContainer.appendChild(div);
            });
        }

        const priorityList = document.getElementById('draw-priority-list');
        if (priorityList) {
            priorityList.innerHTML = burndown.priorityOrder.map(k => {
                const meta = burndown.assetMeta[k];
                if (!meta) return ''; 
                return `<div data-pk="${k}" class="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg label-std cursor-move flex items-center gap-2" style="color: ${meta.color}"><i class="fas fa-grip-vertical opacity-30"></i> ${meta.label}</div>`;
            }).join('');
            if (!burndown.sortable) {
                burndown.sortable = new Sortable(priorityList, { animation: 150, onEnd: () => { burndown.priorityOrder = Array.from(priorityList.children).map(el => el.dataset.pk); burndown.run(); window.debouncedAutoSave(); } });
            }
        }

        const results = burndown.calculate(data);
        const tableContainer = document.getElementById('burndown-table-container');
        if (tableContainer) tableContainer.innerHTML = burndown.renderTable(results);
    },

    calculate: (data) => {
        const { assumptions, investments = [], otherAssets = [], realEstate = [], income = [], budget = {}, helocs = [], benefits = {} } = data;
        const state = burndown.scrape();
        const inflationRate = (assumptions.inflation || 3) / 100;
        const filingStatus = assumptions.filingStatus || 'Single';
        const currentYear = new Date().getFullYear();

        const taxValue = investments.filter(i => i.type === 'Taxable').reduce((s, i) => s + math.fromCurrency(i.value), 0);
        const taxBasis = investments.filter(i => i.type === 'Taxable').reduce((s, i) => {
            const b = math.fromCurrency(i.costBasis);
            return s + (b === 0 ? math.fromCurrency(i.value) : b);
        }, 0);
        
        const bal = {
            'cash': investments.filter(i => i.type === 'Cash').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'taxable': taxValue,
            'roth-basis': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + (math.fromCurrency(i.costBasis) || 0), 0),
            'roth-earnings': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + Math.max(0, math.fromCurrency(i.value) - (math.fromCurrency(i.costBasis) || 0)), 0),
            '401k': investments.filter(i => i.type === 'Pre-Tax (401k/IRA)').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'crypto': investments.filter(i => i.type === 'Crypto').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'metals': investments.filter(i => i.type === 'Metals').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'hsa': investments.filter(i => i.type === 'HSA').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'heloc': 0 
        };

        const hidden529 = investments.filter(i => i.type === '529 Plan').reduce((s, i) => s + math.fromCurrency(i.value), 0);
        const fixedOtherAssets = otherAssets.reduce((s, o) => s + (math.fromCurrency(o.value) - math.fromCurrency(o.loan)), 0);
        const helocLimit = helocs.reduce((s, h) => s + math.fromCurrency(h.limit), 0);
        const fpl2026Base = filingStatus === 'Single' ? 16060 : 32120;
        const ssBenefitBase = (assumptions.ssMonthly || 0) * 12;
        
        const results = [];
        const endAge = parseFloat(document.getElementById('input-projection-end')?.value) || 75;
        const duration = endAge - assumptions.currentAge;

        // 72(t) Setup
        let seppFixedAmount = 0;
        if (state.useSEPP) {
            // Simplified IRS Amortization Method Proxy
            // Balance / Life_Expectancy (approx 22-30) + Interest
            seppFixedAmount = (bal['401k'] * 0.045); 
        }

        for (let i = 0; i <= duration; i++) {
            const age = assumptions.currentAge + i;
            const isRetired = age >= assumptions.retirementAge;
            const yearResult = { age, year: currentYear + i, draws: {}, totalDraw: 0, seppAmount: 0, penalty: 0 };
            const inflationFactor = Math.pow(1 + inflationRate, i);
            const fpl = fpl2026Base * inflationFactor;

            if (!isRetired) {
                const summaries = engine.calculateSummaries(data);
                bal['401k'] += summaries.total401kContribution;
                (budget.savings || []).forEach(s => {
                    const amt = math.fromCurrency(s.annual);
                    if (s.type === 'Taxable') bal['taxable'] += amt;
                    else if (s.type === 'Post-Tax (Roth)') bal['roth-basis'] += amt;
                    else if (s.type === 'Cash') bal['cash'] += amt;
                    else if (s.type === 'HSA') bal['hsa'] += amt;
                    else if (s.type === 'Crypto') bal['crypto'] += amt;
                    else if (s.type === 'Metals') bal['metals'] += amt;
                    else if (s.type === 'Pre-Tax (401k/IRA)') bal['401k'] += amt;
                });
            }

            let baseAnnualBudget = state.useSync ? (budget.expenses || []).reduce((sum, exp) => (isRetired && exp.removedInRetirement) ? sum : sum + math.fromCurrency(exp.annual), 0) : math.fromCurrency(document.getElementById('input-manual-budget')?.value || 0);
            const currentYearBudget = baseAnnualBudget * inflationFactor;

            let taxableIncome = 0;
            let nonTaxableIncome = 0;
            let persistentIncomeTotal = 0;

            const activeIncomes = isRetired ? income.filter(inc => inc.remainsInRetirement) : income;
            activeIncomes.forEach(inc => {
                let amt = math.fromCurrency(inc.amount) * (inc.isMonthly ? 12 : 1);
                amt -= (math.fromCurrency(inc.incomeExpenses) * (inc.incomeExpensesMonthly ? 12 : 1));
                amt *= Math.pow(1 + (inc.increase / 100 || 0), i);
                if (isRetired) persistentIncomeTotal += Math.max(0, amt);
                if (inc.nonTaxable) nonTaxableIncome += Math.max(0, amt);
                else taxableIncome += Math.max(0, amt);
            });

            const ssYearly = (age >= assumptions.ssStartAge) ? ssBenefitBase * inflationFactor : 0;
            taxableIncome += ssYearly; 

            // APPLY SEPP 72(t) DISTRIBUTION
            if (isRetired && age < 60 && state.useSEPP) {
                const canDrawSEPP = Math.min(bal['401k'], seppFixedAmount);
                bal['401k'] -= canDrawSEPP;
                taxableIncome += canDrawSEPP;
                yearResult.seppAmount = canDrawSEPP;
                yearResult.draws['401k'] = (yearResult.draws['401k'] || 0) + canDrawSEPP;
            }

            const snapBenefit = engine.calculateSnapBenefit(taxableIncome, benefits.hhSize || 1, (benefits.shelterCosts || 0) * inflationFactor, benefits.hasSUA, benefits.isDisabled, inflationFactor);
            const snapYearly = snapBenefit * 12;
            yearResult.snapBenefit = snapYearly;
            yearResult.persistentIncome = persistentIncomeTotal;

            let netBudgetNeeded = Math.max(0, currentYearBudget - snapYearly);
            const tax = engine.calculateTax(taxableIncome, filingStatus);
            yearResult.magi = Math.max(0, taxableIncome);
            
            yearResult.isMedicare = age >= 65;
            yearResult.isMedicaid = yearResult.magi < fpl * 1.38;
            yearResult.isSilver = yearResult.magi < fpl * 2.5 && !yearResult.isMedicaid;
            
            if (!yearResult.isMedicare && !yearResult.isMedicaid && bal['hsa'] > 0) {
                const medicalSpend = currentYearBudget * 0.05;
                const hsaMedicalDraw = Math.min(bal['hsa'], medicalSpend);
                bal['hsa'] -= hsaMedicalDraw;
                yearResult.draws['hsa'] = (yearResult.draws['hsa'] || 0) + hsaMedicalDraw;
                netBudgetNeeded = Math.max(0, netBudgetNeeded - hsaMedicalDraw);
            }

            let remainingNeed = Math.max(0, netBudgetNeeded - (taxableIncome + nonTaxableIncome - tax));

            burndown.priorityOrder.forEach(pk => {
                if (remainingNeed <= 0) return;
                const limit = pk === 'heloc' ? (helocLimit - bal['heloc']) : bal[pk];
                const canDraw = Math.min(limit, remainingNeed);
                if (pk === 'heloc') bal['heloc'] += canDraw;
                else bal[pk] -= canDraw;
                yearResult.draws[pk] = (yearResult.draws[pk] || 0) + canDraw;
                remainingNeed -= canDraw;
                
                if (pk === '401k') {
                    taxableIncome += canDraw;
                    // Apply 10% penalty if NOT SEPP and NOT age 59.5+
                    if (age < 59.5) {
                        // If SEPP is enabled, only the *excess* gets penalized. 
                        // If SEPP is disabled, the *whole* draw gets penalized.
                        const penalizedAmt = state.useSEPP ? Math.max(0, canDraw - yearResult.seppAmount) : canDraw;
                        yearResult.penalty += penalizedAmt * 0.10;
                    }
                }
                if (pk === 'taxable') {
                    const gainRatio = taxValue > 0 ? Math.max(0, (taxValue - taxBasis) / taxValue) : 1;
                    taxableIncome += (canDraw * gainRatio);
                }
            });

            yearResult.magi = Math.max(0, taxableIncome);
            yearResult.balances = { ...bal };
            yearResult.budget = currentYearBudget;
            const currentRE = realEstate.reduce((s, r) => s + (math.fromCurrency(r.value) * Math.pow(1 + (assumptions.realEstateGrowth / 100), i) - math.fromCurrency(r.mortgage)), 0);
            yearResult.netWorth = (bal['cash'] + bal['taxable'] + bal['roth-basis'] + bal['roth-earnings'] + bal['401k'] + bal['crypto'] + bal['metals'] + bal['hsa'] + hidden529 + fixedOtherAssets + currentRE) - bal['heloc'] - yearResult.penalty;
            results.push(yearResult);

            const stockG = (1 + (assumptions.stockGrowth / 100));
            const cryptoG = (1 + (assumptions.cryptoGrowth / 100));
            const metalsG = (1 + (assumptions.metalsGrowth / 100));
            
            bal['taxable'] *= stockG;
            bal['401k'] *= stockG;
            bal['roth-basis'] *= stockG;
            bal['roth-earnings'] *= stockG;
            bal['hsa'] *= stockG; 
            bal['crypto'] *= cryptoG;
            bal['metals'] *= metalsG;
        }
        return results;
    },

    renderTable: (results) => {
        const keys = burndown.priorityOrder;
        const infRate = (window.currentData.assumptions.inflation || 3) / 100;
        const headerCells = keys.map(k => `<th class="p-2 text-right text-[9px] min-w-[75px]" style="color: ${burndown.assetMeta[k]?.color}">${burndown.assetMeta[k]?.short}</th>`).join('');
        
        const rows = results.map((r, i) => {
            const inf = isRealDollars ? Math.pow(1 + infRate, i) : 1;
            const draws = keys.map(k => {
                const amt = (r.draws[k] || 0) / inf;
                const bal = r.balances[k] / inf;
                const meta = burndown.assetMeta[k];
                const isSEPPYear = k === '401k' && r.seppAmount > 0;
                return `<td class="p-1.5 text-right border-l border-slate-800/50">
                    <div class="${amt > 0 ? 'font-bold' : 'text-slate-700'}" ${amt > 0 ? `style="color: ${meta.color}"` : ''}>
                        ${formatter.formatCurrency(amt, 0)}
                        ${isSEPPYear ? '<span class="text-[7px] block opacity-60">SEPP</span>' : ''}
                    </div>
                    <div class="text-[8px] opacity-40">${formatter.formatCurrency(bal, 0)}</div>
                </td>`;
            }).join('');
            
            const penaltyDisplay = r.penalty > 0 ? `<div class="text-[8px] text-red-500 font-bold uppercase">Penalty: ${formatter.formatCurrency(r.penalty / inf, 0)}</div>` : '';
            
            return `<tr class="border-b border-slate-800/50 hover:bg-slate-800/10 text-[10px]">
                <td class="p-2 text-center font-bold border-r border-slate-700">${r.age}</td>
                <td class="p-2 text-right text-slate-500">${formatter.formatCurrency(r.budget / inf, 0)}</td>
                <td class="p-2 text-right font-black text-emerald-400">${formatter.formatCurrency(r.magi / inf, 0)}</td>
                <td class="p-2 text-right text-blue-300">${r.persistentIncome > 0 ? formatter.formatCurrency(r.persistentIncome / inf, 0) : '—'}</td>
                <td class="p-2 text-center">${penaltyDisplay || '—'}</td>
                ${draws}
                <td class="p-2 text-right font-black border-l border-slate-700 text-teal-400">${formatter.formatCurrency(r.netWorth / inf, 0)}</td>
            </tr>`;
        }).join('');
        
        return `<table class="w-full text-left border-collapse table-auto">
            <thead class="sticky top-0 bg-slate-800 text-slate-500 label-std z-20">
                <tr>
                    <th class="p-2 border-r border-slate-700 w-10">Age</th>
                    <th class="p-2 text-right">Budget</th>
                    <th class="p-2 text-right">MAGI</th>
                    <th class="p-2 text-right">Inc</th>
                    <th class="p-2 text-center">Tax Info</th>
                    ${headerCells}
                    <th class="p-2 text-right border-l border-slate-700">Net Worth</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    }
};
