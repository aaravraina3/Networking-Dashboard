# Generate Networking Dashboard Sync

A tool to synchronize Generate club onboarding form data with the networking dashboard Google Sheet. This tool handles deduplication of thousands of onboarding entries and merges them with existing networking dashboard data.

## 🎯 What This Tool Does

1. **Fetches onboarding data** from your Generate onboarding form Google Sheet
2. **Deduplicates entries** by keeping the most recent job submission per person
3. **Merges data** with existing networking dashboard entries
4. **Updates the dashboard** with current/alumni status and latest information
5. **Handles thousands of entries** efficiently with proper error handling

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
```bash
cp env.example .env
```

Edit `.env` with your Google Sheets API credentials and file IDs.

### 3. Preview Changes (Recommended First)
```bash
npm run preview
```

### 4. Run the Sync
```bash
npm run sync
```

## 🔧 Configuration

### Required Environment Variables

```bash
# Google Sheets API Configuration
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Google Sheets File IDs
ONBOARDING_FORM_FILE_ID=your_onboarding_form_sheet_id
NETWORKING_DASHBOARD_FILE_ID=your_networking_dashboard_sheet_id
```

### Optional Configuration

```bash
# Sheet ranges (adjust if your data doesn't start from A1)
ONBOARDING_SHEET_RANGE=A:Z
NETWORKING_SHEET_RANGE=A:Z

# Sheet names (if your data is in specific sheets)
ONBOARDING_SHEET_NAME=Form Responses 1
NETWORKING_SHEET_NAME=Sheet1
```

## 📊 How It Works

### Deduplication Strategy
- **Identifies duplicates** by email address
- **Keeps most recent entry** based on submission timestamp
- **Preserves all job history** but only uses latest for networking dashboard

### Status Detection
- **Current members**: Recent graduates or currently enrolled students
- **Alumni**: Graduated in previous years
- **Auto-detection** based on graduation year or explicit status field

### Data Merging
- **New entries**: Added to networking dashboard
- **Existing entries**: Updated with latest information
- **Preserves custom fields** from existing dashboard

## 🎮 Commands

### Interactive Commands
```bash
# Main interactive interface
npm start

# Preview changes without making updates
npm run preview

# Run full sync
npm run sync

# Get setup help
npm start setup
```

### Direct Commands
```bash
# Direct sync (bypasses confirmation)
node src/sync.js

# Direct preview
node src/preview.js
```

## 📋 Google Sheets Setup

### 1. Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create a service account
5. Download the JSON key file

### 2. Share Your Sheets
1. Open your Google Sheets
2. Click "Share" button
3. Add the service account email (from JSON key file)
4. Give "Editor" permissions

### 3. Get File IDs
- Copy the file ID from your Google Sheets URL
- Example: `https://docs.google.com/spreadsheets/d/FILE_ID_HERE/edit`

## 📈 Expected Data Structure

### Onboarding Form Columns
The tool automatically detects these columns (case-insensitive):
- **Email** (required)
- **Name** / **Full Name**
- **Company** / **Current Company**
- **Position** / **Job Title** / **Role**
- **Location** / **City**
- **LinkedIn** / **LinkedIn Profile**
- **GitHub** / **GitHub Profile**
- **Graduation Year** / **Year**
- **Status** / **Current Status**
- **Timestamp** / **Submission Date**

### Networking Dashboard Output
The tool creates/updates these columns:
- **Email**
- **Name**
- **Company**
- **Position**
- **Location**
- **LinkedIn**
- **GitHub**
- **Graduation Year**
- **Status** (current/alumni)
- **Last Updated**

## 🔍 Troubleshooting

### Common Issues

**Authentication Error**
- Check your service account credentials
- Ensure the service account has access to your sheets
- Verify the JSON key format (newlines should be `\n`)

**Column Not Found**
- The tool tries multiple column name variations
- Check your sheet headers match expected names
- Use the preview command to see what columns are detected

**Permission Denied**
- Make sure the service account email has editor access
- Check that the file IDs are correct
- Verify the sheets are not restricted

### Debug Mode
Set `DEBUG=true` in your `.env` file for verbose logging.

## 🛡️ Safety Features

- **Preview mode**: See changes before applying them
- **Backup**: Always preview before syncing
- **Error handling**: Graceful failure with detailed error messages
- **Validation**: Checks for required data before processing

## 📝 Example Output

```
🚀 Starting Generate Networking Dashboard Sync

🔐 Initializing Google Sheets API authentication...
✅ Authentication successful
📥 Fetching onboarding data...
✅ Found 2,847 onboarding entries
🔄 Deduplicating onboarding data...
✅ Deduplicated: 1,234 duplicates removed, 1,613 unique people
📥 Fetching current networking dashboard data...
✅ Found 111 current networking entries
🔄 Merging data...
✅ Merged data: 1,613 total entries (1,502 new, 111 updated)
📤 Updating networking dashboard...
✅ Successfully updated networking dashboard with 1,613 people

✅ Sync completed successfully!

📊 Sync Statistics:
   • Total onboarding entries: 2,847
   • After deduplication: 1,613
   • Current dashboard entries: 111
   • Final entries: 1,613
   • New entries: 1,502
   • Updated entries: 111
```

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - see LICENSE file for details.
