
import { math, stateTaxRates } from './utils.js';

export const templates = {
    helpers: {
        getEfficiencyBadge: (type, value = 0, costBasis = 0, state = 'Michigan') => {
            const v = math.fromCurrency(value);
            const b = math.fromCurrency(costBasis);
            const stateRate = stateTaxRates[state] || 0;
            
            if (type === '529 Plan' || type === 'Post-Tax (Roth)') {
                return `<div class="efficiency-badge inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-current" title="100% Efficient (${type === '529 Plan' ? 'Tax-Free Education' : 'Tax-Free Withdrawal'})">100%</div>`;
            }

            if (v > 0 && b >= v) {
                 return `<div class="efficiency-badge inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-current" title="100% Efficient (No Gains)">100%</div>`;
            }

            const fixedEfficiencies = {
                'Cash': 1.0,
                'HSA': 1.0
            };

            const styles = {
                'Taxable': { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                'Pre-Tax (401k/IRA)': { color: 'text-amber-500', bg: 'bg-amber-500/10' },
                'Post-Tax (Roth)': { color: 'text-purple-400', bg: 'bg-purple-400/10' },
                'Cash': { color: 'text-pink-400', bg: 'bg-pink-400/10' },
                'HSA': { color: 'text-teal-400', bg: 'bg-teal-400/10' },
                'Crypto': { color: 'text-orange-400', bg: 'bg-orange-400/10' },
                'Metals': { color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                '529 Plan': { color: 'text-rose-400', bg: 'bg-rose-400/10' }
            };

            const s = styles[type] || styles['Taxable'];
            let label;

            if (fixedEfficiencies[type] !== undefined) {
                label = Math.round(fixedEfficiencies[type] * 100) + '%';
            } else if (type === 'Pre-Tax (401k/IRA)') {
                const combinedRate = 0.22 + stateRate;
                label = Math.round((1 - combinedRate) * 100) + '%';
            } else if (['Taxable', 'Crypto', 'Metals'].includes(type)) {
                const fedRate = (type === 'Metals') ? 0.28 : 0.15;
                const combinedCapGainsRate = fedRate + stateRate;
                const gainRatio = v > 0 ? Math.max(0, (v - b) / v) : 0;
                const efficiency = 1 - (gainRatio * combinedCapGainsRate);
                label = Math.round(efficiency * 100) + '%';
            } else {
                label = '92%';
            }

            return `<div class="efficiency-badge inline-flex items-center px-1.5 py-0.5 rounded ${s.bg} ${s.color} text-[9px] font-black uppercase tracking-widest border border-current opacity-80" title="Est. Realizable Value Post-Tax (${state} Tax: ${Math.round(stateRate*1000)/10}%)">${label}</div>`;
        },
        getTypeClass: (type) => {
            const map = {
                'Cash': 'text-type-cash',
                'Taxable': 'text-type-taxable',
                'Pre-Tax (401k/IRA)': 'text-type-pretax',
                'Post-Tax (Roth)': 'text-type-posttax',
                'Crypto': 'text-type-crypto',
                'Metals': 'text-type-metals',
                'HSA': 'text-type-hsa',
                '529 Plan': 'text-type-529'
            };
            return map[type] || 'text-type-taxable';
        }
    },

    investment: (data) => {
        const state = window.currentData?.assumptions?.state || 'Michigan';
        const type = data.type || 'Taxable';
        return `
            <td class="w-8"><i class="fas fa-bars drag-handle text-slate-700"></i></td>
            <td><input data-id="name" type="text" placeholder="Account" class="input-base w-full font-bold text-white"></td>
            <td>
                <div class="flex items-center">
                    <select data-id="type" class="input-base w-full font-bold ${templates.helpers.getTypeClass(type)}">
                        <option ${type === 'Taxable' ? 'selected' : ''}>Taxable</option>
                        <option ${type === 'Pre-Tax (401k/IRA)' ? 'selected' : ''}>Pre-Tax (401k/IRA)</option>
                        <option ${type === 'Post-Tax (Roth)' ? 'selected' : ''}>Post-Tax (Roth)</option>
                        <option ${type === 'Cash' ? 'selected' : ''}>Cash</option>
                        <option ${type === 'Crypto' ? 'selected' : ''}>Crypto</option>
                        <option ${type === 'Metals' ? 'selected' : ''}>Metals</option>
                        <option ${type === 'HSA' ? 'selected' : ''}>HSA</option>
                        <option ${type === '529 Plan' ? 'selected' : ''}>529 Plan</option>
                    </select>
                </div>
            </td>
            <td><input data-id="value" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-bold mono-numbers"></td>
            <td><input data-id="costBasis" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-blue-400 opacity-60 mono-numbers"></td>
            <td class="text-center w-20">
                <div data-id="efficiency-container">
                    ${templates.helpers.getEfficiencyBadge(type, data.value, data.costBasis, state)}
                </div>
            </td>
            <td class="text-center"><button data-action="remove" class="text-slate-700 hover:text-red-400"><i class="fas fa-times"></i></button></td>
        `;
    },
    income: () => `
        <div class="bg-slate-800 rounded-2xl border border-slate-700/50 flex flex-col relative group shadow-lg overflow-hidden">
            <div class="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/40">
                <div class="flex items-center gap-3">
                    <i class="fas fa-money-check-alt text-teal-400"></i>
                    <input data-id="name" type="text" placeholder="Source Name" class="bg-transparent border-none outline-none text-white font-black uppercase tracking-widest text-sm placeholder:text-slate-600">
                </div>
                <button data-action="remove" class="text-slate-600 hover:text-red-400 transition-all">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="p-5 space-y-6">
                <!-- Row 1: Gross & Growth -->
                <div class="grid grid-cols-2 gap-6 items-end">
                    <div class="space-y-1">
                        <div class="flex justify-between items-center h-4 mb-0.5">
                            <label class="label-std text-slate-500">Gross Amount</label>
                            <button data-action="toggle-freq" data-id="isMonthly" class="text-blue-500 hover:text-blue-400 label-std">Annual</button>
                        </div>
                        <input data-id="amount" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-teal-400 font-bold mono-numbers">
                    </div>
                    <div class="space-y-1">
                        <div class="h-4 mb-0.5">
                            <label class="label-std text-slate-500">Annual Growth %</label>
                        </div>
                        <input data-id="increase" type="number" step="0.1" placeholder="0" class="input-base w-full text-white font-bold mono-numbers">
                    </div>
                </div>

                <!-- Row 2: 401k & Match & Bonus -->
                <div class="grid grid-cols-3 gap-4 p-4 bg-slate-900/40 rounded-xl border border-slate-700/30">
                    <div class="space-y-1">
                        <label class="label-std text-slate-500">401k %</label>
                        <input data-id="contribution" type="number" placeholder="0" class="input-base w-full text-white font-bold mono-numbers">
                    </div>
                    <div class="space-y-1">
                        <label class="label-std text-slate-500">Match %</label>
                        <input data-id="match" type="number" placeholder="0" class="input-base w-full text-white font-bold mono-numbers">
                    </div>
                    <div class="space-y-1">
                        <label class="label-std text-slate-500">Bonus %</label>
                        <input data-id="bonusPct" type="number" placeholder="0" class="input-base w-full text-white font-bold mono-numbers">
                    </div>
                </div>

                <!-- Row 3: Deductions/Expenses -->
                <div class="space-y-1">
                    <div class="flex justify-between items-center">
                        <label class="label-std text-slate-500">Direct Deductions / Expenses</label>
                        <button data-action="toggle-freq" data-id="incomeExpensesMonthly" class="text-blue-500 hover:text-blue-400 label-std">Annual</button>
                    </div>
                    <input data-id="incomeExpenses" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-pink-400 font-bold mono-numbers">
                </div>

                <!-- Row 4: Settings -->
                <div class="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-700/30">
                    <div class="flex flex-col gap-1">
                        <label class="label-std text-slate-500">Non-Taxable Until (Year)</label>
                        <input data-id="nonTaxableUntil" type="number" placeholder="2026" class="input-base w-24 text-teal-400 font-bold mono-numbers">
                    </div>
                    <label class="flex items-center gap-3 cursor-pointer pt-4">
                        <input data-id="remainsInRetirement" type="checkbox" class="w-4 h-4 accent-blue-500 rounded bg-slate-900 border-slate-700">
                        <span class="label-std text-slate-500 hover:text-blue-400 transition-colors">Stays in Retirement?</span>
                    </label>
                </div>
            </div>
        </div>
    `,
    "budget-savings": (data) => {
        const type = data.type || 'Taxable';
        return `
            <td>
                <select data-id="type" class="input-base w-full font-bold ${templates.helpers.getTypeClass(type)}">
                    <option ${type === 'Taxable' ? 'selected' : ''}>Taxable</option>
                    <option ${type === 'Pre-Tax (401k/IRA)' ? 'selected' : ''}>Pre-Tax (401k/IRA)</option>
                    <option ${type === 'Post-Tax (Roth)' ? 'selected' : ''}>Post-Tax (Roth)</option>
                    <option ${type === 'Cash' ? 'selected' : ''}>Cash</option>
                    <option ${type === 'Crypto' ? 'selected' : ''}>Crypto</option>
                    <option ${type === 'Metals' ? 'selected' : ''}>Metals</option>
                    <option ${type === 'HSA' ? 'selected' : ''}>HSA</option>
                    <option ${type === '529 Plan' ? 'selected' : ''}>529 Plan</option>
                </select>
            </td>
            <td><input data-id="monthly" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-bold mono-numbers" ${data.isLocked ? 'readonly' : ''}></td>
            <td><input data-id="annual" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-black mono-numbers" ${data.isLocked ? 'readonly' : ''}></td>
            <td class="text-center">${data.isLocked ? '' : '<button data-action="remove" class="text-slate-700 hover:text-red-400"><i class="fas fa-times"></i></button>'}</td>
        `;
    },
    "budget-expense": () => `
        <td><input data-id="name" type="text" placeholder="Expense Item" class="input-base w-full font-bold text-white"></td>
        <td class="text-center"><input data-id="removedInRetirement" type="checkbox" class="w-4 h-4 accent-pink-500 rounded bg-slate-900 mx-auto"></td>
        <td><input data-id="monthly" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-400 font-bold mono-numbers"></td>
        <td><input data-id="annual" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500 font-black mono-numbers"></td>
        <td class="text-center"><button data-action="remove" class="text-slate-700 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    realEstate: () => `
        <td><input data-id="name" type="text" placeholder="Property" class="input-base w-full font-bold text-white"></td>
        <td><input data-id="value" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-black mono-numbers"></td>
        <td><input data-id="mortgage" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500 font-bold mono-numbers"></td>
        <td class="text-center"><button data-action="remove" class="text-slate-700 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    otherAsset: () => `
        <td><input data-id="name" type="text" placeholder="Asset" class="input-base w-full font-bold text-white"></td>
        <td><input data-id="value" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-black mono-numbers"></td>
        <td><input data-id="loan" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500 font-bold mono-numbers"></td>
        <td class="text-center"><button data-action="remove" class="text-slate-700 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    heloc: () => `
        <td><input data-id="name" type="text" placeholder="HELOC" class="input-base w-full font-bold text-white"></td>
        <td><input data-id="balance" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500 font-black mono-numbers"></td>
        <td><input data-id="limit" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right font-bold mono-numbers"></td>
        <td class="text-center"><button data-action="remove" class="text-slate-700 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    debt: () => `
        <td><input data-id="name" type="text" placeholder="Debt" class="input-base w-full font-bold text-white"></td>
        <td><input data-id="balance" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500 font-black mono-numbers"></td>
        <td class="text-center"><button data-action="remove" class="text-slate-700 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `
};
