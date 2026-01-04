
export const benefits = {
    init: () => {
        const container = document.getElementById('benefits-config-container');
        if (!container) return;
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                    <label class="block">
                        <span class="text-sm font-bold text-slate-400 uppercase">Household Size</span>
                        <input type="number" data-id="hhSize" value="1" min="1" class="input-base w-full mt-1">
                    </label>
                    <label class="block">
                        <span class="text-sm font-bold text-slate-400 uppercase">Monthly Housing/Shelter Costs</span>
                        <input type="text" data-id="snapDeductions" data-type="currency" placeholder="$0" class="input-base w-full mt-1">
                    </label>
                </div>
                <div class="space-y-4 pt-4">
                    <label class="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" data-id="snapDisability" class="w-6 h-6 accent-teal-500">
                        <span class="text-sm font-bold text-slate-400 uppercase">Household has Disability?</span>
                    </label>
                </div>
            </div>
            <div class="mt-8 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                <h4 class="text-white font-bold mb-2 flex items-center gap-2"><i class="fas fa-info-circle text-blue-400"></i> Logic Details</h4>
                <p class="text-xs text-slate-400 leading-relaxed">
                    These values are used in the Burndown simulation to calculate eligibility for SNAP (Food Stamps) and Medicaid based on your projected retirement income.
                </p>
            </div>
        `;
    },
    load: (data) => {
        if (!data) return;
        const container = document.getElementById('benefits-config-container');
        container?.querySelectorAll('[data-id]').forEach(input => {
            const key = input.dataset.id;
            if (data[key] !== undefined) {
                if (input.type === 'checkbox') input.checked = data[key];
                else input.value = data[key];
            }
        });
    },
    scrape: () => {
        const res = {};
        const container = document.getElementById('benefits-config-container');
        container?.querySelectorAll('[data-id]').forEach(input => {
            const key = input.dataset.id;
            res[key] = input.type === 'checkbox' ? input.checked : (parseFloat(input.value) || 0);
        });
        return res;
    }
};
