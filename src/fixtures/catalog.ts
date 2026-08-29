import type { Application } from "../types";
import { emptyGrowth, growthRow, makeApplication } from "./factory";

export interface FixtureMeta {
  id: string;
  file: string;
  role: string;
  expectedChecks: string[];
  demoCloser?: boolean;
}

export const MANIFEST: FixtureMeta[] = [
  {
    id: "01-alem-leather",
    file: "01-alem-leather.json",
    role: "Clean, strong applicant, no findings",
    expectedChecks: [],
  },
  {
    id: "02-newbloom-cafe",
    file: "02-newbloom-cafe.json",
    role: "Fails AGE_OVER_2Y",
    expectedChecks: ["AGE_OVER_2Y"],
  },
  {
    id: "03-awash-textile-sc",
    file: "03-awash-textile-sc.json",
    role: "Share Company → eligibility unestablished",
    expectedChecks: ["PRIVATELY_OWNED"],
  },
  {
    id: "04-misrak-foods",
    file: "04-misrak-foods.json",
    role: "OWNERSHIP_SUM violation",
    expectedChecks: ["OWNERSHIP_SUM"],
  },
  {
    id: "05-abyssinia-metal",
    file: "05-abyssinia-metal.json",
    role: "YEARS_VS_HISTORY — demo closer",
    expectedChecks: ["YEARS_VS_HISTORY"],
    demoCloser: true,
  },
  {
    id: "06-rift-soaps",
    file: "06-rift-soaps.json",
    role: "UNIQUENESS_UNSUPPORTED",
    expectedChecks: ["UNIQUENESS_UNSUPPORTED"],
  },
  {
    id: "07-hilcoe-print",
    file: "07-hilcoe-print.json",
    role: "JOBS_NARRATIVE_VS_TABLE mismatch",
    expectedChecks: ["JOBS_NARRATIVE_VS_TABLE"],
  },
  {
    id: "08-kality-furniture",
    file: "08-kality-furniture.json",
    role: "EQUIPMENT_OVER_CAP",
    expectedChecks: ["EQUIPMENT_OVER_CAP"],
  },
  {
    id: "09-dire-garments",
    file: "09-dire-garments.json",
    role: "FEMALE_GT_TOTAL",
    expectedChecks: ["FEMALE_GT_TOTAL"],
  },
  {
    id: "10-sheger-honey",
    file: "10-sheger-honey.json",
    role: "PRIORITY_AREAS_COUNT + ORGANOGRAM_MISSING",
    expectedChecks: ["PRIORITY_AREAS_COUNT", "ORGANOGRAM_MISSING"],
  },
  {
    id: "11-sparse-workshop",
    file: "11-sparse-workshop.json",
    role: "Sparse application → several criteria unestablished",
    expectedChecks: ["REQUIRED_FIELD_MISSING"],
  },
  {
    id: "12-harar-coffee",
    file: "12-harar-coffee.json",
    role: "SALES_JUMP flag, otherwise sound",
    expectedChecks: ["SALES_JUMP"],
  },
];

