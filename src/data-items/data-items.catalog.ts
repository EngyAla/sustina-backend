export interface DefaultDataItemDefinition {
    code: string;
    departmentName: string;
    name: string;
    description: string;
    category: 'ENVIRONMENTAL' | 'SOCIAL' | 'GOVERNANCE';
    unit: string;
    frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
}

export const DEFAULT_DATA_ITEMS: DefaultDataItemDefinition[] = [
    // ==========================================
    // HR (22)
    // ==========================================
    {
        code: 'HR_HUMAN_RIGHTS_INCIDENTS',
        departmentName: 'HR',
        name: 'Human Rights Incidents',
        description: 'Number of recorded incidents involving human rights violations.',
        category: 'SOCIAL',
        unit: 'Incidents',
        frequency: 'MONTHLY',
    },
    {
        code: 'HR_HUMAN_RIGHTS_TRAINING',
        departmentName: 'HR',
        name: 'Employees Trained on Human Rights',
        description: 'Number or percentage of employees who completed human rights training.',
        category: 'SOCIAL',
        unit: 'Employees / %',
        frequency: 'ANNUAL',
    },
    {
        code: 'HR_HARASSMENT_VIOLENCE',
        departmentName: 'HR',
        name: 'Harassment & Violence Incidents',
        description: 'Recorded harassment or violence incidents in the workplace.',
        category: 'SOCIAL',
        unit: 'Incidents',
        frequency: 'MONTHLY',
    },
    {
        code: 'HR_DISCRIMINATION_INCIDENTS',
        departmentName: 'HR',
        name: 'Discrimination Incidents',
        description: 'Number of recorded discrimination incidents within the organization.',
        category: 'SOCIAL',
        unit: 'Incidents',
        frequency: 'MONTHLY',
    },
    {
        code: 'HR_FORCED_LABOUR_INCIDENTS',
        departmentName: 'HR',
        name: 'Forced Labour Incidents',
        description: 'Recorded cases related to forced labour.',
        category: 'SOCIAL',
        unit: 'Incidents',
        frequency: 'ANNUAL',
    },
    {
        code: 'HR_GENDER_PAY_RATIO',
        departmentName: 'HR',
        name: 'Gender Pay Ratio',
        description: 'Pay ratio between genders according to the approved calculation methodology.',
        category: 'SOCIAL',
        unit: 'Ratio / %',
        frequency: 'ANNUAL',
    },
    {
        code: 'HR_EMPLOYEES_BY_AGE',
        departmentName: 'HR',
        name: 'Employees by Age Group',
        description: 'Distribution of employees across age groups.',
        category: 'SOCIAL',
        unit: '%',
        frequency: 'ANNUAL',
    },
    {
        code: 'HR_MATERNITY_LEAVES',
        departmentName: 'HR',
        name: 'Maternity Leaves',
        description: 'Number of maternity leaves during the reporting period.',
        category: 'SOCIAL',
        unit: 'Leaves',
        frequency: 'MONTHLY',
    },
    {
        code: 'HR_MALE_EMPLOYEES',
        departmentName: 'HR',
        name: 'Male Employees',
        description: 'Number of male employees.',
        category: 'SOCIAL',
        unit: 'Employees',
        frequency: 'MONTHLY',
    },
    {
        code: 'HR_FEMALE_EMPLOYEES',
        departmentName: 'HR',
        name: 'Female Employees',
        description: 'Number of female employees.',
        category: 'SOCIAL',
        unit: 'Employees',
        frequency: 'MONTHLY',
    },
    {
        code: 'HR_FEMALE_MANAGERS',
        departmentName: 'HR',
        name: 'Female Managers',
        description: 'Number of female managers.',
        category: 'SOCIAL',
        unit: 'Employees',
        frequency: 'ANNUAL',
    },
    {
        code: 'HR_MALE_MANAGERS',
        departmentName: 'HR',
        name: 'Male Managers',
        description: 'Number of male managers.',
        category: 'SOCIAL',
        unit: 'Employees',
        frequency: 'ANNUAL',
    },
    {
        code: 'HR_MALE_NEW_HIRES',
        departmentName: 'HR',
        name: 'Male New Hires',
        description: 'Number of newly hired male employees.',
        category: 'SOCIAL',
        unit: 'Employees',
        frequency: 'MONTHLY',
    },
    {
        code: 'HR_FEMALE_NEW_HIRES',
        departmentName: 'HR',
        name: 'Female New Hires',
        description: 'Number of newly hired female employees.',
        category: 'SOCIAL',
        unit: 'Employees',
        frequency: 'MONTHLY',
    },
    {
        code: 'HR_EMPLOYEES_WITH_DISABILITIES',
        departmentName: 'HR',
        name: 'Employees with Disabilities (%)',
        description: 'Percentage of employees with disabilities out of the total workforce.',
        category: 'SOCIAL',
        unit: '%',
        frequency: 'ANNUAL',
    },
    {
        code: 'HR_CONTRACTOR_TURNOVER',
        departmentName: 'HR',
        name: 'Contractor Turnover (%)',
        description: 'Contractor turnover rate during the reporting period.',
        category: 'SOCIAL',
        unit: '%',
        frequency: 'ANNUAL',
    },
    {
        code: 'HR_EMPLOYEE_TRAINING_HOURS',
        departmentName: 'HR',
        name: 'Employee Training Hours',
        description: 'Total training hours received by employees.',
        category: 'SOCIAL',
        unit: 'Hours',
        frequency: 'ANNUAL',
    },
    {
        code: 'HR_EMPLOYEE_SATISFACTION',
        departmentName: 'HR',
        name: 'Employee Satisfaction Rate',
        description: 'Employee satisfaction rate according to the approved measurement method.',
        category: 'SOCIAL',
        unit: '%',
        frequency: 'ANNUAL',
    },
    {
        code: 'HR_FULL_TIME_EMPLOYEES',
        departmentName: 'HR',
        name: 'Full-Time Employees',
        description: 'Number of full-time employees.',
        category: 'SOCIAL',
        unit: 'Employees',
        frequency: 'MONTHLY',
    },
    {
        code: 'HR_PART_TIME_EMPLOYEES',
        departmentName: 'HR',
        name: 'Part-Time Employees (%)',
        description: 'Percentage of part-time employees out of the total workforce.',
        category: 'SOCIAL',
        unit: '%',
        frequency: 'ANNUAL',
    },
    {
        code: 'HR_GRIEVANCES_RESOLVED_45_DAYS',
        departmentName: 'HR',
        name: 'Internal Grievances Resolved Within 45 Days',
        description: 'Percentage of internal grievances resolved within 45 days.',
        category: 'GOVERNANCE',
        unit: '%',
        frequency: 'MONTHLY',
    },
    {
        code: 'HR_INTERNAL_GRIEVANCES_RESOLVED',
        departmentName: 'HR',
        name: 'Internal Grievances Resolved',
        description: 'Number of internal grievances resolved during the reporting period.',
        category: 'GOVERNANCE',
        unit: 'Grievances',
        frequency: 'MONTHLY',
    },

    // ==========================================
    // ENGINEERING (13)
    // ==========================================
    {
        code: 'ENG_SCOPE_1_EMISSIONS',
        departmentName: 'Engineering',
        name: 'Scope 1 Emissions',
        description: 'Total direct emissions from sources owned or controlled by the organization.',
        category: 'ENVIRONMENTAL',
        unit: 'tCO2e',
        frequency: 'ANNUAL',
    },
    {
        code: 'ENG_SCOPE_2_EMISSIONS',
        departmentName: 'Engineering',
        name: 'Scope 2 Emissions',
        description: 'Indirect emissions from purchased electricity or energy.',
        category: 'ENVIRONMENTAL',
        unit: 'tCO2e',
        frequency: 'ANNUAL',
    },
    {
        code: 'ENG_SCOPE_3_EMISSIONS',
        departmentName: 'Engineering',
        name: 'Scope 3 Emissions',
        description: 'Other indirect emissions associated with the organization value chain.',
        category: 'ENVIRONMENTAL',
        unit: 'tCO2e',
        frequency: 'ANNUAL',
    },
    {
        code: 'ENG_GHG_EMISSIONS_INTENSITY',
        departmentName: 'Engineering',
        name: 'GHG Emissions Intensity',
        description: 'GHG emissions relative to a selected organizational activity unit.',
        category: 'ENVIRONMENTAL',
        unit: 'tCO2e per selected activity unit',
        frequency: 'ANNUAL',
    },
    {
        code: 'ENG_STATIONARY_DIESEL',
        departmentName: 'Engineering',
        name: 'Stationary Diesel Consumption',
        description: 'Diesel consumed by stationary equipment or generators.',
        category: 'ENVIRONMENTAL',
        unit: 'Litres',
        frequency: 'MONTHLY',
    },
    {
        code: 'ENG_MOBILE_DIESEL',
        departmentName: 'Engineering',
        name: 'Mobile Diesel Consumption',
        description: 'Diesel consumed by company mobile vehicles when collected by Engineering.',
        category: 'ENVIRONMENTAL',
        unit: 'Litres',
        frequency: 'MONTHLY',
    },
    {
        code: 'ENG_NATURAL_GAS',
        departmentName: 'Engineering',
        name: 'Natural Gas Consumption',
        description: 'Natural gas consumed at organization facilities.',
        category: 'ENVIRONMENTAL',
        unit: 'm³',
        frequency: 'MONTHLY',
    },
    {
        code: 'ENG_REFRIGERANTS',
        departmentName: 'Engineering',
        name: 'Refrigerant Consumption / Losses',
        description: 'Refrigerants used or lost from cooling and air-conditioning systems.',
        category: 'ENVIRONMENTAL',
        unit: 'kg',
        frequency: 'QUARTERLY',
    },
    {
        code: 'ENG_ELECTRICITY_CONSUMPTION',
        departmentName: 'Engineering',
        name: 'Electricity Consumption',
        description: 'Total electricity consumed at organization facilities.',
        category: 'ENVIRONMENTAL',
        unit: 'kWh',
        frequency: 'MONTHLY',
    },
    {
        code: 'ENG_ELECTRICITY_SPEND',
        departmentName: 'Engineering',
        name: 'Electricity Spend',
        description: 'Total expenditure on electricity during the reporting period.',
        category: 'ENVIRONMENTAL',
        unit: 'EGP',
        frequency: 'MONTHLY',
    },
    {
        code: 'ENG_SOLAR_ELECTRICITY',
        departmentName: 'Engineering',
        name: 'Solar Electricity',
        description: 'Electricity generated from solar energy according to the indicator definition.',
        category: 'ENVIRONMENTAL',
        unit: 'kWh',
        frequency: 'MONTHLY',
    },
    {
        code: 'ENG_WATER_CONSUMPTION',
        departmentName: 'Engineering',
        name: 'Water Consumption',
        description: 'Total water consumed at organization facilities.',
        category: 'ENVIRONMENTAL',
        unit: 'm³',
        frequency: 'MONTHLY',
    },
    {
        code: 'ENG_RECYCLED_WATER',
        departmentName: 'Engineering',
        name: 'Recycled Water',
        description: 'Volume of reused or recycled water according to the measurement methodology.',
        category: 'ENVIRONMENTAL',
        unit: 'm³',
        frequency: 'MONTHLY',
    },

    // ==========================================
    // TRANSPORTATION (2)
    // ==========================================
    {
        code: 'TRN_PETROL_MOBILE',
        departmentName: 'Transportation',
        name: 'Petrol Consumption – Mobile',
        description: 'Petrol consumed by company mobile vehicles.',
        category: 'ENVIRONMENTAL',
        unit: 'Litres',
        frequency: 'MONTHLY',
    },
    {
        code: 'TRN_MOBILE_DIESEL',
        departmentName: 'Transportation',
        name: 'Mobile Diesel Consumption',
        description: 'Diesel consumed by company mobile vehicles collected by Transportation.',
    category: 'ENVIRONMENTAL',
        unit: 'Litres',
        frequency: 'MONTHLY',
    },

    // ==========================================
    // HOUSE KEEPING (3)
    // ==========================================
    {
        code: 'HK_HAZARDOUS_WASTE',
        departmentName: 'House Keeping',
        name: 'Hazardous Waste',
        description: 'Quantity of hazardous waste generated by organization activities.',
        category: 'ENVIRONMENTAL',
        unit: 'kg',
        frequency: 'MONTHLY',
    },
    {
        code: 'HK_NON_HAZARDOUS_WASTE',
        departmentName: 'House Keeping',
        name: 'Non-Hazardous Waste',
        description: 'Quantity of non-hazardous waste generated by organization activities.',
        category: 'ENVIRONMENTAL',
        unit: 'kg',
        frequency: 'MONTHLY',
    },
    {
        code: 'HK_RECYCLED_WASTE',
        departmentName: 'House Keeping',
        name: 'Recycled Waste',
        description: 'Quantity of waste recycled during the reporting period.',
        category: 'ENVIRONMENTAL',
        unit: 'kg',
        frequency: 'MONTHLY',
    },

    // ==========================================
    // HSE (3)
    // ==========================================
    {
        code: 'HSE_WORK_RELATED_FATALITIES',
        departmentName: 'HSE',
        name: 'Work-related Fatalities',
        description: 'Number of work-related fatalities.',
        category: 'SOCIAL',
        unit: 'Fatalities',
        frequency: 'MONTHLY',
    },
    {
        code: 'HSE_WORK_RELATED_INJURIES',
        departmentName: 'HSE',
        name: 'Work-related Injuries',
        description: 'Number of work-related injuries during the reporting period.',
        category: 'SOCIAL',
        unit: 'Injuries',
        frequency: 'MONTHLY',
    },
    {
        code: 'HSE_DAYS_LOST',
        departmentName: 'HSE',
        name: 'Days Lost due to Work-related Injuries',
        description: 'Number of workdays lost due to work-related injuries.',
        category: 'SOCIAL',
        unit: 'Days',
        frequency: 'MONTHLY',
    },

    // ==========================================
    // LEGAL FUNCTION (1)
    // ==========================================
    {
        code: 'LEG_ENVIRONMENTAL_FINES',
        departmentName: 'Legal Function',
        name: 'Environmental Fines & Sanctions',
        description: 'Total monetary fines and sanctions imposed for environmental violations.',
        category: 'ENVIRONMENTAL',
        unit: 'EGP',
        frequency: 'ANNUAL',
    },

    // ==========================================
    // SUPPLY CHAIN (3)
    // ==========================================
    {
        code: 'SC_LOCAL_PRODUCTS',
        departmentName: 'Supply Chain',
        name: 'Products Procured from Local Suppliers',
        description: 'Number of products procured from local suppliers.',
        category: 'SOCIAL',
        unit: 'Products',
        frequency: 'ANNUAL',
    },
    {
        code: 'SC_LOCAL_SUPPLIERS',
        departmentName: 'Supply Chain',
        name: 'Local Suppliers',
        description: 'Number of local suppliers working with the organization.',
        category: 'SOCIAL',
        unit: 'Suppliers',
        frequency: 'ANNUAL',
    },
    {
        code: 'SC_SUPPLIER_CODE_CONDUCT',
        departmentName: 'Supply Chain',
        name: 'Suppliers Signed Supplier Code of Conduct',
        description: 'Percentage of suppliers who signed the supplier code of conduct.',
        category: 'GOVERNANCE',
        unit: '%',
        frequency: 'ANNUAL',
    },

    // ==========================================
    // GUEST RELATIONS (1)
    // ==========================================
    {
        code: 'GR_PATIENT_SATISFACTION',
        departmentName: 'Guest Relations',
        name: 'Patient Satisfaction Rate',
        description: 'Patient satisfaction rate measured through surveys or the approved methodology.',
        category: 'SOCIAL',
        unit: '%',
        frequency: 'MONTHLY',
    },

    // ==========================================
    // HR / COMPLIANCE (1) -> Compliance
    // ==========================================
    {
        code: 'CMP_ANTI_CORRUPTION_TRAINING',
        departmentName: 'Compliance',
        name: 'Employees Trained on Anti-Corruption',
        description: 'Number or percentage of employees who completed anti-corruption and bribery training.',
    category: 'GOVERNANCE',
        unit: 'Employees / %',
        frequency: 'ANNUAL',
    },

    // ==========================================
    // INTERNAL AUDIT / LEGAL (1) -> Internal Audit
    // ==========================================
    {
        code: 'IA_CONFIRMED_CORRUPTION',
        departmentName: 'Internal Audit',
        name: 'Confirmed Internal Corruption/Bribery Cases',
        description: 'Number of confirmed internal corruption or bribery cases.',
        category: 'GOVERNANCE',
        unit: 'Cases',
        frequency: 'ANNUAL',
    },

    // ==========================================
    // LEGAL / COMPLIANCE (1) -> Compliance
    // ==========================================
    {
        code: 'CMP_REFERRED_CORRUPTION',
        departmentName: 'Compliance',
        name: 'Corruption/Bribery Cases Referred/Prosecuted',
        description: 'Number of corruption or bribery cases referred to authorities or legally prosecuted.',
        category: 'GOVERNANCE',
        unit: 'Cases',
        frequency: 'ANNUAL',
    },

    // ==========================================
    // IT (1)
    // ==========================================
    {
        code: 'IT_CYBERSECURITY_INCIDENTS',
        departmentName: 'IT',
        name: 'Cybersecurity Incidents',
        description: 'Number of recorded cybersecurity incidents.',
        category: 'GOVERNANCE',
        unit: 'Incidents',
        frequency: 'ANNUAL',
    },

    // ==========================================
    // LEGAL / HSE (1) -> Legal Function
    // ==========================================
    {
        code: 'LEG_VALID_FACILITY_LICENSES',
        departmentName: 'Legal Function',
        name: 'Valid Facility Licences (%)',
        description: 'Percentage of valid facility licences compared to all required licences.',
        category: 'GOVERNANCE',
        unit: '%',
        frequency: 'QUARTERLY',
    },
];
