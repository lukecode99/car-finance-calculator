export type FinanceType = 'pcp' | 'hp' | 'pch';
export type DepreciationPreset = 'high' | 'medium' | 'low' | 'custom';

export interface CarInputs {
  // Car
  carName: string;
  carPrice: string;

  // Finance type
  financeType: FinanceType;
  termYears: string;          // 1–5

  // PCP / HP shared
  deposit: string;
  apr: string;                // annual %
  // PCP only
  balloon: string;            // guaranteed future value
  // PCH only
  pchDeposit: string;         // initial rental (months equivalent)
  pchMonthly: string;         // monthly inc VAT

  // Depreciation
  depreciationPreset: DepreciationPreset;
  customDepreciationY1: string;   // % year 1
  customDepreciationPA: string;   // % per year after

  // Running costs (annual)
  annualMileage: string;
  insurance: string;
  roadTax: string;
  maintenance: string;
  tyresPerYear: string;       // £ per year
  sellingCost: string;        // broker/dealer commission to sell at end (PCP/HP only)
}

export interface YearlyBreakdown {
  year: number;
  carValue: number;
  depreciation: number;
  financePayments: number;    // capital + interest portion
  runningCosts: number;
  totalCost: number;
  cumulativeTotal: number;
}

export interface FinanceResult {
  type: FinanceType;
  label: string;
  color: string;
  monthlyPayment: number;
  totalFinanceCost: number;
  totalRunningCosts: number;
  totalDepreciation: number;
  sellingCost: number;
  grandTotal: number;
  costPerMile: number;
  costPerMonth: number;       // all-in
  yearlyBreakdown: YearlyBreakdown[];
}

export interface SavedComparison {
  id: string;
  savedAt: string;
  carName: string;
  carPrice: number;
  termYears: number;
  results: FinanceResult[];
}

export const DEFAULT_INPUTS: CarInputs = {
  carName: '',
  carPrice: '26918',
  financeType: 'pcp',
  termYears: '2',
  deposit: '3000',
  apr: '6.9',
  balloon: '14000',
  pchDeposit: '1713',
  pchMonthly: '173',
  depreciationPreset: 'high',
  customDepreciationY1: '30',
  customDepreciationPA: '15',
  annualMileage: '10000',
  insurance: '800',
  roadTax: '110',
  maintenance: '500',
  tyresPerYear: '100',
  sellingCost: '1250',
};

// UK average depreciation presets
export const DEPRECIATION_PRESETS: Record<DepreciationPreset, { y1: number; pa: number; label: string; desc: string }> = {
  high:   { y1: 32, pa: 16, label: 'High',   desc: 'German premium / luxury (Audi, BMW, Mercedes)' },
  medium: { y1: 22, pa: 12, label: 'Medium',  desc: 'Mainstream cars (Ford, Vauxhall, Kia)' },
  low:    { y1: 14, pa:  8, label: 'Low',     desc: 'Strong residuals (Toyota, VW Golf, Mini)' },
  custom: { y1:  0, pa:  0, label: 'Custom',  desc: 'Enter your own depreciation rates' },
};
