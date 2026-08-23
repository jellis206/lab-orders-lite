import { getConfig } from "../../apps/api/src/config";
import { createDatabase, type AppDatabase } from "../../apps/api/src/db/client";
import { labTests, orders, orderTests, patients } from "../../apps/api/src/db/schema";

const NOW = "2025-01-15T14:00:00.000Z";

// Generate realistic patient names
const firstNames = [
  "James", "Mary", "Robert", "Patricia", "Michael", "Jennifer", "William", "Linda",
  "David", "Barbara", "Richard", "Elizabeth", "Joseph", "Susan", "Thomas", "Jessica",
  "Charles", "Sarah", "Christopher", "Karen", "Daniel", "Nancy", "Matthew", "Lisa",
  "Mark", "Betty", "Donald", "Margaret", "Steven", "Sandra", "Paul", "Ashley",
  "Andrew", "Kimberly", "Joshua", "Emily", "Kenneth", "Donna", "Kevin", "Michelle",
  "Brian", "Dorothy", "George", "Carol", "Edward", "Amanda", "Ronald", "Melissa",
  "Anthony", "Deborah", "Frank", "Stephanie", "Ryan", "Rebecca", "Gary", "Sharon",
  "Nicholas", "Laura", "Eric", "Cynthia", "Jonathan", "Kathleen", "Stephen", "Amy",
  "Larry", "Angela", "Justin", "Shirley", "Scott", "Anna", "Brandon", "Brenda",
  "Benjamin", "Pamela", "Samuel", "Emma", "Frank", "Nicole", "Gregory", "Helen",
  "Raymond", "Samantha", "Alexander", "Katherine", "Patrick", "Christine", "Jack", "Debra",
  "Dennis", "Rachel", "Jerry", "Catherine", "Tyler", "Carolyn", "Aaron", "Janet",
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Peterson", "Phillips",
  "Campbell", "Parker", "Evans", "Edwards", "Collins", "Reeves", "Stewart", "Morris",
  "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper",
  "Peterson", "Hunter", "Hicks", "Crawford", "Henry", "Boyd", "Mason", "Moreno",
  "Kennedy", "Warren", "Dixon", "Rivas", "Cohen", "Garrett", "Booth", "Sutton",
  "Pierce", "Friedman", "Wray", "Salazar", "Wilcox", "Chung", "Solis", "Villarreal",
  "Cohen", "Burnham", "Gould", "Carr", "Blackwell", "Gentry", "Cowan", "Rosenberg",
];

const domainNames = ["example.test", "test.local", "sample.test"];
const areaCode = (i: number) => String(200 + (i % 800)).padStart(3, "0");
const exchangeCode = (i: number) => String(i % 800).padStart(3, "0");
const subscriberNumber = (i: number) => String(i % 10000).padStart(4, "0");

