
import { math } from './utils.js';

export const templates = {
    // MODULAR HELPERS - DELETE LINE IN INVESTMENT TO REMOVE BADGE
    helpers: {
        getEfficiencyBadge: (type) => {
            const efficiencies = {
                'Taxable': { label: '92%', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                'Pre-Tax (401k/IRA)': { label: '78%', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                'Post-Tax (Roth)': { label: '100%', color: 'text-purple-400', bg: 'bg-purple-400/10' },
                'Cash': { label: '100%', color: 'text-pink-400', bg: 'bg-pink-400/10' },
                'HSA': { label: '100%', color: 'text-teal-400', bg: 'bg-teal-400/10' },
                'Crypto': { label: '85%', color: 'text-orange-400', bg: 'bg-orange-400/10' },
                'Metals': { label: '72%', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                '529 Plan': { label: '100%', color: 'text-rose-400', bg: 'bg-rose-400/10' }
            };
            const e = efficiencies[type] || efficiencies['Taxable'];
            return `<div class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded ${e.bg} ${e.color} text-[8px] font-black uppercase tracking-widest border border-current opacity-70" title="Est. Tax Efficiency">${e.label}</div>`;
        }
    },

    investment: (data) => `
        <td class="px-4 py-3"><i class="fas fa-bars drag-handle text-slate-600"></i></td>
        <td class="px-4 py-3"><input data-id="name" type="text" placeholder="Account" class="input-base w-full font-bold"></td>
        <td class="px-4 py-3">
            <div class="flex items-center">
                <select data-id="type" class="input-base w-full">
                    <option>Taxable</option>
                    <option>Pre-Tax (401k/IRA)</option>
                    <option>Post-Tax (Roth)</option>
                    <option>Cash</option>
                    <option>Crypto</option>
                    <option>Metals</option>
                    <option>HSA</option>
                    <option>529 Plan</option>
                </select>
                ${templates.helpers.getEfficiencyBadge(data.type || 'Taxable')}
            </div>
        </td>
        <td class="px-4 py-3"><input data-id="value" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-black"></td>
        <td class="px-4 py-3">
            <input data-id="costBasis" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-blue-400 opacity-60">
        </td>
        <td class="px-4 py-3 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    income: () => `
        <div class="bg-slate-800 rounded-[2.5rem] border border-slate-700/50 p-10 flex flex-col gap-8 relative group shadow-2xl shadow-black/40">
            <button data-action="remove" class="absolute top-8 right-8 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <i class="fas fa-times text-xl"></i>
            </button>
            
            <div class="space-y-4">
                <label class="label-std text-slate-500">Source / Employer</label>
                <input data-id="name" type="text" placeholder="Employer Name" class="bg-transparent border-none outline-none w-full text-white font-black text-4xl placeholder:text-slate-700 uppercase tracking-tighter">
                <div class="h-[1px] bg-slate-700/50 w-full"></div>
            </div>

            <div class="grid grid-cols-2 gap-10">
                <div class="space-y-3">
                    <div class="flex justify-between items-center h-4">
                        <label class="label-std text-slate-500">Amount</label>
                        <button data-action="toggle-freq" data-id="isMonthly" class="text-blue-500 hover:text-blue-400 label-std">Annual</button>
                    </div>
                    <input data-id="amount" data-type="currency" type="text" placeholder="$0" class="mono-numbers bg-transparent border-none outline-none w-full text-teal-400 font-black text-3xl h-10">
                    <div class="h-[1px] bg-slate-700/50 w-full"></div>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center h-4">
                        <label class="label-std text-slate-500">Growth %</label>
                    </div>
                    <input data-id="increase" type="number" step="0.1" placeholder="0" class="mono-numbers bg-transparent border-none outline-none w-full text-white font-black text-3xl h-10">
                    <div class="h-[1px] bg-slate-700/50 w-full"></div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-10">
                <div class="space-y-3">
                    <div class="flex justify-between items-center h-4">
                        <label class="label-std text-slate-500">Expenses</label>
                        <button data-action="toggle-freq" data-id="incomeExpensesMonthly" class="text-pink-500 hover:text-pink-400 label-std">Annual</button>
                    </div>
                    <input data-id="incomeExpenses" data-type="currency" type="text" placeholder="$0" class="mono-numbers bg-transparent border-none outline-none w-full text-pink-500 font-black text-3xl h-10">
                    <div class="h-[1px] bg-slate-700/50 w-full"></div>
                </div>
                <div class="space-y-3">
                    <div class="flex items-center h-4">
                        <label class="label-std text-slate-500">Bonus %</label>
                    </div>
                    <input data-id="bonusPct" type="number" placeholder="0" class="mono-numbers bg-transparent border-none outline-none w-full text-white font-black text-3xl h-10">
                    <div class="h-[1px] bg-slate-700/50 w-full"></div>
                </div>
            </div>

            <div class="p-8 bg-slate-900/40 rounded-[1.5rem] border border-slate-700/30">
                <div class="grid grid-cols-2 gap-10">
                    <div class="space-y-3">
                        <div class="flex items-center h-4">
                            <label class="label-std text-slate-500 flex items-center gap-1">
                                401K %
                                <i data-id="capWarning" class="fas fa-exclamation-triangle text-amber-500 hidden" title="Exceeds $23,500 limit"></i>
                            </label>
                        </div>
                        <input data-id="contribution" type="number" placeholder="0" class="mono-numbers bg-transparent border-none outline-none w-full text-white font-black text-3xl h-10">
                        <div class="h-[1px] bg-slate-700/50 w-full"></div>
                    </div>
                    <div class="space-y-3">
                        <div class="flex items-center h-4">
                            <label class="label-std text-slate-500">Match %</label>
                        </div>
                        <input data-id="match" type="number" placeholder="0" class="mono-numbers bg-transparent border-none outline-none w-full text-white font-black text-3xl h-10">
                        <div class="h-[1px] bg-slate-700/50 w-full"></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-10 items-end">
                <div class="space-y-3">
                    <div class="flex items-center h-4">
                        <label class="label-std text-slate-500">Tax Free Until (Year)</label>
                    </div>
                    <input data-id="taxFreeUntil" type="number" placeholder="0" class="mono-numbers bg-transparent border-none outline-none w-full text-white font-black text-3xl h-10">
                    <div class="h-[1px] bg-slate-700/50 w-full"></div>
                </div>
                <div class="flex flex-col gap-4 pb-2">
                    <label class="flex items-center gap-4 cursor-pointer group/check">
                        <input data-id="remainsInRetirement" type="checkbox" class="w-6 h-6 flex-shrink-0 accent-blue-500 rounded border-slate-600 bg-slate-900">
                        <span class="label-std text-slate-500 group-hover/check:text-slate-300 transition-colors leading-none">Persists in retirement?</span>
                    </label>
                    <label class="flex items-center gap-4 cursor-pointer group/check">
                        <input data-id="nonTaxable" type="checkbox" class="w-6 h-6 flex-shrink-0 accent-teal-500 rounded border-slate-600 bg-slate-900">
                        <span class="label-std text-slate-500 group-hover/check:text-slate-300 transition-colors leading-none">Non-Taxable?</span>
                    </label>
                </div>
            </div>
        </div>
    `,
    "budget-savings": (data) => `
        <td class="px-6 py-3"><input data-id="name" data-paste="spreadsheet" type="text" placeholder="Account" class="input-base w-full" ${data.isLocked ? 'readonly' : ''}></td>
        <td class="px-6 py-3"><input data-id="monthly" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-bold" ${data.isLocked ? 'readonly' : ''}></td>
        <td class="px-6 py-3"><input data-id="annual" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-black" ${data.isLocked ? 'readonly' : ''}></td>
        <td class="px-2 py-3 text-center">${data.isLocked ? '' : '<button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button>'}</td>
    `,
    "budget-expense": () => `
        <td class="px-6 py-3"><input data-id="name" data-paste="spreadsheet" type="text" placeholder="Expense (Paste from Sheets)" class="input-base w-full"></td>
        <td class="px-6 py-3 text-center"><input data-id="removedInRetirement" type="checkbox" class="w-6 h-6 flex-shrink-0 accent-pink-500 rounded border-slate-600 bg-slate-900 mx-auto"></td>
        <td class="px-6 py-3"><input data-id="monthly" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-400 font-bold"></td>
        <td class="px-6 py-3"><input data-id="annual" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500 font-black"></td>
        <td class="px-2 py-3 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    realEstate: () => `
        <td class="px-4 py-3"><input data-id="name" type="text" placeholder="Property" class="input-base w-full"></td>
        <td class="px-4 py-3"><input data-id="value" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-black"></td>
        <td class="px-4 py-3"><input data-id="mortgage" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500 font-bold"></td>
        <td class="px-4 py-3 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    otherAsset: () => `
        <td class="px-4 py-3"><input data-id="name" type="text" placeholder="Asset" class="input-base w-full"></td>
        <td class="px-4 py-3"><input data-id="value" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-black"></td>
        <td class="px-4 py-3"><input data-id="loan" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500 font-bold"></td>
        <td class="px-4 py-3 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    heloc: () => `
        <td class="px-4 py-3"><input data-id="name" type="text" placeholder="HELOC" class="input-base w-full"></td>
        <td class="px-4 py-3"><input data-id="balance" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500 font-black"></td>
        <td class="px-4 py-3"><input data-id="limit" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right font-bold"></td>
        <td class="px-4 py-3 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    debt: () => `
        <td class="px-4 py-3"><input data-id="name" type="text" placeholder="Debt" class="input-base w-full"></td>
        <td class="px-4 py-3"><input data-id="balance" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500 font-black"></td>
        <td class="px-4 py-3 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `
};
