import * as React from "react";
import { cn } from "@/lib/utils";

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onFiles?: (files: FileList) => void;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, onFiles, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0 && onFiles) {
        onFiles(e.target.files);
      }
      
      if (onChange) {
        onChange(e);
      }
    };
    
    return (
      <input
        type="file"
        ref={ref}
        className={cn(
          "block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#2C5282] file:text-white hover:file:bg-[#2C5282]/90",
          className
        )}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

FileInput.displayName = "FileInput";

export default FileInput;
