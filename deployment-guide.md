# RentRight AI Deployment Guide

## Environment Variables Configuration

For secure deployment, you'll need to configure the following environment variables:

### Critical Security Keys

| Variable Name | Description | Required |
|---------------|-------------|----------|
| `ENCRYPTION_KEY` | Primary encryption key for document security | Yes |
| `ENCRYPTION_KEY_PREVIOUS` | Previous encryption keys (comma-separated) for decryption of older files | No |
| `ADMIN_API_KEY` | Secret key for admin API access | Yes |

### API Integration Keys

| Variable Name | Description | Required |
|---------------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for document analysis | Yes |
| `OPENAI_ASSISTANT_ID` | OpenAI Assistant ID (if using assistants) | No |
| `STRIPE_SECRET_KEY` | Stripe secret key for payment processing | Yes |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe public key for client-side integration | Yes |
| `SENDGRID_API_KEY` | SendGrid API key for email services | Yes |
| `SENDGRID_FROM_EMAIL` | SendGrid sender email address | Yes |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics measurement ID | No |

## Encryption Key Setup

For your production deployment, use the encryption key displayed during the application startup:

```
ENCRYPTION_KEY=d9a0b04fd7c532789d79bed1d1d741d0a8c165a0652de2e3c59a8319a4ee9995
```

This is critical for securing user documents. **Do not use file-based encryption for production environments.**

When generating a new key or rotating keys, make sure to:

1. Set the new key as `ENCRYPTION_KEY`
2. Move the old key to `ENCRYPTION_KEY_PREVIOUS` (comma-separated if multiple keys)
3. Run the re-encryption API to update all existing files:
   ```
   curl -X POST https://your-domain.com/api/admin/reencrypt \
     -H "x-admin-key: YOUR_ADMIN_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"reencryptAll": true}'
   ```

## Database Configuration

The application expects a PostgreSQL database to be available. The connection string should be provided via the `DATABASE_URL` environment variable.

## File Storage

Ensure the following directories exist and are writable by the application:
- `uploads` - Temporary storage for unencrypted files (these will be deleted after processing)
- `encrypted-uploads` - Secure storage for encrypted user documents

## Post-Deployment Verification

After deployment, verify the following:
1. Check the logs to confirm `Using primary encryption key from ENCRYPTION_KEY environment variable` appears
2. Verify document upload and encryption is working
3. Test the payment flow with Stripe test mode
4. Confirm email sending is functioning correctly

## Backup Considerations

Regularly backup:
1. The PostgreSQL database
2. Encrypted files in the `encrypted-uploads` directory
3. Your encryption keys (store securely outside the application)

## Security Reminders

- Never expose your encryption keys or API keys in client-side code
- Regularly rotate your encryption keys and API keys
- Keep all dependencies updated to patch security vulnerabilities
- Implement proper access controls for admin functionality