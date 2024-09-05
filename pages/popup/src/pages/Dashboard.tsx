import React, { useEffect, useState } from 'react';
import { PopupLayout } from '@src/components/layout/PopupLayout';
import { VideoManager } from '@src/components/Dashboard/VideoManage';
import type { IBlockedVideoDetails } from '@extension/storage/lib';
import { blockedVideosByTabStorage, extensionStorage } from '@extension/storage';
import { Chip, Switch, TextField } from '@mui/material';
import { UserEntries } from '@src/components/Dashboard/UserEntries';

// Helper function to get the current tab ID
const getCurrentTabId = async (): Promise<number> => {
  return new Promise<number>(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      resolve(tabs[0]?.id || 0); // Ensure that tabs[0] and tabs[0].id are defined
    });
  });
};

export const Dashboard = () => {
  const [accordian, setAccordian] = useState<boolean>(true);
  const [blockedVideos, setBlockedVideos] = useState<IBlockedVideoDetails[]>([]);
  const [detectedVideos, setDetectedVideos] = useState<object[]>([]);
  const [tabId, setTabId] = useState<number | null>(null);

  useEffect(() => {
    const fetchTabId = async () => {
      const id = await getCurrentTabId();
      setTabId(id);
    };

    fetchTabId();
  }, []);

  useEffect(() => {
    if (tabId !== null) {
      // Initial fetch of blocked videos for this tab
      blockedVideosByTabStorage.get().then(data => {
        console.log('blockedVideosByTabStorage => data.tabs[tabId] => ', { 'data.tabs[tabId]': data.tabs[tabId] });
        if (data.tabs[tabId]) {
          setBlockedVideos(data.tabs[tabId]?.blacklisted || []);
          setDetectedVideos(data.tabs[tabId]?.detectedVideos || []);
        }
      });

      // Subscribe to live updates
      const unsubscribe = blockedVideosByTabStorage.subscribe(() => {
        blockedVideosByTabStorage.get().then(data => {
          console.log('blockedVideosByTabStorage => data.tabs[tabId] => ', { 'data.tabs[tabId]': data.tabs[tabId] });
          if (data.tabs[tabId]) {
            setBlockedVideos(data.tabs[tabId]?.blacklisted || []);
            setDetectedVideos(data.tabs[tabId]?.detectedVideos || []);
          }
        });
      });

      // Cleanup subscription on component unmount
      return () => unsubscribe();
    }
    // Return nothing if tabId is null
    return undefined;
  }, [tabId]);

  return (
    <PopupLayout>
      {/*<VideoManager />*/}
      <div className="flex flex-col space-y-3">
        <UserEntries />

        <div className="w-full">
          <div className="bg-white rounded-lg">
            <div
              className={
                accordian
                  ? 'p-4 flex justify-between items-center gap-2 border-b-[#f0f0f0] border-b border-solid'
                  : 'p-4 flex justify-between items-center gap-2'
              }>
              <div className="flex-auto">
                <h4 className="text-sm font-medium">
                  Blocked {blockedVideos.length}/{detectedVideos.length} Videos
                </h4>
              </div>
              <button
                type="button"
                className="flex-[0_0_auto]"
                //        onClick={() => setAccordian(!accordian)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={12}
                  height={12}
                  fill="currentColor"
                  className={
                    accordian
                      ? 'bi bi-chevron-down transition-[0.5s] rotate-180'
                      : 'bi bi-chevron-down transition-[0.5s]'
                  }
                  viewBox="0 0 16 16">
                  <path
                    fillRule="evenodd"
                    d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"
                  />
                </svg>
              </button>
            </div>
            {accordian && (
              <div className="p-4">
                <div className="flex flex-col space-y-3">
                  {blockedVideos.map((video, index) => (
                    <div key={`video-${index}`} className="border-b-[#f0f0f0] border-b border-solid">
                      <div className="flex gap-[10px]">
                        <div className="w-[90px] flex-[0_0_auto] h-[60px] flex items-center justify-center">
                          <img
                            src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-auto">
                          <h4 className="text-sm font-medium">{video.title}</h4>
                          <p className="text-xs">{video.channel}</p>
                          <p className="text-xs text-gray-500">{new Date(video.detectedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PopupLayout>
  );
};
