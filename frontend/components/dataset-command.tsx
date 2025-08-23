"use client";

import { useState, useEffect, useRef } from 'react';
import { useDatasetContext } from '@/lib/dataset-context';
import { RiDatabaseLine } from '@remixicon/react';
import Image from 'next/image';

interface DatasetCommandProps {
  isVisible: boolean;
  onSelectDataset: (datasetName: string) => void;
  onClose: () => void;
  // Element that triggers the menu (e.g., the tag button). Clicks on this should not count as outside clicks
  triggerRef?: { current: HTMLElement | null };
}

export function DatasetCommand({ isVisible, onSelectDataset, onClose, triggerRef }: DatasetCommandProps) {
  const { datasets } = useDatasetContext();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset selection when visibility changes
  useEffect(() => {
    if (isVisible) {
      setSelectedIndex(0);
    }
  }, [isVisible]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % datasets.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + datasets.length) % datasets.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (datasets[selectedIndex]) {
            onSelectDataset(datasets[selectedIndex].name);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, datasets, selectedIndex, onSelectDataset, onClose]);

  // Handle click outside to close
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      const clickedInsideDropdown = dropdownRef.current?.contains(targetNode);
      const clickedOnTrigger = triggerRef?.current?.contains(targetNode);
      if (!clickedInsideDropdown && !clickedOnTrigger) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, onClose]);

  // Keep mounted to allow smooth close animation

  // Get dataset icon based on name/format
  const getDatasetIcon = (datasetName: string) => {
    const fileName = datasetName.toLowerCase();
    
    if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return '/icons/sheet.png';
    } else if (fileName.endsWith('.db') || fileName.endsWith('.sqlite') || fileName.endsWith('.sqlite3')) {
      return '/icons/db.png';
    } else if (fileName.endsWith('.json')) {
      return '/icons/json.png';
    }
    
    return '/icons/dataset.png';
  };

  return (
    <div
      ref={dropdownRef}
      aria-hidden={!isVisible}
      className={`absolute bottom-full left-0 mb-3 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-[20px] border border-gray-200/60 dark:border-gray-700/60 shadow-lg z-50 transition-all duration-200 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100/80 dark:border-gray-700/80">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
          {datasets.length === 0 ? 'No Available Datasets' : 'Available Datasets'}
        </span>
      </div>

      {/* Dataset List or No Datasets Message */}
      <div className="py-2">
        {datasets.length === 0 ? (
          <div className="mx-2 my-1 px-3 py-3 text-center">
            <RiDatabaseLine className="w-6 h-6 text-gray-400 dark:text-gray-500 mx-auto mb-1.5" />
            <span className="text-sm text-gray-500 dark:text-gray-400 block">
              No available dataset
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 block">
              Upload a dataset to get started
            </span>
          </div>
        ) : (
          datasets.map((dataset, index) => (
            <div
              key={dataset.id}
              className={`mx-2 my-1 px-3 py-2.5 cursor-pointer transition-colors duration-200 ease-out rounded-xl border ${
                index === selectedIndex 
                  ? 'bg-gray-100 dark:bg-gray-700 border-gray-200/50 dark:border-gray-600/50' 
                  : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50 border-transparent'
              }`}
              onClick={() => onSelectDataset(dataset.name)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                  <Image
                    src={getDatasetIcon(dataset.name)}
                    alt="Dataset"
                    width={20}
                    height={20}
                    className="object-contain opacity-80"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium transition-colors duration-200 ${
                    index === selectedIndex 
                      ? 'text-gray-900 dark:text-gray-100' 
                      : 'text-gray-700 dark:text-gray-200'
                  } truncate block`}>
                    {dataset.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
                    {dataset.rows.toLocaleString()} rows • {dataset.columns} columns
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}