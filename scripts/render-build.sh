#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npx prisma generate
npm run build
# npx prisma migrate deploy # Uncomment this when you have migrations or want to auto-apply migrations
