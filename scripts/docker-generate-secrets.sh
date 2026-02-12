#!/bin/bash
set -e

echo "================================================"
echo "Docker Secrets Generator"
echo "================================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env first:"
    echo "  cp .env.example .env"
    exit 1
fi

echo ""
echo "Checking .env file..."

# Check NEXTAUTH_SECRET
NEEDS_NEXTAUTH=false
if grep -q "^NEXTAUTH_SECRET=" .env; then
    CURRENT_NEXTAUTH=$(grep "^NEXTAUTH_SECRET=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ -z "$CURRENT_NEXTAUTH" ] || [ "$CURRENT_NEXTAUTH" = "your-nextauth-secret-here" ] || [ "$CURRENT_NEXTAUTH" = "dev-secret-change-in-production" ]; then
        NEEDS_NEXTAUTH=true
    else
        echo "   ⚠️  NEXTAUTH_SECRET already set (skipping)"
    fi
else
    NEEDS_NEXTAUTH=true
fi

# Check ENCRYPTION_KEY
NEEDS_ENCRYPTION=false
if grep -q "^ENCRYPTION_KEY=" .env; then
    CURRENT_ENCRYPTION=$(grep "^ENCRYPTION_KEY=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ -z "$CURRENT_ENCRYPTION" ] || [ "$CURRENT_ENCRYPTION" = "your-encryption-key-here" ]; then
        NEEDS_ENCRYPTION=true
    else
        echo "   ⚠️  ENCRYPTION_KEY already set (skipping)"
    fi
else
    NEEDS_ENCRYPTION=true
fi

# Exit if nothing needs to be updated
if [ "$NEEDS_NEXTAUTH" = false ] && [ "$NEEDS_ENCRYPTION" = false ]; then
    echo ""
    echo "✓ All secrets already configured!"
    echo ""
    echo "To force regenerate, remove the values from .env first"
    echo "Next steps:"
    echo "  1. Review .env configuration"
    echo "  2. Run: docker compose up -d"
    exit 0
fi

echo ""
echo "Generating secrets..."
echo ""

# Generate NEXTAUTH_SECRET if needed
if [ "$NEEDS_NEXTAUTH" = true ]; then
    echo "1. Generating NEXTAUTH_SECRET..."
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "   ✓ Generated: ${NEXTAUTH_SECRET:0:20}..."
fi

# Generate ENCRYPTION_KEY if needed
if [ "$NEEDS_ENCRYPTION" = true ]; then
    echo "2. Generating ENCRYPTION_KEY..."
    
    # Check if we can use node locally
    if command -v node &> /dev/null && [ -f "scripts/generate-encryption-key.ts" ]; then
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            echo "   Installing dependencies..."
            npm install --silent
        fi
        
        # Generate encryption key using existing script
        ENCRYPTION_KEY=$(npx tsx scripts/generate-encryption-key.ts 2>/dev/null | tail -n 1)
    else
        # Fallback: generate random hex string
        ENCRYPTION_KEY=$(openssl rand -hex 32)
    fi
    echo "   ✓ Generated: ${ENCRYPTION_KEY:0:20}..."
fi

echo ""
echo "Updating .env file..."

# Update NEXTAUTH_SECRET if needed
if [ "$NEEDS_NEXTAUTH" = true ]; then
    if grep -q "^NEXTAUTH_SECRET=" .env; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|" .env
        else
            sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|" .env
        fi
        echo "   ✓ Updated NEXTAUTH_SECRET"
    else
        echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"" >> .env
        echo "   ✓ Added NEXTAUTH_SECRET"
    fi
fi

# Update ENCRYPTION_KEY if needed
if [ "$NEEDS_ENCRYPTION" = true ]; then
    if grep -q "^ENCRYPTION_KEY=" .env; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"|" .env
        else
            sed -i "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"|" .env
        fi
        echo "   ✓ Updated ENCRYPTION_KEY"
    else
        echo "ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"" >> .env
        echo "   ✓ Added ENCRYPTION_KEY"
    fi
fi

echo ""
echo "================================================"
echo "✓ Secrets generated successfully!"
echo "================================================"
echo ""
echo "Updated secrets:"
if [ "$NEEDS_NEXTAUTH" = true ]; then
    echo "  - NEXTAUTH_SECRET"
fi
if [ "$NEEDS_ENCRYPTION" = true ]; then
    echo "  - ENCRYPTION_KEY"
fi
echo ""
echo "Next steps:"
echo "  1. Review .env configuration"
echo "  2. Run: docker compose up -d"
echo ""
