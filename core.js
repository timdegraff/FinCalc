
import { GoogleGenAI } from '@google/genai';
import { signInWithGoogle, logoutUser } from './auth.js';
import { templates } from './templates.js';
import { autoSave, updateSummaries } from './data.js';
import { math, engine, assetColors, assumptions } from './utils.js';
import { formatter } from './formatter.js';

let assetChart = null;
let lastChartSum = 0;

export function initializeUI() {
    attachGlobalListeners();
    attachNavigationListeners();
    attachDynamicRowListeners();
    attachSortingListeners();
    attachCoPilotListeners();
    attachPasteListeners();
    showTab('assets-debts');
}

function attachGlobalListeners() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.onclick = signInWithGoogle;
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.onclick = logoutUser;

    document.body.addEventListener('input', (e) => {
        if (e.target.closest('.input-base, .input-range') || e.target.closest('input[data-id]')) {
            handleLinkedBudgetValues(e.target);
            if (e.target.dataset.id === 'contribution' || e.target.dataset.id === 'amount') {
                const row = e.target.closest('tr') || e.target.closest('.bg-slate-800');
                if (row) checkIrsLimits(row);
            }
            
            // UNIFIED SYNC LOGIC
            const id = e.target.dataset.id || e.target.dataset.liveId;
            if (id) {
                let val = e.target.value;
                
                // 1. Age Constraint: Retirement Age >= Current Age
                if (id === 'currentAge' || id === 'retirementAge') {
                    const currentAge = parseFloat(document.querySelector('[data-id="currentAge"]')?.value || window.currentData?.assumptions?.currentAge || 40);
                    let retirementAge = parseFloat(document.querySelector('[data-id="retirementAge"]')?.value || window.currentData?.assumptions?.retirementAge || 65);
                    
                    if (id === 'currentAge') {
                        const newC = parseFloat(val);
                        if (newC > retirementAge) {
                            retirementAge = newC;
                            syncAllInputs('retirementAge', newC);
                        }
                    } else if (id === 'retirementAge') {
                        const newR = parseFloat(val);
                        if (newR < currentAge) {
                            val = currentAge;
                            e.target.value = val;
                        }
                    }
                }

                // 2. Sync all other elements sharing this ID
                syncAllInputs(id, val);
                
                // 3. Update memory model immediately
                if (window.currentData && window.currentData.assumptions) {
                    window.currentData.assumptions[id] = parseFloat(val) || val;
                }
            }

            window.debouncedAutoSave();
        }
    });

    document.getElementById('input-projection-end')?.addEventListener('input', (e) => {
        const label = document.getElementById('label-projection-end');
        if (label) label.textContent = e.target.value;
        window.debouncedAutoSave();
    });
}

function syncAllInputs(id, val) {
    const selectors = [
        `#assumptions-container [data-id="${id}"]`,
        `#burndown-live-sliders [data-live-id="${id}"]`,
        `#burndown-live-sliders [data-id="${id}"]`,
        `#input-top-retire-age[data-id="${id}"]`
    ];

    selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            if (el.value !== val) el.value = val;
            let label = null;
            if (el.id === 'input-top-retire-age') {
                label = document.getElementById('label-top-retire-age');
            } else {
                label = el.previousElementSibling?.querySelector('span');
            }
            
            if (label) {
                if (id === 'ssMonthly') {
                    label.textContent = math.toCurrency(parseFloat(val));
                } else {
                    label.textContent = val;
                }
            }
        });
    });
}

function attachPasteListeners() {
    document.body.addEventListener('paste', (e) => {
        const target = e.target;
        if (target.dataset.paste === 'spreadsheet' || target.dataset.id === 'monthly' || target.dataset.id === 'annual') {
            const clipboardData = e.clipboardData || window.clipboardData;
            const pastedData = clipboardData.getData('Text');
            
            if (pastedData.includes('\t') || pastedData.includes('\n')) {
                e.preventDefault();
                const lines = pastedData.trim().split(/\r?\n/);
                const isExpenseTable = target.closest('#budget-expenses-rows') !== null;
                const containerId = isExpenseTable ? 'budget-expenses-rows' : 'budget-savings-rows';
                const rowType = isExpenseTable ? 'budget-expense' : 'budget-savings';

                lines.forEach((line, index) => {
                    const columns = line.split('\t');
                    let name = '', monthly = 0;
                    if (target.dataset.id === 'monthly') {
                        if (columns.length > 1 && isNaN(math.fromCurrency(columns[0]))) {
                             name = columns[0];
                             monthly = math.fromCurrency(columns[1]);
                        } else {
                             monthly = math.fromCurrency(columns[0]);
                        }
                    } else {
                        name = columns[0] || '';
                        monthly = math.fromCurrency(columns[1] || '0');
                    }
                    const annual = monthly * 12;
                    if (index === 0 && !target.value.trim()) {
                        const row = target.closest('tr');
                        const nameInp = row.querySelector('[data-id="name"]');
                        const monthlyInp = row.querySelector('[data-id="monthly"]');
                        const annualInp = row.querySelector('[data-id="annual"]');
                        if (nameInp && name) nameInp.value = name;
                        if (monthlyInp) monthlyInp.value = math.toCurrency(monthly);
                        if (annualInp) annualInp.value = math.toCurrency(annual);
                    } else {
                        window.addRow(containerId, rowType, { name, monthly, annual });
                    }
                });
                window.debouncedAutoSave();
            }
        }
    });
}

