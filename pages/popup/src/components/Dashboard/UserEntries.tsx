import React, { useEffect, useState } from 'react';
import { Card, CardContent, Chip, Switch, TextField, Typography } from '@mui/material';
import { extensionStorage, EnumExtensionStorageListMode } from '@extension/storage';
import CloseIcon from '@mui/icons-material/Close';

interface UserEntriesProps {}

export const UserEntries: React.FC<UserEntriesProps> = () => {
  const [contentFilter, setContentFilter] = useState<string>('');
  const [filterList, setFilterList] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>(''); // For managing the input field
  const [channelInput, setChannelInput] = useState<string>('');
  const [blockedChannelList, setblockedChannelList] = useState<string[]>([]);
  const [shotsBlock, setShotsBlock] = useState<boolean>(false);
  const [playlistBlock, setPlaylistBlock] = useState<boolean>(false);
  const [bannerBlock, setBannerBlock] = useState<boolean>(false);

  const [accordian, setAccordian] = useState<boolean>(true);
  const [activeMode, setActiveMode] = useState<EnumExtensionStorageListMode>(EnumExtensionStorageListMode.BLOCK_LIST);

  const handleAddChip = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && inputValue.trim()) {
      setFilterList([...filterList, inputValue.trim()]);
      setInputValue('');
    }
  };
  const handleDeleteChip = (chipToDelete: string) => {
    setFilterList(filterList.filter(chip => chip !== chipToDelete));
  };

  const handleAddChannel = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && channelInput.trim()) {
      setblockedChannelList([...blockedChannelList, channelInput.trim()]);
      setChannelInput('');
    }
  };
  const handleDeleteChannel = (chipToDelete: string) => {
    setblockedChannelList(blockedChannelList.filter(chip => chip !== chipToDelete));
  };
  useEffect(() => {
    const fetchInitialData = async () => {
      const { instructions, listMode, filterList, channelBlockList, shotsAllow, playlistAllow, bannerAllow } =
        await extensionStorage.get();
      console.log('AAA => ', { instructions, listMode, filterList, shotsAllow, playlistAllow, bannerAllow });
      setContentFilter(instructions || '');
      setActiveMode(listMode);
      setFilterList(filterList);
      setblockedChannelList(channelBlockList || []);
      setShotsBlock(shotsAllow);
      setPlaylistBlock(playlistAllow);
      setBannerBlock(bannerAllow);
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
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
      await extensionStorage.updateShotsAllow(shotsBlock); // Persist the blockedChannel list
    })();
  }, [shotsBlock]);
  useEffect(() => {
    (async () => {
      await extensionStorage.updatePlayListAllow(playlistBlock); // Persist the blockedChannel list
    })();
  }, [playlistBlock]);
  useEffect(() => {
    (async () => {
      await extensionStorage.updateBannerAllow(bannerBlock); // Persist the blockedChannel list
    })();
  }, [bannerBlock]);
  const getButtonClass = (mode: EnumExtensionStorageListMode): string => {
    return activeMode === mode
      ? 'text-[#000] py-[5px] px-2 font-medium bg-[#0B82EF] text-[#fff] rounded-[5px]'
      : 'text-[#000] py-[5px] px-2 font-medium rounded-[5px]';
  };

  useEffect(() => {
    console.log('Mode => ', activeMode);
    (async () => {
      console.log('Mode => ', activeMode);
      await extensionStorage.setBlockList(activeMode);
    })();
  }, [activeMode]);

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
                  onClick={() => setActiveMode(EnumExtensionStorageListMode.DISABLED)}>
                  Disabled
                </button>
                <button
                  type="button"
                  className={getButtonClass(EnumExtensionStorageListMode.ALLOW_LIST)}
                  onClick={() => setActiveMode(EnumExtensionStorageListMode.ALLOW_LIST)}>
                  Allow List Mode
                </button>
                <button
                  type="button"
                  className={getButtonClass(EnumExtensionStorageListMode.BLOCK_LIST)}
                  onClick={() => setActiveMode(EnumExtensionStorageListMode.BLOCK_LIST)}>
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
          <div className="px-3 pt-3 flex justify-between items-center gap-2">
            <div className="flex-auto">
              <h4 className="text-sm font-medium">Block Listed Channels ({blockedChannelList?.length})</h4>
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
        </div>
      </div>

      <div className="flex items-center justify-between pt-0 mt-0">
        <div className="flex items-center">
          <Switch
            color="primary"
            checked={shotsBlock}
            onChange={() => setShotsBlock(!shotsBlock)}
            inputProps={{ 'aria-label': 'block allow switch' }}
          />
          <Typography variant="subtitle2" className="ml-2">
            {shotsBlock ? 'Block Shorts' : 'Allow Shorts'}
          </Typography>
        </div>
        <div className="flex items-center">
          <Switch
            color="primary"
            checked={playlistBlock}
            onChange={() => setPlaylistBlock(!playlistBlock)}
            inputProps={{ 'aria-label': 'block allow switch' }}
          />
          <Typography variant="subtitle2" className="ml-2">
            Block Playlists
          </Typography>
        </div>
        <div className="flex items-center">
          <Switch
            color="primary"
            checked={bannerBlock}
            onChange={() => setBannerBlock(!bannerBlock)}
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
