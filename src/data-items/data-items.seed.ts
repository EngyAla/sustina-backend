import { DEFAULT_DEPARTMENTS } from '../departments/default-departments.js';
import { DEFAULT_DATA_ITEMS } from './data-items.catalog.js';

export async function seedDataItemsForOrganization(
    tx: any,
    organizationId: string,
) {
    // Ensure the default departments exist first.
    await tx.department.createMany({
        data: DEFAULT_DEPARTMENTS.map((name, index) => ({
            name,
            organizationId,
            sortOrder: index + 1,
        })),
        skipDuplicates: true,
    });

    const departments = await tx.department.findMany({
        where: {
            organizationId,
        },
        select: {
            id: true,
            name: true,
        },
    });

    const departmentMap = new Map<string, string>(
        departments.map((department: { id: string; name: string }) => [
            department.name,
            department.id,
        ]),
    );

    // Validate department mappings before writing any KPIs.
    const missingDepartments = [
        ...new Set(
            DEFAULT_DATA_ITEMS
                .filter((item) => !departmentMap.has(item.departmentName))
                .map((item) => item.departmentName),
        ),
    ];

    if (missingDepartments.length > 0) {
        throw new Error(
            `Missing departments for KPI seed: ${missingDepartments.join(', ')}`,
        );
    }

    for (const [index, item] of DEFAULT_DATA_ITEMS.entries()) {
        const departmentId = departmentMap.get(item.departmentName);

        if (!departmentId) {
            throw new Error(
                `Department not found: ${item.departmentName}`,
            );
        }

        await tx.dataItem.upsert({
            where: {
                organizationId_code: {
                    organizationId,
                    code: item.code,
                },
            },
            update: {
                name: item.name,
                description: item.description,
                category: item.category,
                unit: item.unit,
                frequency: item.frequency,
                departmentId,
                sortOrder: index + 1,
            },
            create: {
                organizationId,
                departmentId,
                code: item.code,
                name: item.name,
                description: item.description,
                category: item.category,
                unit: item.unit,
                frequency: item.frequency,
                sortOrder: index + 1,
            },
        });
    }

    return {
        total: DEFAULT_DATA_ITEMS.length,
    };
}
