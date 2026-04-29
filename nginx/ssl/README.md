# SSL Certificates

This directory should contain your SSL certificates for HTTPS.

## For Development/Testing

Generate a self-signed certificate:

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## For Production

### Option 1: Let's Encrypt (Recommended)

Use certbot to obtain free SSL certificates:

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
```

### Option 2: Commercial Certificate

Place your certificate files in this directory:

- `cert.pem` - Your SSL certificate (or `fullchain.pem` for Let's Encrypt)
- `key.pem` - Your private key

## File Permissions

Ensure proper permissions:

```bash
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem
```

## Security Note

**Never commit actual SSL certificates to version control!**

This directory is included in `.gitignore`.
