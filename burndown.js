
import { formatter } from './formatter.js';
import { math, engine, assetColors } from './utils.js';

let isRealDollars = false;

export const burndown = {
    // Initializing with defaults ensures priorityOrder is never undefined for Firebase
    priorityOrder: ['cash', 'taxable', 'roth-basis', 'heloc', '401k', 'roth-earnings', 'crypto', 'metals', 'hsa'],
    
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

                        <!-- Roth Conversion Ladder: Removed from UI for simplicity, but code is preserved -->
                        <!-- 
                        <label class="flex items-center gap-4 px-5 py-3 bg-slate-900/50 rounded-2xl border border-slate-700 cursor-pointer group transition-all hover:bg-slate-900">
                            <input type="checkbox" id="toggle-roth-ladder" class="w-5 h-5 accent-teal-500">
                            <div class="flex flex-col">
                                <span class="label-std text-slate-300 group-hover:text-teal-400 transition-colors">Roth Conversion Ladder</span>
                                <span class="text-[8px] text-slate-600 uppercase font-black">Top-off to Benefit Cliff</span>
                            </div>
                        </label>
                        -->

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

                <!-- Budget Source Section -->
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
        const triggers = ['burndown-strategy', 'toggle-rule-72t', 'toggle-budget-sync'/*, 'toggle-roth-ladder'*/]; // 'toggle-roth-ladder' commented out
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
            // {id: 'toggle-roth-ladder', key: 'useRothLadder', type: 'check'}, // Commented out from load
            {id: 'toggle-budget-sync', key: 'useSync', type: 'check'},
        ];
        config.forEach(c => {
            const el = document.getElementById(c.id);
            if (el && data?.[c.key] !== undefined) {
                if (c.type === 'check') el.checked = data[c.key];
                else el.value = data[c.key];
            }
        });

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
            // useRothLadder: document.getElementById('toggle-roth-ladder')?.checked ?? false, // Commented out from scrape
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
                { key: 'slowGoFactor', label: 'Age 62 Budget %', min: 0.1, max: 1.5, step: 0.05, isPct: true },
                { key: 'noGoFactor', label: 'Age 80 Budget %', min: 0.1, max: 1.5, step: 0.05, isPct: true },
                { key: 'stockGrowth', label: 'Stocks APY %', min: 0, max: 15, step: 0.5 },
                { key: 'cryptoGrowth', label: 'Bitcoin %', min: 0, max: 15, step: 0.5 },
                { key: 'metalsGrowth', label: 'Metals %', min: 0, max: 15, step: 0.5 },
                { key: 'inflation', label: 'Inflation %', min: 0, max: 10, step: 0.1 }
            ];
            sliderConfigs.forEach(({ key, label, min, max, step, isPct }) => {
                let val = data.assumptions[key] || (isPct ? 0.8 : 0);
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
        const { assumptions, investments = [], otherAssets = [], realEstate = [], income = [], budget = {}, helocs = [] } = data;
        const stateConfig = burndown.scrape(); // Renamed 'state' to 'stateConfig' to avoid conflict with assumptions.state
        const inflationRate = (assumptions.inflation || 3) / 100;
        const stockGrowth = (assumptions.stockGrowth || 8) / 100;
        const cryptoGrowth = (assumptions.cryptoGrowth || 10) / 100;
        const metalsGrowth = (assumptions.metalsGrowth || 6) / 100;
        const realEstateGrowth = (assumptions.realEstateGrowth || 3) / 100;
        
        const filingStatus = assumptions.filingStatus || 'Single';
        const currentYear = new Date().getFullYear();

        const bal = {
            'cash': investments.filter(i => i.type === 'Cash').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'taxable': investments.filter(i => i.type === 'Taxable').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'roth-basis': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + (math.fromCurrency(i.costBasis) || 0), 0),
            'roth-earnings': investments.filter(i => i.type === 'Post-Tax (Roth)').reduce((s, i) => s + Math.max(0, math.fromCurrency(i.value) - (math.fromCurrency(i.costBasis) || 0)), 0),
            '401k': investments.filter(i => i.type === 'Pre-Tax (401k/IRA)').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'crypto': investments.filter(i => i.type === 'Crypto').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'metals': investments.filter(i => i.type === 'Metals').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'hsa': investments.filter(i => i.type === 'HSA').reduce((s, i) => s + math.fromCurrency(i.value), 0),
            'heloc': helocs.reduce((s, h) => s + math.fromCurrency(h.balance), 0)
        };

        const helocLimit = helocs.reduce((s, h) => s + math.fromCurrency(h.limit), 0);
        const avgHelocRate = (helocs.length > 0 ? helocs.reduce((s, h) => s + (parseFloat(h.rate) || 7.0), 0) / helocs.length : 7.0) / 100;
        const fpl2026Base = filingStatus === 'Single' ? 16060 : 32120;
        
        const results = [];
        const duration = 100 - assumptions.currentAge;

        // Pre-calculate 72t bridge fixed amount based on 401k balance at retirement age
        let temp401kAtRetirement = bal['401k'];
        for (let j = 0; j < (assumptions.retirementAge - assumptions.currentAge); j++) {
             temp401kAtRetirement *= (1 + stockGrowth);
        }
        const seppFixedAmount = stateConfig.useSEPP ? engine.calculateMaxSepp(temp401kAtRetirement, assumptions.retirementAge) : 0;
        
        let isSeppStartedForRun = false; // Flag to track if 72t has started in this specific run

        for (let i = 0; i <= duration; i++) {
            const age = assumptions.currentAge + i;
            const currentYearIter = currentYear + i;
            const isRetired = age >= assumptions.retirementAge;
            const yearResult = { age, year: currentYearIter, draws: {}, rothConversion: 0, penalty: 0 };
            const inflationFactor = Math.pow(1 + inflationRate, i);
            const fpl = fpl2026Base * inflationFactor;

            // NW Capture
            const currentRE = realEstate.reduce((s, r) => s + (math.fromCurrency(r.value) * Math.pow(1 + realEstateGrowth, i) - math.fromCurrency(r.mortgage)), 0);
            const fixedOtherAssets = otherAssets.reduce((s, o) => s + (math.fromCurrency(o.value) - math.fromCurrency(o.loan)), 0);
            const currentNW = (bal['cash'] + bal['taxable'] + bal['roth-basis'] + bal['roth-earnings'] + bal['401k'] + bal['crypto'] + bal['metals'] + bal['hsa'] + fixedOtherAssets + currentRE) - bal['heloc'];

            let targetBudget = stateConfig.useSync ? 
                (budget.expenses || []).reduce((sum, exp) => (isRetired && exp.removedInRetirement) ? sum : sum + math.fromCurrency(exp.annual), 0) : 
                (stateConfig.manualBudget || 100000);
            targetBudget *= inflationFactor;

            if (stateConfig.strategy === 'perpetual') {
                const safeRate = Math.max(0, stockGrowth - inflationRate);
                targetBudget = currentNW * safeRate;
            }

            // --- 1. Calculate base income for the year (from employment, SS, non-taxable rentals, etc.) ---
            let baseTaxableIncome = 0; // Income that contributes to MAGI from sources
            let baseNonTaxableIncome = 0; // Income that does not contribute to MAGI from sources
            let totalPreTaxDeductions = 0; // 401k/HSA contributions

            const activeIncomes = isRetired ? income.filter(inc => inc.remainsInRetirement) : income;
            activeIncomes.forEach(inc => {
                let grossBaseAmount = math.fromCurrency(inc.amount) * (inc.isMonthly ? 12 : 1);
                let annualDirectExpenses = math.fromCurrency(inc.incomeExpenses);
                if (inc.incomeExpensesMonthly) annualDirectExpenses *= 12;

                grossBaseAmount *= Math.pow(1 + (inc.increase / 100 || 0), i);
                const bonusAmount = grossBaseAmount * (parseFloat(inc.bonusPct) / 100 || 0);
                const incomeAfterDirectExpenses = (grossBaseAmount + bonusAmount) - annualDirectExpenses;

                if (inc.nonTaxableUntil && parseInt(inc.nonTaxableUntil) >= currentYearIter) {
                    baseNonTaxableIncome += incomeAfterDirectExpenses;
                } else {
                    baseTaxableIncome += incomeAfterDirectExpenses;
                    totalPreTaxDeductions += grossBaseAmount * (parseFloat(inc.contribution) / 100 || 0); // 401k contrib
                }
            });

            // Add Social Security (taxable portion)
            const ssYearly = (age >= assumptions.ssStartAge) ? engine.calculateSocialSecurity(assumptions.ssMonthly || 0, assumptions.workYearsAtRetirement || 35, inflationFactor) : 0;
            baseTaxableIncome += ssYearly;

            // Add HSA contributions from budget as pre-tax deductions
            totalPreTaxDeductions += (budget.savings?.filter(s => s.type === 'HSA').reduce((s, x) => s + math.fromCurrency(x.annual), 0) || 0);

            // Calculate MAGI *before* any asset draws
            let currentMAGI = baseTaxableIncome - totalPreTaxDeductions;
            let currentNetNonTaxableIncome = baseNonTaxableIncome;

            // --- 2. Calculate net income from recurring sources and determine initial remaining budget need ---
            let taxOnBaseMAGI = engine.calculateTax(currentMAGI, filingStatus);
            let netAvailableFromRecurring = (currentMAGI + currentNetNonTaxableIncome) - taxOnBaseMAGI;
            let remainingBudgetNeed = Math.max(0, targetBudget - netAvailableFromRecurring);

            // --- 3. Asset Decumulation based on Priority Order and Strategy ---
            let totalTaxableDraws = 0; // Tracks taxable draws *from assets*
            let totalNonTaxableDraws = 0; // Tracks non-taxable draws *from assets*

            const medicaidCeiling = fpl * 1.38;
            const priorityOrderEffective = burndown.priorityOrder.filter(k => k !== 'hsa').concat(['hsa']); // HSA is internally always last for actual draw if funds are needed

            if (stateConfig.strategy === 'medicaid' && isRetired) {
                // Medicaid Max Strategy
                // Prioritize non-taxable assets (excluding 401k for now)
                priorityOrderEffective.filter(k => !burndown.assetMeta[k].isTaxable && k !== '401k').forEach(pk => {
                    if (remainingBudgetNeed <= 0) return;
                    const canDraw = Math.min(bal[pk], remainingBudgetNeed);
                    if (canDraw > 0) {
                        bal[pk] -= canDraw;
                        yearResult.draws[pk] = (yearResult.draws[pk] || 0) + canDraw;
                        remainingBudgetNeed -= canDraw;
                        totalNonTaxableDraws += canDraw;
                    }
                });

                // Attempt 72t draw if needed and conditions met, constrained by Medicaid ceiling
                if (remainingBudgetNeed > 0 && isRetired && age < 60 && stateConfig.useSEPP && bal['401k'] > 0) {
                    isSeppStartedForRun = true; // Mark 72t as active for this projection run
                    const currentTotalTaxable = currentMAGI + totalTaxableDraws;
                    const allowedTaxableDrawBeforeCeiling = Math.max(0, medicaidCeiling - currentTotalTaxable);
                    
                    let seppDrawAmount = Math.min(bal['401k'], seppFixedAmount, remainingBudgetNeed);
                    seppDrawAmount = Math.min(seppDrawAmount, allowedTaxableDrawBeforeCeiling);

                    if (seppDrawAmount > 0) {
                        bal['401k'] -= seppDrawAmount;
                        yearResult.draws['401k'] = (yearResult.draws['401k'] || 0) + seppDrawAmount;
                        yearResult.seppAmount = seppDrawAmount;
                        remainingBudgetNeed -= seppDrawAmount;
                        totalTaxableDraws += seppDrawAmount;
                    }
                }

                // Draw from other taxable assets, again constrained by Medicaid ceiling
                priorityOrderEffective.filter(k => burndown.assetMeta[k].isTaxable && k !== '401k').forEach(pk => {
                    if (remainingBudgetNeed <= 0) return;
                    const currentTotalTaxable = currentMAGI + totalTaxableDraws;
                    const allowedTaxableDrawBeforeCeiling = Math.max(0, medicaidCeiling - currentTotalTaxable);

                    const canDrawFromAsset = Math.min(bal[pk], remainingBudgetNeed, allowedTaxableDrawBeforeCeiling);

                    if (canDrawFromAsset > 0) {
                        bal[pk] -= canDrawFromAsset;
                        yearResult.draws[pk] = (yearResult.draws[pk] || 0) + canDrawFromAsset;
                        remainingBudgetNeed -= canDrawFromAsset;
                        totalTaxableDraws += canDrawFromAsset;
                    }
                });

                // Finally, if there's still a need, use HELOC or any remaining assets without MAGI constraint
                priorityOrderEffective.forEach(pk => {
                    if (remainingBudgetNeed <= 0) return;
                    // Skip if it's a taxable asset and we've already hit or exceeded Medicaid ceiling
                    if (burndown.assetMeta[pk].isTaxable && (currentMAGI + totalTaxableDraws) >= medicaidCeiling && pk !== 'heloc') return;

                    const limit = (pk === 'heloc') ? (helocLimit - bal['heloc']) : bal[pk]; // HELOC is treated as a draw source if limits allow
                    const canDraw = Math.min(limit, remainingBudgetNeed);
                    
                    if (canDraw > 0) {
                        if (pk === 'heloc') bal['heloc'] += canDraw; // Increase HELOC balance
                        else bal[pk] -= canDraw;
                        yearResult.draws[pk] = (yearResult.draws[pk] || 0) + canDraw;
                        remainingBudgetNeed -= canDraw;
                        if (burndown.assetMeta[pk].isTaxable) totalTaxableDraws += canDraw;
                        else totalNonTaxableDraws += canDraw;
                    }
                });

            } else { // Standard Priority Strategy (and Perpetual Wealth)
                priorityOrderEffective.forEach(pk => {
                    if (remainingBudgetNeed <= 0) return;

                    // 72t bridge for 401k, only if enabled, retired, under 60, and *needed*
                    if (pk === '401k' && isRetired && age < 60 && stateConfig.useSEPP && bal['401k'] > 0) {
                        // Condition to start SEPP: if not already started, AND there's a need
                        if (!isSeppStartedForRun && remainingBudgetNeed > 0) {
                            isSeppStartedForRun = true;
                        }
                        
                        // If SEPP is started (either this year or a previous year in this run)
                        if (isSeppStartedForRun) {
                            const seppDraw = Math.min(bal['401k'], seppFixedAmount, remainingBudgetNeed);
                            if (seppDraw > 0) {
                                bal['401k'] -= seppDraw;
                                yearResult.draws['401k'] = (yearResult.draws['401k'] || 0) + seppDraw;
                                yearResult.seppAmount = seppDraw;
                                remainingBudgetNeed -= seppDraw;
                                totalTaxableDraws += seppDraw;
                                return; // Move to next asset in priority, 401k already handled for this year's need
                            }
                        }
                    }
                    
                    const limit = (pk === 'heloc') ? (helocLimit - bal['heloc']) : bal[pk];
                    const canDraw = Math.min(limit, remainingBudgetNeed);
                    
                    if (canDraw > 0) {
                        if (pk === 'heloc') bal['heloc'] += canDraw;
                        else bal[pk] -= canDraw;
                        yearResult.draws[pk] = (yearResult.draws[pk] || 0) + canDraw;
                        remainingBudgetNeed -= canDraw;
                        if (burndown.assetMeta[pk].isTaxable) totalTaxableDraws += canDraw;
                        else totalNonTaxableDraws += canDraw;
                    }
                });
            }

            // --- 4. Final Calculations for the year ---
            // Update MAGI for the year with all draws
            yearResult.magi = currentMAGI + totalTaxableDraws;

            // HELOC Paydown: Use excess cashflow to reduce HELOC balance (if any surplus)
            if (remainingBudgetNeed < 0 && bal['heloc'] > 0) { 
                const paydownAmount = Math.min(bal['heloc'], Math.abs(remainingBudgetNeed));
                bal['heloc'] = Math.max(0, bal['heloc'] - paydownAmount); // Ensure HELOC balance never goes below zero
            }
            
            yearResult.balances = { ...bal };
            yearResult.budget = targetBudget;
            yearResult.netWorth = currentNW;
            yearResult.isMedicaid = yearResult.magi <= medicaidCeiling;
            yearResult.isSilver = yearResult.magi <= fpl * 2.5 && !yearResult.isMedicaid;
            results.push(yearResult);

            // GROWTH FOR NEXT YEAR
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
                const isSpecial = k === '401k' && (r.seppAmount || 0) > 0;
                return `<td class="p-1.5 text-right border-l border-slate-800/50">
                    <div class="${amt > 0 ? 'font-bold' : 'text-slate-700'}" ${amt > 0 ? `style="color: ${meta.color}"` : ''}>
                        ${formatter.formatCurrency(amt, 0)}
                        ${isSpecial ? '<span class="text-[7px] block opacity-60">72t</span>' : ''}
                    </div>
                    <div class="text-[8px] opacity-40">${formatter.formatCurrency(bal, 0)}</div>
                </td>`;
            }).join('');
            
            let badge = r.isMedicaid ? `<span class="px-2 py-1 rounded bg-emerald-500 text-white text-[9px] font-black uppercase">Medicaid</span>` :
                        (r.isSilver ? `<span class="px-2 py-1 rounded bg-blue-500 text-white text-[9px] font-black uppercase">Silver</span>` : `<span class="px-2 py-1 rounded bg-slate-700 text-slate-400 text-[9px] font-black">Standard</span>`);
            
            return `<tr class="border-b border-slate-800/50 hover:bg-slate-800/10 text-[10px]">
                <td class="p-2 text-center font-bold border-r border-slate-700 bg-slate-800/20">${r.age}</td>
                <td class="p-2 text-right text-slate-400">${formatter.formatCurrency(r.budget / inf, 0)}</td>
                <td class="p-2 text-right font-black text-white">${formatter.formatCurrency(r.magi / inf, 0)}</td>
                <td class="p-2 text-center border-x border-slate-800/50">${badge}</td>
                ${draws}
                <td class="p-2 text-right font-black border-l border-slate-700 text-teal-400 bg-slate-800/20">${formatter.formatCurrency(r.netWorth / inf, 0)}</td>
            </tr>`;
        }).join('');
        
        return `<table class="w-full text-left border-collapse table-auto" style="font-family: 'Inter', sans-serif;">
            <thead class="sticky top-0 bg-slate-800 text-slate-500 label-std z-20">
                <tr>
                    <th class="p-2 border-r border-slate-700 w-10">Age</th>
                    <th class="p-2 text-right">Budget</th>
                    <th class="p-2 text-right">MAGI</th>
                    <th class="p-2 text-center border-x border-slate-800/50">Status</th>
                    ${headerCells}
                    <th class="p-2 text-right border-l border-slate-700">Net Worth</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    }
};