export function buildApplications(): Application[] {
  return [
    makeApplication({
      id: "01-alem-leather",
      companyName: "Alem Leather Works PLC",
      email: "hanna@alemleather.et",
    }),

    makeApplication({
      id: "02-newbloom-cafe",
      companyName: "NewBloom Cafe",
      businessOrgForm: "sole_proprietorship",
      yearsInOperation: 1,
      businessType: "Hospitality",
      ownershipWomenPct: 100,
      ownershipMenPct: 0,
      growth: {
        "2022": growthRow(null, null, null, null),
        "2023": growthRow(null, null, null, null),
        "2024": growthRow(1_200_000, 6, 4, 2),
        "2025_proj": growthRow(2_000_000, 9, 6, 3),
        "2026_proj": growthRow(2_800_000, 15, 10, 5),
      },
      uniqueness: "no_unique_features",
      uniqueFeatures: null,
      localRawMaterialPct: 40,
      keyRawMaterials: "Ethiopian coffee, local dairy",
      jobCreationNarrative:
        "We will create 6 new jobs in the next 15 months: baristas and one supervisor.",
      jobPositions: [
        { position: "Baristas", newJobs: 4 },
        { position: "Supervisor", newJobs: 1 },
        { position: "Kitchen assistant", newJobs: 1 },
      ],
    }),

    makeApplication({
      id: "03-awash-textile-sc",
      companyName: "Awash Textile Share Company",
      businessOrgForm: "share_company",
      businessType: "Textile",
      yearsInOperation: 12,
      uniqueness: "no_unique_features",
      uniqueFeatures: null,
    }),

    makeApplication({
      id: "04-misrak-foods",
      companyName: "Misrak Foods PLC",
      businessType: "Agro-processing",
      ownershipWomenPct: 40,
      ownershipMenPct: 40,
    }),

    makeApplication({
      id: "05-abyssinia-metal",
      companyName: "Abyssinia Metalworks PLC",
      businessRegistrationNumber: "ET-AA-441902",
      businessLicenseNumber: "BL-03-1188",
      yearsInOperation: 3,
      businessType: "Metal fabrication",
      ownershipWomenPct: 30,
      ownershipMenPct: 70,
      companyOverview:
        "Fabricates agricultural implements for Oromia cooperatives. Claims three years of operation after a 2023 licence, while the growth table still carries 2022 turnover from the prior licence era.",
      growth: {
        "2022": growthRow(12_400_000, 28, 6, 5),
        "2023": growthRow(14_100_000, 34, 8, 7),
        "2024": growthRow(16_800_000, 41, 11, 9),
        "2025_proj": growthRow(19_500_000, 50, 14, 12),
        "2026_proj": growthRow(23_000_000, 71, 20, 17),
      },
      uniqueness: "not_new_but_unique_features",
      uniqueFeatures:
        "Modular plough heads that swap without replacing the full frame, designed for highland soils.",
      localRawMaterialPct: 55,
      keyRawMaterials: "Local scrap steel, imported cutting blades",
      problemsToAddress:
        "CNC capacity bottleneck and inconsistent weld quality on export orders.",
      equipmentRequests: [
        {
          description: "CNC plasma cutter",
          quantity: 1,
          estimatedTotalPriceEtb: 1_450_000,
          purpose: "Repeatable parts for plough heads",
        },
      ],
      expectedResults: ["production_capacity", "quality", "new_markets"],
      jobCreationNarrative:
        "We will create 21 new jobs in the next 15 months across CNC, welding, and field service.",
      jobPositions: [
        { position: "CNC operators", newJobs: 6 },
        { position: "Welders", newJobs: 8 },
        { position: "Quality inspectors", newJobs: 3 },
        { position: "Field service technicians", newJobs: 4 },
      ],
    }),

    makeApplication({
      id: "06-rift-soaps",
      companyName: "Rift Valley Soaps PLC",
      businessType: "Consumer goods",
      uniqueness: "not_new_but_unique_features",
      uniqueFeatures: null,
    }),

    makeApplication({
      id: "07-hilcoe-print",
      companyName: "Hilcoe Print House PLC",
      businessType: "Printing services",
      jobCreationNarrative:
        "We will create 40 new jobs in the next 15 months as the new press comes online.",
      jobPositions: [
        { position: "Press operators", newJobs: 6 },
        { position: "Bindery staff", newJobs: 4 },
        { position: "Sales", newJobs: 2 },
      ],
      growth: {
        "2022": growthRow(4_800_000, 18, 7, 4),
        "2023": growthRow(6_200_000, 24, 10, 6),
        "2024": growthRow(8_100_000, 31, 13, 8),
        "2025_proj": growthRow(10_400_000, 40, 17, 11),
        "2026_proj": growthRow(13_000_000, 52, 22, 14),
      },
    }),

    makeApplication({
      id: "08-kality-furniture",
      companyName: "Kality Furniture PLC",
      businessType: "Wood furniture",
      equipmentRequests: [
        {
          description: "CNC wood router",
          quantity: 1,
          estimatedTotalPriceEtb: 2_200_000,
          purpose: "Panel cutting",
        },
        {
          description: "Edge banding machine",
          quantity: 1,
          estimatedTotalPriceEtb: 1_100_000,
          purpose: "Finishing",
        },
        {
          description: "Dust extraction system",
          quantity: 1,
          estimatedTotalPriceEtb: 480_000,
          purpose: "OSH",
        },
      ],
    }),

    makeApplication({
      id: "09-dire-garments",
      companyName: "Dire Garments PLC",
      businessType: "Garment manufacturing",
      cityRegion: "Dire Dawa",
      address: "Kebele 05, Dire Dawa",
      growth: {
        "2022": growthRow(3_100_000, 22, 14, 6),
        "2023": growthRow(3_800_000, 26, 16, 7),
        "2024": growthRow(4_600_000, 20, 25, 8),
        "2025_proj": growthRow(5_500_000, 28, 18, 9),
        "2026_proj": growthRow(6_400_000, 49, 26, 14),
      },
    }),

    makeApplication({
      id: "10-sheger-honey",
      companyName: "Sheger Honey PLC",
      businessType: "Agro-processing",
      organogramFile: null,
      expectedResults: ["new_markets", "quality"],
      priorityAreasExplanation:
        "We want better packaging and a second market in Djibouti.",
    }),

    makeApplication({
      id: "11-sparse-workshop",
      companyName: "Sparse Workshop",
      businessRegistrationNumber: null,
      businessLicenseNumber: null,
      address: null,
      cityRegion: "Hawassa",
      mobileNumber: null,
      email: null,
      businessOrgForm: "other",
      yearsInOperation: 5,
      businessType: "Metal",
      ownershipWomenPct: null,
      ownershipMenPct: null,
      companyOverview: null,
      growth: emptyGrowth(),
      motivation: null,
      businessGoals: null,
      marketOverview: null,
      products: [],
      uniqueness: null,
      uniqueFeatures: null,
      localRawMaterialPct: null,
      keyRawMaterials: null,
      managementTeam: [],
      organogramFile: null,
      problemsToAddress: null,
      equipmentRequests: [],
      consultantRequests: [],
      expectedResults: [],
      priorityAreasExplanation: null,
      jobCreationNarrative: null,
      jobPositions: [],
      socialEnvironmentalImpact: null,
      oshCommitment: null,
    }),

    makeApplication({
      id: "12-harar-coffee",
      companyName: "Harar Highland Coffee PLC",
      businessType: "Coffee processing",
      cityRegion: "Harar",
      address: "Jegol, Harar",
      growth: {
        "2022": growthRow(2_200_000, 12, 5, 3),
        "2023": growthRow(2_600_000, 14, 6, 4),
        "2024": growthRow(9_800_000, 18, 8, 5),
        "2025_proj": growthRow(11_000_000, 22, 10, 6),
        "2026_proj": growthRow(12_500_000, 43, 18, 12),
      },
    }),
  ];
}
