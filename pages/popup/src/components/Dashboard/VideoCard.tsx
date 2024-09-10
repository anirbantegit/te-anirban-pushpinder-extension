import React, { memo } from 'react';
import type { IBlockedVideoDetails } from '@extension/storage/lib';

export const VideoCard = memo(({ video }: { video: IBlockedVideoDetails }) => (
  <div className="border-b-[#f0f0f0] border-b border-solid">
    <div className="flex gap-[10px]">
      <div className="w-[90px] flex-[0_0_auto] h-[60px] flex items-center justify-center">
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-auto">
        <h4 className="text-sm font-medium">{video.title}</h4>
        <p className="text-xs">{video.channel}</p>
        <p className="text-xs text-gray-500">{new Date(video.detectedAt).toLocaleString()}</p>
      </div>
    </div>
  </div>
));

VideoCard.displayName = 'VideoCard';
