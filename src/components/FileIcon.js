import React from 'react';
import { 
  FileText, FileImage, Film, Music, Archive, Code2, 
  File, FileSpreadsheet, Presentation, BookOpen
} from 'lucide-react';

const icons = {
  image: FileImage,
  pdf: BookOpen,
  word: FileText,
  excel: FileSpreadsheet,
  powerpoint: Presentation,
  video: Film,
  audio: Music,
  archive: Archive,
  code: Code2,
  text: FileText,
  other: File,
};

export default function FileIcon({ category, color, size = 24, className = '' }) {
  const Icon = icons[category] || File;
  return <Icon size={size} color={color} className={className} strokeWidth={1.5} />;
}
