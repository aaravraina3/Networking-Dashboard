import { google } from 'googleapis';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

/**
 * Networking Dashboard Synchronization Tool
 * 
 * This tool handles:
 * 1. Fetching data from Generate onboarding form Google Sheet
 * 2. Deduplicating entries (keeping most recent job per person)
 * 3. Merging with existing networking dashboard data
 * 4. Updating the networking dashboard Google Sheet
 */

class NetworkingSync {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.onboardingSheetId = process.env.ONBOARDING_FORM_FILE_ID;
    this.networkingSheetId = process.env.NETWORKING_DASHBOARD_FILE_ID;
    this.onboardingRange = process.env.ONBOARDING_SHEET_RANGE || 'A:Z';
    this.networkingRange = process.env.NETWORKING_SHEET_RANGE || 'A:Z';
    this.onboardingSheetName = process.env.ONBOARDING_SHEET_NAME;
    this.networkingSheetName = process.env.NETWORKING_SHEET_NAME;
  }

  /**
   * Initialize Google Sheets API authentication
   */
  async initializeAuth() {
    try {
      console.log(chalk.blue('🔐 Initializing Google Sheets API authentication...'));
      
      this.auth = await google.auth.getClient({
        projectId: process.env.GOOGLE_PROJECT_ID,
        credentials: {
          type: 'service_account',
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          client_id: process.env.GOOGLE_CLIENT_ID,
          token_url: 'https://oauth2.googleapis.com/token',
          universe_domain: 'googleapis.com',
        },
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.readonly',
        ],
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log(chalk.green('✅ Authentication successful'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Authentication failed:'), error.message);
      return false;
    }
  }

  /**
   * Get onboarding data from Google Sheet
   */
  async getOnboardingData() {
    try {
      console.log(chalk.blue('📥 Fetching onboarding data...'));
      
      const range = this.onboardingSheetName 
        ? `'${this.onboardingSheetName}'!${this.onboardingRange}`
        : this.onboardingRange;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.onboardingSheetId,
        range: range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log(chalk.yellow('⚠️  No onboarding data found'));
        return [];
      }

      const headers = rows[0];
      const data = [];
      
      console.log(chalk.blue(`📋 Onboarding data columns: ${headers.join(', ')}`));

      // Map column headers to expected fields (flexible mapping)
      const emailIndex = this.findColumnIndex(headers, ['Email', 'email', 'Email Address']);
      const nameIndex = this.findColumnIndex(headers, ['Name', 'name', 'Full Name', 'Full name']);
      const companyIndex = this.findColumnIndex(headers, ['Company', 'company', 'Current Company', 'Employer']);
      const positionIndex = this.findColumnIndex(headers, ['Position', 'position', 'Job Title', 'Role', 'Title']);
      const locationIndex = this.findColumnIndex(headers, ['Location', 'location', 'City', 'Where are you based?']);
      const linkedinIndex = this.findColumnIndex(headers, ['LinkedIn', 'linkedin', 'LinkedIn Profile', 'LinkedIn URL']);
      const githubIndex = this.findColumnIndex(headers, ['GitHub', 'github', 'GitHub Profile', 'GitHub URL']);
      const graduationIndex = this.findColumnIndex(headers, ['Graduation Year', 'graduationYear', 'Year', 'Graduation']);
      const statusIndex = this.findColumnIndex(headers, ['Status', 'status', 'Current Status', 'Member Status']);
      const dateIndex = this.findColumnIndex(headers, ['Timestamp', 'timestamp', 'Submission Date', 'Date']);

      if (emailIndex === -1) {
        throw new Error('Email column not found in onboarding data');
      }

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const email = row[emailIndex];
        
        if (!email || !email.trim()) continue; // Skip rows without email

        // Determine current status
        let currentStatus = 'current';
        if (statusIndex !== -1 && row[statusIndex]) {
          const status = row[statusIndex].toLowerCase();
          currentStatus = status.includes('alumni') ? 'alumni' : 'current';
        } else if (graduationIndex !== -1 && row[graduationIndex]) {
          const gradYear = parseInt(row[graduationIndex]);
          const currentYear = new Date().getFullYear();
          currentStatus = gradYear < currentYear ? 'alumni' : 'current';
        }

        // Parse submission date
        let submissionDate = new Date();
        if (dateIndex !== -1 && row[dateIndex]) {
          submissionDate = new Date(row[dateIndex]);
        }

        // Extract all available fields - using exact column names from your actual data
        const personalEmailIndex = this.findColumnIndex(headers, ['Personal_Email']);
        const phoneIndex = this.findColumnIndex(headers, ['Phone_Number']);
        const majorIndex = this.findColumnIndex(headers, ['Major']);
        const minorIndex = this.findColumnIndex(headers, ['Minor']);
        const collegeIndex = this.findColumnIndex(headers, ['College']);
        const schoolYearIndex = this.findColumnIndex(headers, ['School_Year']);
        const portfolioIndex = this.findColumnIndex(headers, ['Portfolio']);
        const semesterIndex = this.findColumnIndex(headers, ['Semester_Completed']);
        const durationIndex = this.findColumnIndex(headers, ['Duration']);
        const companyRatingIndex = this.findColumnIndex(headers, ['Company_Rating']);
        const roleRatingIndex = this.findColumnIndex(headers, ['Role_Rating']);
        const jobSearchIndex = this.findColumnIndex(headers, ['Job_Search_Method_1']);
        const industryIndex = this.findColumnIndex(headers, ['Industry']);
        const departmentIndex = this.findColumnIndex(headers, ['Department']);
        const gradYearUpdatedIndex = this.findColumnIndex(headers, ['Grad Year Updated']);

        data.push({
          email: email.trim().toLowerCase(),
          name: nameIndex !== -1 ? (row[nameIndex]?.trim() || '') : '',
          personalEmail: personalEmailIndex !== -1 ? (row[personalEmailIndex]?.trim() || '') : '',
          phone: phoneIndex !== -1 ? (row[phoneIndex]?.trim() || '') : '',
          major: majorIndex !== -1 ? (row[majorIndex]?.trim() || '') : '',
          minor: minorIndex !== -1 ? (row[minorIndex]?.trim() || '') : '',
          college: collegeIndex !== -1 ? (row[collegeIndex]?.trim() || '') : '',
          schoolYear: schoolYearIndex !== -1 ? (row[schoolYearIndex]?.trim() || '') : '',
          company: companyIndex !== -1 ? (row[companyIndex]?.trim() || '') : '',
          position: positionIndex !== -1 ? (row[positionIndex]?.trim() || '') : '',
          location: locationIndex !== -1 ? (row[locationIndex]?.trim() || '') : '',
          linkedin: linkedinIndex !== -1 ? (row[linkedinIndex]?.trim() || '') : '',
          github: githubIndex !== -1 ? (row[githubIndex]?.trim() || '') : '',
          portfolio: portfolioIndex !== -1 ? (row[portfolioIndex]?.trim() || '') : '',
          semester: semesterIndex !== -1 ? (row[semesterIndex]?.trim() || '') : '',
          duration: durationIndex !== -1 ? (row[durationIndex]?.trim() || '') : '',
          companyRating: companyRatingIndex !== -1 ? (row[companyRatingIndex]?.trim() || '') : '',
          roleRating: roleRatingIndex !== -1 ? (row[roleRatingIndex]?.trim() || '') : '',
          jobSearchMethod: jobSearchIndex !== -1 ? (row[jobSearchIndex]?.trim() || '') : '',
          industry: industryIndex !== -1 ? (row[industryIndex]?.trim() || '') : '',
          department: departmentIndex !== -1 ? (row[departmentIndex]?.trim() || '') : '',
          gradYearUpdated: gradYearUpdatedIndex !== -1 ? (row[gradYearUpdatedIndex]?.trim() || '') : '',
          graduationYear: graduationIndex !== -1 ? (row[graduationIndex]?.trim() || '') : '',
          currentStatus,
          submissionDate,
          rowId: i + 1,
        });
      }

      console.log(chalk.green(`✅ Found ${data.length} onboarding entries`));
      return data;
    } catch (error) {
      console.error(chalk.red('❌ Error fetching onboarding data:'), error.message);
      throw error;
    }
  }

  /**
   * Find column index by trying multiple possible names
   */
  findColumnIndex(headers, possibleNames) {
    for (const name of possibleNames) {
      const index = headers.findIndex(header => 
        header && header.toLowerCase().includes(name.toLowerCase())
      );
      if (index !== -1) return index;
    }
    return -1;
  }

  /**
   * Deduplicate onboarding data by keeping the most recent entry per email
   */
  deduplicateOnboardingData(data) {
    console.log(chalk.blue('🔄 Deduplicating onboarding data...'));
    
    const emailMap = new Map();
    
    // Sort by submission date (most recent first)
    const sortedData = [...data].sort((a, b) => b.submissionDate.getTime() - a.submissionDate.getTime());
    
    // Keep only the most recent entry per email
    for (const person of sortedData) {
      if (!emailMap.has(person.email)) {
        emailMap.set(person.email, person);
      }
    }
    
    const deduplicated = Array.from(emailMap.values());
    const duplicatesRemoved = data.length - deduplicated.length;
    
    console.log(chalk.green(`✅ Deduplicated: ${duplicatesRemoved} duplicates removed, ${deduplicated.length} unique people`));
    return deduplicated;
  }

  /**
   * Get current networking dashboard data
   */
  async getCurrentNetworkingData() {
    try {
      console.log(chalk.blue('📥 Fetching current networking dashboard data...'));
      
      const range = this.networkingSheetName 
        ? `'${this.networkingSheetName}'!${this.networkingRange}`
        : this.networkingRange;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.networkingSheetId,
        range: range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        console.log(chalk.yellow('⚠️  No current networking data found'));
        return [];
      }

      const headers = rows[0];
      const data = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const obj = {};
        
        headers.forEach((header, index) => {
          if (header) {
            obj[this.camelize(header)] = row[index] || '';
          }
        });
        
        obj.id = i + 1;
        data.push(obj);
      }

      console.log(chalk.green(`✅ Found ${data.length} current networking entries`));
      return data;
    } catch (error) {
      console.error(chalk.red('❌ Error fetching current networking data:'), error.message);
      throw error;
    }
  }

  /**
   * Merge onboarding data with current networking dashboard data
   * CONSERVATIVE: Only adds new people, keeps existing people unchanged
   */
  mergeNetworkingData(onboardingData, currentData) {
    console.log(chalk.blue('🔄 Merging data (conservative mode - keeping existing people unchanged)...'));
    
    const currentEmailSet = new Set(
      currentData.map(person => person.email?.toLowerCase()).filter(Boolean)
    );

    // Find ONLY new people from onboarding data (not already in dashboard)
    const newPeople = onboardingData.filter(person => !currentEmailSet.has(person.email));
    
    // Keep ALL existing people exactly as they are (no updates)
    const existingPeople = currentData.map(currentPerson => ({
      email: currentPerson.email?.toLowerCase() || '',
      name: currentPerson.name || '',
      company: currentPerson.company || '',
      position: currentPerson.position || '',
      location: currentPerson.location || '',
      linkedin: currentPerson.linkedin || '',
      github: currentPerson.github || '',
      graduationYear: currentPerson.graduationYear || '',
      currentStatus: currentPerson.currentStatus || 'current',
      submissionDate: new Date(),
      rowId: currentPerson.id || 0,
    }));

    const mergedData = [...existingPeople, ...newPeople];
    
    console.log(chalk.green(`✅ Merged data: ${mergedData.length} total entries (${newPeople.length} new people added, ${existingPeople.length} existing people kept unchanged)`));
    return mergedData;
  }

  /**
   * Update the networking dashboard Google Sheet - SAFE APPEND ONLY
   * Only adds new people without touching existing data
   */
  async updateNetworkingDashboard(mergedData, currentData) {
    try {
      console.log(chalk.blue('📤 Adding new people to networking dashboard (append-only mode)...'));
      
      // Find only the new people (not already in current data)
      const currentEmailSet = new Set(
        currentData.map(person => person.email?.toLowerCase()).filter(Boolean)
      );
      
      const newPeople = mergedData.filter(person => !currentEmailSet.has(person.email));
      
      if (newPeople.length === 0) {
        console.log(chalk.yellow('⚠️  No new people to add'));
        return {
          success: true,
          rowsUpdated: 0,
          message: 'No new people to add',
        };
      }

      console.log(chalk.blue(`📝 Adding ${newPeople.length} new people to the end of the sheet...`));

      // Get current sheet info to find where to append
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.networkingSheetId,
        range: this.networkingSheetName ? `'${this.networkingSheetName}'!A:Z` : 'A:Z',
      });

      const existingRows = response.data.values || [];
      const nextRow = existingRows.length + 1;

      // Get the actual column structure from existing data
      const headers = existingRows[0] || [];
      console.log(chalk.blue(`📋 Found ${headers.length} columns in existing sheet: ${headers.join(', ')}`));
      
      // Map person data to match existing column structure
      const newRows = newPeople.map(person => {
        const row = new Array(headers.length).fill(''); // Initialize empty row
        
        // Map to existing columns based on header names
        headers.forEach((header, index) => {
          const headerLower = header.toLowerCase();
          
          if (headerLower.includes('email') && !headerLower.includes('personal')) {
            row[index] = person.email;
          } else if (headerLower.includes('name') && !headerLower.includes('company')) {
            row[index] = person.name;
          } else if (headerLower.includes('personal') && headerLower.includes('email')) {
            row[index] = person.personalEmail || '';
          } else if (headerLower.includes('phone')) {
            row[index] = person.phone || '';
          } else if (headerLower.includes('major')) {
            row[index] = person.major || '';
          } else if (headerLower.includes('minor')) {
            row[index] = person.minor || '';
          } else if (headerLower.includes('college')) {
            row[index] = person.college || '';
          } else if (headerLower.includes('school') && headerLower.includes('year')) {
            row[index] = person.schoolYear || '';
          } else if (headerLower.includes('graduation')) {
            row[index] = person.graduationYear || '';
          } else if (headerLower.includes('linkedin')) {
            row[index] = person.linkedin || '';
          } else if (headerLower.includes('portfolio')) {
            row[index] = person.portfolio || '';
          } else if (headerLower.includes('number') && headerLower.includes('position')) {
            row[index] = person.positionsCount || '';
          } else if (headerLower.includes('company') && !headerLower.includes('rating')) {
            row[index] = person.company || '';
          } else if (headerLower.includes('job') && headerLower.includes('title')) {
            row[index] = person.position || '';
          } else if (headerLower.includes('semester')) {
            row[index] = person.semester || '';
          } else if (headerLower.includes('duration')) {
            row[index] = person.duration || '';
          } else if (headerLower.includes('company') && headerLower.includes('rating')) {
            row[index] = person.companyRating || '';
          } else if (headerLower.includes('role') && headerLower.includes('rating')) {
            row[index] = person.roleRating || '';
          } else if (headerLower.includes('job') && headerLower.includes('search')) {
            row[index] = person.jobSearchMethod || '';
          } else if (headerLower.includes('industry')) {
            row[index] = person.industry || '';
          }
        });
        
        return row;
      });

      // Append new data to the end of the sheet
      const lastColumn = String.fromCharCode(65 + headers.length - 1); // Convert to letter (A, B, C, etc.)
      const range = this.networkingSheetName 
        ? `'${this.networkingSheetName}'!A:${lastColumn}`
        : `A:${lastColumn}`;
        
      console.log(chalk.blue(`📝 Appending to range: ${range}`));
      
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.networkingSheetId,
        range: range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: newRows,
        },
      });

      console.log(chalk.green(`✅ Successfully added ${newRows.length} new people to networking dashboard`));
      return {
        success: true,
        rowsUpdated: newRows.length,
        message: `Successfully added ${newRows.length} new people to networking dashboard`,
      };
    } catch (error) {
      console.error(chalk.red('❌ Error updating networking dashboard:'), error.message);
      return {
        success: false,
        rowsUpdated: 0,
        message: `Failed to update networking dashboard: ${error.message}`,
      };
    }
  }

  /**
   * Complete synchronization process
   */
  async sync() {
    try {
      console.log(chalk.cyan.bold('\n🚀 Starting Generate Networking Dashboard Sync\n'));
      
      // Initialize authentication
      if (!(await this.initializeAuth())) {
        return { success: false, message: 'Authentication failed' };
      }

      // Step 1: Get onboarding data
      const onboardingData = await this.getOnboardingData();
      
      // Step 2: Deduplicate onboarding data
      const deduplicatedData = this.deduplicateOnboardingData(onboardingData);
      
      // Step 3: Get current networking data
      const currentData = await this.getCurrentNetworkingData();
      
      // Step 4: Merge data
      const mergedData = this.mergeNetworkingData(deduplicatedData, currentData);
      
      // Step 5: Update networking dashboard (append-only mode)
      const updateResult = await this.updateNetworkingDashboard(mergedData, currentData);
      
      if (!updateResult.success) {
        throw new Error(updateResult.message);
      }

      const newEntries = deduplicatedData.filter(person => 
        !currentData.some(current => current.email?.toLowerCase() === person.email)
      ).length;

      const stats = {
        totalOnboardingEntries: onboardingData.length,
        deduplicatedEntries: deduplicatedData.length,
        currentEntries: currentData.length,
        finalEntries: currentData.length + newEntries,
        newEntries: newEntries,
        updatedEntries: 0, // Conservative mode - no updates to existing people
      };

      console.log(chalk.green.bold('\n✅ Sync completed successfully!\n'));
      console.log(chalk.cyan('📊 Sync Statistics:'));
      console.log(chalk.white(`   • Total onboarding entries: ${stats.totalOnboardingEntries}`));
      console.log(chalk.white(`   • After deduplication: ${stats.deduplicatedEntries}`));
      console.log(chalk.white(`   • Current dashboard entries: ${stats.currentEntries}`));
      console.log(chalk.white(`   • Final entries: ${stats.finalEntries}`));
      console.log(chalk.green(`   • New entries: ${stats.newEntries}`));
      console.log(chalk.blue(`   • Updated entries: ${stats.updatedEntries}`));

      return {
        success: true,
        message: 'Sync completed successfully',
        stats,
      };
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Sync failed:'), error.message);
      return {
        success: false,
        message: `Sync failed: ${error.message}`,
      };
    }
  }

  /**
   * Preview sync without making changes
   */
  async preview() {
    try {
      console.log(chalk.cyan.bold('\n👀 Previewing Generate Networking Dashboard Sync\n'));
      
      // Initialize authentication
      if (!(await this.initializeAuth())) {
        return { success: false, message: 'Authentication failed' };
      }

      // Get data without making changes
      const onboardingData = await this.getOnboardingData();
      const deduplicatedData = this.deduplicateOnboardingData(onboardingData);
      const currentData = await this.getCurrentNetworkingData();
      
      const newEntries = deduplicatedData.filter(person => 
        !currentData.some(current => current.email?.toLowerCase() === person.email)
      ).length;
      
      const stats = {
        totalOnboardingEntries: onboardingData.length,
        deduplicatedEntries: deduplicatedData.length,
        currentEntries: currentData.length,
        newEntries,
        updatedEntries: deduplicatedData.length - newEntries,
      };

      console.log(chalk.cyan('📊 Preview Statistics:'));
      console.log(chalk.white(`   • Total onboarding entries: ${stats.totalOnboardingEntries}`));
      console.log(chalk.white(`   • After deduplication: ${stats.deduplicatedEntries}`));
      console.log(chalk.white(`   • Current dashboard entries: ${stats.currentEntries}`));
      console.log(chalk.green(`   • New entries that will be added: ${stats.newEntries}`));
      console.log(chalk.blue(`   • Existing entries that will be updated: ${stats.updatedEntries}`));

      return {
        success: true,
        message: 'Preview completed successfully',
        stats,
      };
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Preview failed:'), error.message);
      return {
        success: false,
        message: `Preview failed: ${error.message}`,
      };
    }
  }

  /**
   * Utility function to camelCase strings
   */
  camelize(str) {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  }
}

export default NetworkingSync;
