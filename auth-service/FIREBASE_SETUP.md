# Firebase Setup Guide

## Issue
You're getting "FIREBASE_SERVICE_ACCOUNT_JSON is not set" error when trying to authenticate with Firebase.

## Solution

### 1. Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Download the JSON file

### 2. Create .env File

Create a `.env` file in the `auth-service` directory with the following content:

```env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project-id","private_key_id":"your-private-key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
```

### 3. Important Notes

- **FIREBASE_SERVICE_ACCOUNT_JSON**: This must be the entire JSON content from your downloaded service account file, but formatted as a single line string (no line breaks)
- The JSON should be properly escaped for the environment variable
- **NEVER commit the .env file to git** - it contains sensitive credentials

### 4. Restart the Service

After setting up the environment variables, restart your auth service:

```bash
cd auth-service
npm start
```

## Testing

Once configured, your Firebase authentication should work with the API client interface you're using.

## Security Note

- The `.env` file is already in `.gitignore` to prevent accidental commits
- Always use `.env.example` files for templates with placeholder values
- Never commit real credentials to version control
