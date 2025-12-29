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

    console.log(`✅ Created 1 State Admin, 1 District Admin, ${blockAdmins.length} Block Admins, ${gpAdmins.length} GP Admins\n`);

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
    console.log('   GP ADMIN:');
    console.log('      Email: gpbn-gp1@admin.com');
    console.log('      Password: admin123');
    console.log('   COLLECTION AGENT:');
    console.log('      Email: agent1@waste.com');
    console.log('      Password: agent123');
    console.log('\n========================================\n');

    await disconnectDatabase();
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
