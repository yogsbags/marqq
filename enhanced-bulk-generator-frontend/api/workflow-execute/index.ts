import { spawn } from 'child_process'
import { NextRequest } from 'next/server'
import path from 'path'

export const config = {
  maxDuration: 300, // 5 minutes (Vercel Pro plan)
  runtime: 'nodejs',
}

export default async function handler(req: NextRequest) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await req.json()
  const topicLimit = body.topicLimit || 1
  const category = body.category || 'derivatives'

  // Backend files are at the root level (one level up from frontend/)
  const backendDir = path.join(process.cwd(), '..')
  const mainJsPath = path.join(backendDir, 'main.js')

  console.log('Vercel Workflow Execution Request:', {
    backendDir,
    mainJsPath,
    topicLimit,
    category,
    cwd: process.cwd(),
  })

  return new Promise((resolve) => {
    const args = [
      mainJsPath,
      'full',
      '--auto-approve',
      '--topic-limit',
      topicLimit.toString(),
      '--category',
      category,
    ]

    console.log('Spawning process:', {
      executable: process.execPath,
      args,
      cwd: backendDir,
    })

    const nodeProcess = spawn(process.execPath, args, {
      cwd: backendDir,
      env: { ...process.env },
    })

    let output: string[] = []
    let errorOutput: string[] = []

    nodeProcess.stdout.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter((line) => line.trim())
      output.push(...lines)
      console.log('STDOUT:', data.toString())
    })

    nodeProcess.stderr.on('data', (data: Buffer) => {
      const error = data.toString()
      errorOutput.push(error)
      console.error('STDERR:', error)
    })

    nodeProcess.on('close', (code) => {
      console.log('Process exited with code:', code)

      if (code === 0) {
        resolve(
          new Response(
            JSON.stringify({
              success: true,
              output: output,
              exitCode: code,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        )
      } else {
        resolve(
          new Response(
            JSON.stringify({
              success: false,
              error: 'Workflow execution failed',
              output: output,
              errorOutput: errorOutput,
              exitCode: code,
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        )
      }
    })

    nodeProcess.on('error', (error) => {
      console.error('Process error:', error)
      resolve(
        new Response(
          JSON.stringify({
            success: false,
            error: error.message,
            output: output,
            errorOutput: errorOutput,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
    })

    // Timeout after 4.5 minutes (before Vercel's 5-minute limit)
    setTimeout(() => {
      nodeProcess.kill()
      resolve(
        new Response(
          JSON.stringify({
            success: false,
            error: 'Workflow execution timeout (4.5 minutes)',
            output: output,
            errorOutput: errorOutput,
          }),
          {
            status: 504,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
    }, 270000)
  })
}
