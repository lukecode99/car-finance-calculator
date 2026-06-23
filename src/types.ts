export type FinanceType = 'pcp' | 'hp' | 'pch' | 'loan' | 'salary';
export type DepreciationPreset = 'high' | 'medium' | 'low' | 'custom';
export type TaxRate = '20' | '40' | '45';

export interface CarInputs {
  // Car
  carName: string;
  carPrice: string;
  annualMileage: string;

  // Toggles — which options to show/compare
  enablePcp: boolean;
  enableHp: boolean;
  enablePch: boolean;
  enableLoan: boolean;
  enableSalary: boolean;

  // Finance term (shared)
  termYears: string;

  // PCP
  pcpDeposit: string;
  pcpApr: string;
  balloon: string;
  pcpMileageIncluded: string;
  pcpExcessPpm: string;   // pence per excess mile
  pcpProvider: string;
  pcpProviderUrl: string;

  // HP (own deposit + APR)
  hpDeposit: string;
  hpApr: string;
  hpProvider: string;
  hpProviderUrl: string;

  // PCH / Contract Hire
  pchDeposit: string;
  pchMonthly: string;
  pchMileageIncluded: string;
  pchExcessPpm: string;
  pchProvider: string;
  pchProviderUrl: string;

  // Bank Loan
  loanAmount: string;
  loanApr: string;
  loanProvider: string;
  loanProviderUrl: string;

  // Salary Sacrifice
  ssDeposit: string;
  ssP11d: string;
  ssCo2: string;
  ssMonthly: string;
  ssInsuranceIncluded: boolean;
  ssServiceIncluded: boolean;
  ssTyresIncluded: boolean;
  ssTaxRate: TaxRate;
  ssProvider: string;
  ssProviderUrl: string;

  // Depreciation
  depreciationPreset: DepreciationPreset;
  customDepreciationY1: string;
  customDepreciationPA: string;

  // Running costs (annual)
  insurance: string;
  roadTax: string;
  maintenance: string;
  tyresPerYear: string;
  sellingCost: string;
}

export interface YearlyBreakdown {
  year: number;
  carValue: number;
  depreciation: number;
  financePayments: number;
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
  costPerMonth: number;
  yearlyBreakdown: YearlyBreakdown[];
  excessMileageCost?: number;
  bikRate?: number;
  monthlyBikTax?: number;
  monthlyNetSacrifice?: number;
  provider?: string;
  providerUrl?: string;
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
  annualMileage: '10000',

  enablePcp: true,
  enableHp: true,
  enablePch: true,
  enableLoan: false,
  enableSalary: false,

  termYears: '2',

  pcpDeposit: '3000',
  pcpApr: '6.9',
  balloon: '14000',
  pcpMileageIncluded: '10000',
  pcpExcessPpm: '7',
  pcpProvider: '',
  pcpProviderUrl: '',

  hpDeposit: '3000',
  hpApr: '6.9',
  hpProvider: '',
  hpProviderUrl: '',

  pchDeposit: '1713',
  pchMonthly: '173',
  pchMileageIncluded: '10000',
  pchExcessPpm: '10',
  pchProvider: '',
  pchProviderUrl: '',

  loanAmount: '23918',
  loanApr: '8.9',
  loanProvider: '',
  loanProviderUrl: '',

  ssDeposit: '0',
  ssP11d: '26918',
  ssCo2: '120',
  ssMonthly: '350',
  ssInsuranceIncluded: false,
  ssServiceIncluded: false,
  ssTyresIncluded: false,
  ssTaxRate: '20',
  ssProvider: '',
  ssProviderUrl: '',

  depreciationPreset: 'high',
  customDepreciationY1: '30',
  customDepreciationPA: '15',

  insurance: '800',
  roadTax: '110',
  maintenance: '500',
  tyresPerYear: '100',
  sellingCost: '1250',
};

export const DEPRECIATION_PRESETS: Record<DepreciationPreset, { y1: number; pa: number; label: string; desc: string }> = {
  high:   { y1: 32, pa: 16, label: 'High',   desc: 'German premium / luxury (Audi, BMW, Mercedes)' },
  medium: { y1: 22, pa: 12, label: 'Medium',  desc: 'Mainstream cars (Ford, Vauxhall, Kia)' },
  low:    { y1: 14, pa:  8, label: 'Low',     desc: 'Strong residuals (Toyota, VW Golf, Mini)' },
  custom: { y1:  0, pa:  0, label: 'Custom',  desc: 'Enter your own depreciation rates' },
};
