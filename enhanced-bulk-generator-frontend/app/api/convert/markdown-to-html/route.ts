import { marked } from 'marked'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Markdown to HTML Converter API
 * Converts markdown content to HTML with SEO metadata, excluding research verification
 */

// Configure marked options
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: false,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { markdownContent, seoMetadata } = body

    if (!markdownContent) {
      return NextResponse.json(
        { error: 'Markdown content is required' },
        { status: 400 }
      )
    }

    // Strip research verification section
    const contentWithoutResearch = stripResearchVerification(markdownContent)

    // Strip SEO metadata section from content
    const contentWithoutSeo = stripSeoMetadata(contentWithoutResearch)

    // Convert to HTML
    let htmlContent = await marked.parse(contentWithoutSeo)

    // Post-process HTML for special styling
    htmlContent = postProcessHtml(htmlContent)

    // Parse SEO metadata if provided
    let metaTitle = ''
    let metaDescription = ''
    let canonicalUrl = ''
    let focusKeyword = ''

    if (seoMetadata) {
      try {
        const seo = typeof seoMetadata === 'string' ? JSON.parse(seoMetadata) : seoMetadata
        metaTitle = seo.meta_title || seo.seo_title || ''
        metaDescription = seo.meta_description || seo.seo_description || ''
        canonicalUrl = seo.canonical_url || seo.url_slug || ''
        focusKeyword = seo.focus_keyword || seo.target_keyword || ''
      } catch (err) {
        console.error('Failed to parse SEO metadata:', err)
      }
    }

    // Generate SEO metadata HTML comments
    const seoMetadataBlock = generateSeoMetadataBlock(
      metaTitle,
      metaDescription,
      canonicalUrl,
      focusKeyword
    )

    // Combine HTML with SEO metadata
    const finalHtml = generateRawHtml(htmlContent, seoMetadataBlock)

    return NextResponse.json({
      success: true,
      html: finalHtml,
      metadata: {
        metaTitle,
        metaDescription,
        canonicalUrl,
        focusKeyword,
      },
    })
  } catch (error) {
    console.error('Error converting markdown to HTML:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Remove research verification section from markdown content
 */
function stripResearchVerification(content: string): string {
  // Match "### RESEARCH VERIFICATION" or similar heading followed by content until "---"
  const researchRegex = /^###?\s*RESEARCH VERIFICATION[\s\S]*?^---\s*$/im
  return content.replace(researchRegex, '').trim()
}

/**
 * Remove SEO metadata section from markdown content
 */
function stripSeoMetadata(content: string): string {
  const headingRegex = /^\s*##\s*SEO Metadata/im
  const match = content.match(headingRegex)
  if (!match || match.index === undefined) {
    return content.trim()
  }
  return content.slice(0, match.index).trim()
}

/**
 * Post-process HTML to add special styling
 */
function postProcessHtml(html: string): string {
  // Add special class to summary section
  html = html.replace(
    /<h2>Summary<\/h2>/i,
    '<h2>Summary</h2><div class="executive-summary">'
  )

  // Close summary div before next h2
  html = html.replace(
    /(<div class="executive-summary">[\s\S]*?)<h2>/,
    '$1</div><h2>'
  )

  // Add special class to Important Notes section
  html = html.replace(
    /<p><strong>Important Notes:<\/strong>/i,
    '<div class="important-notes"><p><strong>Important Notes:</strong>'
  )

  // Close important notes div after the "Created by" line
  html = html.replace(
    /(<div class="important-notes">[\s\S]*?<p><strong>Created by PL Capital Research Team[\s\S]*?<\/p>)/,
    '$1\n</div>'
  )

  return html
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }
  return text.replace(/[&<>"]/g, (m) => map[m])
}

/**
 * Generate SEO metadata HTML comment block
 */
function generateSeoMetadataBlock(
  metaTitle: string,
  metaDescription: string,
  canonicalUrl: string,
  focusKeyword: string
): string {
  if (!metaTitle && !metaDescription && !canonicalUrl && !focusKeyword) {
    return ''
  }

  let block = '\n<!-- SEO Metadata -->\n'

  if (canonicalUrl) {
    block += `<!-- SEO Optimized URL: ${escapeHtml(canonicalUrl)} -->\n`
  }
  if (metaTitle) {
    block += `<!-- SEO Meta Title: ${escapeHtml(metaTitle)} -->\n`
  }
  if (metaDescription) {
    block += `<!-- SEO Meta Description: ${escapeHtml(metaDescription)} -->\n`
  }
  if (focusKeyword) {
    block += `<!-- Focus Keyword: ${escapeHtml(focusKeyword)} -->\n`
  }

  return block
}

/**
 * Generate raw HTML (content + SEO metadata)
 */
function generateRawHtml(content: string, seoMetadataBlock: string): string {
  let html = content

  // Add SEO metadata block after content
  if (seoMetadataBlock) {
    html += '\n' + seoMetadataBlock
  }

  return html
}
