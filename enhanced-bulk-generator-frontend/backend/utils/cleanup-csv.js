#!/usr/bin/env node

/**
 * CSV Cleanup Utility
 * Removes malformed rows with empty or invalid IDs from stages 1-4
 *
 * Usage: node utils/cleanup-csv.js
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const dataDir = path.join(__dirname, '..', 'data');

// Stage configurations
const stages = [
  {
    stage: 1,
    file: 'research-gaps.csv',
    idField: 'gap_id',
    idPattern: /^GAP(-QW)?-\d+$/,
    description: 'Research Gaps'
  },
  {
    stage: 2,
    file: 'generated-topics.csv',
    idField: 'topic_id',
    idPattern: /^TOPIC-\d+$/,
    description: 'Generated Topics'
  },
  {
    stage: 3,
    file: 'topic-research.csv',
    idField: 'topic_research_id',
    idPattern: /^TR-\d+$/,
    description: 'Topic Research'
  },
  {
    stage: 4,
    file: 'created-content.csv',
    idField: 'content_id',
    idPattern: /^CONT-\d+$/,
    description: 'Created Content'
  }
];

console.log('🧹 CSV Cleanup Utility');
console.log('='.repeat(60));
console.log('This will remove malformed rows with invalid IDs\n');

let totalCleaned = 0;
let totalKept = 0;

stages.forEach(({ stage, file, idField, idPattern, description }) => {
  const filePath = path.join(dataDir, file);

  console.log(`\n📄 Stage ${stage}: ${description}`);
  console.log(`   File: ${file}`);

  if (!fs.existsSync(filePath)) {
    console.log('   ⚠️  File not found, skipping...');
    return;
  }

  try {
    // Read and parse CSV
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      skip_records_with_error: true,
      trim: true,
      escape: '"',
      quote: '"',
    });

    const originalCount = records.length;

    // Filter valid records
    const validRecords = records.filter((record) => {
      const idValue = record[idField];

      // Check if ID exists and matches pattern
      if (!idValue) {
        return false;
      }

      return idPattern.test(idValue.trim());
    });

    const cleanedCount = originalCount - validRecords.length;
    totalCleaned += cleanedCount;
    totalKept += validRecords.length;

    console.log(`   📊 Original: ${originalCount} rows`);
    console.log(`   ✅ Valid: ${validRecords.length} rows`);
    console.log(`   🗑️  Removed: ${cleanedCount} malformed rows`);

    if (cleanedCount > 0) {
      // Create backup
      const backupPath = `${filePath}.backup-${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`   💾 Backup created: ${path.basename(backupPath)}`);

      // Write cleaned CSV
      if (validRecords.length > 0) {
        const cleanedCsv = stringify(validRecords, {
          header: true,
          columns: Object.keys(validRecords[0])
        });
        fs.writeFileSync(filePath, cleanedCsv, 'utf-8');
        console.log(`   ✨ Cleaned CSV saved`);
      } else {
        // No valid records, write empty CSV with headers only
        const headers = Object.keys(records[0]);
        const emptyCsv = stringify([], {
          header: true,
          columns: headers
        });
        fs.writeFileSync(filePath, emptyCsv, 'utf-8');
        console.log(`   ⚠️  No valid records found, wrote empty CSV with headers`);
      }
    } else {
      console.log(`   ✅ No cleanup needed, all rows are valid`);
    }

  } catch (error) {
    console.error(`   ❌ Error processing ${file}:`, error.message);
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 CLEANUP SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Total valid rows kept: ${totalKept}`);
console.log(`🗑️  Total malformed rows removed: ${totalCleaned}`);

if (totalCleaned > 0) {
  console.log('\n💡 Backups created with timestamp suffix');
  console.log('   To restore: cp backup-file.csv original-file.csv');
}

console.log('\n✅ Cleanup complete!');
console.log('\nNext steps:');
console.log('1. Review the cleaned CSV files in data/');
console.log('2. Check if Stage 1 has approved gaps (approval_status = "Yes")');
console.log('3. Rerun stages as needed');
