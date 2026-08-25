import { getConfig } from "@/config";
import { createDatabase, type AppDatabase } from "./client";
import { labTests, orders, orderTests, patients } from "./schema";

const NOW = "2025-01-15T14:00:00.000Z";

const patientRows = [
  {
    id: "patient-ada",
    firstName: "Ada",
    lastName: "Rivera",
    dateOfBirth: "1988-04-12",
    email: "ada.rivera@example.test",
    phone: "555-0101",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "patient-marcus",
    firstName: "Marcus",
    lastName: "Chen",
    dateOfBirth: "1975-09-23",
    email: "marcus.chen@example.test",
    phone: "555-0102",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "patient-nina",
    firstName: "Nina",
    lastName: "Patel",
    dateOfBirth: "1994-01-08",
    email: "nina.patel@example.test",
    phone: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "patient-theo",
    firstName: "Theo",
    lastName: "Brooks",
    dateOfBirth: "2001-11-30",
    email: null,
    phone: "555-0104",
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const testRows = [
  {
    id: "test-cbc",
    code: "CBC",
    name: "Complete Blood Count",
    priceCents: 3000,
    turnaroundHours: 12,
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "test-cmp",
    code: "CMP",
    name: "Comprehensive Metabolic Panel",
    priceCents: 4500,
    turnaroundHours: 24,
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "test-lipid",
    code: "LIPID",
    name: "Lipid Panel",
    priceCents: 3800,
    turnaroundHours: 24,
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "test-vitd",
    code: "VITD",
    name: "Vitamin D, 25-Hydroxy",
    priceCents: 6200,
    turnaroundHours: 48,
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "test-a1c",
    code: "A1C",
    name: "Hemoglobin A1c",
    priceCents: 2700,
    turnaroundHours: 18,
    active: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "test-tsh",
    code: "TSH",
    name: "Thyroid Stimulating Hormone",
    priceCents: 4100,
    turnaroundHours: 36,
    active: false,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const orderRows = [
  {
    id: "order-001",
    patientId: "patient-ada",
    status: "pending" as const,
    orderedAt: "2025-01-10T09:00:00.000Z",
    totalCents: 7500,
    estimatedReadyAt: "2025-01-11T09:00:00.000Z",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "order-002",
    patientId: "patient-marcus",
    status: "in_progress" as const,
    orderedAt: "2025-01-11T10:30:00.000Z",
    totalCents: 10000,
    estimatedReadyAt: "2025-01-13T10:30:00.000Z",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "order-003",
    patientId: "patient-nina",
    status: "completed" as const,
    orderedAt: "2025-01-08T08:00:00.000Z",
    totalCents: 2700,
    estimatedReadyAt: "2025-01-09T02:00:00.000Z",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "order-004",
    patientId: "patient-theo",
    status: "cancelled" as const,
    orderedAt: "2025-01-09T13:00:00.000Z",
    totalCents: 4100,
    estimatedReadyAt: "2025-01-11T01:00:00.000Z",
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const orderTestRows = [
  {
    orderId: "order-001",
    labTestId: "test-cbc",
    testCode: "CBC",
    testName: "Complete Blood Count",
    priceCents: 3000,
    turnaroundHours: 12,
  },
  {
    orderId: "order-001",
    labTestId: "test-cmp",
    testCode: "CMP",
    testName: "Comprehensive Metabolic Panel",
    priceCents: 4500,
    turnaroundHours: 24,
  },
  {
    orderId: "order-002",
    labTestId: "test-lipid",
    testCode: "LIPID",
    testName: "Lipid Panel",
    priceCents: 3800,
    turnaroundHours: 24,
  },
  {
    orderId: "order-002",
    labTestId: "test-vitd",
    testCode: "VITD",
    testName: "Vitamin D, 25-Hydroxy",
    priceCents: 6200,
    turnaroundHours: 48,
  },
  {
    orderId: "order-003",
    labTestId: "test-a1c",
    testCode: "A1C",
    testName: "Hemoglobin A1c",
    priceCents: 2700,
    turnaroundHours: 18,
  },
  {
    orderId: "order-004",
    labTestId: "test-tsh",
    testCode: "TSH",
    testName: "Thyroid Stimulating Hormone",
    priceCents: 4100,
    turnaroundHours: 36,
  },
];

export async function seedDatabase(db: AppDatabase) {
  await db.transaction(async (transaction) => {
    await transaction.delete(orderTests);
    await transaction.delete(orders);
    await transaction.delete(labTests);
    await transaction.delete(patients);
    await transaction.insert(patients).values(patientRows);
    await transaction.insert(labTests).values(testRows);
    await transaction.insert(orders).values(orderRows);
    await transaction.insert(orderTests).values(orderTestRows);
  });
}

if (import.meta.main) {
  const config = getConfig();
  const { client, db } = createDatabase(config);
  try {
    await seedDatabase(db);
    console.info("Seeded 4 patients, 6 lab tests, and 4 orders.");
  } finally {
    client.close();
  }
}