function checkIrsLimits(row) {
    const amountEl = row.querySelector('[data-id="amount"]');
    if (!amountEl) return;
    const amountValue = math.fromCurrency(amountEl.value);
    const freqBtn = row.querySelector('[data-id="isMonthly"]');
    const isMonthly = freqBtn && freqBtn.textContent.trim().toLowerCase() === 'monthly';
    const baseAnnual = isMonthly ? amountValue * 12 : amountValue;
    const personalPct = parseFloat(row.querySelector('[data-id="contribution"]')?.value) || 0;
    const personal401k = baseAnnual * (personalPct / 100);
    const limit = 23500; 
    const warning = row.querySelector('[data-id="capWarning"]');
    if (warning) warning.classList.toggle('hidden', personal401k <= limit);
}

function attachCoPilotListeners() {
    const pilotBtn = document.getElementById('ai-pilot-btn');
    if (pilotBtn) {
        pilotBtn.onclick = async () => {
            const modal = document.getElementById('ai-modal');
            const container = document.getElementById('ai-response-container');
            modal.classList.remove('hidden');
            container.innerHTML = `<div class="flex flex-col items-center justify-center py-20 gap-4"><div class="animate-spin text-teal-400 text-4xl"><i class="fas fa-circle-notch"></i></div><p class="font-bold text-slate-500">Reviewing strategy...</p></div>`;
            try {
                const env = (typeof process !== 'undefined') ? process.env : {};
                const apiKey = env.API_KEY || '';
                const ai = new GoogleGenAI({ apiKey });
                const prompt = `Financial data summary: ${JSON.stringify(window.currentData)}. Give 3 short optimization tips for 2026 Michigan benefits/taxes.`;
                const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
                container.innerHTML = response.text.replace(/\n/g, '<br>');
            } catch (e) {
                container.innerHTML = `<p class="text-red-400">AI Error: ${e.message}</p>`;
            }
        };
    }
    const closeModal = document.getElementById('close-ai-modal');
    if (closeModal) closeModal.onclick = () => document.getElementById('ai-modal').classList.add('hidden');
}

function handleLinkedBudgetValues(target) {
    const row = target.closest('tr');
    if (!row) return;
    const isBudgetRow = row.closest('#budget-savings-rows') || row.closest('#budget-expenses-rows');
    if (!isBudgetRow) return;
    const monthlyInput = row.querySelector('[data-id="monthly"]');
    const annualInput = row.querySelector('[data-id="annual"]');
    if (!monthlyInput || !annualInput) return;
    const val = math.fromCurrency(target.value);
    if (target.dataset.id === 'monthly') annualInput.value = math.toCurrency(val * 12);
    else if (target.dataset.id === 'annual') monthlyInput.value = math.toCurrency(val / 12);
}

function attachNavigationListeners() {
    document.getElementById('main-nav')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (btn && btn.dataset.tab) showTab(btn.dataset.tab);
    });
}

function attachDynamicRowListeners() {
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        if (btn.dataset.addRow) {
            window.addRow(btn.dataset.addRow, btn.dataset.rowType);
            window.debouncedAutoSave();
        } else if (btn.dataset.action === 'remove') {
            const row = btn.closest('tr') || btn.closest('.bg-slate-800');
            row?.remove();
            window.debouncedAutoSave();
        } else if (btn.dataset.action === 'toggle-freq') {
            const isMonthly = btn.textContent.trim().toLowerCase() === 'monthly';
            btn.textContent = isMonthly ? 'Annual' : 'Monthly';
            const input = btn.closest('div')?.querySelector('input') || btn.closest('.space-y-1')?.querySelector('input') || btn.closest('.space-y-2')?.querySelector('input');
            if (input) {
                const cur = math.fromCurrency(input.value);
                input.value = math.toCurrency(isMonthly ? cur * 12 : cur / 12);
            }
            const parent = btn.closest('.bg-slate-800');
            if (parent) checkIrsLimits(parent);
            window.debouncedAutoSave();
        }
    });
    document.body.addEventListener('change', (e) => {
        if (e.target.dataset.id === 'type' && e.target.closest('#investment-rows')) updateCostBasisVisibility(e.target.closest('tr'));
    });
}

