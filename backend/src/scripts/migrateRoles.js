import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { User } from '../models/User.js';

/**
 * MIGRATION SCRIPT
 * Updates existing user roles from old naming to new frontend-compatible naming
 * 
 * Old -> New mapping:
 * STATE_ADMIN -> STATE
 * DISTRICT_ADMIN -> DISTRICT
 * BLOCK_ADMIN -> BLOCK
 * GP_ADMIN -> MUNICIPALITY
 * COLLECTION_AGENT -> AGENT
 */

const migrateRoles = async () => {
  try {
    console.log('🔄 Starting role migration...\n');

    await connectDatabase();

    // Define the mapping
    const roleMapping = {
      'STATE_ADMIN': 'STATE',
      'DISTRICT_ADMIN': 'DISTRICT',
      'BLOCK_ADMIN': 'BLOCK',
      'GP_ADMIN': 'MUNICIPALITY',
      'COLLECTION_AGENT': 'AGENT'
    };

    let totalUpdated = 0;

    // Update each role
    for (const [oldRole, newRole] of Object.entries(roleMapping)) {
      const result = await User.updateMany(
        { role: oldRole },
        { $set: { role: newRole } }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${result.modifiedCount} users from ${oldRole} to ${newRole}`);
        totalUpdated += result.modifiedCount;
      }
    }

    console.log('\n========================================');
    if (totalUpdated > 0) {
      console.log(`✅ MIGRATION COMPLETE!`);
      console.log(`   Total users updated: ${totalUpdated}`);
    } else {
      console.log(`ℹ️  No users needed migration`);
      console.log(`   (Either already migrated or using new role names)`);
    }
    console.log('========================================\n');

    // Verify - show current role distribution
    const roleCounts = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    if (roleCounts.length > 0) {
      console.log('📊 Current role distribution:');
      roleCounts.forEach(({ _id, count }) => {
        console.log(`   ${_id}: ${count} user(s)`);
      });
      console.log('');
    }

    await disconnectDatabase();
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateRoles();
