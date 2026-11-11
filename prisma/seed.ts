import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { Pool } from "pg";

import bcrypt from "bcrypt";
import { DEFAULT_DEPARTMENTS } from "../src/departments/default-departments.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({
    connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
});

// npx prisma db seed 
// This script seeds the database with initial taxonomy data (sectors, industries, and sub-industries).

const taxonomy = [
    {
        name: "Services",
        description: "Service-based industries and activities",
        industries: [
        {
            name: "Healthcare",
            subIndustries: [
            "Hospitals",
            "Clinics",
            "Medical Centers",
            ],
        },
        {
            name: "Financial Services",
            subIndustries: [
            "Banks",
            "Insurance",
            "Finance Companies",
            ],
        },
        {
            name: "Education",
            subIndustries: [
            "Schools",
            "Universities",
            "Training Centers",
            ],
        },
        {
            name: "Hospitality & Tourism",
            subIndustries: [
            "Hotels",
            "Resorts",
            "Travel Agencies",
            ],
        },
        {
            name: "Transportation & Logistics",
            subIndustries: [
            "Airlines",
            "Shipping",
            "Public Transport",
            ],
        },
        {
            name: "Information Technology",
            subIndustries: [
            "Software Companies",
            "IT Services",
            ],
        },
        {
            name: "Telecommunications",
            subIndustries: [
            "Mobile Operators",
            "Internet Providers",
            ],
        },
        {
            name: "Professional Services",
            subIndustries: [
            "Consulting",
            "Legal",
            "Accounting",
            "Auditing",
            ],
        },
        {
            name: "Real Estate",
            subIndustries: [
            "Property Management",
            "Real Estate Brokerage",
            ],
        },
        {
            name: "Media & Entertainment",
            subIndustries: [
            "TV",
            "Cinema",
            "Digital Platforms",
            ],
        },
        {
            name: "Personal Services",
            subIndustries: [
            "Fitness Centers",
            "Salons",
            "Cleaning Services",
            ],
        },
        {
            name: "Security Services",
            subIndustries: [
            "Security Companies",
            "Surveillance Services",
            ],
        },
        ],
    },
    {
        name: "Manufacturing",
        description: "Manufacturing and industrial production activities",
        industries: [
        {
            name: "Food & Beverage",
            subIndustries: [
            "Bakery Products",
            "Dairy Products",
            "Beverages",
            "Meat Processing",
            "Canned Food",
            ],
        },
        {
            name: "Iron & Steel",
            subIndustries: [
            "Steel Products",
            "Iron Products",
            ],
        },
        {
            name: "Cement",
            subIndustries: [
            "Cement",
            "Clinker",
            ],
        },
        {
            name: "Aluminium",
            subIndustries: [
            "Aluminium Sheets",
            "Aluminium Profiles",
            ],
        },
        {
            name: "Fertilizers",
            subIndustries: [
            "Nitrogen Fertilizers",
            "Phosphate Fertilizers",
            ],
        },
        {
            name: "Hydrogen",
            subIndustries: [
            "Green Hydrogen",
            "Industrial Hydrogen",
            ],
        },
        ],
    },
];

async function seedSuperAdmin() {
    const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error(
            "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be defined in .env",
        );
    }

    // Check if the email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        if (existingUser.role !== "SUPER_ADMIN") {
            throw new Error(
                "The configured Super Admin email already belongs to another user.",
            );
        }

        console.log("Super Admin already exists. Skipping creation.");
        return;
    }

    // Hash the password before saving it
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
        data: {
            email,
            passwordHash,
            role: "SUPER_ADMIN",
            status: "ACTIVE",
            organizationId: null,
        },
    });

    console.log("Super Admin created successfully.");
}

async function seedDefaultDepartmentsForOrganizations() {
    const organizations = await prisma.organization.findMany({
        select: {
        id: true,
        legalName: true,
        },
    });

    for (const organization of organizations) {
        await prisma.department.createMany({
            data: DEFAULT_DEPARTMENTS.map((name, index) => ({
                name,
                organizationId: organization.id,
                sortOrder: index + 1,
            })),
            skipDuplicates: true,
        });

        console.log(
            `Default departments seeded for: ${organization.legalName}`,
        );
    }

    console.log('Default departments seeding completed successfully.');
}

async function main() {
    const activeSectorNames = taxonomy.map((item) => item.name);

    // 1. Upsert sectors, industries and sub-industries
    for (const [sectorIndex, sectorData] of taxonomy.entries()) {
        const sector = await prisma.sector.upsert({
        where: {
            name: sectorData.name,
        },
        update: {
            description: sectorData.description,
            isActive: true,
            sortOrder: sectorIndex + 1,
        },
        create: {
            name: sectorData.name,
            description: sectorData.description,
            isActive: true,
            sortOrder: sectorIndex + 1,
        },
        });

        const activeIndustryNames = sectorData.industries.map(
        (industry) => industry.name,
        );

        for (const [industryIndex, industryData] of
        sectorData.industries.entries()) {
        const industry = await prisma.industry.upsert({
            where: {
            sectorId_name: {
                sectorId: sector.id,
                name: industryData.name,
            },
            },
            update: {
            isActive: true,
            sortOrder: industryIndex + 1,
            },
            create: {
            name: industryData.name,
            sectorId: sector.id,
            isActive: true,
            sortOrder: industryIndex + 1,
            },
        });

        const activeSubIndustryNames = industryData.subIndustries;

        for (const [subIndustryIndex, subIndustryName] of
            industryData.subIndustries.entries()) {
            await prisma.subIndustry.upsert({
            where: {
                industryId_name: {
                industryId: industry.id,
                name: subIndustryName,
                },
            },
            update: {
                isActive: true,
                sortOrder: subIndustryIndex + 1,
            },
            create: {
                name: subIndustryName,
                industryId: industry.id,
                isActive: true,
                sortOrder: subIndustryIndex + 1,
            },
            });
        }

        // Deactivate old sub-industries not in the new taxonomy
        await prisma.subIndustry.updateMany({
            where: {
            industryId: industry.id,
            name: {
                notIn: activeSubIndustryNames,
            },
            },
            data: {
            isActive: false,
            },
        });
        }

        // Deactivate old industries under this sector
        await prisma.industry.updateMany({
        where: {
            sectorId: sector.id,
            name: {
            notIn: activeIndustryNames,
            },
        },
        data: {
            isActive: false,
        },
        });
    }

    // Deactivate sectors not in the new taxonomy
    await prisma.sector.updateMany({
        where: {
        name: {
            notIn: activeSectorNames,
        },
        },
        data: {
        isActive: false,
        },
    });

    console.log("Taxonomy seed completed successfully.");

    await seedDefaultDepartmentsForOrganizations();

    await seedSuperAdmin();

    console.log("Database seeding completed successfully.");
}

main()
    .catch((error) => {
        console.error("Error while seeding taxonomy:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });