import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { PopupLayout } from '@src/components/layout/PopupLayout';
import { VideoManager } from '@src/components/Dashboard/VideoManage';
import type { IBlockedVideoDetails, typeExtensionVideoData } from '@extension/storage/lib';
import { blockedVideosByTabStorage, extensionStorage } from '@extension/storage';
import { Chip, CircularProgress, Switch, TextField } from '@mui/material';
import { UserEntries } from '@src/components/Dashboard/UserEntries';
import { VideoCard } from '@src/components/Dashboard/VideoCard';

// Helper function to get the current tab ID
const getCurrentTabId = async (): Promise<number> => {
  return new Promise<number>(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      resolve(tabs[0]?.id || 0); // Ensure that tabs[0] and tabs[0].id are defined
    });
  });
};

// BlockedSection component to reduce repeated code
const BlockedSection = memo(
  ({
    title,
    isProcessing,
    isDetecting,
    blockedCount,
    detectedCount,
    videos,
    accordian,
    onToggle,
  }: {
    title: string;
    isProcessing: boolean;
    isDetecting: boolean;
    blockedCount: number;
    detectedCount: number;
    videos: IBlockedVideoDetails[];
    accordian: boolean;
    onToggle: () => void;
  }) => (
    <div className="w-full">
      <div className="bg-white rounded-lg">
        <div
          className={
            accordian
              ? 'p-4 flex justify-between items-center gap-2 border-b-[#f0f0f0] border-b border-solid'
              : 'p-4 flex justify-between items-center gap-2'
          }>
          <div className="flex-auto flex items-center">
            <h4 className="text-sm font-medium">
              Blocked {blockedCount}/{detectedCount} {title}
            </h4>
            {isProcessing && <CircularProgress size={16} className="ml-2" />}
          </div>
          <button type="button" className="flex-[0_0_auto]" onClick={onToggle}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={12}
              height={12}
              fill="currentColor"
              className={
                accordian ? 'bi bi-chevron-down transition-[0.5s] rotate-180' : 'bi bi-chevron-down transition-[0.5s]'
              }
              viewBox="0 0 16 16">
              <path
                fillRule="evenodd"
                d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"
              />
            </svg>
          </button>
        </div>
        {!isProcessing && accordian && (
          <div className="p-4">
            <div className="flex flex-col space-y-3">
              {videos.map((video, index) => (
                <VideoCard key={`video-${index}`} video={video} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  ),
);
BlockedSection.displayName = 'BlockedSection';

export const Dashboard = () => {
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [blockedVideos, setBlockedVideos] = useState<IBlockedVideoDetails[]>([]);
  const [detectedVideos, setDetectedVideos] = useState<typeExtensionVideoData[]>([]);
  const [tabId, setTabId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);

  useEffect(() => {
    const fetchTabId = async () => {
      const id = await getCurrentTabId();
      setTabId(id);
    };

    fetchTabId();
  }, []);

  useEffect(() => {
    if (tabId !== null) {
      const fetchBlockedVideos = async () => {
        const data = await blockedVideosByTabStorage.get();
        const tabData = data.tabs[tabId];
        if (tabData) {
          setIsProcessing(tabData.isProcessing);
          setIsDetecting(tabData.isDetecting);
          setBlockedVideos(tabData.blacklisted || []);
          setDetectedVideos(tabData.detectedVideos || []);
        }
      };

      fetchBlockedVideos();

      const unsubscribe = blockedVideosByTabStorage.subscribe(fetchBlockedVideos);

      return () => unsubscribe();
    }
    return undefined;
  }, [tabId]);

  // Use useMemo to memoize the filtered lists
  const filteredBlockedShorts = useMemo(
    () => blockedVideos.filter(video => video.videoType === 'shorts'),
    [blockedVideos],
  );
  const filteredBlockedVideos = useMemo(
    () => blockedVideos.filter(video => video.videoType === 'video'),
    [blockedVideos],
  );
  const filteredBlockedPlaylist = useMemo(
    () => blockedVideos.filter(video => video.videoType === 'playlist'),
    [blockedVideos],
  );

  // Toggle accordion and ensure only one is open at a time
  const handleAccordionToggle = useCallback(
    (section: string) => {
      // Close the section if it's already open, otherwise open the new one
      setActiveAccordion(prev => (prev === section ? null : section));
    },
    [setActiveAccordion],
  );

  return (
    <PopupLayout>
      <div className="flex flex-col space-y-3">
        <UserEntries />

        {/* Blocked Shorts */}
        {filteredBlockedShorts.length > 0 && (
          <BlockedSection
            title="Shorts"
            isProcessing={isProcessing}
            isDetecting={isDetecting}
            blockedCount={filteredBlockedShorts.length}
            detectedCount={detectedVideos.filter(video => video.videoType === 'shorts').length}
            videos={filteredBlockedShorts}
            accordian={activeAccordion === 'shorts'}
            onToggle={() => handleAccordionToggle('shorts')}
          />
        )}

        {/* Blocked Playlists */}
        {filteredBlockedPlaylist.length > 0 && (
          <BlockedSection
            title="Playlist"
            isProcessing={isProcessing}
            isDetecting={isDetecting}
            blockedCount={filteredBlockedPlaylist.length}
            detectedCount={detectedVideos.filter(video => video.videoType === 'playlist').length}
            videos={filteredBlockedPlaylist}
            accordian={activeAccordion === 'playlist'}
            onToggle={() => handleAccordionToggle('playlist')}
          />
        )}

        {/* Blocked Videos */}
        {filteredBlockedVideos.length > 0 && (
          <BlockedSection
            title="Videos"
            isProcessing={isProcessing}
            isDetecting={isDetecting}
            blockedCount={filteredBlockedVideos.length}
            detectedCount={detectedVideos.filter(video => video.videoType === 'video').length}
            videos={filteredBlockedVideos}
            accordian={activeAccordion === 'videos'}
            onToggle={() => handleAccordionToggle('videos')}
          />
        )}
      </div>
    </PopupLayout>
  );
};
