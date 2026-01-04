
import { math } from './utils.js';

export const templates = {
    investment: () => `
        <td class="px-4 py-2"><i class="fas fa-bars drag-handle text-slate-600"></i></td>
        <td class="px-4 py-2"><input data-id="name" type="text" placeholder="Account" class="input-base w-full"></td>
        <td class="px-4 py-2">
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
        </td>
        <td class="px-4 py-2"><input data-id="value" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-bold"></td>
        <td class="px-4 py-2">
            <input data-id="costBasis" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-blue-400">
        </td>
        <td class="px-4 py-2 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    income: () => `
        <div class="bg-slate-800 rounded-[2rem] border border-slate-700/50 p-8 flex flex-col gap-6 relative group shadow-2xl shadow-black/40">
            <button data-action="remove" class="absolute top-6 right-6 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <i class="fas fa-times text-lg"></i>
            </button>
            
            <div class="space-y-3">
                <label class="text-[10px] uppercase font-black text-slate-500 tracking-widest">Source / Employer</label>
                <input data-id="name" type="text" placeholder="Employer Name" class="bg-transparent border-none outline-none w-full text-white font-black text-3xl placeholder:text-slate-700">
                <div class="h-[1px] bg-slate-700/50 w-full"></div>
            </div>

            <div class="grid grid-cols-2 gap-8">
                <div class="space-y-2">
                    <label class="text-[10px] uppercase font-black text-slate-500 tracking-widest flex justify-between">
                        Amount
                        <button data-action="toggle-freq" data-id="isMonthly" class="text-blue-500 hover:text-blue-400 font-black">Annual</button>
                    </label>
                    <input data-id="amount" data-type="currency" type="text" placeholder="$0" class="bg-transparent border-none outline-none w-full text-teal-400 font-black text-2xl">
                    <div class="h-[1px] bg-slate-700/50 w-full"></div>
                </div>
                <div class="space-y-2">
                    <label class="text-[10px] uppercase font-black text-slate-500 tracking-widest">Growth %</label>
                    <input data-id="increase" type="number" step="0.1" placeholder="0" class="bg-transparent border-none outline-none w-full text-white font-bold text-2xl">
                    <div class="h-[1px] bg-slate-700/50 w-full"></div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-8">
                <div class="space-y-2">
                    <label class="text-[10px] uppercase font-black text-slate-500 tracking-widest flex justify-between">
                        Write-offs
                        <button data-action="toggle-freq" data-id="writeOffsMonthly" class="text-pink-500 hover:text-pink-400 font-black">Annual</button>
                    </label>
                    <input data-id="writeOffs" data-type="currency" type="text" placeholder="$0" class="bg-transparent border-none outline-none w-full text-pink-500 font-black text-2xl">
                    <div class="h-[1px] bg-slate-700/50 w-full"></div>
                </div>
                <div class="space-y-2">
                    <label class="text-[10px] uppercase font-black text-slate-500 tracking-widest">Bonus %</label>
                    <input data-id="bonusPct" type="number" placeholder="0" class="bg-transparent border-none outline-none w-full text-white font-bold text-2xl">
                    <div class="h-[1px] bg-slate-700/50 w-full"></div>
                </div>
            </div>

            <div class="p-6 bg-slate-900/40 rounded-2xl border border-slate-700/30 space-y-6">
                <div class="grid grid-cols-2 gap-8">
                    <div class="space-y-2">
                        <label class="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-1">
                            Personal 401k %
                            <i data-id="capWarning" class="fas fa-exclamation-triangle text-amber-500 hidden" title="Exceeds $23,500 limit"></i>
                        </label>
                        <input data-id="contribution" type="number" placeholder="0" class="bg-transparent border-none outline-none w-full text-white font-bold text-2xl">
                        <div class="h-[1px] bg-slate-700/50 w-full"></div>
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] uppercase font-black text-slate-500 tracking-widest">Match %</label>
                        <input data-id="match" type="number" placeholder="0" class="bg-transparent border-none outline-none w-full text-white font-bold text-2xl">
                        <div class="h-[1px] bg-slate-700/50 w-full"></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-8 items-end">
                <div class="space-y-2">
                    <label class="text-[10px] uppercase font-black text-slate-500 tracking-widest">Tax Free Until (Year)</label>
                    <input data-id="taxFreeUntil" type="number" placeholder="0" class="bg-transparent border-none outline-none w-full text-white font-bold text-2xl">
                    <div class="h-[1px] bg-slate-700/50 w-full"></div>
                </div>
                <div class="flex flex-col gap-3 pb-1">
                    <label class="flex items-center gap-3 cursor-pointer group/check">
                        <input data-id="remainsInRetirement" type="checkbox" class="w-5 h-5 accent-blue-500 rounded border-slate-600 bg-slate-900">
                        <span class="text-[10px] uppercase font-black text-slate-500 group-hover/check:text-slate-300 transition-colors tracking-widest">Persists in retirement?</span>
                    </label>
                    <label class="flex items-center gap-3 cursor-pointer group/check">
                        <input data-id="nonTaxable" type="checkbox" class="w-5 h-5 accent-teal-500 rounded border-slate-600 bg-slate-900">
                        <span class="text-[10px] uppercase font-black text-slate-500 group-hover/check:text-slate-300 transition-colors tracking-widest">Non-Taxable?</span>
                    </label>
                </div>
            </div>
        </div>
    `,
    "budget-savings": (data) => `
        <td class="px-6 py-2"><input data-id="name" type="text" placeholder="Account" class="input-base w-full" ${data.isLocked ? 'readonly' : ''}></td>
        <td class="px-6 py-2"><input data-id="monthly" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400" ${data.isLocked ? 'readonly' : ''}></td>
        <td class="px-6 py-2"><input data-id="annual" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-bold" ${data.isLocked ? 'readonly' : ''}></td>
        <td class="px-2 py-2 text-center">${data.isLocked ? '' : '<button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button>'}</td>
    `,
    "budget-expense": () => `
        <td class="px-6 py-2"><input data-id="name" data-paste="spreadsheet" type="text" placeholder="Expense (Paste from Sheets)" class="input-base w-full"></td>
        <td class="px-6 py-2"><input data-id="monthly" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-400"></td>
        <td class="px-6 py-2"><input data-id="annual" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500 font-bold"></td>
        <td class="px-2 py-2 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    realEstate: () => `
        <td class="px-4 py-2"><input data-id="name" type="text" placeholder="Property" class="input-base w-full"></td>
        <td class="px-4 py-2"><input data-id="value" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400"></td>
        <td class="px-4 py-2"><input data-id="mortgage" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500"></td>
        <td class="px-4 py-2 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    otherAsset: () => `
        <td class="px-4 py-2"><input data-id="name" type="text" placeholder="Asset" class="input-base w-full"></td>
        <td class="px-4 py-2"><input data-id="value" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400"></td>
        <td class="px-4 py-2"><input data-id="loan" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500"></td>
        <td class="px-4 py-2 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    heloc: () => `
        <td class="px-4 py-2"><input data-id="name" type="text" placeholder="HELOC" class="input-base w-full"></td>
        <td class="px-4 py-2"><input data-id="balance" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500"></td>
        <td class="px-4 py-2"><input data-id="limit" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right"></td>
        <td class="px-4 py-2 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    debt: () => `
        <td class="px-4 py-2"><input data-id="name" type="text" placeholder="Debt" class="input-base w-full"></td>
        <td class="px-4 py-2"><input data-id="balance" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500"></td>
        <td class="px-4 py-2 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `
};