function attachSortingListeners() {
    document.querySelectorAll('[data-sort]').forEach(header => {
        header.onclick = () => {
            const type = header.dataset.sort;
            const container = document.getElementById('budget-expenses-rows');
            const rows = Array.from(container.querySelectorAll('tr'));
            const isAsc = header.dataset.order === 'asc';
            rows.sort((a, b) => {
                const valA = math.fromCurrency(a.querySelector(`[data-id="${type}"]`)?.value || 0);
                const valB = math.fromCurrency(b.querySelector(`[data-id="${type}"]`)?.value || 0);
                return isAsc ? valA - valB : valB - valA;
            });
            header.dataset.order = isAsc ? 'desc' : 'asc';
            container.append(...rows);
        };
    });
}

function updateCostBasisVisibility(row) {
    const typeSelect = row.querySelector('[data-id="type"]');
    const costBasisInput = row.querySelector('[data-id="costBasis"]');
    if (!typeSelect || !costBasisInput) return;
    const val = typeSelect.value;
    const isIrrelevant = (val === 'Pre-Tax (401k/IRA)' || val === 'Cash' || val === 'HSA' || val === '529 Plan');
    costBasisInput.style.visibility = isIrrelevant ? 'hidden' : 'visible';
    costBasisInput.disabled = isIrrelevant;
}

