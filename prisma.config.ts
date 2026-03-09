import * as dotenv from 'dotenv'
dotenv.config()

import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
})