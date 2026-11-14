import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ResourceImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export const ResourceImage: React.FC<ResourceImageProps> = ({
  src,
  alt,
  className = '',
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#DCE7D8] to-[#EFECE2] text-[#2D4A35] p-4 text-center ${className}`}
      >
        <Package className="w-7 h-7 opacity-70 mb-1.5" />
        <span className="text-xs font-medium line-clamp-1">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