export function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tabId}`)?.classList.remove('hidden');
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
    if (tabId === 'burndown' || tabId === 'projection') window.debouncedAutoSave(); 
}

window.addRow = (containerId, type, data = {}) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    let element;
    if (type === 'income') element = document.createElement('div');
    else {
        element = document.createElement('tr');
        element.className = 'border-b border-slate-700/50 hover:bg-slate-800/20 transition-colors';
    }
    element.innerHTML = templates[type](data);
    container.appendChild(element);
    
    if (type === 'budget-expense' || type === 'budget-savings') {
        if (data.monthly !== undefined && data.annual === undefined) data.annual = data.monthly * 12;
        if (data.annual !== undefined && data.monthly === undefined) data.monthly = data.annual / 12;
    }

    element.querySelectorAll('[data-id]').forEach(input => {
        const key = input.dataset.id;
        const val = data[key];
        if (val !== undefined) {
            if (input.type === 'checkbox') input.checked = !!val;
            else if (input.dataset.type === 'currency') input.value = math.toCurrency(val);
            else input.value = val;
        }
    });
    if (type === 'income') {
        const amtBtn = element.querySelector('[data-id="isMonthly"]');
        if (amtBtn) amtBtn.textContent = data.isMonthly ? 'Monthly' : 'Annual';
        const offBtn = element.querySelector('[data-id="writeOffsMonthly"]');
        if (offBtn) offBtn.textContent = data.writeOffsMonthly ? 'Monthly' : 'Annual';
        checkIrsLimits(element);
    }
    if (type === 'investment') updateCostBasisVisibility(element);
    element.querySelectorAll('[data-type="currency"]').forEach(formatter.bindCurrencyEventListeners);
};

window.updateSidebarChart = (data) => {
    const ctx = document.getElementById('sidebar-asset-chart')?.getContext('2d');
    if (!ctx) return;
    const totals = {};
    let totalSum = 0;
    data.investments?.forEach(i => {
        const val = math.fromCurrency(i.value);
        totals[i.type] = (totals[i.type] || 0) + val;
        totalSum += val;
    });
    data.realEstate?.forEach(r => {
        const val = math.fromCurrency(r.value);
        totals['Real Estate'] = (totals['Real Estate'] || 0) + val;
        totalSum += val;
    });
    data.otherAssets?.forEach(o => {
        const val = math.fromCurrency(o.value);
        totals['Other'] = (totals['Other'] || 0) + val;
        totalSum += val;
    });

    const diff = Math.abs(totalSum - lastChartSum);
    if (lastChartSum !== 0 && (diff / lastChartSum) < 0.005) return;
    lastChartSum = totalSum;

    if (assetChart) assetChart.destroy();
    
    const labels = Object.keys(totals);
    const chartData = Object.values(totals);
    const colors = labels.map(l => assetColors[l] || assetColors['Taxable']);

    assetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: chartData,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 2
            }]
        },
        options: {
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (c) => {
                            const p = ((c.parsed / totalSum) * 100).toFixed(1);
                            return `${c.label}: ${p}%`;
                        }
                    }
                }
            },
            cutout: '75%',
            responsive: true,
            maintainAspectRatio: false
        }
    });
};

window.createAssumptionControls = (data) => {
    const container = document.getElementById('assumptions-container');
    if (!container) return;
    
    const settingsHTML = `
        <div class="col-span-full mb-4 pb-2 border-b border-slate-700/50 flex items-center gap-2">
            <i class="fas fa-user-circle text-blue-400"></i>
            <h3 class="text-xs uppercase font-black text-slate-400 tracking-widest">Personal & Strategy</h3>
        </div>
        <div class="space-y-6 lg:border-r lg:border-slate-700/30 lg:pr-8">
            <label class="block"><span class="text-[10px] text-slate-500 font-black uppercase tracking-widest">Filing Status</span><select data-id="filingStatus" class="input-base w-full mt-1"><option>Single</option><option>Married Filing Jointly</option></select></label>
            <label class="block"><span class="text-[10px] text-slate-500 font-black uppercase tracking-widest">Benefit Target Threshold</span><select data-id="benefitCeiling" class="input-base w-full mt-1">
                <option value="1.38">138% FPL (Medicaid)</option>
                <option value="2.5">250% FPL (Silver)</option>
                <option value="999">Wealth Preservation / No Subsidies</option>
            </select></label>
            <div id="assumptions-life"></div>
        </div>
        <div class="space-y-6 lg:border-r lg:border-slate-700/30 lg:px-8">
            <div class="mb-4 pb-2 border-b border-slate-700/50 flex items-center gap-2">
                <i class="fas fa-university text-emerald-400"></i>
                <h3 class="text-xs uppercase font-black text-slate-400 tracking-widest">Retirement & Social Security</h3>
            </div>
            <div id="assumptions-retirement"></div>
        </div>
        <div class="space-y-6 lg:pl-8">
            <div class="mb-4 pb-2 border-b border-slate-700/50 flex items-center gap-2">
                <i class="fas fa-chart-area text-amber-400"></i>
                <h3 class="text-xs uppercase font-black text-slate-400 tracking-widest">Market & Growth</h3>
            </div>
            <div id="assumptions-market"></div>
        </div>
    `;
    container.innerHTML = settingsHTML;
    
    const groups = {
        life: [
            { id: 'currentAge', label: 'Current Age', min: 18, max: 100, step: 1 },
            { id: 'retirementAge', label: 'Retirement Age', min: 18, max: 100, step: 1 },
        ],
        retirement: [
            { id: 'ssStartAge', label: 'SS Start Age', min: 62, max: 70, step: 1 },
            { id: 'ssMonthly', label: 'SS Monthly (Today\'s $)', min: 0, max: 6000, step: 100, isCurrency: true },
        ],
        market: [
            { id: 'stockGrowth', label: 'Stocks APY %', min: 0, max: 15, step: 0.5 },
            { id: 'cryptoGrowth', label: 'Bitcoin %', min: 0, max: 50, step: 1 },
            { id: 'metalsGrowth', label: 'Metals %', min: 0, max: 15, step: 1 },
            { id: 'realEstateGrowth', label: 'Real Estate APY %', min: 0, max: 15, step: 0.5 },
            { id: 'inflation', label: 'Inflation %', min: 0, max: 10, step: 0.1 }
        ]
    };

    Object.entries(groups).forEach(([groupName, configs]) => {
        const subContainer = document.getElementById(`assumptions-${groupName}`);
        configs.forEach(({ id, label, min, max, step, isCurrency }) => {
            let val = data.assumptions?.[id] ?? assumptions.defaults[id];
            const div = document.createElement('div');
            div.className = 'space-y-2 mb-6';
            const displayVal = isCurrency ? math.toCurrency(val) : val;
            div.innerHTML = `<label class="flex justify-between font-bold text-[10px] uppercase text-slate-500 tracking-widest">${label} <span class="text-emerald-400 font-black">${displayVal}</span></label>
            <input type="range" data-id="${id}" value="${val}" min="${min}" max="${max}" step="${step}" class="input-range">`;
            subContainer.appendChild(div);
        });
    });

    container.querySelectorAll('select').forEach(s => s.value = data.assumptions?.[s.dataset.id] || 'Single');
};

function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
window.debouncedAutoSave = debounce(() => autoSave(true), 500);
