import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Chip, Switch, TextField, Typography } from '@mui/material';
import { extensionStorage } from '@extension/storage/dist/lib';
import CloseIcon from '@mui/icons-material/Close';
interface UserEntriesProps {}

export const UserEntries: React.FC<UserEntriesProps> = () => {
  const [contentFilter, setContentFilter] = useState<string>('');
  const [isBlockList, setIsBlockList] = useState<boolean>(true); // True for block, false for allow
  const [filterList, setFilterList] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>(''); // For managing the input field

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
    <Card sx={{ maxWidth: 600, minWidth: '100%', margin: '0 auto', boxShadow: 3 }}>
      <CardContent>
        <div className="user-entries-container">
          {/* Card Header */}
          <Typography variant="h5" component="div" className="mb-4 font-bold text-left">
            Filters
          </Typography>

          {/* Instruction Input */}
          <div className="mb-4">
            <TextField
              multiline
              rows={2}
              placeholder="Type your filter instruction here"
              value={contentFilter}
              onChange={e => setContentFilter(e.target.value)}
              variant="outlined"
              fullWidth
              className="mb-4"
            />
          </div>

          {/* Block/Allow Switch */}
          <div className="flex items-center mb-4">
            <Typography variant="subtitle1" className="mr-4">
              Filter Mode ?
            </Typography>
            <Switch
              checked={isBlockList}
              onChange={handleSwitchChange}
              color="primary"
              inputProps={{ 'aria-label': 'block allow switch' }}
            />
            <Typography variant="subtitle2" className="ml-4">
              {isBlockList ? 'Block' : 'Allow'}
            </Typography>
          </div>

          {/* Keyword Entry and Chips */}
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
    </Card>
  );
};
