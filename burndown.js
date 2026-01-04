
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
                            <h3 class="text-xl font-bold text-white flex items-center gap-2">
                                <i class="fas fa-microchip text-purple-400"></i> Strategy Engine
                            </h3>
                            <div class="h-8 w-[1px] bg-slate-700"></div>
                            <button id="btn-optimize-draw" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2">
                                <i class="fas fa-magic"></i> OPTIMIZE FOR BENEFITS
                            </button>
                            
                            <!-- New Quick Access Slider -->
                            <div class="flex items-center gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-700">
                                <span class="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">Retire Age: <span id="label-top-retire-age" class="text-purple-400">65</span></span>
                                <input type="range" id="input-top-retire-age" min="18" max="100" value="65" class="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500">
                            </div>

                            <button id="toggle-burndown-real" class="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-all uppercase tracking-widest flex items-center gap-2">
                                <i class="fas fa-sync"></i> 2026 Dollars (Real)
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

                    <div id="burndown-live-sliders" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
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
        if (syncToggle) {
            syncToggle.onchange = (e) => {
                const manualContainer = document.getElementById('manual-budget-input-container');
                if (manualContainer) manualContainer.classList.toggle('hidden', e.target.checked);
                burndown.run();
                window.debouncedAutoSave();
            };
        }
        const manualInput = document.getElementById('input-manual-budget');
        if (manualInput) {
            manualInput.oninput = () => {
                burndown.run();
                window.debouncedAutoSave();
            };
            formatter.bindCurrencyEventListeners(manualInput);
        }
        const optBtn = document.getElementById('btn-optimize-draw');
        if (optBtn) {
            optBtn.onclick = () => {
                burndown.optimize();
                burndown.run();
                window.debouncedAutoSave();
            };
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
        const topRetireInput = document.getElementById('input-top-retire-age');
        if (topRetireInput) {
            topRetireInput.oninput = (e) => {
                const newVal = parseFloat(e.target.value);
                if (newVal < window.currentData.assumptions.currentAge) {
                    e.target.value = window.currentData.assumptions.currentAge;
                    return;
                }
                window.currentData.assumptions.retirementAge = newVal;
                const label = document.getElementById('label-top-retire-age');
                if (label) label.textContent = newVal;
                window.debouncedAutoSave();
            };
        }
    },

    load: (data) => {
        burndown.priorityOrder = data?.priority || ['cash', 'taxable', 'roth-basis', 'heloc', '401k', 'roth-earnings', 'crypto', 'metals', 'hsa'];
        isRealDollars = !!data?.isRealDollars;
        
        // Sync UI for loaded state
        const realBtn = document.getElementById('toggle-burndown-real');
        if (realBtn) {
            realBtn.classList.toggle('text-blue-400', isRealDollars);
            realBtn.classList.toggle('border-blue-500', isRealDollars);
        }
        const syncToggle = document.getElementById('toggle-budget-sync');
        if (syncToggle && data?.useSync !== undefined) {
            syncToggle.checked = data.useSync;
            const manualContainer = document.getElementById('manual-budget-input-container');
            if (manualContainer) manualContainer.classList.toggle('hidden', data.useSync);
        }
        const manualInput = document.getElementById('input-manual-budget');
        if (manualInput && data?.manualBudget) {
            manualInput.value = math.toCurrency(data.manualBudget);
        }
    },

    scrape: () => {
        const manualBudgetEl = document.getElementById('input-manual-budget');
        const syncToggle = document.getElementById('toggle-budget-sync');
        return { 
            priority: burndown.priorityOrder,
            manualBudget: math.fromCurrency(manualBudgetEl?.value || 0),
            useSync: syncToggle?.checked ?? true,
            isRealDollars
        };
    },

    assetMeta: {
        'cash': { label: 'Cash', color: assetColors['Cash'] },
        'taxable': { label: 'Taxable Brokerage', color: assetColors['Taxable'] },
        'roth-basis': { label: 'Roth Basis', color: assetColors['Post-Tax (Roth)'] },
        'heloc': { label: 'HELOC', color: assetColors['HELOC'] },
        '401k': { label: '401k/IRA', color: assetColors['Pre-Tax (401k/IRA)'] },
        'roth-earnings': { label: 'Roth Gains', color: assetColors['Roth Gains'] },
        'crypto': { label: 'Bitcoin', color: assetColors['Crypto'] },
        'metals': { label: 'Metals', color: assetColors['Metals'] },
        'hsa': { label: 'HSA', color: assetColors['HSA'] }
    },

    optimize: () => {
        burndown.priorityOrder = ['cash', 'taxable', 'roth-basis', 'heloc', '401k', 'roth-earnings', 'crypto', 'metals', 'hsa'];
    },

    run: () => {
        const data = window.currentData;
        if (!data || !data.assumptions) return;
        
        const topRetireInput = document.getElementById('input-top-retire-age');
        const topRetireLabel = document.getElementById('label-top-retire-age');
        if (topRetireInput) {
            topRetireInput.value = data.assumptions.retirementAge;
            if (topRetireLabel) topRetireLabel.textContent = data.assumptions.retirementAge;
        }

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
                if (key === 'retirementAge' && val < data.assumptions.currentAge) val = data.assumptions.currentAge;

                const div = document.createElement('div');
                div.className = 'space-y-2';
                div.innerHTML = `
                    <label class="flex justify-between font-bold text-[10px] uppercase text-slate-500">${label} <span class="text-blue-400 font-black">${val}</span></label>
                    <input type="range" data-live-id="${key}" value="${val}" min="${min}" max="${max}" step="${step}" class="input-range">
                `;
                div.querySelector('input').oninput = (e) => {
                    let newVal = parseFloat(e.target.value);
                    if (key === 'retirementAge' && newVal < data.assumptions.currentAge) {
                        newVal = data.assumptions.currentAge;
                        e.target.value = newVal;
                    } else if (key === 'currentAge' && newVal > data.assumptions.retirementAge) {
                        data.assumptions.retirementAge = newVal;
                        const rSlider = sliderContainer.querySelector('[data-live-id="retirementAge"]');
                        if (rSlider) { rSlider.value = newVal; rSlider.previousElementSibling.querySelector('span').textContent = newVal; }
                    }
                    div.querySelector('span').textContent = newVal;
                    data.assumptions[key] = newVal;
                    window.debouncedAutoSave();
                };
                sliderContainer.appendChild(div);
            });
        } else if (sliderContainer) {
            sliderContainer.querySelectorAll('input[data-live-id]').forEach(input => {
                const key = input.dataset.liveId;
                const val = data.assumptions[key];
                if (val !== undefined) {
                    input.value = val;
                    const label = input.previousElementSibling?.querySelector('span');
                    if (label) label.textContent = val;
                }
            });
        }

        const priorityList = document.getElementById('draw-priority-list');
        if (priorityList) {
            priorityList.innerHTML = burndown.priorityOrder.map(k => {
                const meta = burndown.assetMeta[k];
                if (!meta) return ''; 
                return `<div data-pk="${k}" class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-[10px] font-bold cursor-move flex items-center gap-2 uppercase tracking-widest" style="color: ${meta.color}"><i class="fas fa-grip-vertical opacity-30"></i> ${meta.label}</div>`;
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

        let taxValue = investments.filter(i => i.type === 'Taxable').reduce((s, i) => s + math.fromCurrency(i.value), 0);
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
            'crypto': investments.filter(i => i.type === 'Crypto').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'metals': investments.filter(i => i.type === 'Metals').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'hsa': investments.filter(i => i.type === 'HSA').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'heloc': 0 
        };

        let hidden529 = investments.filter(i => i.type === '529 Plan').reduce((s, i) => s + math.fromCurrency(i.value), 0);

        const fixedOtherAssets = otherAssets.reduce((s, o) => s + (math.fromCurrency(o.value) - math.fromCurrency(o.loan)), 0);
        const helocLimit = helocs.reduce((s, h) => s + math.fromCurrency(h.limit), 0);
        const fpl2026Base = filingStatus === 'Single' ? 16060 : 21710;
        let baseAnnualBudget = state.useSync ? (budget.expenses?.reduce((s, x) => s + math.fromCurrency(x.annual), 0) || 0) : state.manualBudget;
        let ssBenefitBase = (assumptions.ssMonthly || 0) * 12;
        
        const results = [];
        const endAge = parseFloat(document.getElementById('input-projection-end')?.value) || 100;
        const duration = endAge - assumptions.currentAge;

        for (let i = 0; i <= duration; i++) {
            const age = assumptions.currentAge + i;
            const isRetired = age >= assumptions.retirementAge;
            const yearResult = { age, year: currentYear + i, draws: {}, totalDraw: 0 };
            const inflationFactor = Math.pow(1 + inflationRate, i);
            const fpl = fpl2026Base * inflationFactor;
            let currentYearBudget = baseAnnualBudget * inflationFactor;

            let taxableIncome = 0;
            let nonTaxableIncome = 0;
            const activeIncomes = isRetired ? income.filter(i => i.remainsInRetirement) : income;
            activeIncomes.forEach(inc => {
                let amt = math.fromCurrency(inc.amount);
                if (inc.isMonthly) amt *= 12;
                amt -= (math.fromCurrency(inc.writeOffs) * (inc.writeOffsMonthly ? 12 : 1));
                amt *= Math.pow(1 + (inc.increase / 100 || 0), i);
                amt = Math.max(0, amt); 
                if (inc.nonTaxable || (inc.taxFreeUntil && yearResult.year <= inc.taxFreeUntil)) nonTaxableIncome += amt;
                else taxableIncome += amt;
            });

            const ssYearly = (age >= assumptions.ssStartAge) ? ssBenefitBase * inflationFactor : 0;
            taxableIncome += ssYearly; 

            const snapBenefit = engine.calculateSnapBenefit(taxableIncome, benefits.hhSize || 1, (benefits.shelterCosts || 0) * inflationFactor, benefits.hasSUA, benefits.isDisabled, inflationFactor);
            const snapYearly = snapBenefit * 12;
            yearResult.snapBenefit = snapYearly;

            let netBudgetNeeded = Math.max(0, currentYearBudget - snapYearly);
            const tax = engine.calculateTax(taxableIncome, filingStatus);
            
            yearResult.magi = Math.max(0, taxableIncome);
            yearResult.isMedicaid = yearResult.magi < fpl * 1.38;
            yearResult.isSilver = yearResult.magi < fpl * 2.5 && !yearResult.isMedicaid;
            
            if (!yearResult.isMedicaid && bal['hsa'] > 0) {
                const medicalSpend = currentYearBudget * 0.10;
                const hsaMedicalDraw = Math.min(bal['hsa'], medicalSpend);
                bal['hsa'] -= hsaMedicalDraw;
                yearResult.draws['hsa'] = (yearResult.draws['hsa'] || 0) + hsaMedicalDraw;
                netBudgetNeeded = Math.max(0, netBudgetNeeded - hsaMedicalDraw);
            }

            const shortfall = Math.max(0, netBudgetNeeded - (taxableIncome + nonTaxableIncome - tax));
            let remainingNeed = shortfall;

            burndown.priorityOrder.forEach(pk => {
                if (remainingNeed <= 0) return;
                const isHeloc = pk === 'heloc';
                const limit = isHeloc ? (helocLimit - bal['heloc']) : bal[pk];
                const canDraw = Math.min(limit, remainingNeed);
                if (isHeloc) bal['heloc'] += canDraw;
                else bal[pk] -= canDraw;
                yearResult.draws[pk] = (yearResult.draws[pk] || 0) + canDraw;
                remainingNeed -= canDraw;
                if (pk === '401k') taxableIncome += canDraw;
                if (pk === 'taxable') {
                    const gainRatio = taxValue > 0 ? (taxValue - taxBasis) / taxValue : 1;
                    taxableIncome += (canDraw * gainRatio);
                }
            });

            yearResult.magi = Math.max(0, taxableIncome);
            yearResult.balances = { ...bal };
            yearResult.budget = currentYearBudget;
            
            const currentRE = realEstate.reduce((s, r) => s + (math.fromCurrency(r.value) * Math.pow(1 + (assumptions.realEstateGrowth / 100), i) - math.fromCurrency(r.mortgage)), 0);
            
            yearResult.netWorth = (bal['cash'] + bal['taxable'] + bal['roth-basis'] + bal['roth-earnings'] + bal['401k'] + bal['crypto'] + bal['metals'] + bal['hsa'] + hidden529 + fixedOtherAssets + currentRE) - bal['heloc'];
            results.push(yearResult);

            const stockG = (1 + (assumptions.stockGrowth / 100));
            const cryptoG = (1 + (assumptions.cryptoGrowth / 100));
            const metalsG = (1 + (assumptions.metalsGrowth / 100));
            bal['taxable'] *= stockG;
            bal['401k'] *= stockG;
            bal['roth-basis'] *= stockG;
            bal['roth-earnings'] *= stockG;
            bal['crypto'] *= cryptoG;
            bal['metals'] *= metalsG;
            bal['hsa'] *= stockG;
            hidden529 *= stockG;
        }
        return results;
    },

    renderTable: (results) => {
        const keys = burndown.priorityOrder;
        const inflationRate = (window.currentData.assumptions.inflation || 3) / 100;
        
        const headerCells = keys.map(k => {
            const meta = burndown.assetMeta[k];
            if (!meta) return '';
            return `<th class="p-3 text-right" style="color: ${meta.color}">${meta.label}</th>`;
        }).join('');
        
        const rows = results.map((r, i) => {
            const inflationFactor = isRealDollars ? Math.pow(1 + inflationRate, i) : 1;
            const draws = keys.map(k => {
                const amt = (r.draws[k] || 0) / inflationFactor;
                const balance = r.balances[k] / inflationFactor;
                return `<td class="p-2 text-right border-l border-slate-800/50">
                    <div class="${amt > 0 ? (k === 'heloc' ? 'text-red-400' : 'text-white') + ' font-bold' : 'text-slate-600'}">${formatter.formatCurrency(amt, 0)}</div>
                    <div class="text-[8px] ${k === 'heloc' && balance > 0 ? 'text-red-400' : 'opacity-40'}">${formatter.formatCurrency(balance, 0)}</div>
                </td>`;
            }).join('');
            
            let badge = r.isMedicaid ? `<span class="px-2 py-0.5 rounded bg-blue-900/40 text-blue-400 text-[9px] font-bold">MEDICAID</span>` : (r.isSilver ? `<span class="px-2 py-0.5 rounded bg-purple-900/40 text-purple-400 text-[9px] font-bold">SILVER</span>` : `<span class="text-[9px] text-slate-700">PRIVATE</span>`);
            const snapDisplay = r.snapBenefit > 0 ? `<div class="text-[8px] text-emerald-500 font-bold tracking-tight">+${formatter.formatCurrency(r.snapBenefit / inflationFactor, 0)} SNAP</div>` : '';
            
            return `<tr class="border-b border-slate-800/50 hover:bg-slate-800/20 text-[10px]">
                <td class="p-2 text-center font-bold border-r border-slate-700">${r.age}</td>
                <td class="p-2 text-right text-slate-500">${formatter.formatCurrency(r.budget / inflationFactor, 0)}</td>
                <td class="p-2 text-right font-black text-emerald-400">${formatter.formatCurrency(r.magi / inflationFactor, 0)}</td>
                <td class="p-2 text-center space-y-1 w-20">${badge}${snapDisplay}</td>
                ${draws}
                <td class="p-2 text-right font-black border-l border-slate-700 text-teal-400">${formatter.formatCurrency(r.netWorth / inflationFactor, 0)}</td>
            </tr>`;
        }).join('');
        
        return `<table class="w-full text-left border-collapse">
            <thead class="sticky top-0 bg-slate-800 text-slate-500 uppercase text-[9px] z-20">
                <tr><th class="p-3 border-r border-slate-700">Age</th><th class="p-3 text-right">Budget</th><th class="p-3 text-right">MAGI</th><th class="p-3 text-center">Plan</th>${headerCells}<th class="p-3 text-right border-l border-slate-700">Net Worth</th></tr>
            </thead>
            <tbody class="bg-slate-900/30">${rows}</tbody>
        </table>`;
    }
};
