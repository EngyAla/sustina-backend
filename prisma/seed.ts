import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { Pool } from "pg";

import bcrypt from "bcrypt";

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
        name: "Energy & Utilities",
        description: "Energy production and utility services",
        industries: [
        {
            name: "Renewable Energy",
            subIndustries: ["Solar Power", "Wind Power"],
        },
        ],
    },
    {
        name: "Technology",
        description: "Technology and software services",
        industries: [
        {
            name: "Software",
            subIndustries: ["Enterprise Software", "Cloud Computing"],
        },
        ],
    },
    {
        name: "Manufacturing",
        description: "Industrial and manufacturing activities",
        industries: [
        {
            name: "Automotive",
            subIndustries: ["Electric Vehicles", "Auto Components"],
        },
        ],
    },
    {
        name: "Financial Services",
        description: "Financial and banking services",
        industries: [
        {
            name: "Banking",
            subIndustries: ["Commercial Banking", "Investment Banking"],
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

async function main() {
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
            sortOrder: sectorIndex + 1,
        },
    });

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
            sortOrder: industryIndex + 1,
        },
        });

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
                sortOrder: subIndustryIndex + 1,
            },
            });
        }
        }
    }
    console.log("Taxonomy seed completed successfully.");

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