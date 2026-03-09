import { User } from '../types/User';
import { Item } from '../types/Item';
import { DEFAULT_CATEGORIES } from '../types/Item';
import { initializeDatabase, isDatabaseInitialized } from '../services/db/db';
import { hasExistingLocalStorageData, migrateFromLocalStorage, verifyMigration } from '../services/db/migration';
import { userRepository, itemRepository, categoryRepository, inventoryTypeRepository } from '../services/db/repositories';
import { PRESET_TYPES } from '../services/inventoryTypeService';

const seedUsers: Omit<User, 'id'>[] = [
  {
    email: 'admin@example.com',
    password: 'changeme',
    role: 'admin',
    signInCount: 0,
    lastSignInAt: null,
    lastSignInIp: null,
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationTokenExpiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    email: 'user@example.com',
    password: 'changeme',
    role: 'user',
    signInCount: 0,
    lastSignInAt: null,
    lastSignInIp: null,
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationTokenExpiresAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function makeElectronicsItem(
  name: string,
  description: string,
  modelNumber: string,
  partNumber: string,
  vendorName: string,
  quantity: number,
  unitValue: number,
  vendorUrl: string,
  category: string,
  location: string,
  barcode: string,
  reorderPoint: number
): Omit<Item, 'id'> {
  return {
    name,
    description,
    quantity,
    unitValue,
    value: quantity * unitValue,
    picture: null,
    category,
    location,
    barcode,
    reorderPoint,
    inventoryTypeId: 1, // Electronics
    customFields: { modelNumber, partNumber, vendorName, vendorUrl },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const seedItems: Omit<Item, 'id'>[] = [
  // Arduino
  makeElectronicsItem('Arduino Uno', 'The Arduino Uno is a microcontroller board based on the ATmega328.', 'R3', '50', 'Adafruit', 8, 24.95, 'https://www.adafruit.com/product/50', 'Arduino', 'H1LD1B1', 'RIMS-0001', 5),
  makeElectronicsItem('Arduino Mega 2560', 'The Arduino Mega 2560 is a microcontroller board based on the ATmega2560.', 'R3', '191', 'Adafruit', 1, 45.95, 'https://www.adafruit.com/product/191', 'Arduino', 'H1LD1B3', 'RIMS-0002', 2),
  makeElectronicsItem('Arduino Nano', 'Compact Arduino board with ATmega328P, ideal for breadboard projects.', 'V3', '1501', 'SparkFun', 15, 22.95, 'https://www.sparkfun.com/products/1501', 'Arduino', 'H1LD1B2', 'RIMS-0003', 5),
  // Raspberry Pi
  makeElectronicsItem('Raspberry Pi 4 Model B', 'Quad-core 64-bit ARM Cortex-A72 running at 1.5GHz with 4GB RAM.', '4B-4GB', '4292', 'Adafruit', 5, 55.00, 'https://www.adafruit.com/product/4292', 'Raspberry Pi', 'H1LD2B1', 'RIMS-0004', 3),
  makeElectronicsItem('Raspberry Pi Zero 2 W', 'Compact single-board computer with wireless connectivity.', 'Zero2W', '5291', 'Adafruit', 10, 15.00, 'https://www.adafruit.com/product/5291', 'Raspberry Pi', 'H1LD2B2', 'RIMS-0005', 5),
  // Sensors
  makeElectronicsItem('DHT22 Temperature & Humidity Sensor', 'Digital temperature and humidity sensor with single-wire interface.', 'DHT22', '385', 'Adafruit', 25, 9.95, 'https://www.adafruit.com/product/385', 'Sensors', 'H2LD1B1', 'RIMS-0006', 10),
  makeElectronicsItem('HC-SR04 Ultrasonic Distance Sensor', 'Ultrasonic ranging module with 2cm to 400cm range.', 'HC-SR04', '3942', 'Adafruit', 20, 3.95, 'https://www.adafruit.com/product/3942', 'Sensors', 'H2LD1B2', 'RIMS-0007', 10),
  makeElectronicsItem('MPU-6050 Accelerometer & Gyroscope', '6-axis motion tracking device with I2C interface.', 'MPU-6050', 'SEN-11028', 'SparkFun', 12, 14.95, 'https://www.sparkfun.com/products/11028', 'Sensors', 'H2LD1B3', 'RIMS-0008', 5),
  // LCDs & Displays
  makeElectronicsItem('16x2 LCD Display with I2C', 'Blue backlight 16x2 character LCD with I2C interface module.', 'LCD1602-I2C', '181', 'Adafruit', 18, 12.95, 'https://www.adafruit.com/product/181', 'LCDs & Displays', 'H2LD2B1', 'RIMS-0009', 8),
  makeElectronicsItem('0.96" OLED Display 128x64', 'Small monochrome OLED display with I2C interface.', 'SSD1306', '326', 'Adafruit', 30, 7.95, 'https://www.adafruit.com/product/326', 'LCDs & Displays', 'H2LD2B2', 'RIMS-0010', 15),
  // LEDs
  makeElectronicsItem('NeoPixel Ring 16 RGB LED', 'Ring of 16 individually addressable RGB LEDs.', 'WS2812B-16', '1463', 'Adafruit', 8, 9.95, 'https://www.adafruit.com/product/1463', 'LEDs', 'H2LD3B1', 'RIMS-0011', 5),
  makeElectronicsItem('LED Assortment Kit 5mm', '100 piece LED kit with red, green, yellow, blue, and white LEDs.', 'LED-5MM-KIT', 'COM-12062', 'SparkFun', 5, 8.95, 'https://www.sparkfun.com/products/12062', 'LEDs', 'H2LD3B2', 'RIMS-0012', 3),
  // Components & Parts
  makeElectronicsItem('Resistor Kit 1/4W', '500 piece resistor assortment from 10 ohm to 1M ohm.', 'RES-KIT-500', 'COM-10969', 'SparkFun', 3, 12.95, 'https://www.sparkfun.com/products/10969', 'Components & Parts', 'H3LD1B1', 'RIMS-0013', 2),
  makeElectronicsItem('Ceramic Capacitor Kit', '300 piece ceramic capacitor assortment, various values.', 'CAP-KIT-300', 'COM-13698', 'SparkFun', 4, 9.95, 'https://www.sparkfun.com/products/13698', 'Components & Parts', 'H3LD1B2', 'RIMS-0014', 2),
  makeElectronicsItem('Electrolytic Capacitor Kit', '100 piece electrolytic capacitor assortment, 1uF to 1000uF.', 'ECAP-KIT-100', '2975', 'Adafruit', 6, 7.95, 'https://www.adafruit.com/product/2975', 'Components & Parts', 'H3LD1B3', 'RIMS-0015', 3),
  // Power
  makeElectronicsItem('5V 2.5A Power Supply', 'USB-C power supply for Raspberry Pi 4, 5V 2.5A output.', 'PS-5V-2.5A', '4298', 'Adafruit', 10, 8.95, 'https://www.adafruit.com/product/4298', 'Power', 'H3LD2B1', 'RIMS-0016', 5),
  makeElectronicsItem('18650 Li-Ion Battery', 'Rechargeable 3.7V 2600mAh lithium-ion battery.', '18650-2600', '1781', 'Adafruit', 20, 9.95, 'https://www.adafruit.com/product/1781', 'Power', 'H3LD2B2', 'RIMS-0017', 10),
  makeElectronicsItem('LM7805 Voltage Regulator', '5V 1A linear voltage regulator IC.', 'LM7805', '2164', 'Adafruit', 50, 0.75, 'https://www.adafruit.com/product/2164', 'Power', 'H3LD2B3', 'RIMS-0018', 20),
  // Prototyping
  makeElectronicsItem('Full-Size Breadboard', '830 tie-point solderless breadboard.', 'BB-830', '239', 'Adafruit', 12, 5.95, 'https://www.adafruit.com/product/239', 'Prototyping', 'H3LD3B1', 'RIMS-0019', 5),
  makeElectronicsItem('Jumper Wire Kit', '65 piece jumper wire kit for breadboarding.', 'JW-65', '153', 'Adafruit', 8, 6.95, 'https://www.adafruit.com/product/153', 'Prototyping', 'H3LD3B2', 'RIMS-0020', 4),
  makeElectronicsItem('Perfboard 5x7cm', 'Double-sided prototype PCB board, 5x7cm.', 'PB-5x7', '2670', 'Adafruit', 25, 1.50, 'https://www.adafruit.com/product/2670', 'Prototyping', 'H3LD3B3', 'RIMS-0021', 10),
  // Wireless
  makeElectronicsItem('ESP32 Development Board', 'WiFi and Bluetooth enabled microcontroller development board.', 'ESP32-DEVKIT', '3405', 'Adafruit', 10, 14.95, 'https://www.adafruit.com/product/3405', 'Wireless', 'H4LD1B1', 'RIMS-0022', 5),
  makeElectronicsItem('nRF24L01+ Wireless Module', '2.4GHz wireless transceiver module.', 'nRF24L01+', 'WRL-00691', 'SparkFun', 15, 6.95, 'https://www.sparkfun.com/products/691', 'Wireless', 'H4LD1B2', 'RIMS-0023', 8),
  // Robotics
  makeElectronicsItem('Servo Motor SG90', 'Micro servo motor, 180 degree rotation, 9g weight.', 'SG90', '169', 'Adafruit', 20, 5.95, 'https://www.adafruit.com/product/169', 'Robotics', 'H4LD2B1', 'RIMS-0024', 10),
  makeElectronicsItem('DC Motor with Gearbox', '6V DC motor with 48:1 gearbox, 200 RPM.', 'DCM-48', '3777', 'Adafruit', 8, 3.50, 'https://www.adafruit.com/product/3777', 'Robotics', 'H4LD2B2', 'RIMS-0025', 5),
  makeElectronicsItem('L298N Motor Driver', 'Dual H-bridge motor driver module for DC motors.', 'L298N', 'ROB-14450', 'SparkFun', 6, 12.95, 'https://www.sparkfun.com/products/14450', 'Robotics', 'H4LD2B3', 'RIMS-0026', 3),
  // Tools
  makeElectronicsItem('Soldering Iron 60W', 'Temperature adjustable soldering iron with stand.', 'SI-60W', '180', 'Adafruit', 3, 22.00, 'https://www.adafruit.com/product/180', 'Tools', 'H5LD1B1', 'RIMS-0027', 2),
  makeElectronicsItem('Digital Multimeter', 'Auto-ranging digital multimeter with LCD display.', 'DMM-AR', '2034', 'Adafruit', 4, 17.50, 'https://www.adafruit.com/product/2034', 'Tools', 'H5LD1B2', 'RIMS-0028', 2),
  // Cables
  makeElectronicsItem('USB-C Cable 1m', 'USB-C to USB-A cable, 1 meter length.', 'USB-C-1M', '4474', 'Adafruit', 15, 4.95, 'https://www.adafruit.com/product/4474', 'Cables', 'H5LD2B1', 'RIMS-0029', 8),
  makeElectronicsItem('Micro USB Cable 1m', 'Micro USB to USB-A cable, 1 meter length.', 'MUSB-1M', '592', 'Adafruit', 20, 2.95, 'https://www.adafruit.com/product/592', 'Cables', 'H5LD2B2', 'RIMS-0030', 10),
];

// Category presets per inventory type
const CATEGORY_PRESETS: Record<string, string[]> = {
  Electronics: DEFAULT_CATEGORIES as unknown as string[],
  Firearms: ['Handguns', 'Rifles', 'Shotguns', 'Accessories', 'Optics', 'Holsters & Cases'],
  Ammunition: ['Rimfire', 'Centerfire Pistol', 'Centerfire Rifle', 'Shotshell', 'Specialty'],
};

/**
 * Initialize the database and seed data if needed
 */
export async function initializeData(): Promise<void> {
  await initializeDatabase();

  // Check if we need to migrate from localStorage
  if (hasExistingLocalStorageData()) {
    console.log('Detected existing localStorage data, migrating to SQLite...');
    const result = migrateFromLocalStorage();
    console.log('Migration result:', result);
    const verification = verifyMigration();
    console.log('Migration verification:', verification);
    return;
  }

  // Check if database already has data
  const existingUsers = userRepository.count();
  if (existingUsers > 0) {
    console.log('Database already initialized with', existingUsers, 'users');
    // Ensure inventory types exist (for upgraded databases)
    seedInventoryTypes();
    return;
  }

  // Seed fresh data
  console.log('Seeding fresh database...');

  // Seed inventory types first
  seedInventoryTypes();

  // Seed users
  for (const userData of seedUsers) {
    userRepository.create(userData);
  }

  // Seed items
  for (const itemData of seedItems) {
    itemRepository.create(itemData);
  }

  // Seed categories with type associations
  const existingCategories = categoryRepository.count();
  if (existingCategories === 0) {
    const types = inventoryTypeRepository.getAll();
    const now = new Date().toISOString();
    for (const type of types) {
      const cats = CATEGORY_PRESETS[type.name] || [];
      cats.forEach((name, index) => {
        categoryRepository.create({
          name,
          sortOrder: index,
          inventoryTypeId: type.id,
          createdAt: now,
          updatedAt: now,
        });
      });
    }
    console.log('Seeded categories for all inventory types');
  }

  console.log('Database seeded successfully');
}

function seedInventoryTypes(): void {
  const existingTypes = inventoryTypeRepository.count();
  if (existingTypes > 0) return;

  const now = new Date().toISOString();
  for (const preset of PRESET_TYPES) {
    inventoryTypeRepository.create({
      name: preset.name,
      icon: preset.icon,
      schema: preset.schema,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`Seeded ${PRESET_TYPES.length} inventory types`);
}

export { seedUsers, seedItems };
