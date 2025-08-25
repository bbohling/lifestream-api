# Strava API Setup Guide

## 🔧 Setting Up Strava API Credentials

To use this application, you need to create a Strava API application and configure your credentials.

### Step 1: Create Strava API Application

1. **Visit Strava API Settings**: Go to https://www.strava.com/settings/api
2. **Create API Application**: 
   - Click "Create & Manage Your App"
   - Fill out the application details:
     - **Application Name**: "Lifestream API" (or whatever you prefer)
     - **Category**: Choose appropriate category (e.g., "Data Importer")
     - **Club**: Leave blank unless you have a specific club
     - **Website**: http://localhost:3000 (for development)
     - **Authorization Callback Domain**: localhost
     - **Description**: Brief description of your application

3. **Get Your Credentials**: After creating, you'll see:
   - **Client ID**: A numeric ID (e.g., 12345)
   - **Client Secret**: A long alphanumeric string

### Step 2: Configure Environment Variables

Update your `.env` file with the actual credentials:

```env
# Replace these placeholder values with your actual Strava API credentials
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=your_actual_client_secret_from_strava

# Other configuration
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./production.db"
JWT_SECRET=your-super-secure-jwt-secret-key-here
CORS_ORIGIN=http://localhost:3000
```

### Step 3: User Authorization (Initial Setup)

Before you can sync data, you need to authorize your application to access your Strava data:

1. **Get Authorization URL**: You'll need to visit a URL like:
   ```
   https://www.strava.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000/auth/callback&approval_prompt=force&scope=read,activity:read_all
   ```

2. **Authorization Flow**: 
   - Replace `YOUR_CLIENT_ID` with your actual client ID
   - Visit the URL in your browser
   - Click "Authorize" 
   - You'll be redirected with a `code` parameter
   - Exchange this code for access and refresh tokens

### Step 4: Store User Tokens

You'll need to store the access token, refresh token, and expiration time in your database. The application expects a user record with:
- `accessToken`: Current access token
- `refreshToken`: Refresh token (for getting new access tokens)
- `expiresAt`: Unix timestamp when access token expires
- `athleteId`: Your Strava athlete ID

## 🔍 Checking Your Setup

Use this command to verify your credentials are configured correctly:

```bash
npm run setup:verify
```

## 🚨 Common Issues

### "client_id invalid" Error
- Double-check your `STRAVA_CLIENT_ID` in the `.env` file
- Make sure you're using the numeric Client ID, not the Client Secret
- Ensure there are no extra spaces or quotes around the values

### "client_secret invalid" Error  
- Verify your `STRAVA_CLIENT_SECRET` is correct
- The client secret is case-sensitive
- Make sure you copied the full secret without truncation

### Authorization Issues
- Make sure your callback domain matches what you set in Strava (localhost for development)
- Check that you're requesting the correct scopes (`read,activity:read_all`)
- Verify the authorization URL is formatted correctly

## 📚 Useful Links

- [Strava API Documentation](https://developers.strava.com/docs/)
- [Strava API Settings](https://www.strava.com/settings/api)
- [OAuth 2.0 Flow Documentation](https://developers.strava.com/docs/authentication/)

## 🔐 Security Notes

- **Never commit your `.env` file** to version control
- **Keep your Client Secret private** - don't share it publicly
- **Regenerate credentials** if you suspect they've been compromised
- **Use environment-specific credentials** for different environments (dev, staging, production)
