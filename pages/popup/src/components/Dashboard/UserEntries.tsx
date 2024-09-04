import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, CardHeader, Chip, Switch, TextField, Typography } from '@mui/material';
import { extensionStorage } from '@extension/storage/dist/lib';
import CloseIcon from '@mui/icons-material/Close';
interface UserEntriesProps {}

export const UserEntries: React.FC<UserEntriesProps> = () => {
  const [contentFilter, setContentFilter] = useState<string>('');
  const [isBlockList, setIsBlockList] = useState<boolean>(true); // True for block, false for allow
  const [filterList, setFilterList] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>(''); // For managing the input field
  const [accordian, setAccordian] = useState<boolean>(true);

  const handleAddChip = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && inputValue.trim()) {
      setFilterList([...filterList, inputValue.trim()]);
      setInputValue('');
    }
  };
  const handleDeleteChip = (chipToDelete: string) => {
    setFilterList(filterList.filter(chip => chip !== chipToDelete));
  };
  const handleSwitchChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setIsBlockList(newValue);
    await extensionStorage.setIsBlockList(newValue); // Persist the value
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const { instructions, isBlockList, filterList } = await extensionStorage.get();
      setContentFilter(instructions || '');
      setIsBlockList(isBlockList);
      setFilterList(filterList);
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

  return (
    <>
      {/* <Card sx={{ maxWidth: 600, minWidth: '100%', margin: '0 auto', boxShadow: 3 }}>

        <CardContent>
          <div className="user-entries-container">
            <Typography variant="subtitle1" component="h5" className="mb-4 font-bold text-left">
              All Filters
            </Typography>
            <div className="mb-4">
              <TextField
                placeholder="Type your filter instruction here"
                value={contentFilter}
                onChange={e => setContentFilter(e.target.value)}
                variant="outlined"
                fullWidth
                className="mb-4"
              />
            </div>

            <div className="w-full">
              <TextField
                variant="outlined"
                placeholder="Enter Keywords"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleAddChip}
                fullWidth
                className="mb-2"
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
          </div>
        </CardContent>
      </Card> */}

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
            />
          </div>
          <div className="w-full">
            <div className="flex">
              <div className="bg-[#fff] rounded-[5px] p-[3px] flex items-center">
                <button type="button" className="text-[#000] py-[5px] px-2 font-medium rounded-[5px]">
                  Disabled
                </button>
                <button type="button" className="text-[#000] py-[5px] px-2 font-medium rounded-[5px]">
                  Allow List Mode
                </button>
                <button
                  type="button"
                  className="text-[#000] py-[5px] px-2 font-medium bg-[#0B82EF] text-[#fff] rounded-[5px]">
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
            />
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="bg-white rounded-lg">
          <div className="px-3 pt-3 flex justify-between items-center gap-2">
            <div className="flex-auto">
              <h4 className="text-sm font-medium">Block Listed Channels (3)</h4>
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
            <div className="flex w-full">
              <div className="flex flex-auto">
                <div className="text-[13px] text-[#555] font-medium">Pedro Duarte</div>
              </div>
              <div className="flex flex-[0_0_auto]">
                <CloseIcon style={{ color: '#999', fontSize: '18px' }} />
              </div>
            </div>
            <div className="flex w-full">
              <div className="flex flex-auto">
                <div className="text-[13px] text-[#555] font-medium">Colm Tuite</div>
              </div>
              <div className="flex flex-[0_0_auto]">
                <CloseIcon style={{ color: '#999', fontSize: '18px' }} />
              </div>
            </div>
            <div className="flex w-full">
              <div className="flex flex-auto">
                <div className="text-[13px] text-[#555] font-medium">Pietro Schirano</div>
              </div>
              <div className="flex flex-[0_0_auto]">
                <CloseIcon style={{ color: '#999', fontSize: '18px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-0 mt-0">
        <div className="flex items-center">
          <Switch
            checked={isBlockList}
            onChange={handleSwitchChange}
            color="primary"
            inputProps={{ 'aria-label': 'block allow switch' }}
          />
          <Typography variant="subtitle2" className="ml-2">
            {isBlockList ? 'Block Shorts' : 'Allow Shorts'}
          </Typography>
        </div>
        <div className="flex items-center">
          <Switch
            checked={isBlockList}
            onChange={handleSwitchChange}
            color="primary"
            inputProps={{ 'aria-label': 'block allow switch' }}
          />
          <Typography variant="subtitle2" className="ml-2">
            Block Playlists
          </Typography>
        </div>
        <div className="flex items-center">
          <Switch
            checked={isBlockList}
            onChange={handleSwitchChange}
            color="primary"
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
