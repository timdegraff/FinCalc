
export const templates = {
    investment: () => `
        <td class="px-4 py-2"><i class="fas fa-bars drag-handle text-slate-600"></i></td>
        <td class="px-4 py-2"><input data-id="name" type="text" placeholder="Brokerage" class="input-base w-full"></td>
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
        <td class="px-4 py-2"><input data-id="value" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400"></td>
        <td class="px-4 py-2">
            <input data-id="costBasis" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-blue-400">
        </td>
        <td class="px-4 py-2 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    realEstate: () => `
        <td class="px-4 py-2"><input data-id="name" type="text" placeholder="Home" class="input-base w-full"></td>
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
    `,
    income: () => `
        <td class="px-4 py-2"><input data-id="name" type="text" placeholder="Employer" class="input-base w-full"></td>
        <td class="px-4 py-2"><input data-id="amount" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400 font-bold"></td>
        <td class="px-4 py-2"><input data-id="bonusPct" type="number" placeholder="0" class="input-base w-full text-right"></td>
        <td class="px-4 py-2"><input data-id="contribution" type="number" placeholder="0" class="input-base w-full text-right"></td>
        <td class="px-4 py-2"><input data-id="match" type="number" placeholder="0" class="input-base w-full text-right"></td>
        <td class="px-4 py-2 text-center"><input data-id="remainsInRetirement" type="checkbox" class="w-5 h-5 accent-teal-500"></td>
        <td class="px-4 py-2 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    "budget-savings": () => `
        <td class="px-4 py-2"><input data-id="name" type="text" placeholder="Savings Goal" class="input-base w-full"></td>
        <td class="px-4 py-2"><input data-id="annual" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-teal-400"></td>
        <td class="px-4 py-2 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `,
    "budget-expense": () => `
        <td class="px-4 py-2"><input data-id="name" type="text" placeholder="Expense Category" class="input-base w-full"></td>
        <td class="px-4 py-2"><input data-id="annual" data-type="currency" type="text" placeholder="$0" class="input-base w-full text-right text-pink-500"></td>
        <td class="px-4 py-2 text-center"><button data-action="remove" class="text-slate-500 hover:text-red-400"><i class="fas fa-times"></i></button></td>
    `
};
