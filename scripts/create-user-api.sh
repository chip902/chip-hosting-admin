#!/bin/bash

# Create first admin user via Payload API
# Make sure your dev server is running on port 3000

echo "Creating first admin user via API..."

curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@chiphostingadmin.com",
    "password": "AdminPassword123!"
  }'

echo -e "\n\nUser creation request sent."
echo "If successful, you can login with:"
echo "Email: admin@chiphostingadmin.com"
echo "Password: AdminPassword123!"
echo ""
echo "IMPORTANT: Change this password immediately after first login!"