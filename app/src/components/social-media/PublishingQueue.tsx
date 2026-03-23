'use client'

import React from 'react'
import {
  Send,
  ExternalLink,
  Copy,
  Eye,
  CheckCircle2,
  Clock,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
} from 'lucide-react'

type PublishingQueueProps = {
  publishedUrls: Record<string, string>
  platforms: string[]
}

export default function PublishingQueue({ publishedUrls, platforms }: PublishingQueueProps) {
  const platformConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    linkedin: { icon: Linkedin, color: 'bg-orange-500', label: 'LinkedIn' },
    instagram: { icon: Instagram, color: 'bg-orange-400', label: 'Instagram' },
    youtube: { icon: Youtube, color: 'bg-orange-600', label: 'YouTube' },
    facebook: { icon: Facebook, color: 'bg-orange-500', label: 'Facebook' },
    twitter: { icon: Twitter, color: 'bg-amber-500', label: 'Twitter/X' },
  }

  return (
    <div className="space-y-4">
      <h3 className="mb-4 flex items-center text-lg font-semibold text-foreground">
        <Send className="mr-2 h-5 w-5 text-orange-500" />
        Publishing Queue
      </h3>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map(platform => {
          const config = platformConfig[platform]
          const url = publishedUrls[platform]
          const isPublished = !!url
          const PlatformIcon = config.icon

          return (
            <div
              key={platform}
              className={`rounded-[1.1rem] border p-4 transition-all ${
                isPublished
                  ? 'border-orange-200/80 bg-orange-50/80 dark:border-orange-900/40 dark:bg-orange-950/15'
                  : 'border-border bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${config.color}`}>
                    <PlatformIcon className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-foreground">{config.label}</h4>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  isPublished
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {isPublished ? 'Published' : 'Uploading...'}
                </span>
              </div>

              {isPublished ? (
                <div className="space-y-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center break-all text-xs text-orange-600 hover:text-orange-700 hover:underline dark:text-orange-300 dark:hover:text-orange-200"
                  >
                    <ExternalLink className="h-3 w-3 mr-1 inline flex-shrink-0" />
                    {url}
                  </a>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(url)}
                      className="flex flex-1 items-center justify-center rounded bg-orange-500 px-3 py-1 text-xs text-white transition-colors hover:bg-orange-600"
                    >
                      <Copy className="h-3 w-3 mr-1 inline" />
                      Copy URL
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center rounded border border-orange-200/80 bg-background px-3 py-1 text-center text-xs text-foreground transition-colors hover:bg-accent dark:border-orange-900/40"
                    >
                      <Eye className="h-3 w-3 mr-1 inline" />
                      View Post
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-orange-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs text-muted-foreground">Publishing to {config.label}...</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 rounded-[1.1rem] border border-orange-200/80 bg-orange-50/80 p-4 dark:border-orange-900/40 dark:bg-orange-950/15">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Publishing Progress</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {Object.keys(publishedUrls).length} of {platforms.length} platforms complete
            </p>
          </div>
          <div>
            {Object.keys(publishedUrls).length === platforms.length
              ? <CheckCircle2 className="h-6 w-6 text-orange-500" />
              : <Clock className="h-6 w-6 text-muted-foreground" />
            }
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-orange-100 dark:bg-white/10">
          <div
            className="h-2 rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${(Object.keys(publishedUrls).length / platforms.length) * 100}%` }}
          />
        </div>
      </div>

      {/* All Published Message */}
      {Object.keys(publishedUrls).length === platforms.length && (
        <div className="rounded-[1.1rem] border border-orange-200/80 bg-orange-50/80 p-4 text-center dark:border-orange-900/40 dark:bg-orange-950/15">
          <p className="font-semibold text-orange-700 dark:text-orange-300">
            Campaign successfully published to all platforms!
          </p>
        </div>
      )}
    </div>
  )
}
