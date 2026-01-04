
export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const math = {
    toCurrency: (value, isCompact = false) => {
        if (isNaN(value) || value === null) return '$0';
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', currency: 'USD',
            notation: isCompact ? 'compact' : 'standard',
            minimumFractionDigits: 0, maximumFractionDigits: isCompact ? 1 : 0
        }).format(value);
    },
    fromCurrency: (value) => {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        return Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
    }
};

export const assumptions = {
    defaults: { 
        currentAge: 40, retirementAge: 65, ssStartAge: 67, ssMonthly: 2500, 
        stockGrowth: 7, cryptoGrowth: 15, metalsGrowth: 4, inflation: 3, 
        filingStatus: 'Single', benefitCeiling: 1.38, helocRate: 8.5
    }
};

export const engine = {
    calculateTax: (taxableIncome, status = 'Single') => {
        const stdDed = status === 'Single' ? 15000 : 30000;
        let taxable = Math.max(0, taxableIncome - stdDed);
        let tax = 0;
        
        const brackets = status === 'Single' ? 
            [[11600, 0.10], [47150, 0.12], [100525, 0.22], [191950, 0.24]] :
            [[23200, 0.10], [94300, 0.12], [201050, 0.22], [383900, 0.24]];

        let prev = 0;
        for (const [limit, rate] of brackets) {
            const range = Math.min(taxable, limit - prev);
            tax += range * rate;
            taxable -= range;
            prev = limit;
            if (taxable <= 0) break;
        }
        if (taxable > 0) tax += taxable * 0.32;
        return tax;
    },

    calculateSummaries: (data) => {
        const inv = data.investments || [];
        const re = data.realEstate || [];
        const inc = data.income || [];
        const budget = data.budget || { savings: [], expenses: [] };

        const totalAssets = inv.reduce((s, x) => s + math.fromCurrency(x.value), 0) +
                           re.reduce((s, x) => s + math.fromCurrency(x.value), 0);
        const totalLiabilities = re.reduce((s, x) => s + math.fromCurrency(x.mortgage), 0);

        let total401kContribution = 0;
        const grossIncome = inc.reduce((s, x) => {
            let base = math.fromCurrency(x.amount);
            if (x.isMonthly) base *= 12;
            let writes = math.fromCurrency(x.writeOffs);
            if (x.writeOffsMonthly) writes *= 12;
            const bonus = base * (parseFloat(x.bonusPct) / 100 || 0);
            const personal401k = base * (parseFloat(x.contribution) / 100 || 0);
            const match401k = base * (parseFloat(x.match) / 100 || 0);
            total401kContribution += (personal401k + match401k);
            return s + base + bonus - writes;
        }, 0);

        const totalAnnualSavings = budget.savings.reduce((s, x) => s + math.fromCurrency(x.annual), 0) + total401kContribution;
        const totalAnnualBudget = budget.expenses.reduce((s, x) => s + math.fromCurrency(x.annual), 0);

        return {
            netWorth: totalAssets - totalLiabilities,
            totalAssets, totalLiabilities, grossIncome,
            total401kContribution, totalAnnualSavings, totalAnnualBudget
        };
    }
};
