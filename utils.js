
export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export const math = {
    toCurrency: (value, isCompact = false) => {
        if (isNaN(value) || value === null) return '$0';
        return new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'USD',
            notation: isCompact ? 'compact' : 'standard',
            minimumFractionDigits: 0,
            maximumFractionDigits: isCompact ? 1 : 0
        }).format(value);
    },
    fromCurrency: (value) => {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        return Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
    },
    calculateProgressiveTax: (income) => {
        // 2024 simplified federal brackets for estimation
        const brackets = [
            { rate: 0.10, min: 0, max: 11600 },
            { rate: 0.12, min: 11600, max: 47150 },
            { rate: 0.22, min: 47150, max: 100525 },
            { rate: 0.24, min: 100525, max: 191950 },
            { rate: 0.32, min: 191950, max: 243725 },
            { rate: 0.35, min: 243725, max: 609350 },
            { rate: 0.37, min: 609350, max: Infinity }
        ];
        let tax = 0;
        for (const b of brackets) {
            if (income > b.min) {
                tax += (Math.min(income, b.max) - b.min) * b.rate;
            } else break;
        }
        return tax;
    }
};

export const assetClassColors = {
    'Taxable': '#34d399',
    'Pre-Tax (401k/IRA)': '#60a5fa',
    'Post-Tax (Roth)': '#fbbf24',
    'HSA': '#2dd4bf',
    '529 Plan': '#a78bfa',
    'Cash': '#f472b6',
    'Crypto': '#f97316',
    'Metals': '#eab308',
    'Real Estate': '#ef4444'
};

export const assumptions = {
    defaults: {
        currentAge: 40,
        retirementAge: 65,
        ssStartAge: 67,
        ssMonthly: 2500,
        stockGrowth: 7,
        cryptoGrowth: 10,
        metalsGrowth: 2,
        inflation: 3,
        housingGrowth: 3,
        salaryGrowth: 3
    }
};

export const engine = {
    calculateSummaries: (data) => {
        const inv = data.investments || [];
        const re = data.realEstate || [];
        const oa = data.otherAssets || [];
        const inc = data.income || [];
        const budget = data.budget || { savings: [], expenses: [] };

        const totalAssets = inv.reduce((s, x) => s + math.fromCurrency(x.value), 0) +
                           re.reduce((s, x) => s + math.fromCurrency(x.value), 0) +
                           oa.reduce((s, x) => s + math.fromCurrency(x.value), 0);

        const totalLiabilities = (data.debts?.reduce((s, x) => s + math.fromCurrency(x.balance), 0) || 0) +
                                (data.helocs?.reduce((s, x) => s + math.fromCurrency(x.balance), 0) || 0) +
                                re.reduce((s, x) => s + math.fromCurrency(x.mortgage), 0) +
                                oa.reduce((s, x) => s + math.fromCurrency(x.loan), 0);

        const grossIncome = inc.reduce((s, x) => {
            const b = math.fromCurrency(x.amount);
            return s + b + (b * (parseFloat(x.bonusPct) / 100 || 0));
        }, 0);

        const total401kContribution = inc.reduce((s, x) => {
            const b = math.fromCurrency(x.amount);
            const total = b + (b * (parseFloat(x.bonusPct) / 100 || 0));
            const base = x.contribIncBonus ? total : b;
            const matchBase = x.matchIncBonus ? total : b;
            return s + (base * (parseFloat(x.contribution) / 100 || 0)) + (matchBase * (parseFloat(x.match) / 100 || 0));
        }, 0);

        const totalAnnualSavings = budget.savings.reduce((s, x) => s + math.fromCurrency(x.annual), 0) + total401kContribution;
        const totalAnnualBudget = budget.expenses.reduce((s, x) => s + math.fromCurrency(x.annual), 0);

        return {
            netWorth: totalAssets - totalLiabilities,
            totalAssets,
            totalLiabilities,
            grossIncome,
            total401kContribution,
            totalAnnualSavings,
            totalAnnualBudget
        };
    }
};
