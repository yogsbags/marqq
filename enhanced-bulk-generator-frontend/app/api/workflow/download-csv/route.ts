import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename parameter is required' },
        { status: 400 }
      )
    }

    // Security: Only allow .csv files and sanitize filename
    if (!filename.endsWith('.csv') || filename.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    // Construct path to CSV file
    // Try multiple possible paths for different environments
    const possiblePaths = [
      path.join(process.cwd(), 'backend', 'data', filename),  // Railway: frontend/backend/data/
      path.join(process.cwd(), '..', 'data', filename),       // Local: ../data/
      path.join(process.cwd(), '..', 'backend', 'data', filename)  // Alternative
    ]

    const csvPath = possiblePaths.find(p => fs.existsSync(p))

    // Check if file exists
    if (!csvPath) {
      return NextResponse.json(
        { error: `File not found: ${filename}. Searched paths: ${possiblePaths.join(', ')}` },
        { status: 404 }
      )
    }

    // Read CSV file
    const fileContent = fs.readFileSync(csvPath, 'utf-8')

    // Return CSV file with appropriate headers for download
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('CSV download error:', error)
    return NextResponse.json(
      { error: 'Failed to download CSV file' },
      { status: 500 }
    )
  }
}
