
import { math, stateTaxRates } from './utils.js';

export const templates = {
    helpers: {
        getEfficiencyBadge: (type, value = 0, costBasis = 0, state = 'Michigan') => {
            const v = math.fromCurrency(value);
            const b = math.fromCurrency(costBasis);
            const stateRate = stateTaxRates[state] || 0;
            
            if (v > 0 && b >= v) {
                 return `<div class="efficiency-badge inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-current" title="100% Efficient (No Gains)">100%</div>`;
            }

            const efficiencies = {
                'Taxable': { baseEfficiency: 0.92, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                'Pre-Tax (401k/IRA)': { baseEfficiency: 1 - (0.22 + stateRate), color: 'text-amber-500', bg: 'bg-amber-500/10' },
                'Post-Tax (Roth)': { baseEfficiency: 1.0, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                'Cash': { baseEfficiency: 1.0, color: 'text-pink-400', bg: 'bg-pink-400/10' },
                'HSA': { baseEfficiency: 1.0, color: 'text-teal-400', bg: 'bg-teal-400/10' },
                'Crypto': { baseEfficiency: 1 - (0.15 + stateRate), color: 'text-orange-400', bg: 'bg-orange-400/10' },
                'Metals': { baseEfficiency: 1 - (0.28 + stateRate), color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                '529 Plan': { baseEfficiency: 1.0, color: 'text-rose-400', bg: 'bg-rose-400/10' }
            };
            const e = efficiencies[type] || efficiencies['Taxable'];
            
            let label;
            if (type === 'Taxable' && v > 0) {
                const gainRatio = Math.max(0, (v - b) / v);
                // 15% Federal + State Rate
                const combinedTaxRate = 0.15 + stateRate;
                const efficiency = 1 - (gainRatio * combinedTaxRate);
                label = Math.round(efficiency * 100) + '%';
            } else {
                label = Math.round(e.baseEfficiency * 100) + '%';
            }

            return `<div class="efficiency-badge inline-flex items-center px-1.5 py-0.5 rounded ${e.bg} ${e.color} text-[9px] font-black uppercase tracking-widest border border-current opacity-80" title="Est. Realizable Value Post-Tax (${state} Tax: ${Math.round(stateRate*1000)/10}%)">${label}</div>`;
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
            return map[type] || '';
        }
    },

    investment: (data) => {
        const state = window.currentData?.assumptions?.state || 'Michigan';
        return `
            <td class="w-8"><i class="fas fa-bars drag-handle text-slate-700"></i></td>
            <td><input data-id="name" type="text" placeholder="Account" class="input-base w-full font-bold text-white"></td>
            <td>
                <div class="flex items-center">
                    <select data-id="type" class="input-base w-full font-bold ${templates.helpers.getTypeClass(data.type)}">
                        <option>Taxable</option>
                        <option>Pre-Tax (401k/IRA)</option>
                        <option>Post-Tax (Roth)</option>
                        <option>Cash</option>
                        <option>Crypto</option>
                        <option>Metals</option>
                        <option>HSA</option>
                        <option>529 Plan</option>
                    </select>
                </div>
            </td>
            <td><input data-id="value" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-bold mono-numbers"></td>
            <td><input data-id="costBasis" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-blue-400 opacity-60 mono-numbers"></td>
            <td class="text-center w-20">
                <div data-id="efficiency-container">
                    ${templates.helpers.getEfficiencyBadge(data.type || 'Taxable', data.value, data.costBasis, state)}
                </div>
            </td>
            <td class="text-center"><button data-action="remove" class="text-slate-700 hover:text-red-400"><i class="fas fa-times"></i></button></td>
        `;
    },
    income: () => `
        <div class="bg-slate-800 rounded-2xl border border-slate-700/50 p-6 flex flex-col gap-5 relative group shadow-lg">
            <button data-action="remove" class="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="space-y-1">
                <label class="label-std text-slate-500">Source</label>
                <input data-id="name" type="text" placeholder="Employer Name" class="bg-transparent border-none outline-none w-full text-white font-black text-xl placeholder:text-slate-700 uppercase tracking-tighter">
                <div class="h-[1px] bg-slate-700/50 w-full"></div>
            </div>

            <div class="grid grid-cols-2 gap-5">
                <div class="space-y-1">
                    <div class="flex justify-between items-center h-4">
                        <label class="label-std text-slate-500">Gross</label>
                        <button data-action="toggle-freq" data-id="isMonthly" class="text-blue-500 hover:text-blue-400 label-std">Annual</button>
                    </div>
                    <input data-id="amount" data-type="currency" type="text" placeholder="$0" class="mono-numbers bg-transparent border-none outline-none w-full text-teal-400 font-bold text-base h-7">
                    <div class="h-[1px] bg-slate-700/50 w-full"></div>
                </div>
                <div class="space-y-1">
                    <label class="label-std text-slate-500">Growth %</label>
                    <input data-id="increase" type="number" step="0.1" placeholder="0" class="mono-numbers bg-transparent border-none outline-none w-full text-white font-bold text-base h-7">
                    <div class="h-[1px] bg-slate-700/50 w-full"></div>
                </div>
            </div>

            <div class="p-4 bg-slate-900/40 rounded-xl border border-slate-700/30">
                <div class="grid grid-cols-2 gap-5">
                    <div class="space-y-1">
                        <label class="label-std text-slate-500">401K %</label>
                        <input data-id="contribution" type="number" placeholder="0" class="mono-numbers bg-transparent border-none outline-none w-full text-white font-bold text-base h-7">
                        <div class="h-[1px] bg-slate-700/50 w-full"></div>
                    </div>
                    <div class="space-y-1">
                        <label class="label-std text-slate-500">Match %</label>
                        <input data-id="match" type="number" placeholder="0" class="mono-numbers bg-transparent border-none outline-none w-full text-white font-bold text-base h-7">
                        <div class="h-[1px] bg-slate-700/50 w-full"></div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-2 pt-2">
                <label class="flex items-center gap-3 cursor-pointer">
                    <input data-id="remainsInRetirement" type="checkbox" class="w-4 h-4 accent-blue-500 rounded bg-slate-900">
                    <span class="label-std text-slate-500 leading-none">Keeps in Retirement?</span>
                </label>
            </div>
        </div>
    `,
    "budget-savings": (data) => `
        <td>
            <select data-id="type" class="input-base w-full font-bold ${templates.helpers.getTypeClass(data.type)}">
                <option>Taxable</option>
                <option>Pre-Tax (401k/IRA)</option>
                <option>Post-Tax (Roth)</option>
                <option>Cash</option>
                <option>Crypto</option>
                <option>Metals</option>
                <option>HSA</option>
                <option>529 Plan</option>
            </select>
        </td>
        <td><input data-id="monthly" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-bold mono-numbers" ${data.isLocked ? 'readonly' : ''}></td>
        <td><input data-id="annual" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-black mono-numbers" ${data.isLocked ? 'readonly' : ''}></td>
        <td class="text-center">${data.isLocked ? '' : '<button data-action="remove" class="text-slate-700 hover:text-red-400"><i class="fas fa-times"></i></button>'}</td>
    `,
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
