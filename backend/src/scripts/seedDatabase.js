import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { State } from '../models/State.js';
import { District } from '../models/District.js';
import { Block } from '../models/Block.js';
import { GramPanchayat } from '../models/GramPanchayat.js';
import { Zone } from '../models/Zone.js';
import { User } from '../models/User.js';
import { CollectionAgent } from '../models/CollectionAgent.js';
import { Van } from '../models/Van.js';
import { DumpingSite } from '../models/DumpingSite.js';
import { generateDumpSiteQRData } from '../utils/qrGenerator.js';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    await connectDatabase();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await State.deleteMany({});
    await District.deleteMany({});
    await Block.deleteMany({});
    await GramPanchayat.deleteMany({});
    await Zone.deleteMany({});
    await User.deleteMany({});
    await CollectionAgent.deleteMany({});
    await Van.deleteMany({});
    await DumpingSite.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // 1. Create State: West Bengal
    console.log('📍 Creating State...');
    const westBengal = await State.create({
      name: 'West Bengal',
      code: 'WB',
    });
    console.log(`✅ State created: ${westBengal.name}\n`);

    // 2. Create District: Kolkata
    console.log('📍 Creating District...');
    const kolkata = await District.create({
      name: 'Kolkata',
      code: 'KOL',
      stateId: westBengal._id,
    });
    console.log(`✅ District created: ${kolkata.name}\n`);

    // 3. Create 3 Blocks
    console.log('📍 Creating Blocks...');
    const blocks = await Block.insertMany([
      { name: 'Block North', code: 'BN', districtId: kolkata._id },
      { name: 'Block Central', code: 'BC', districtId: kolkata._id },
      { name: 'Block South', code: 'BS', districtId: kolkata._id },
    ]);
    console.log(`✅ ${blocks.length} Blocks created\n`);

    // 4. Create GPs/Municipalities (2 per block)
    console.log('📍 Creating GPs/Municipalities...');
    const gps = [];
    for (const block of blocks) {
      const blockGps = await GramPanchayat.insertMany([
        {
          name: `${block.name} - GP 1`,
          code: `${block.code}-GP1`,
          blockId: block._id,
          type: 'GRAM_PANCHAYAT',
          contactNumber: '+91-9876543210',
          address: `${block.name} Administrative Office`,
        },
        {
          name: `${block.name} - Municipality`,
          code: `${block.code}-MUN`,
          blockId: block._id,
          type: 'MUNICIPALITY',
          contactNumber: '+91-9876543220',
          address: `${block.name} Municipal Office`,
        },
      ]);
      gps.push(...blockGps);
    }
    console.log(`✅ ${gps.length} GPs/Municipalities created\n`);

    // 5. Create Zones (2 zones per GP)
    console.log('📍 Creating Zones...');
    const zones = [];
    for (const gp of gps) {
      const gpZones = await Zone.insertMany([
        {
          name: `${gp.name} - Zone A`,
          code: `${gp.code}-ZA`,
          gpId: gp._id,
          area: 10.5,
        },
        {
          name: `${gp.name} - Zone B`,
          code: `${gp.code}-ZB`,
          gpId: gp._id,
          area: 12.3,
        },
      ]);
      zones.push(...gpZones);
    }
    console.log(`✅ ${zones.length} Zones created\n`);

    // 6. Create Users for each role
    console.log('👥 Creating Users...');
    
    // State Admin
    const stateAdmin = await User.create({
      email: 'state@admin.com',
      password: 'admin123',
      name: 'State Administrator',
      role: 'STATE',
      stateId: westBengal._id,
    });

    // District Admin
    const districtAdmin = await User.create({
      email: 'district@admin.com',
      password: 'admin123',
      name: 'District Administrator',
      role: 'DISTRICT',
      stateId: westBengal._id,
      districtId: kolkata._id,
    });

    // Block Admins (one per block)
    const blockAdmins = [];
    for (const block of blocks) {
      const admin = await User.create({
        email: `block${block.code.toLowerCase()}@admin.com`,
        password: 'admin123',
        name: `${block.name} Administrator`,
        role: 'BLOCK',
        stateId: westBengal._id,
        districtId: kolkata._id,
        blockId: block._id,
      });
      blockAdmins.push(admin);
    }

    // GP Admins (one per GP)
    const gpAdmins = [];
    for (const gp of gps) {
      const admin = await User.create({
        email: `gp${gp.code.toLowerCase()}@admin.com`,
        password: 'admin123',
        name: `${gp.name} Administrator`,
        role: 'MUNICIPALITY',
        stateId: westBengal._id,
        districtId: kolkata._id,
        blockId: gp.blockId,
        gpId: gp._id,
      });
      gpAdmins.push(admin);
    }

    // Additional test users for easier testing
    const testUserCentral = await User.create({
      email: 'central@municipality.com',
      password: 'test123',
      name: 'Central Municipality Admin',
      role: 'MUNICIPALITY',
      stateId: westBengal._id,
      districtId: kolkata._id,
      blockId: gps[2].blockId,
      gpId: gps[2]._id,
    });

    const testUserSouth = await User.create({
      email: 'south@municipality.com',
      password: 'test123',
      name: 'South Municipality Admin',
      role: 'MUNICIPALITY',
      stateId: westBengal._id,
      districtId: kolkata._id,
      blockId: gps[4].blockId,
      gpId: gps[4]._id,
    });

    console.log(`✅ Created 1 State Admin, 1 District Admin, ${blockAdmins.length} Block Admins, ${gpAdmins.length} GP Admins + 2 Test Accounts\n`);

    // 7. Create Vans (1 per zone)
    console.log('🚛 Creating Vans...');
    const vans = [];
    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];
      const van = await Van.create({
        registrationNumber: `WB-${String(i + 1).padStart(4, '0')}`,
        gpId: zone.gpId,
        zoneId: zone._id,
        capacity: 1000,
        driverName: `Driver ${i + 1}`,
      });
      vans.push(van);
    }
    console.log(`✅ ${vans.length} Vans created\n`);

    // 8. Create Collection Agents (2 per zone)
    console.log('👷 Creating Collection Agents...');
    const agents = [];
    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];
      const van = vans[i];
      
      // Agent 1
      const user1 = await User.create({
        email: `agent${i * 2 + 1}@waste.com`,
        password: 'agent123',
        name: `Collection Agent ${i * 2 + 1}`,
        role: 'AGENT',
        stateId: westBengal._id,
        districtId: kolkata._id,
        blockId: zone.gpId ? (await GramPanchayat.findById(zone.gpId)).blockId : null,
        gpId: zone.gpId,
      });

      const agent1 = await CollectionAgent.create({
        userId: user1._id,
        name: user1.name,
        email: user1.email,
        phone: `+91-98765${String(i * 2 + 1).padStart(5, '0')}`,
        gpId: zone.gpId,
        zoneId: zone._id,
        assignedVanId: van._id,
        employeeId: `EMP-${String(i * 2 + 1).padStart(4, '0')}`,
      });
      agents.push(agent1);

      // Agent 2
      const user2 = await User.create({
        email: `agent${i * 2 + 2}@waste.com`,
        password: 'agent123',
        name: `Collection Agent ${i * 2 + 2}`,
        role: 'AGENT',
        stateId: westBengal._id,
        districtId: kolkata._id,
        blockId: zone.gpId ? (await GramPanchayat.findById(zone.gpId)).blockId : null,
        gpId: zone.gpId,
      });

      const agent2 = await CollectionAgent.create({
        userId: user2._id,
        name: user2.name,
        email: user2.email,
        phone: `+91-98765${String(i * 2 + 2).padStart(5, '0')}`,
        gpId: zone.gpId,
        zoneId: zone._id,
        assignedVanId: van._id,
        employeeId: `EMP-${String(i * 2 + 2).padStart(4, '0')}`,
      });
      agents.push(agent2);
    }
    console.log(`✅ ${agents.length} Collection Agents created\n`);

    // 9. Create Dumping Sites (1 per GP)
    console.log('🏭 Creating Dumping Sites...');
    const dumpSites = [];
    for (let i = 0; i < gps.length; i++) {
      const gp = gps[i];
      const qrCode = generateDumpSiteQRData(
        new mongoose.Types.ObjectId().toString(),
        `Dump Site ${i + 1}`,
        gp._id.toString()
      );

      const site = await DumpingSite.create({
        name: `${gp.name} - Dump Site`,
        gpId: gp._id,
        qrCode,
        latitude: 22.5726 + (i * 0.01),
        longitude: 88.3639 + (i * 0.01),
        capacity: 100,
        address: `Dump Site Location ${i + 1}`,
      });
      dumpSites.push(site);
    }
    console.log(`✅ ${dumpSites.length} Dumping Sites created\n`);

    // 10. Create Houses (10 per zone)
    console.log('🏠 Creating Houses...');
    const houses = [];
    const { generateHouseQRData } = await import('../utils/qrGenerator.js');
    
    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];
      const { House } = await import('../models/House.js');
      
      for (let j = 1; j <= 10; j++) {
        const houseNum = `H-${String(i * 10 + j).padStart(4, '0')}`;
        const qrCode = generateHouseQRData(
          new mongoose.Types.ObjectId().toString(),
          houseNum,
          zone.gpId.toString()
        );
        
        const house = await House.create({
          houseNumber: houseNum,
          ownerName: `Owner ${i * 10 + j}`,
          address: `${houseNum}, Street ${j}, Zone ${zone.name}`,
          gpId: zone.gpId,
          zoneId: zone._id,
          qrCode,
          latitude: 22.5726 + (i * 0.001) + (j * 0.0001),
          longitude: 88.3639 + (i * 0.001) + (j * 0.0001),
          isGPSActive: true,
          totalMembers: Math.floor(Math.random() * 6) + 2,
          assignedVanId: vans[i]._id,
        });
        houses.push(house);
      }
    }
    console.log(`✅ ${houses.length} Houses created\n`);

    // 11. Create Collection Logs (for today and yesterday)
    console.log('📊 Creating Collection Logs...');
    const { Collection } = await import('../models/Collection.js');
    const collections = [];
    
    // Create collections for today (50% of houses)
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    
    for (let i = 0; i < Math.floor(houses.length * 0.5); i++) {
      const house = houses[i];
      const agent = agents.find(a => a.zoneId.toString() === house.zoneId.toString());
      
      if (agent) {
        const collection = await Collection.create({
          houseId: house._id,
          agentId: agent._id,
          gpId: house.gpId,
          agentLatitude: house.latitude,
          agentLongitude: house.longitude,
          solidWaste: Math.random() * 5 + 1,
          plasticWaste: Math.random() * 2,
          organicWaste: Math.random() * 3,
          eWaste: Math.random() * 0.5,
          totalWaste: 0, // Will be calculated by pre-save hook if exists
          collectionDate: today,
          status: i % 3 === 0 ? 'DUMPED' : 'COLLECTED',
          dumpSiteId: i % 3 === 0 ? dumpSites.find(d => d.gpId.toString() === house.gpId.toString())?._id : null,
          notes: 'Regular collection',
        });
        
        // Calculate total waste
        collection.totalWaste = collection.solidWaste + collection.plasticWaste + collection.organicWaste + collection.eWaste;
        await collection.save();
        collections.push(collection);
      }
    }
    
    // Create collections for yesterday (70% of houses)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);
    
    for (let i = 0; i < Math.floor(houses.length * 0.7); i++) {
      const house = houses[i];
      const agent = agents.find(a => a.zoneId.toString() === house.zoneId.toString());
      
      if (agent) {
        const collection = await Collection.create({
          houseId: house._id,
          agentId: agent._id,
          gpId: house.gpId,
          agentLatitude: house.latitude,
          agentLongitude: house.longitude,
          solidWaste: Math.random() * 5 + 1,
          plasticWaste: Math.random() * 2,
          organicWaste: Math.random() * 3,
          eWaste: Math.random() * 0.5,
          totalWaste: 0,
          collectionDate: yesterday,
          status: 'DUMPED',
          dumpSiteId: dumpSites.find(d => d.gpId.toString() === house.gpId.toString())?._id,
          notes: 'Regular collection',
        });
        
        collection.totalWaste = collection.solidWaste + collection.plasticWaste + collection.organicWaste + collection.eWaste;
        await collection.save();
        collections.push(collection);
      }
    }
    console.log(`✅ ${collections.length} Collection Logs created\n`);

    // 12. Create Attendance Records (for today)
    console.log('📅 Creating Attendance Records...');
    const { Attendance } = await import('../models/Attendance.js');
    const attendanceRecords = [];
    
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    for (const agent of agents) {
      const checkIn = new Date();
      checkIn.setHours(6, Math.floor(Math.random() * 30), 0, 0);
      
      const checkOut = new Date();
      checkOut.setHours(14, Math.floor(Math.random() * 60), 0, 0);
      
      const attendance = await Attendance.create({
        agentId: agent._id,
        date: todayDate,
        checkInTime: checkIn,
        checkInLatitude: 22.5726 + Math.random() * 0.01,
        checkInLongitude: 88.3639 + Math.random() * 0.01,
        checkOutTime: checkOut,
        checkOutLatitude: 22.5726 + Math.random() * 0.01,
        checkOutLongitude: 88.3639 + Math.random() * 0.01,
        status: 'PRESENT',
      });
      attendanceRecords.push(attendance);
    }
    console.log(`✅ ${attendanceRecords.length} Attendance Records created\n`);

    // Summary
    console.log('\n========================================');
    console.log('✅ DATABASE SEEDING COMPLETED!');
    console.log('========================================\n');
    console.log('📊 Summary:');
    console.log(`   • 1 State (${westBengal.name})`);
    console.log(`   • 1 District (${kolkata.name})`);
    console.log(`   • ${blocks.length} Blocks`);
    console.log(`   • ${gps.length} GPs/Municipalities`);
    console.log(`   • ${zones.length} Zones`);
    console.log(`   • ${vans.length} Vans`);
    console.log(`   • ${agents.length} Collection Agents`);
    console.log(`   • ${dumpSites.length} Dumping Sites`);
    console.log(`   • ${houses.length} Houses`);
    console.log(`   • ${collections.length} Collection Logs`);
    console.log(`   • ${attendanceRecords.length} Attendance Records`);
    console.log('\n👤 Test User Accounts:');
    console.log('   STATE ADMIN:');
    console.log('      Email: state@admin.com');
    console.log('      Password: admin123');
    console.log('   DISTRICT ADMIN:');
    console.log('      Email: district@admin.com');
    console.log('      Password: admin123');
    console.log('   BLOCK ADMIN:');
    console.log('      Email: blockbn@admin.com');
    console.log('      Password: admin123');
    console.log('   \n📍 MUNICIPALITY ADMINS:');
    console.log('      1. North GP:');
    console.log('         Email: gpbn-gp1@admin.com');
    console.log('         Password: admin123');
    console.log('      2. Central Municipality (TEST):');
    console.log('         Email: central@municipality.com');
    console.log('         Password: test123');
    console.log('      3. South Municipality (TEST):');
    console.log('         Email: south@municipality.com');
    console.log('         Password: test123');
    console.log('   \n👷 COLLECTION AGENTS:');
    console.log('      1. Email: agent1@waste.com');
    console.log('         Password: agent123');
    console.log('      2. Email: agent.central@waste.com (TEST)');
    console.log('         Password: test123');
    console.log('\n========================================\n');

    await disconnectDatabase();
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
