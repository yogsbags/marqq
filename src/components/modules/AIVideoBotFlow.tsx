import { VideoGenFlow } from './VideoGenFlow';

interface AIVideoBotFlowProps {
  autoStart?: boolean;
}

export function AIVideoBotFlow({ autoStart = false }: AIVideoBotFlowProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
        <h1 className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2 uppercase">
          AI Video Bot
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Create engaging video content with AI-powered digital avatars for personalized customer interactions
        </p>
      </div>

      {/* Video Gen Flow */}
      <VideoGenFlow />
    </div>
  );
}
