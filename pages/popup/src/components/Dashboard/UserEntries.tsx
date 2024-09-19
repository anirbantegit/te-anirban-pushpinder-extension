import React, { useCallback, useEffect, useState } from 'react';
import { Chip, Switch, Typography } from '@mui/material';
import { extensionStorage, EnumExtensionStorageListMode } from '@extension/storage';
import type { typeExtensionStorageData } from '@extension/storage';
import CloseIcon from '@mui/icons-material/Close';

interface UserEntriesProps {}

export const UserEntries: React.FC<UserEntriesProps> = () => {
  const [contentFilter, setContentFilter] = useState<string>('');
  const [filterList, setFilterList] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>(''); // For managing the input field
  const [channelInput, setChannelInput] = useState<string>('');
  const [blockedChannelList, setblockedChannelList] = useState<string[]>([]);
  const [shortsSwitchFeed, setShortsSwitchFeed] = useState<boolean>(false);
  const [playlistSwitchFeed, setPlaylistSwitchFeed] = useState<boolean>(false);
  const [bannerBlock, setBannerBlock] = useState<boolean>(false);

  const [accordian, setAccordian] = useState<boolean>(true);
  const [activeMode, setActiveMode] = useState<EnumExtensionStorageListMode>(EnumExtensionStorageListMode.BLOCK_LIST);

  useEffect(() => {
    const fetchInitialData = async () => {
      const extensionData: typeExtensionStorageData = await extensionStorage.get();
      const { instructions, listMode, filterList, allowList, blockList } = extensionData;

      console.log('extensionData => ', extensionData);

      setContentFilter(instructions || '');
      setActiveMode(listMode);
      setFilterList(filterList);

      // Set the initial state based on the active list mode (allowList/blockList)
      const currentList = listMode === EnumExtensionStorageListMode.BLOCK_LIST ? blockList : allowList;
      setblockedChannelList(currentList.channelBlockList || []);
      setShortsSwitchFeed(!currentList.shortsAllow);
      setPlaylistSwitchFeed(!currentList.playlistAllow);
      setBannerBlock(currentList.bannerAllow);
    };

    fetchInitialData();
    extensionStorage.subscribe(async () => {
      const extensionData: typeExtensionStorageData = await extensionStorage.get();
      console.log('extensionData fresh => ', extensionData);
      await fetchInitialData();
    });
  }, []);

  /*useEffect(() => {
    (async () => {
      const trimmedFilter = contentFilter.trim();
      await extensionStorage.updateInstructions(trimmedFilter === '' ? null : trimmedFilter); // Persist the instructions
      await extensionStorage.updateFilterList(filterList); // Persist the filter list
    })();
  }, [contentFilter, filterList]);

  useEffect(() => {
    (async () => {
      await extensionStorage.updateChannelBlockList(blockedChannelList); // Persist the blockedChannel list
    })();
  }, [blockedChannelList]);

  useEffect(() => {
    (async () => {
      await extensionStorage.updateShortsAllow(shortsSwitchFeed); // Persist the blockedChannel list
    })();
  }, [shortsSwitchFeed]);
  useEffect(() => {
    (async () => {
      await extensionStorage.updatePlayListAllow(playlistSwitchFeed); // Persist the blockedChannel list
    })();
  }, [playlistSwitchFeed]);
  useEffect(() => {
    (async () => {
      await extensionStorage.updateBannerAllow(bannerBlock); // Persist the blockedChannel list
    })();
  }, [bannerBlock]);*/

  const handlerUpdateFilterList = useCallback(async (filterList: string[]) => {
    setFilterList(filterList);
    await extensionStorage.updateFilterList(filterList);
  }, []);

  const handleAddChip = async (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && inputValue.trim()) {
      await handlerUpdateFilterList([...filterList, inputValue.trim()]);
      setInputValue('');
    }
  };
  const handleDeleteChip = async (chipToDelete: string) => {
    await handlerUpdateFilterList(filterList.filter(chip => chip !== chipToDelete));
  };

  const handlerBannerFeed = useCallback(async (feed: boolean) => {
    await extensionStorage.updateBannerAllow(feed);
    setBannerBlock(feed);
  }, []);

  const handlerPlaylistFeed = useCallback(async (feed: boolean) => {
    await extensionStorage.updatePlayListAllow(feed);
    setPlaylistSwitchFeed(feed);
  }, []);

  const handlerShortsFeed = useCallback(async (feed: boolean) => {
    await extensionStorage.updateShortsAllow(feed);
    setShortsSwitchFeed(feed);
  }, []);

  const getButtonClass = (mode: EnumExtensionStorageListMode): string => {
    return activeMode === mode
      ? 'text-[#000] py-[5px] px-2 font-medium bg-[#0B82EF] text-[#fff] rounded-[5px]'
      : 'text-[#000] py-[5px] px-2 font-medium rounded-[5px]';
  };

  const handlerSetActiveMode = useCallback((mode: EnumExtensionStorageListMode) => {
    (async () => {
      setActiveMode(mode);
      await extensionStorage.setBlockList(mode);
    })();
  }, []);

  // Handler to add a new channel to the blocked list
  const handlerAddNewBlockedChannelList = useCallback(async (channelName: string) => {
    setblockedChannelList((prevChannelList: string[]) => {
      // Ensure the list contains unique values
      const updatedList = Array.from(new Set([...prevChannelList, channelName]));

      // Update storage asynchronously
      extensionStorage.updateChannelBlockList(updatedList);

      // Return the updated list for state change
      return updatedList;
    });
  }, []);

  // Handler to remove a channel from the blocked list
  const handlerRemoveNewBlockedChannelList = useCallback(async (channelName: string) => {
    setblockedChannelList((prevChannelList: string[]) => {
      // Remove the channel from the list and ensure uniqueness
      const updatedList = prevChannelList.filter(channel => channel !== channelName);

      // Update storage asynchronously
      extensionStorage.updateChannelBlockList(updatedList);

      // Return the updated list for state change
      return updatedList;
    });
  }, []);

  const handleAddChannel = async (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && channelInput.trim()) {
      await handlerAddNewBlockedChannelList(channelInput.trim());
      setChannelInput('');
    }
  };
  const handleDeleteChannel = async (chipToDelete: string) => {
    await handlerRemoveNewBlockedChannelList(chipToDelete);
  };

  /*useEffect(() => {
    (async () => {
      await extensionStorage.setBlockList(activeMode);
      const extensionData: typeExtensionStorageData = await extensionStorage.get();
      const { allowList, blockList } = extensionData;

      // Set the state based on the current mode (allowList/blockList)
      const currentList = activeMode === EnumExtensionStorageListMode.BLOCK_LIST ? blockList : allowList;
      setblockedChannelList(currentList.channelBlockList || []);
      setShortsSwitchFeed(!currentList.shortsAllow);
      setPlaylistSwitchFeed(!currentList.playlistAllow);
      setBannerBlock(currentList.bannerAllow);
    })();
  }, [activeMode]);*/

  return (
    <>
      <div className="w-full">
        <Typography variant="subtitle2" component="h5" className="mb-0 text-left">
          <span className="font-medium">All Filters</span>
        </Typography>
        <div className="flex flex-col gap-y-2">
          <div className="w-full">
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight 
        focus:outline-none focus:shadow-outline focus:border-[#0B82EF]"
              type="text"
              placeholder="Blocked Topics"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleAddChip}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {filterList.map((chip, index) => (
                <Chip
                  key={`chip-${index}`}
                  label={chip}
                  size="small"
                  onDelete={() => handleDeleteChip(chip)}
                  className="m-1"
                  variant="outlined"
                  style={{ backgroundColor: '#0B82EF', color: '#fff', borderRadius: '5px' }}
                  deleteIcon={<CloseIcon style={{ color: '#fff' }} />}
                />
              ))}
            </div>
          </div>
          <div className="w-full">
            <div className="flex">
              <div className="bg-[#fff] rounded-[5px] p-[3px] flex items-center">
                <button
                  type="button"
                  className={getButtonClass(EnumExtensionStorageListMode.DISABLED)}
                  onClick={() => handlerSetActiveMode(EnumExtensionStorageListMode.DISABLED)}>
                  Disabled
                </button>
                <button
                  type="button"
                  className={getButtonClass(EnumExtensionStorageListMode.ALLOW_LIST)}
                  onClick={() => handlerSetActiveMode(EnumExtensionStorageListMode.ALLOW_LIST)}>
                  Allow List Mode
                </button>
                <button
                  type="button"
                  className={getButtonClass(EnumExtensionStorageListMode.BLOCK_LIST)}
                  onClick={() => handlerSetActiveMode(EnumExtensionStorageListMode.BLOCK_LIST)}>
                  Block List Mode
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <Typography variant="subtitle2" component="h5" className="mb-0 text-left">
          <span className="font-medium">Blocked Channels</span>
        </Typography>
        <div className="flex flex-col gap-y-2">
          <div className="w-full">
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight 
        focus:outline-none focus:shadow-outline focus:border-[#0B82EF]"
              type="text"
              placeholder="Blocked Channels"
              value={channelInput}
              onChange={e => setChannelInput(e.target.value)}
              onKeyDown={handleAddChannel}
            />
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="bg-white rounded-lg">
          <div
            className={
              accordian
                ? 'p-4 flex justify-between items-center gap-2 border-b-[#f0f0f0] border-b border-solid'
                : 'p-4 flex justify-between items-center gap-2'
            }>
            <div className="flex-auto flex items-center">
              <h4 className="text-sm font-medium">Block Listed Channels ({blockedChannelList?.length})</h4>
            </div>

            <button
              type="button"
              className="flex-[0_0_auto]"
              onClick={() => setAccordian(blockedChannelList?.length ? !accordian : false)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={12}
                height={12}
                fill="currentColor"
                className={
                  (blockedChannelList?.length ? accordian : false)
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
          {(blockedChannelList?.length ? accordian : false) && (
            <div className="flex flex-col gap-y-1 pl-8 pr-[8px] pt-2 pb-3 overflow-x-hidden overflow-y-auto max-h-[120px]">
              {blockedChannelList?.length > 0 &&
                blockedChannelList?.map((listing: any, index: any) => {
                  return (
                    <div className="flex w-full" key={index}>
                      <div className="flex flex-auto">
                        <div className="text-[13px] text-[#555] font-medium">{listing}</div>
                      </div>
                      <div className="flex flex-[0_0_auto]" onClick={() => handleDeleteChannel(listing)}>
                        <CloseIcon style={{ color: '#999', fontSize: '18px' }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-0 mt-0">
        <div className="flex items-center">
          <Switch
            color="primary"
            checked={shortsSwitchFeed ?? false}
            onChange={() => handlerShortsFeed(!shortsSwitchFeed)}
            inputProps={{ 'aria-label': 'block allow switch' }}
          />
          <Typography variant="subtitle2" className="ml-2">
            {shortsSwitchFeed ? 'Block Shorts' : 'Allow Shorts'}
          </Typography>
        </div>
        <div className="flex items-center">
          <Switch
            color="primary"
            checked={playlistSwitchFeed ?? false}
            onChange={() => handlerPlaylistFeed(!playlistSwitchFeed)}
            inputProps={{ 'aria-label': 'block allow switch' }}
          />
          <Typography variant="subtitle2" className="ml-2">
            Block Playlists
          </Typography>
        </div>
        <div className="flex items-center">
          <Switch
            color="primary"
            checked={bannerBlock ?? false}
            onChange={() => handlerBannerFeed(!bannerBlock)}
            inputProps={{ 'aria-label': 'block allow switch' }}
          />
          <Typography variant="subtitle2" className="ml-2">
            Block Banners
          </Typography>
        </div>
      </div>
    </>
  );
};
