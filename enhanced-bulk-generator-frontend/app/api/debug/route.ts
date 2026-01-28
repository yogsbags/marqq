import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Debug endpoint to check Railway environment
 * Access via: /api/debug
 */
export async function GET(req: NextRequest) {
  try {
    const cwd = process.cwd()
    const backendDir = path.join(cwd, 'backend')
    const csvPath = path.join(backendDir, 'data', 'research-gaps.csv')

    // Check if files exist
    const checks = {
      cwd,
      backendDirExists: fs.existsSync(backendDir),
      backendPath: backendDir,
      csvExists: fs.existsSync(csvPath),
      csvPath,
      nodeVersion: process.version,
      platform: process.platform,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        RAILWAY: process.env.RAILWAY_ENVIRONMENT_NAME || 'Not on Railway',
      }
    }

    // Try to read CSV if it exists
    if (checks.csvExists) {
      const csvContent = fs.readFileSync(csvPath, 'utf-8')
      const lines = csvContent.split('\n')
      checks['csvLineCount'] = lines.length
      checks['csvSample'] = lines.slice(0, 3).join('\n')
    }

    // Check if backend files exist
    const backendFiles = fs.existsSync(backendDir)
      ? fs.readdirSync(backendDir)
      : []
    checks['backendFiles'] = backendFiles

    return NextResponse.json({
      success: true,
      checks,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
