"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";
import { 
  RiQuillPenAiLine, 
  RiSettingsLine, 
  RiDatabaseLine, 
  RiUploadLine, 
  RiFileTextLine, 
  RiFileExcelLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiDownloadLine
} from "@remixicon/react";
import { Label } from "@/components/label";
import { Button } from "@/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import SliderControl from "@/components/slider-control";
import { Sheet, SheetTitle, SheetContent } from "@/components/sheet";
import * as React from "react";
import { ScrollArea } from "@/components/scroll-area";
import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { Separator } from "@/components/separator";
import { parseFile, ParsedFileData } from "@/lib/file-parser";

type SettingsPanelContext = {
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  togglePanel: () => void;
};

const SettingsPanelContext = React.createContext<SettingsPanelContext | null>(
  null,
);

function useSettingsPanel() {
  const context = React.useContext(SettingsPanelContext);
  if (!context) {
    throw new Error(
      "useSettingsPanel must be used within a SettingsPanelProvider.",
    );
  }
  return context;
}

const SettingsPanelProvider = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile(1024);
  const [openMobile, setOpenMobile] = React.useState(false);

  // Helper to toggle the sidebar.
  const togglePanel = React.useCallback(() => {
    return isMobile && setOpenMobile((open) => !open);
  }, [isMobile, setOpenMobile]);

  const contextValue = React.useMemo<SettingsPanelContext>(
    () => ({
      isMobile,
      openMobile,
      setOpenMobile,
      togglePanel,
    }),
    [isMobile, openMobile, setOpenMobile, togglePanel],
  );

  return (
    <SettingsPanelContext.Provider value={contextValue}>
      {children}
    </SettingsPanelContext.Provider>
  );
};
SettingsPanelProvider.displayName = "SettingsPanelProvider";

const SettingsPanelContent = () => {
  const [dataset, setDataset] = React.useState<ParsedFileData | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadingFile, setUploadingFile] = React.useState<{name: string, size: string} | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);



  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload only CSV or XLSX files');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setUploadingFile({
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
    });
    
    try {
      // Simulate progress while parsing
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 10, 90));
      }, 100);

      // Parse the actual file
      const parsedData = await parseFile(file);
      
      // Complete the progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Small delay to show 100% completion
      setTimeout(() => {
        setDataset(parsedData);
        setIsUploading(false);
        setUploadingFile(null);
        setUploadProgress(0);
      }, 500);
      
    } catch (error) {
      setError(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsUploading(false);
      setUploadingFile(null);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const getFileIconSrc = (type: string) => {
    return type === 'csv' ? '/csv-file.png' : '/xlsx-file.png';
  };

  return (
    <>
      {/* Sidebar header */}
      <div className="py-5">
        <div className="flex items-center gap-2">
          <RiDatabaseLine
            className="text-muted-foreground/70"
            size={20}
            aria-hidden="true"
          />
          <h2 className="text-sm font-medium">Data Management</h2>
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase text-muted-foreground/80">
            Upload Dataset
          </h3>
          {dataset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDataset(null)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
            >
              <RiDeleteBinLine className="w-3 h-3" />
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {!dataset ? (
          isUploading && uploadingFile ? (
            /* Upload Progress Container */
            <div className="w-full">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded">
                    <RiFileTextLine className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {uploadingFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {uploadingFile.size}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-200 dark:to-gray-100 h-1.5 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Container */
            <div
              className={`
                group relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 cursor-pointer
                ${isDragging 
                  ? 'border-gray-800 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 dark:border-gray-400' 
                  : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              
              <div className="space-y-4">
                <div className="flex items-center justify-center mx-auto group-hover:animate-[bounce-up_1.5s_ease-in-out_infinite]">
                  <Image 
                    src="/file.png" 
                    alt="Upload file" 
                    width={48} 
                    height={48}
                    className="transition-transform duration-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isDragging ? 'Drop your file here' : 'Upload your dataset'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Drag & drop or click to browse
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    CSV or XLSX files only
                  </p>
                </div>
                
                <Button
                  size="sm"
                  className="mt-2 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700 hover:border-gray-600"
                >
                  <RiUploadLine className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </div>
          )
        ) : (
          /* Dataset Info Card */
          <div className="w-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded">
                  <Image 
                    src={getFileIconSrc(dataset.type)} 
                    alt={`${dataset.type.toUpperCase()} file`} 
                    width={20} 
                    height={20}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {dataset.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {dataset.size}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {dataset.rows.toLocaleString()} rows
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {dataset.columns} cols
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700 hover:border-gray-600"
                >
                  <RiEyeLine className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700 hover:border-gray-600"
                >
                  <RiDownloadLine className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
SettingsPanelContent.displayName = "SettingsPanelContent";

const SettingsPanel = () => {
  const { isMobile, openMobile, setOpenMobile } = useSettingsPanel();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent className="w-80 px-4 md:px-6 py-0 bg-[hsl(240_5%_92.16%)] [&>button]:hidden">
          <SheetTitle className="hidden">Settings</SheetTitle>
          <div className="flex h-full w-full flex-col">
            <SettingsPanelContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <ScrollArea>
      <div className="w-[350px] px-4 md:px-6">
        <SettingsPanelContent />
      </div>
    </ScrollArea>
  );
};
SettingsPanel.displayName = "SettingsPanel";

const SettingsPanelTrigger = ({
  onClick,
}: {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) => {
  const { isMobile, togglePanel } = useSettingsPanel();

  if (!isMobile) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      className="px-2"
      onClick={(event) => {
        onClick?.(event);
        togglePanel();
      }}
    >
      <RiSettingsLine
        className="text-muted-foreground sm:text-muted-foreground/70 size-5"
        size={20}
        aria-hidden="true"
      />
      <span className="max-sm:sr-only">Settings</span>
    </Button>
  );
};
SettingsPanelTrigger.displayName = "SettingsPanelTrigger";

export {
  SettingsPanel,
  SettingsPanelProvider,
  SettingsPanelTrigger,
  useSettingsPanel,
};
