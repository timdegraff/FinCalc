
import { formatter } from './formatter.js';
import { math, engine, assetColors, stateTaxRates } from './utils.js';

let isRealDollars = false;

export const burndown = {
    priorityOrder: ['cash', 'taxable', 'roth-basis', 'heloc', '401k', 'crypto', 'metals', 'roth-earnings', 'hsa'],
    
    init: () => {
        const container = document.getElementById('tab-burndown');
        container.innerHTML = `
            <div class="flex flex-col gap-6">
                <!-- Strategy Control Bar -->
                <div class="card-container p-6 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl">
                    <div class="flex flex-wrap items-center justify-between gap-8 mb-8">
                        <div class="flex flex-col">
                            <h3 class="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                                <i class="fas fa-microchip text-purple-400"></i> Strategy Engine
                            </h3>
                            <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Decumulation Logic Orchestrator</span>
                        </div>
                        
                        <div class="h-10 w-[1px] bg-slate-700 mx-2"></div>
                        
                        <div class="flex flex-col gap-1.5">
                            <label class="label-std text-slate-500">Draw Strategy</label>
                            <select id="burndown-strategy" class="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs font-black text-blue-400 outline-none focus:border-blue-500 transition-all cursor-pointer">
                                <option value="standard">Standard (Priority Order)</option>
                                <option value="medicaid">Medicaid Max (Limit Income to 138% FPL)</option>
                                <option value="perpetual">Wealth Preservation (Real Flat Principal)</option>
                            </select>
                        </div>

                        <div id="swr-indicator" class="hidden flex flex-col items-center justify-center px-6 border-l border-slate-700">
                            <span class="label-std text-slate-500">Safe Draw (SWR)</span>
                            <span id="swr-value" class="text-teal-400 font-black mono-numbers text-xl">0%</span>
                        </div>
                    </div>

                    <!-- ADVANCED FIRE TOGGLES -->
                    <div class="flex flex-wrap items-center gap-4">
                        <label class="flex items-center gap-4 px-5 py-3 bg-slate-900/50 rounded-2xl border border-slate-700 cursor-pointer group transition-all hover:bg-slate-900">
                            <input type="checkbox" id="toggle-rule-72t" class="w-5 h-5 accent-blue-500">
                            <div class="flex flex-col">
                                <span class="label-std text-slate-300 group-hover:text-blue-400 transition-colors">SEPP (72t) Bridge</span>
                                <span class="text-[8px] text-slate-600 uppercase font-black">Penalty-Free Early Draw</span>
                            </div>
                        </label>

                        <button id="btn-dwz-toggle" class="px-5 py-3 bg-slate-900/50 rounded-2xl border border-slate-700 text-left transition-all hover:bg-slate-900 flex items-center gap-4 group min-w-[180px]">
                            <div class="w-5 h-5 rounded-full border-2 border-slate-700 flex items-center justify-center group-[.active]:border-rose-500 group-[.active]:bg-rose-500/20">
                                <div class="w-2 h-2 rounded-full bg-slate-700 group-[.active]:bg-rose-500"></div>
                            </div>
                            <div class="flex flex-col">
                                <span id="dwz-label" class="label-std text-slate-500 group-[.active]:text-rose-400 transition-colors">Generational Wealth</span>
                                <span id="dwz-sub" class="text-[8px] text-slate-600 uppercase font-black">Hold Assets for Heirs</span>
                            </div>
                        </button>
                        
                        <button id="toggle-burndown-real" class="px-5 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl label-std font-black text-slate-400 hover:text-white transition-all flex items-center gap-3">
                            <i class="fas fa-calendar-alt"></i> Nominal Dollars
                        </button>
                    </div>
                </div>

                <!-- Budget Source & Sliders -->
                <div class="flex items-center justify-between gap-6 bg-slate-900/30 p-5 rounded-[1.5rem] border border-slate-700/50">
                    <div class="flex items-center gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="label-std text-slate-500">Budget Source Logic</label>
                            <div class="flex items-center gap-4">
                                <label class="flex items-center gap-3 cursor-pointer bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-blue-500 transition-all">
                                    <input type="checkbox" id="toggle-budget-sync" checked class="w-4 h-4 accent-blue-500">
                                    <span class="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Sync from Budget Tab</span>
                                </label>
                                <div id="manual-budget-container" class="hidden flex items-center gap-3">
                                    <span class="text-[10px] text-slate-500 font-black uppercase">Manual Annual:</span>
                                    <input type="text" id="input-manual-budget" data-type="currency" value="$100,000" class="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-teal-400 font-black outline-none w-32 mono-numbers">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Top Retirement Age Slider -->
                    <div class="flex flex-col gap-1">
                         <label class="flex justify-between label-std text-slate-500 text-[9px]">Retirement Age <span id="label-top-retire-age" class="text-blue-400 font-black mono-numbers">65</span></label>
                         <input type="range" id="input-top-retire-age" data-id="retirementAge" min="30" max="80" step="1" class="input-range w-32">
                    </div>
                </div>

                <!-- Spending Phases & SS Years -->
                <div id="burndown-live-sliders" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 border-t border-slate-700/50 mt-8 pt-8">
                    <!-- Populated by JS -->
                </div>
            </div>

            <!-- Priority Reordering -->
            <div class="card-container p-5 bg-slate-800/80 rounded-2xl border border-slate-700 backdrop-blur-sm">
                <div class="flex items-center gap-6">
                    <span class="label-std text-slate-500 font-black">Draw Order Priority:</span>
                    <div id="draw-priority-list" class="flex flex-wrap gap-3">
                        <!-- Draggable items -->
                    </div>
                    <span class="text-[9px] text-slate-600 italic ml-auto font-bold uppercase tracking-widest"><i class="fas fa-shield-alt mr-1"></i> HSA forced to bottom internally</span>
                </div>
            </div>

            <!-- Main Table -->
            <div class="card-container p-6 bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden shadow-inner">
                <div id="burndown-table-container" class="max-h-[75vh] overflow-auto rounded-2xl border border-slate-800 mono-numbers"></div>
            </div>
        </div>
        `;
        burndown.attachListeners();
    },

    updateToggleStyle: (btn) => {
        if (!btn) return;
        btn.classList.toggle('bg-blue-600/20', isRealDollars);
        btn.classList.toggle('text-blue-400', isRealDollars);
        btn.classList.toggle('border-blue-500/30', isRealDollars);
        btn.innerHTML = isRealDollars ? 
            '<i class="fas fa-sync-alt"></i> 2026 Dollars' : 
            '<i class="fas fa-calendar-alt"></i> Nominal Dollars';
    },

    attachListeners: () => {
        const triggers = ['burndown-strategy', 'toggle-rule-72t', 'toggle-budget-sync'/*, 'toggle-roth-ladder'*/];
        triggers.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.onchange = () => {
                if (id === 'burndown-strategy') {
                    const swrInd = document.getElementById('swr-indicator');
                    if (swrInd) swrInd.classList.toggle('hidden', el.value !== 'perpetual');
                }
                if (id === 'toggle-budget-sync') {
                    const manualContainer = document.getElementById('manual-budget-container');
                    if (manualContainer) manualContainer.classList.toggle('hidden', el.checked);
                }
                burndown.run();
                window.debouncedAutoSave();
            };
        });
        
        // Synced Retirement Slider Logic (Handled in core.js for global sync, but basic listener here)
        const topRetireSlider = document.getElementById('input-top-retire-age');
        if (topRetireSlider) {
            topRetireSlider.oninput = (e) => {
                const val = e.target.value;
                document.getElementById('label-top-retire-age').textContent = val;
                // Syncs with core logic via data-id="retirementAge" listener in core.js
            };
        }

        const dwzBtn = document.getElementById('btn-dwz-toggle');
        if (dwzBtn) {
            dwzBtn.onclick = () => {
                dwzBtn.classList.toggle('active');
                const active = dwzBtn.classList.contains('active');
                document.getElementById('dwz-label').textContent = active ? 'Die With Zero' : 'Generational Wealth';
                document.getElementById('dwz-sub').textContent = active ? 'Amortize Assets to 100' : 'Hold Assets for Heirs';
                burndown.run();
                window.debouncedAutoSave();
            };
        }

        const manualInput = document.getElementById('input-manual-budget');
        if (manualInput) {
            manualInput.oninput = () => { burndown.run(); window.debouncedAutoSave(); };
            manualInput.addEventListener('blur', (e) => {
                const val = math.fromCurrency(e.target.value);
                e.target.value = math.toCurrency(val);
            });
            manualInput.addEventListener('focus', (e) => {
                const val = math.fromCurrency(e.target.value);
                e.target.value = val === 0 ? '' : val;
            });
        }
        const realBtn = document.getElementById('toggle-burndown-real');
        if (realBtn) {
            realBtn.onclick = () => {
                isRealDollars = !isRealDollars;
                burndown.updateToggleStyle(realBtn);
                burndown.run();
                window.debouncedAutoSave();
            };
        }
    },

    load: (data) => {
        if (data?.priority) burndown.priorityOrder = data.priority;
        isRealDollars = !!data?.isRealDollars;
        const config = [
            {id: 'burndown-strategy', key: 'strategy', type: 'val'},
            {id: 'toggle-rule-72t', key: 'useSEPP', type: 'check'},
            {id: 'toggle-budget-sync', key: 'useSync', type: 'check'},
        ];
        config.forEach(c => {
            const el = document.getElementById(c.id);
            if (el && data?.[c.key] !== undefined) {
                if (c.type === 'check') el.checked = data[c.key];
                else el.value = data[c.key];
            }
        });
        
        // Sync retirement age slider visual state on load
        const rAge = window.currentData?.assumptions?.retirementAge || 65;
        const rSlider = document.getElementById('input-top-retire-age');
        if (rSlider) {
             rSlider.value = rAge;
             document.getElementById('label-top-retire-age').textContent = rAge;
        }

        const dwzBtn = document.getElementById('btn-dwz-toggle');
        if (dwzBtn && data?.dieWithZero !== undefined) {
            if (data.dieWithZero) dwzBtn.classList.add('active');
            else dwzBtn.classList.remove('active');
            const active = dwzBtn.classList.contains('active');
            document.getElementById('dwz-label').textContent = active ? 'Die With Zero' : 'Generational Wealth';
            document.getElementById('dwz-sub').textContent = active ? 'Amortize Assets to 100' : 'Hold Assets for Heirs';
        }
        
        const swrInd = document.getElementById('swr-indicator');
        if (swrInd) swrInd.classList.toggle('hidden', (data?.strategy !== 'perpetual'));

        const realBtn = document.getElementById('toggle-burndown-real');
        if (realBtn) {
            burndown.updateToggleStyle(realBtn);
        }
        
        const manualInput = document.getElementById('input-manual-budget');
        if (manualInput && data?.manualBudget !== undefined) {
            manualInput.value = math.toCurrency(data.manualBudget);
        }
    },

    scrape: () => {
        return { 
            priority: burndown.priorityOrder,
            strategy: document.getElementById('burndown-strategy')?.value || 'standard',
            useSync: document.getElementById('toggle-budget-sync')?.checked ?? true,
            useSEPP: document.getElementById('toggle-rule-72t')?.checked ?? false,
            dieWithZero: document.getElementById('btn-dwz-toggle')?.classList.contains('active') ?? false,
            manualBudget: math.fromCurrency(document.getElementById('input-manual-budget')?.value || "$100,000"),
            isRealDollars
        };
    },

    assetMeta: {
        'cash': { label: 'Cash', short: 'Cash', color: assetColors['Cash'], isTaxable: false },
        'taxable': { label: 'Taxable Brokerage', short: 'Brokerage', color: assetColors['Taxable'], isTaxable: true },
        'roth-basis': { label: 'Roth Basis', short: 'Roth Basis', color: assetColors['Post-Tax (Roth)'], isTaxable: false },
        'heloc': { label: 'HELOC', short: 'HELOC', color: assetColors['HELOC'], isTaxable: false },
        '401k': { label: '401k/IRA', short: '401k/IRA', color: assetColors['Pre-Tax (401k/IRA)'], isTaxable: true },
        'roth-earnings': { label: 'Roth Gains', short: 'Roth Gains', color: assetColors['Roth Gains'], isTaxable: false },
        'crypto': { label: 'Bitcoin', short: 'Bitcoin', color: assetColors['Crypto'], isTaxable: true },
        'metals': { label: 'Metals', short: 'Metals', color: assetColors['Metals'], isTaxable: true },
        'hsa': { label: 'HSA', short: 'HSA', color: assetColors['HSA'], isTaxable: false }
    },

    run: () => {
        const data = window.currentData;
        if (!data || !data.assumptions) return;
        
        const sliderContainer = document.getElementById('burndown-live-sliders');
        if (sliderContainer && sliderContainer.innerHTML.trim() === '') {
            const sliderConfigs = [
                { key: 'workYearsAtRetirement', label: 'SS Work Years', min: 10, max: 45, step: 1 },
                { key: 'slowGoFactor', label: 'Early Ret (Age <65) Spend %', min: 0.5, max: 1.5, step: 0.1, isPct: true },
                { key: 'midGoFactor', label: 'Mid Ret (Age 65-80) Spend %', min: 0.5, max: 1.5, step: 0.1, isPct: true },
                { key: 'noGoFactor', label: 'Late Ret (Age 80+) Spend %', min: 0.5, max: 1.5, step: 0.1, isPct: true },
                { key: 'stockGrowth', label: 'Stocks APY %', min: 0, max: 15, step: 0.5 },
                { key: 'inflation', label: 'Inflation %', min: 0, max: 10, step: 0.1 }
            ];
            sliderConfigs.forEach(({ key, label, min, max, step, isPct }) => {
                let val = data.assumptions[key] || (isPct ? 1.0 : 0);
                if (key === 'workYearsAtRetirement' && val === 0) val = 35;
                const div = document.createElement('div');
                div.className = 'space-y-1.5';
                const displayVal = isPct ? `${Math.round(val * 100)}%` : (key.includes('Growth') || key === 'inflation' ? `${val}%` : val);
                div.innerHTML = `
                    <label class="flex justify-between label-std text-slate-500 text-[9px]">${label} <span class="text-blue-400 font-black mono-numbers">${displayVal}</span></label>
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
                return `<div data-pk="${k}" class="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl label-std cursor-move flex items-center gap-2 group hover:border-slate-500 transition-all shadow-lg" style="color: ${meta.color}"><i class="fas fa-grip-vertical opacity-30 group-hover:opacity-100 transition-opacity"></i> ${meta.label}</div>`;
            }).join('');
            if (!burndown.sortable) {
                burndown.sortable = new Sortable(priorityList, { animation: 150, onEnd: () => { burndown.priorityOrder = Array.from(priorityList.children).map(el => el.dataset.pk); burndown.run(); window.debouncedAutoSave(); } });
            }
        }

        const stockGrowth = (data.assumptions.stockGrowth || 8) / 100;
        const inflationRate = (data.assumptions.inflation || 3) / 100;
        const swrValue = Math.max(0, stockGrowth - inflationRate);
        const swrEl = document.getElementById('swr-value');
        if (swrEl) swrEl.textContent = `${(swrValue * 100).toFixed(1)}%`;

        const results = burndown.calculate(data);
        const tableContainer = document.getElementById('burndown-table-container');
        if (tableContainer) tableContainer.innerHTML = burndown.renderTable(results);
    },

    calculate: (data) => {
        const { assumptions, investments = [], otherAssets = [], realEstate = [], income = [], budget = {}, helocs = [], benefits = [], debts = [] } = data;
        const stateConfig = burndown.scrape(); 
        const inflationRate = (assumptions.inflation || 3) / 100;
        const stockGrowth = (assumptions.stockGrowth || 8) / 100;
        const cryptoGrowth = (assumptions.cryptoGrowth || 10) / 100;
        const metalsGrowth = (assumptions.metalsGrowth || 6) / 100;
        const realEstateGrowth = (assumptions.realEstateGrowth || 3) / 100;
        
        const filingStatus = assumptions.filingStatus || 'Single';
        const hhSize = benefits.hhSize || 1; 
        const currentYear = new Date().getFullYear();

        const bal = {
            'cash': investments.filter(i => i.type === 'Cash').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'taxable': investments.filter(i => i.type === 'Taxable').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'taxableBasis': investments.filter(i => i.type === 'Taxable').reduce((s, i) => s + math.fromCurrency(i.costBasis), 0),
            'roth-basis': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + (math.fromCurrency(i.costBasis) || 0), 0),
            'roth-earnings': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + Math.max(0, math.fromCurrency(i.value) - (math.fromCurrency(i.costBasis) || 0)), 0),
            '401k': investments.filter(i => i.type === 'Pre-Tax (401k/IRA)').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'crypto': investments.filter(i => i.type === 'Crypto').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'metals': investments.filter(i => i.type === 'Metals').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'hsa': investments.filter(i => i.type === 'HSA').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'heloc': helocs.reduce((s, h) => s + math.fromCurrency(h.balance), 0)
        };
        
        // Deep copy debt objects to allow amortization mutation without affecting source
        const simRealEstate = realEstate.map(r => ({ ...r, mortgage: math.fromCurrency(r.mortgage), principalPayment: math.fromCurrency(r.principalPayment) }));
        const simDebts = debts.map(d => ({ ...d, balance: math.fromCurrency(d.balance), principalPayment: math.fromCurrency(d.principalPayment) }));
        const simOtherAssets = otherAssets.map(o => ({ ...o, loan: math.fromCurrency(o.loan), principalPayment: math.fromCurrency(o.principalPayment) }));

        const helocLimit = helocs.reduce((s, h) => s + math.fromCurrency(h.limit), 0);
        
        // Calculate Weighted Average HELOC Rate
        let totalHelocBal = helocs.reduce((s, h) => s + math.fromCurrency(h.balance), 0);
        let weightedRateSum = helocs.reduce((s, h) => s + (math.fromCurrency(h.balance) * (parseFloat(h.rate) || 7.0)), 0);
        const avgHelocRate = (totalHelocBal > 0 ? (weightedRateSum / totalHelocBal) : 7.0) / 100;
        
        const baseFpl = 16060 + (hhSize - 1) * 5650;
        const results = [];
        const duration = 100 - assumptions.currentAge;
        
        let seppFixedAmount = 0; 
        let isSeppStarted = false;

        // Spending Phase Multipliers (default to 1.0 if not set)
        const earlyRetireFactor = assumptions.slowGoFactor || 1.0;
        const midRetireFactor = assumptions.midGoFactor || 1.0;
        const lateRetireFactor = assumptions.noGoFactor || 1.0;

        for (let i = 0; i <= duration; i++) {
            const age = assumptions.currentAge + i;
            const currentYearIter = currentYear + i;
            const isRetired = age >= assumptions.retirementAge;
            const yearResult = { age, year: currentYearIter, draws: {}, rothConversion: 0, penalty: 0 };
            const inflationFactor = Math.pow(1 + inflationRate, i);
            const fpl = baseFpl * inflationFactor;

            // Amortize Debts
            const amortize = (arr, key) => arr.reduce((s, item) => {
                if (item[key] > 0) {
                     // Simple principal reduction if provided
                     const annualPrincipal = (item.principalPayment || 0) * 12;
                     item[key] = Math.max(0, item[key] - annualPrincipal);
                }
                return s + item[key];
            }, 0);
            
            const totalMortgage = amortize(simRealEstate, 'mortgage');
            const totalOtherLoans = amortize(simOtherAssets, 'loan');
            const totalDebt = amortize(simDebts, 'balance');

            // NW Capture
            const currentREVal = realEstate.reduce((s, r) => s + (math.fromCurrency(r.value) * Math.pow(1 + realEstateGrowth, i)), 0);
            const currentREEquity = currentREVal - totalMortgage;
            const fixedOtherAssetsVal = otherAssets.reduce((s, o) => s + math.fromCurrency(o.value), 0); // No growth assumed for generic other
            
            const currentNW = (bal['cash'] + bal['taxable'] + bal['roth-basis'] + bal['roth-earnings'] + bal['401k'] + bal['crypto'] + bal['metals'] + bal['hsa'] + fixedOtherAssetsVal + currentREEquity) - bal['heloc'] - totalOtherLoans - totalDebt;

            // Budget Calculation (Fixed vs Variable)
            let baseBudget = 0;
            if (stateConfig.useSync) {
                (budget.expenses || []).forEach(exp => {
                    if (isRetired && exp.removedInRetirement) return;
                    const amount = math.fromCurrency(exp.annual);
                    // Fixed expenses do NOT inflate. Variable do.
                    if (exp.isFixed) baseBudget += amount;
                    else baseBudget += (amount * inflationFactor);
                });
            } else {
                baseBudget = (stateConfig.manualBudget || 100000) * inflationFactor;
            }

            // Apply Aging Multipliers
            let targetBudget = baseBudget;
            if (isRetired) {
                if (age < 65) targetBudget *= earlyRetireFactor;
                else if (age < 80) targetBudget *= midRetireFactor;
                else targetBudget *= lateRetireFactor;
            }

            if (stateConfig.strategy === 'perpetual') {
                const safeRate = Math.max(0, stockGrowth - inflationRate);
                targetBudget = currentNW * safeRate;
            }

            // --- 1. Base Income & MAGI Prep ---
            let ordinaryIncome = 0;
            let ltcgIncome = 0;
            let netIncomeAvailable = 0; 
            let totalPreTaxDeductions = 0;

            const activeIncomes = isRetired ? income.filter(inc => inc.remainsInRetirement) : income;
            activeIncomes.forEach(inc => {
                let grossBase = math.fromCurrency(inc.amount) * (inc.isMonthly ? 12 : 1);
                let directExp = math.fromCurrency(inc.incomeExpenses) * (inc.incomeExpensesMonthly ? 12 : 1);
                grossBase *= Math.pow(1 + (inc.increase / 100 || 0), i);
                const bonus = grossBase * (parseFloat(inc.bonusPct) / 100 || 0);
                const netSourceIncome = (grossBase + bonus) - directExp;

                if (inc.nonTaxableUntil && parseInt(inc.nonTaxableUntil) >= currentYearIter) {
                    netIncomeAvailable += netSourceIncome;
                } else {
                    ordinaryIncome += netSourceIncome;
                    netIncomeAvailable += netSourceIncome;
                    totalPreTaxDeductions += grossBase * (parseFloat(inc.contribution) / 100 || 0);
                }
            });

            // Social Security
            const ssGross = (age >= assumptions.ssStartAge) ? engine.calculateSocialSecurity(assumptions.ssMonthly || 0, assumptions.workYearsAtRetirement || 35, inflationFactor) : 0;
            const stateForTax = assumptions.state || 'Michigan';
            const taxesSS = (stateTaxRates[stateForTax] || {}).taxesSS;
            
            const ssTaxableFederal = engine.calculateTaxableSocialSecurity(ssGross, ordinaryIncome - totalPreTaxDeductions, filingStatus);
            // If state taxes SS, we treat it as ordinary. If not, logic handled in calculateTax roughly or via explicit exclusion (Simplified here: mapped to ordinary for Fed calc)
            ordinaryIncome += ssTaxableFederal;
            netIncomeAvailable += ssGross;

            // RMDs (Required Minimum Distributions)
            let rmdAmount = 0;
            if (age >= 75) {
                rmdAmount = engine.calculateRMD(bal['401k'], age);
                bal['401k'] -= rmdAmount;
                ordinaryIncome += rmdAmount;
                netIncomeAvailable += rmdAmount;
                yearResult.draws['401k'] = (yearResult.draws['401k'] || 0) + rmdAmount;
                yearResult.rmdAmount = rmdAmount;
            }

            // Deduct Pre-Tax Savings
            totalPreTaxDeductions += (budget.savings?.filter(s => s.type === 'HSA').reduce((s, x) => s + math.fromCurrency(x.annual), 0) || 0);
            ordinaryIncome -= totalPreTaxDeductions;
            netIncomeAvailable -= totalPreTaxDeductions;

            // Health Insurance Premium Load (ACA Silver Estimate if applicable)
            // Simplified: If Early Retired and Silver/Standard, add cost.
            // (We add it to the budget NEED, not the budget itself to avoid double counting if user put it in budget tab)
            // For now, relying on user budget input as requested, but logic is ready for future.

            // --- 2. Calculate Initial Tax & Deficit ---
            let estimatedTax = engine.calculateTax(ordinaryIncome, ltcgIncome, filingStatus, assumptions.state, inflationFactor);
            netIncomeAvailable -= estimatedTax;
            
            // Check for Surplus (e.g. from RMDs or Pensions > Budget)
            let remainingBudgetNeed = targetBudget - netIncomeAvailable;

            if (remainingBudgetNeed < 0) {
                // SURPLUS! Reinvest.
                const surplus = Math.abs(remainingBudgetNeed);
                // Priority: Pay down HELOC, then Taxable Brokerage
                if (bal['heloc'] > 0) {
                    const paydown = Math.min(bal['heloc'], surplus);
                    bal['heloc'] -= paydown;
                    if (surplus > paydown) {
                        bal['taxable'] += (surplus - paydown);
                        bal['taxableBasis'] += (surplus - paydown);
                    }
                } else {
                    bal['taxable'] += surplus;
                    bal['taxableBasis'] += surplus;
                }
                remainingBudgetNeed = 0; // Fulfilled
            }

            // --- 3. Decumulation Loop ---
            const priorityOrderEffective = burndown.priorityOrder.filter(k => k !== 'hsa').concat(['hsa']);
            const medicaidCeiling = fpl * 1.38;

            // 72t Logic Check
            if (isRetired && age < 60 && stateConfig.useSEPP && bal['401k'] > 0 && remainingBudgetNeed > 0) {
                if (!isSeppStarted) {
                    seppFixedAmount = engine.calculateMaxSepp(bal['401k'], age);
                    isSeppStarted = true;
                }
            }

            priorityOrderEffective.forEach(pk => {
                if (remainingBudgetNeed <= 0) return;

                // SPECIAL ASSET HANDLING
                if (pk === '401k') {
                    if (isSeppStarted && age < 60) {
                        const draw = Math.min(bal['401k'], seppFixedAmount); 
                        if (draw > 0) {
                            bal['401k'] -= draw;
                            yearResult.draws['401k'] = (yearResult.draws['401k'] || 0) + draw;
                            yearResult.seppAmount = draw;
                            remainingBudgetNeed -= draw;
                            ordinaryIncome += draw;
                            return; 
                        }
                    }
                }

                if (pk === 'roth-earnings' && age < 60) {
                    const rawDraw = Math.min(bal[pk], remainingBudgetNeed * 1.15); 
                    if (rawDraw > 0) {
                         bal[pk] -= rawDraw;
                         const netDraw = rawDraw / 1.15; 
                         yearResult.draws[pk] = (yearResult.draws[pk] || 0) + rawDraw;
                         remainingBudgetNeed -= netDraw;
                         ordinaryIncome += rawDraw; 
                         return;
                    }
                }
                
                let limit = (pk === 'heloc') ? (helocLimit - bal['heloc']) : bal[pk];
                
                if (limit > 0) {
                    const amountNeeded = remainingBudgetNeed;
                    const canDraw = Math.min(limit, amountNeeded);
                    
                    if (pk === 'heloc') bal['heloc'] += canDraw;
                    else bal[pk] -= canDraw;
                    
                    yearResult.draws[pk] = (yearResult.draws[pk] || 0) + canDraw;
                    remainingBudgetNeed -= canDraw;

                    if (pk === 'taxable') {
                        const currentBasis = bal['taxableBasis'];
                        const currentVal = bal['taxable'] + canDraw;
                        const gainRatio = currentVal > 0 ? Math.max(0, (currentVal - currentBasis) / currentVal) : 0;
                        const taxablePortion = canDraw * gainRatio;
                        
                        ltcgIncome += taxablePortion;
                        bal['taxableBasis'] -= (canDraw * (1 - gainRatio)); 
                    } else if (burndown.assetMeta[pk].isTaxable) {
                         ordinaryIncome += canDraw;
                    }
                }
            });

            // --- 4. Final Reconcile ---
            const finalTax = engine.calculateTax(ordinaryIncome, ltcgIncome, filingStatus, assumptions.state, inflationFactor);
            // Note: We don't retroactively draw for the increased tax in this simplified loop, but accurate MAGI is captured.
            
            // HELOC Paydown if Surplus (Re-check in case draws created surplus via fixed inputs? Unlikely but safe)
            if (remainingBudgetNeed < 0 && bal['heloc'] > 0) { 
                const paydownAmount = Math.min(bal['heloc'], Math.abs(remainingBudgetNeed));
                bal['heloc'] = Math.max(0, bal['heloc'] - paydownAmount);
            }
            
            const totalMagi = ordinaryIncome + ltcgIncome;
            yearResult.balances = { ...bal };
            yearResult.budget = targetBudget;
            yearResult.magi = totalMagi;
            yearResult.netWorth = currentNW;
            
            yearResult.isMedicaid = (age < 65) && (totalMagi <= medicaidCeiling);
            yearResult.isSilver = (age < 65) && (totalMagi <= fpl * 2.5 && !yearResult.isMedicaid);
            results.push(yearResult);

            // GROWTH
            bal['taxable'] *= (1 + stockGrowth);
            bal['401k'] *= (1 + stockGrowth);
            bal['hsa'] *= (1 + stockGrowth);
            bal['crypto'] *= (1 + cryptoGrowth);
            bal['metals'] *= (1 + metalsGrowth);
            if (bal['heloc'] > 0) bal['heloc'] *= (1 + avgHelocRate);
            
            const rothGrowth = (bal['roth-basis'] + bal['roth-earnings']) * stockGrowth;
            bal['roth-earnings'] += rothGrowth;
        }
        return results;
    }
};
