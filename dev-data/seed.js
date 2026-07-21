/**
 * AEROX DATABASE SEEDER
 * Run: node dev-data/seed.js --import   (to seed data)
 * Run: node dev-data/seed.js --delete   (to wipe data)
 */

import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

import mongoose from "mongoose";
import Gadget from "../models/gadgetModel.js";
import Component from "../models/componentModel.js";
import User from "../models/userModel.js";

const DB = process.env.MONGODB_URI;

mongoose.connect(DB).then(() => console.log("✅ DB connected for seeding"));

// ─── GADGETS ───────────────────────────────────────────────────────────────
const gadgets = [
  {
    name: "AeroX Swift Pro Mouse",
    category: "mouse",
    price: 129,
    stock: 85,
    isFeatured: true,
    imageCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKxqCymlfvgRj0jAg-04n9ANyXQTfvcGUjtD4jE2NuN5dLeNxPR_6GjaJ1Xs53MVBhzjobPWB2PDsRPXEEn3ALBgWet97LyfbxEti5tntSdLzMsTHUPRrq5RewqEnX15Xfd0Fpk3_04Qb-v7D3BaB9F1M_jRY5dK_1omzppLkRIOQUpGvDheWPkJuu0_1B3eZ9cCR2GSZWmsomLMnXG-qRfHJF0vEulPZjyC_7CBCsI9P6omxA_e2yWrrOaG_kfHZOmcmieCEchog-",
    ratingsAverage: 4.8,
    ratingsQuantity: 214,
    specs: {
      connectivity: "wireless",
      weight: 54,
      sensor: "AeroX Precision 3370",
      batteryLife: "70 hours",
    },
  },
  {
    name: "Vulcan Elite TKL Keyboard",
    category: "keyboard",
    price: 189,
    stock: 52,
    isFeatured: true,
    imageCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuARUBNRk3JcPdmVZK-mz3SF4POH7piHY77mNaVUcGjV9wrlX8p178fruyp5u9RHGkBbRK7Pb-4JKpiL1ZXOprEH8sClzi4VVctu8Ldjc8DyCU5Ch_x6tDzqcDVKTx2non1bXbFSBgdLwHKdBhOXvGxMcyO2RWqdf4LFOI35SZ5ccGc2Kg2guHMhVUUXGeNpQFjiK9LDHCyCETRlAZaROTR3irlsmE-TK3mTA0TPBdWCBKjG7nt6Suqwx8TP3fT9p_92fE44any1l5JB",
    ratingsAverage: 4.9,
    ratingsQuantity: 431,
    specs: {
      connectivity: "wired",
      switchType: "AeroX Optical Red",
    },
  },
  {
    name: "Sonic Fury 7.1 Headset",
    category: "audio",
    price: 249,
    stock: 38,
    isFeatured: true,
    imageCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3J4bGttSRCObjQZtC-KbHxzXIea12al83_pMWv_xiaH565noszssjVS7rl0slcH8gPGKhRM9RqKC2nO-9gN7rJ6r1lG3DsoBHol5q0N1aQMnOvewZf_4PlUyHZs8ziA9fVoEpJbREkJi9_o-VNtRmya4xOMht3YYI_dFasWDnkpkutb5mGAbOeXVcWttPalFhXRDFASQ3NQBtaCkRHaHSuOGKgUud0tYhzy5YSzwyPW20liBcHi5KGKlf70aHuVtHEWyAgA35HMuW",
    ratingsAverage: 4.7,
    ratingsQuantity: 182,
    specs: {
      connectivity: "wireless",
      batteryLife: "24 hours",
    },
  },
  {
    name: "Vision Pro 4K Cam",
    category: "streaming",
    price: 199,
    stock: 20,
    isFeatured: true,
    imageCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuCPRm9spcPyQYo4hj-WR06WdAXsIPxjd5MLujYBWReaPcLMl4Jr7Omu3Kin2AWH3Bq3eKFu3H32P2o6ricZ18jsoSV6wpqhWKXo2O2akaEMSbiT2r26xTCbwltcznnTgX43nRANZKcZKHdJrHsfS3egrMPFjrT68GO__bT3dwfr05sQjY1-8te6xVSi2GM1Y1XLn4t2Cw2w4sn0bWpc0fSt9VrzPzdGl9wcYC5goL3-YQu3t4M2yGhOdU3FpF9vuTj8sBRU1eUg9C5-",
    ratingsAverage: 4.6,
    ratingsQuantity: 97,
    specs: {
      connectivity: "wired",
    },
  },
  {
    name: "Sabre RGB Pro Mouse",
    category: "mouse",
    price: 59.99,
    stock: 140,
    isFeatured: false,
    imageCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQxWQK_2aSZgMSdW2ceswDLX7LxTxaGa1nMBqStXeZ9jhHoYT2ulBXeDkV06aY-vDggUYtbWG_PqSYj05mgCERcv8jSm8yKWZKPSuUGNsyrANkOA7V0QFUmBHAvoFQ9jJIQu1PycHuodvhDn4cksXvdlLYXhuFGpYaiLseS3D4yRpTTaOmXuXm4RCXNLeGSIlHZW1Opz86wwFCW5rgpNazrPaNnhGTNlpwkARhMoXe-uWxLiwZ8CjfqAo6FFGYOX_QUiBhto",
    ratingsAverage: 4.3,
    ratingsQuantity: 328,
    specs: {
      connectivity: "wired",
      sensor: "AeroX Quickstrike",
    },
  },
  {
    name: "LT100 Smart Lighting Kit",
    category: "ambient-lighting",
    price: 149,
    stock: 65,
    isFeatured: false,
    imageCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuBZbIXaXORdUSAL8dSz-VCx3_wU7xRUbSeO1H9uwwCG9xwjZletH4O51PJb4hDwbWTKsq8WX_OkvOxTyUzCCNbEnD_IxL85PAc6mZD12NIrFcUp8HQG7-rxRCXVuuTbqnq3Nxc5Xlgz6ZBNSctU6u7waB1XASdLmnUj1JZwNCkmCpXi2CyxzIAURiOx52nMebuapZQ8pMyFASwF3VlCyAtQBZ22_C8fJzdrNf00LtYGXXSmbWPS7FCdcR006WBFc9iWWsatdOAy6UjP",
    ratingsAverage: 4.5,
    ratingsQuantity: 89,
    specs: {
      connectivity: "wireless",
    },
  },
];

