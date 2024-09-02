import React, { useEffect, useState } from 'react';
import { PopupLayout } from '@src/components/layout/PopupLayout';
import { VideoManager } from '@src/pages/VideoManage';
import type { BlockedVideoDetails } from '@extension/storage/lib';
import { blockedVideosByTabStorage, blacklistedVideosStorage } from '@extension/storage';

// Helper function to get the current tab ID
const getCurrentTabId = async (): Promise<number> => {
  return new Promise<number>(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      resolve(tabs[0]?.id || 0); // Ensure that tabs[0] and tabs[0].id are defined
    });
  });
};

export const Dashboard = () => {
  const [contentFilter, setContentFilter] = useState('');
  const [accordian, setAccordian] = useState(true);
  const [blockedVideos, setBlockedVideos] = useState<BlockedVideoDetails[]>([]);
  const [detectedVideos, setDetectedVideos] = useState<object[]>([]);
  const [tabId, setTabId] = useState<number | null>(null);

  useEffect(() => {
    console.log('Blocked Videos => ', { blockedVideos });
  }, [blockedVideos]);

  useEffect(() => {
    const fetchTabId = async () => {
      const id = await getCurrentTabId();
      setTabId(id);
    };

    fetchTabId();

    const fetchInstructions = async () => {
      const { instructions } = await blacklistedVideosStorage.get();
      setContentFilter(instructions || '');
    };

    fetchInstructions();
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
  }, [tabId]);

  useEffect(() => {
    (async () => {
      const trimmedFilter = contentFilter.trim();
      await blacklistedVideosStorage.updateInstructions(trimmedFilter === '' ? null : trimmedFilter);
    })();
  }, [contentFilter]);

  return (
    <PopupLayout>
      <VideoManager />
      <div className="flex flex-col space-y-3">
        <div className="w-full">
          <h4 className="text-sm font-medium mb-1">Filter</h4>
          <textarea
            placeholder="Type your filter instruction here"
            value={contentFilter}
            onChange={e => setContentFilter(e.target.value)}
            className="w-full h-[60px] resize-none bg-white rounded-lg px-2 py-1.5"
          />
        </div>
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
        {/* <div>
          <h4 className="text-sm font-medium mb-1">Blacklisted Videos</h4>
          <TextField
            label="Video ID"
            value={videoId}
            onChange={e => setVideoId(e.target.value)}
            variant="outlined"
            fullWidth
          />
        </div>
        <Button variant="contained" color="primary" onClick={handleAddVideo} disabled={!videoId}>
          Add to Blacklist
        </Button>
        <List>
          {blacklistedVideos.map(id => (
            <ListItem
              key={id}
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveVideo(id)}>
                  <DeleteIcon />
                </IconButton>
              }>
              <ListItemText primary={id} />
            </ListItem>
          ))}
        </List> */}
      </div>
    </PopupLayout>
  );
};
