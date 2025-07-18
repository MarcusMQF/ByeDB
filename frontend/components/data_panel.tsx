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
  RiDownloadLine,
  RiRefreshLine
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
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useDatasetContext } from "@/lib/dataset-context";

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
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadingFile, setUploadingFile] = React.useState<{name: string, size: string} | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = React.useState(false);
  const { datasets, uploadFile, error: apiError, exportDatabase, clearAllDatasets, isLoading: isDatasetsLoading, lastRefreshTime, refreshDatasets, getDatasetLastUpdated, isDatasetRecentlyUpdated } = useDatasetContext();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file type by extension (more flexible than MIME type)
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json', '.db'];
    const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidFile) {
      setError('Please upload a CSV, Excel (.xlsx/.xls), JSON, or SQLite (.db) file.');
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
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + Math.random() * 15, 85));
      }, 200);

      // Upload file to backend API
      await uploadFile(file, true);
      
      // Complete the progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Small delay to show 100% completion
      setTimeout(() => {
        setIsUploading(false);
        setUploadingFile(null);
        setUploadProgress(0);
      }, 500);
      
    } catch (error) {
      console.error('File upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to upload file: ${errorMessage}`);
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

  const handleClearDatasets = async () => {
    try {
      await clearAllDatasets();
      setShowClearDialog(false);
    } catch (error) {
      console.error('Failed to clear datasets:', error);
    }
  };

  // Function to get the appropriate icon based on dataset name/format
  const getDatasetIcon = (datasetName: string) => {
    const fileName = datasetName.toLowerCase();
    
    // CSV and Excel files use sheet icon
    if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return '/icons/sheet.png';
    } 
    // Database files use db icon
    else if (fileName.endsWith('.db') || fileName.endsWith('.sqlite') || fileName.endsWith('.sqlite3')) {
      return '/icons/db.png';
    } 
    // JSON files use json icon
    else if (fileName.endsWith('.json')) {
      return '/icons/json.png';
    }
    
    // For tables without extensions (from backend), determine by common patterns
    // If it looks like a typical table name, use sheet icon as default
    return '/icons/sheet.png';
  };

  return (
    <>
      {/* Confirmation Dialog for Clear Dataset */}
      <ConfirmationDialog
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete your datasets and clear the chat memory."
        confirmText="Clear Dataset"
        cancelText="Cancel"
        onConfirm={handleClearDatasets}
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
      />

      {/* Sidebar header */}
      <div className="py-5">
        <div className="flex items-center gap-2">
          <RiDatabaseLine
            className="text-muted-foreground/70"
            size={20}
            aria-hidden="true"
          />
          <h2 className="text-sm font-medium">Upload Dataset</h2>
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase text-muted-foreground/80">
            Upload Dataset
          </h3>
          {datasets.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearDialog(true)}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-red-500 flex items-center gap-1"
              >
                <RiDeleteBinLine className="w-3 h-3" />
                <span>Clear Dataset</span>
              </Button>
            </div>
          )}
        </div>

        {(error || apiError) && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error || apiError}</p>
          </div>
        )}

        {/* Upload Section - Always visible */}
        <div className="space-y-3">
          {isUploading && uploadingFile ? (
            /* Upload Progress Container */
            <div className="w-full">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8">
                    <Image 
                      src={getDatasetIcon(uploadingFile.name)}
                      alt="Uploading file" 
                      width={18} 
                      height={18}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {uploadingFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {uploadingFile.size}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {Math.round(uploadProgress)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 h-2 rounded-full transition-all duration-300 ease-out" 
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
                accept=".csv,.xlsx,.xls,.json,.db"
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
                    CSV, XLSX, JSON or DB files only
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
          )}
        </div>

        {/* Uploaded Datasets Section - Always visible */}
        {datasets.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium uppercase text-muted-foreground/80">
                DATASETS
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshDatasets}
                  disabled={isDatasetsLoading}
                  className={`
                    h-6 w-6 p-0 rounded-full
                    text-muted-foreground hover:text-foreground
                    hover:bg-gray-100 dark:hover:bg-gray-800
                    transition-all duration-200 ease-out
                    hover:scale-110 hover:shadow-sm
                    active:scale-95
                    disabled:opacity-70 disabled:cursor-not-allowed
                    disabled:hover:scale-100 disabled:hover:shadow-none
                    group relative overflow-hidden
                  `}
                  title="Refresh datasets"
                >
                  <RiRefreshLine 
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                      isDatasetsLoading ? 'animate-spin' : 'group-hover:rotate-180'
                    }`} 
                  />
                  
                  {/* Subtle hover glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </div>
            </div>
            
            <div className="w-full space-y-3 pb-6">
              {datasets.map((dataset, index) => {
                const datasetLastUpdated = getDatasetLastUpdated(dataset.id);
                const isRecentlyUpdated = isDatasetRecentlyUpdated(dataset.id);
                return (
                <div key={dataset.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8">
                        <Image 
                          src={getDatasetIcon(dataset.name)}
                          alt="Dataset file" 
                          width={24} 
                          height={24}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {dataset.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Last modified: {dataset.lastModified}
                        </p>
                      </div>
                    </div>
                    
                    {/* Individual dataset last updated timestamp */}
                    {datasetLastUpdated && (
                      <div className="flex-shrink-0 text-right">
                        <div className={`text-xs px-2 py-1 rounded-md border transition-all duration-300 ${
                          isRecentlyUpdated 
                            ? 'text-green-700 dark:text-green-300 bg-green-100/80 dark:bg-green-900/30 border-green-300 dark:border-green-600 shadow-sm' 
                            : 'text-muted-foreground/70 bg-gray-100/50 dark:bg-gray-700/30 border-gray-200/30 dark:border-gray-600/30'
                        }`}>
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              isRecentlyUpdated 
                                ? 'bg-green-500 animate-pulse' 
                                : 'bg-gray-400 dark:bg-gray-500'
                            }`}></div>
                            <span>{datasetLastUpdated.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true 
                            })}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {dataset.rows.toLocaleString()}
                    </p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Rows</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {dataset.columns}
                    </p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Columns</p>
                  </div>
                </div>
                
                {/* File Size Information - Only for uploaded datasets */}
                {dataset.source === 'uploaded' && (
                  <div className="mb-4">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                          File Size
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {/* Calculate estimated file size based on data */}
                          {dataset.data && dataset.data.length > 0 
                            ? `${Math.max(0.1, (dataset.rows * dataset.columns * 10) / 1024 / 1024).toFixed(1)} MB`
                            : 'Unknown'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Badge variant="secondary" className="text-xs font-medium">
                    {dataset.rows === 1 ? '1 record' : `${dataset.rows.toLocaleString()} records`}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs font-medium text-black dark:text-white">
                    <RiCheckLine className="w-3 h-3" />
                    <span>{dataset.source === 'uploaded' ? 'Uploaded' : 'Created'}</span>
                  </div>
                </div>
                </div>
                );
              })}
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