// ─── PC COMPONENTS ─────────────────────────────────────────────────────────
const components = [
  {
    name: "AeroX Titan X CPU",
    category: "cpu",
    price: 499,
    stock: 30,
    isFeatured: true,
    imageCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuAQxWQK_2aSZgMSdW2ceswDLX7LxTxaGa1nMBqStXeZ9jhHoYT2ulBXeDkV06aY-vDggUYtbWG_PqSYj05mgCERcv8jSm8yKWZKPSuUGNsyrANkOA7V0QFUmBHAvoFQ9jJIQu1PycHuodvhDn4cksXvdlLYXhuFGpYaiLseS3D4yRpTTaOmXuXm4RCXNLeGSIlHZW1Opz86wwFCW5rgpNazrPaNnhGTNlpwkARhMoXe-uWxLiwZ8CjfqAo6FFGYOX_QUiBhto",
    ratingsAverage: 4.9,
    ratingsQuantity: 118,
    specifications: new Map([
      ["Cores", "16"],
      ["Threads", "32"],
      ["Base Clock", "3.8 GHz"],
      ["Boost Clock", "5.6 GHz"],
      ["TDP", "125W"],
      ["Socket", "LGA1700"],
    ]),
  },
  {
    name: "AeroX Vortex RTX GPU",
    category: "gpu",
    price: 799,
    stock: 15,
    isFeatured: true,
    imageCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKxqCymlfvgRj0jAg-04n9ANyXQTfvcGUjtD4jE2NuN5dLeNxPR_6GjaJ1Xs53MVBhzjobPWB2PDsRPXEEn3ALBgWet97LyfbxEti5tntSdLzMsTHUPRrq5RewqEnX15Xfd0Fpk3_04Qb-v7D3BaB9F1M_jRY5dK_1omzppLkRIOQUpGvDheWPkJuu0_1B3eZ9cCR2GSZWmsomLMnXG-qRfHJF0vEulPZjyC_7CBCsI9P6omxA_e2yWrrOaG_kfHZOmcmieCEchog-",
    ratingsAverage: 4.8,
    ratingsQuantity: 94,
    specifications: new Map([
      ["VRAM", "16GB GDDR7"],
      ["CUDA Cores", "9728"],
      ["Boost Clock", "2.85 GHz"],
      ["TDP", "320W"],
      ["Interface", "PCIe 4.0 x16"],
      ["Outputs", "3× DP 1.4, 1× HDMI 2.1"],
    ]),
  },
  {
    name: "AeroX Frost DDR5 RAM",
    category: "ram",
    price: 189,
    stock: 60,
    isFeatured: false,
    imageCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuARUBNRk3JcPdmVZK-mz3SF4POH7piHY77mNaVUcGjV9wrlX8p178fruyp5u9RHGkBbRK7Pb-4JKpiL1ZXOprEH8sClzi4VVctu8Ldjc8DyCU5Ch_x6tDzqcDVKTx2non1bXbFSBgdLwHKdBhOXvGxMcyO2RWqdf4LFOI35SZ5ccGc2Kg2guHMhVUUXGeNpQFjiK9LDHCyCETRlAZaROTR3irlsmE-TK3mTA0TPBdWCBKjG7nt6Suqwx8TP3fT9p_92fE44any1l5JB",
    ratingsAverage: 4.7,
    ratingsQuantity: 201,
    specifications: new Map([
      ["Capacity", "32GB (2×16GB)"],
      ["Speed", "DDR5-6400"],
      ["Latency", "CL32"],
      ["Voltage", "1.4V"],
      ["Form Factor", "DIMM"],
      ["RGB", "Addressable"],
    ]),
  },
  {
    name: "AeroX Phantom Mid Tower",
    category: "case",
    price: 229,
    stock: 25,
    isFeatured: false,
    imageCover: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3J4bGttSRCObjQZtC-KbHxzXIea12al83_pMWv_xiaH565noszssjVS7rl0slcH8gPGKhRM9RqKC2nO-9gN7rJ6r1lG3DsoBHol5q0N1aQMnOvewZf_4PlUyHZs8ziA9fVoEpJbREkJi9_o-VNtRmya4xOMht3YYI_dFasWDnkpkutb5mGAbOeXVcWttPalFhXRDFASQ3NQBtaCkRHaHSuOGKgUud0tYhzy5YSzwyPW20liBcHi5KGKlf70aHuVtHEWyAgA35HMuW",
    ratingsAverage: 4.6,
    ratingsQuantity: 67,
    specifications: new Map([
      ["Form Factor", "ATX Mid Tower"],
      ["Motherboard Support", "ATX, mATX, ITX"],
      ["Drive Bays", "2× 3.5\", 4× 2.5\""],
      ["Fan Support", "Up to 9× 120mm"],
      ["Radiator Support", "360mm front, 240mm top"],
      ["Tempered Glass", "Yes — 2 panels"],
    ]),
  },
];

