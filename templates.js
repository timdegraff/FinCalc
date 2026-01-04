
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
        <td class="px-4 py-2 sticky left-0 bg-slate-800 z-10">
            <input data-id="name" type="text" placeholder="Source" class="input-base w-full">
        </td>
        <td class="px-4 py-2">
            <div class="flex flex-col gap-1">
                <input data-id="amount" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-bold">
                <button data-action="toggle-freq" data-id="isMonthly" class="text-[9px] uppercase font-bold text-slate-500 hover:text-blue-400 transition-colors text-right">Annual</button>
            </div>
        </td>
        <td class="px-4 py-2"><input data-id="increase" type="number" step="0.1" placeholder="3.0" class="input-base w-full text-right"></td>
        <td class="px-4 py-2">
            <div class="flex flex-col gap-1">
                <input data-id="writeOffs" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500">
                <button data-action="toggle-freq" data-id="writeOffsMonthly" class="text-[9px] uppercase font-bold text-slate-500 hover:text-pink-400 transition-colors text-right">Annual</button>
            </div>
        </td>
        <td class="px-4 py-2"><input data-id="bonusPct" type="number" placeholder="0" class="input-base w-full text-right"></td>
        <td class="px-4 py-2">
            <div class="flex items-center gap-1">
                <input data-id="contribution" type="number" placeholder="0" class="input-base w-full text-right">
                <i data-id="capWarning" class="fas fa-exclamation-triangle text-amber-500 hidden cursor-help" title="Exceeds IRS Limits"></i>
            </div>
        </td>
        <td class="px-4 py-2"><input data-id="match" type="number" placeholder="0" class="input-base w-full text-right"></td>
        <td class="px-4 py-2"><input data-id="taxFreeUntil" type="number" placeholder="0" class="input-base w-full text-right"></td>
        <td class="px-4 py-2 text-center"><input data-id="remainsInRetirement" type="checkbox" class="w-5 h-5 accent-blue-500"></td>
        <td class="px-4 py-2 text-center"><input data-id="nonTaxable" type="checkbox" class="w-5 h-5 accent-teal-500"></td>
        <td class="px-4 py-2 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    "budget-savings": (data) => `
        <td class="px-6 py-2"><input data-id="name" type="text" placeholder="Account" class="input-base w-full" ${data.isLocked ? 'readonly' : ''}></td>
        <td class="px-6 py-2"><input data-id="monthly" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400" ${data.isLocked ? 'readonly' : ''}></td>
        <td class="px-6 py-2"><input data-id="annual" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-bold" ${data.isLocked ? 'readonly' : ''}></td>
        <td class="px-2 py-2 text-center">${data.isLocked ? '' : '<button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button>'}</td>
    `,
    "budget-expense": () => `
        <td class="px-6 py-2"><input data-id="name" type="text" placeholder="Expense" class="input-base w-full"></td>
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