// Standard lab tests with realistic pricing
const testTemplates = [
  { code: "CBC", name: "Complete Blood Count", basePriceCents: 3000, turnaroundHours: 12 },
  { code: "CMP", name: "Comprehensive Metabolic Panel", basePriceCents: 4500, turnaroundHours: 24 },
  { code: "LIPID", name: "Lipid Panel", basePriceCents: 3800, turnaroundHours: 24 },
  { code: "VITD", name: "Vitamin D, 25-Hydroxy", basePriceCents: 6200, turnaroundHours: 48 },
  { code: "A1C", name: "Hemoglobin A1c", basePriceCents: 2700, turnaroundHours: 18 },
  { code: "TSH", name: "Thyroid Stimulating Hormone", basePriceCents: 4100, turnaroundHours: 36 },
  { code: "PSA", name: "Prostate Specific Antigen", basePriceCents: 3500, turnaroundHours: 24 },
  { code: "BNP", name: "B-type Natriuretic Peptide", basePriceCents: 5800, turnaroundHours: 36 },
  { code: "CK", name: "Creatine Kinase", basePriceCents: 3200, turnaroundHours: 12 },
  { code: "ALT", name: "Alanine Aminotransferase", basePriceCents: 2500, turnaroundHours: 12 },
  { code: "AST", name: "Aspartate Aminotransferase", basePriceCents: 2500, turnaroundHours: 12 },
  { code: "ALP", name: "Alkaline Phosphatase", basePriceCents: 2800, turnaroundHours: 12 },
  { code: "GGT", name: "Gamma-Glutamyl Transferase", basePriceCents: 3000, turnaroundHours: 12 },
  { code: "LDH", name: "Lactate Dehydrogenase", basePriceCents: 2900, turnaroundHours: 12 },
  { code: "BILI", name: "Bilirubin Total", basePriceCents: 2600, turnaroundHours: 12 },
  { code: "ALBU", name: "Albumin", basePriceCents: 2400, turnaroundHours: 12 },
  { code: "GLU", name: "Glucose", basePriceCents: 2200, turnaroundHours: 8 },
  { code: "UREA", name: "Blood Urea Nitrogen", basePriceCents: 2300, turnaroundHours: 12 },
  { code: "CREAT", name: "Creatinine", basePriceCents: 2400, turnaroundHours: 12 },
  { code: "K", name: "Potassium", basePriceCents: 2500, turnaroundHours: 12 },
  { code: "NA", name: "Sodium", basePriceCents: 2500, turnaroundHours: 12 },
  { code: "CA", name: "Calcium", basePriceCents: 2700, turnaroundHours: 12 },
  { code: "PH", name: "Phosphorus", basePriceCents: 2700, turnaroundHours: 12 },
  { code: "MG", name: "Magnesium", basePriceCents: 3100, turnaroundHours: 24 },
  { code: "CL", name: "Chloride", basePriceCents: 2500, turnaroundHours: 12 },
  { code: "CO2", name: "Carbon Dioxide", basePriceCents: 2500, turnaroundHours: 12 },
  { code: "TRI", name: "Triglycerides", basePriceCents: 3200, turnaroundHours: 24 },
  { code: "CHO", name: "Total Cholesterol", basePriceCents: 2900, turnaroundHours: 24 },
  { code: "HDL", name: "HDL Cholesterol", basePriceCents: 3100, turnaroundHours: 24 },
  { code: "LDL", name: "LDL Cholesterol", basePriceCents: 3300, turnaroundHours: 24 },
  { code: "IRON", name: "Iron", basePriceCents: 3400, turnaroundHours: 24 },
  { code: "TIBC", name: "Total Iron Binding Capacity", basePriceCents: 3200, turnaroundHours: 24 },
  { code: "FERR", name: "Ferritin", basePriceCents: 4200, turnaroundHours: 24 },
  { code: "PT", name: "Prothrombin Time", basePriceCents: 4000, turnaroundHours: 12 },
  { code: "PTT", name: "Activated Partial Thromboplastin Time", basePriceCents: 4100, turnaroundHours: 12 },
  { code: "INR", name: "International Normalized Ratio", basePriceCents: 3900, turnaroundHours: 12 },
  { code: "TROPO", name: "Troponin", basePriceCents: 5500, turnaroundHours: 6 },
  { code: "MYOG", name: "Myoglobin", basePriceCents: 4500, turnaroundHours: 12 },
  { code: "LACT", name: "Lactate", basePriceCents: 4200, turnaroundHours: 8 },
  { code: "AMYL", name: "Amylase", basePriceCents: 3100, turnaroundHours: 12 },
  { code: "PROT", name: "Total Protein", basePriceCents: 2600, turnaroundHours: 12 },
  { code: "GLOB", name: "Globulin", basePriceCents: 2700, turnaroundHours: 12 },
  { code: "AGR", name: "Albumin-Globulin Ratio", basePriceCents: 2800, turnaroundHours: 12 },
  { code: "PHOS", name: "Phosphatase", basePriceCents: 3000, turnaroundHours: 12 },
  { code: "TP", name: "Total Protein Panel", basePriceCents: 4500, turnaroundHours: 24 },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateOfBirth(): string {
  const year = randomInt(1935, 2010);
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function generatePatients(count: number) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const emailChance = Math.random() > 0.2; // 80% have email
    const phoneChance = Math.random() > 0.3; // 70% have phone
    
    rows.push({
      id: `patient-${String(i).padStart(6, "0")}`,
      firstName,
      lastName,
      dateOfBirth: randomDateOfBirth(),
      email: emailChance ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${randomChoice(domainNames)}` : null,
      phone: phoneChance ? `555-${areaCode(i)}-${exchangeCode(i + 100)}-${subscriberNumber(i)}` : null,
      createdAt: NOW,
      updatedAt: NOW,
    });
  }
  return rows;
}

function generateLabTests(count: number) {
  const rows = [];
  const selected = testTemplates.slice(0, count);
  for (const test of selected) {
    rows.push({
      id: `test-${test.code.toLowerCase()}`,
      code: test.code,
      name: test.name,
      priceCents: test.basePriceCents,
      turnaroundHours: test.turnaroundHours,
      active: Math.random() > 0.15, // 85% active
      createdAt: NOW,
      updatedAt: NOW,
    });
  }
  return rows;
}

function generateOrders(patientCount: number, orderCount: number, _testCount: number) {
  const orders = [];
  const baseDate = new Date("2024-01-01");
  
  for (let i = 0; i < orderCount; i++) {
    const daysOffset = randomInt(0, 380);
    const orderedAt = new Date(baseDate);
    orderedAt.setDate(orderedAt.getDate() + daysOffset);
    
    const turnaroundHours = randomInt(6, 72);
    const estimatedReadyAt = new Date(orderedAt);
    estimatedReadyAt.setHours(estimatedReadyAt.getHours() + turnaroundHours);
    
    const statuses = ["pending", "in_progress", "completed", "cancelled"] as const;
    const statusWeights = [0.2, 0.15, 0.55, 0.1]; // More completed orders
    const rand = Math.random();
    let status: typeof statuses[number];
    if (rand < statusWeights[0]) status = "pending";
    else if (rand < statusWeights[0] + statusWeights[1]) status = "in_progress";
    else if (rand < statusWeights[0] + statusWeights[1] + statusWeights[2]) status = "completed";
    else status = "cancelled";
    
    orders.push({
      id: `order-${String(i).padStart(7, "0")}`,
      patientId: `patient-${String(randomInt(0, patientCount - 1)).padStart(6, "0")}`,
      status,
      orderedAt: orderedAt.toISOString(),
      totalCents: 0, // Will be calculated from tests
      estimatedReadyAt: estimatedReadyAt.toISOString(),
      createdAt: NOW,
      updatedAt: NOW,
    });
  }
  return orders;
}

function generateOrderTests(
  orders: ReturnType<typeof generateOrders>,
  testRows: ReturnType<typeof generateLabTests>,
) {
  const orderTests = [];
  
  for (const order of orders) {
    const testCount = randomInt(1, Math.min(5, testRows.length));
    const selectedTests = new Set<string>();
    let totalCents = 0;
    
    // Select random tests for this order
    while (selectedTests.size < testCount) {
      const test = randomChoice(testRows);
      if (!selectedTests.has(test.id)) {
        selectedTests.add(test.id);
        totalCents += test.priceCents;
        
        orderTests.push({
          orderId: order.id,
          labTestId: test.id,
          testCode: test.code,
          testName: test.name,
          priceCents: test.priceCents,
          turnaroundHours: test.turnaroundHours,
        });
      }
    }
    
    // Update order total
    order.totalCents = totalCents;
  }
  
  return orderTests;
}

export async function seedLargeDatabase(db: AppDatabase): Promise<void> {
  const PATIENT_COUNT = 5000;
  const TEST_COUNT = 45;
  const ORDER_COUNT = 50000;
  const BATCH_SIZE = 1000;

  console.time("Total seed time");
  
  await db.transaction(async (transaction) => {
    console.log("Clearing existing data...");
    await transaction.delete(orderTests);
    await transaction.delete(orders);
    await transaction.delete(labTests);
    await transaction.delete(patients);
    
    console.log(`Generating ${PATIENT_COUNT} patients...`);
    const patientRows = generatePatients(PATIENT_COUNT);
    
    console.log(`Generating ${TEST_COUNT} lab tests...`);
    const testRows = generateLabTests(TEST_COUNT);
    
    console.log(`Generating ${ORDER_COUNT} orders...`);
    const orderRows = generateOrders(PATIENT_COUNT, ORDER_COUNT, TEST_COUNT);
    
    console.log("Generating order-test mappings...");
    const orderTestRows = generateOrderTests(orderRows, testRows);
    
    console.log("Inserting patients...");
    for (let i = 0; i < patientRows.length; i += BATCH_SIZE) {
      const batch = patientRows.slice(i, i + BATCH_SIZE);
      await transaction.insert(patients).values(batch);
      if ((i + BATCH_SIZE) % 5000 === 0) {
        console.log(`  Inserted ${Math.min(i + BATCH_SIZE, patientRows.length)} patients...`);
      }
    }
    
    console.log("Inserting lab tests...");
    await transaction.insert(labTests).values(testRows);
    
    console.log("Inserting orders...");
    for (let i = 0; i < orderRows.length; i += BATCH_SIZE) {
      const batch = orderRows.slice(i, i + BATCH_SIZE);
      await transaction.insert(orders).values(batch);
      if ((i + BATCH_SIZE) % 10000 === 0) {
        console.log(`  Inserted ${Math.min(i + BATCH_SIZE, orderRows.length)} orders...`);
      }
    }
    
    console.log("Inserting order tests...");
    for (let i = 0; i < orderTestRows.length; i += BATCH_SIZE) {
      const batch = orderTestRows.slice(i, i + BATCH_SIZE);
      await transaction.insert(orderTests).values(batch);
      if ((i + BATCH_SIZE) % 50000 === 0) {
        console.log(`  Inserted ${Math.min(i + BATCH_SIZE, orderTestRows.length)} order-tests...`);
      }
    }
  });
  
  console.timeEnd("Total seed time");
  console.log(`\n✅ Seeded ${PATIENT_COUNT} patients, ${TEST_COUNT} lab tests, ${ORDER_COUNT} orders, and ~${(ORDER_COUNT * 3).toLocaleString()} order-tests.`);
}

if (import.meta.main) {
  const config = getConfig();
  const { client, db } = createDatabase(config);
  try {
    await seedLargeDatabase(db);
  } finally {
    client.close();
  }
}