// ─── ADMIN USER ─────────────────────────────────────────────────────────────
const adminUser = [
  {
    name: "AeroX Admin",
    email: "admin@aerox.com",
    password: "Admin@AeroX2024",
    passwordConfirm: "Admin@AeroX2024",
    role: "admin",
  },
];

// ─── IMPORT ─────────────────────────────────────────────────────────────────
const importData = async () => {
  try {
    await Gadget.create(gadgets);
    console.log("✅ Gadgets seeded:", gadgets.length);

    await Component.create(components);
    console.log("✅ Components seeded:", components.length);

    const existingAdmin = await User.findOne({ email: "admin@aerox.com" });
    if (!existingAdmin) {
      await User.create(adminUser);
      console.log("✅ Admin user seeded");
    } else {
      console.log("ℹ️  Admin user already exists, skipping.");
    }

    console.log("\n🚀 All data seeded successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
};

// ─── DELETE ─────────────────────────────────────────────────────────────────
const deleteData = async () => {
  try {
    await Gadget.deleteMany();
    await Component.deleteMany();
    console.log("🗑️  All gadgets and components deleted.");
    process.exit();
  } catch (err) {
    console.error("❌ Delete error:", err.message);
    process.exit(1);
  }
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
} else {
  console.log("Usage:");
  console.log("  node dev-data/seed.js --import   (seed data)");
  console.log("  node dev-data/seed.js --delete   (wipe data)");
  process.exit();
}
