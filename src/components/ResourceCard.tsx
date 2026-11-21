import React from 'react';
import { ArrowRight, MapPin, Users } from 'lucide-react';
import { ResourceImage } from './ResourceImage';
import { StatusBadge } from './StatusBadge';
import type { Club, Resource, ResourceAvailability } from '../types/eventpool';

interface ResourceCardProps {
  resource: Resource;
  club?: Club;
  availability: ResourceAvailability;
  onSelect: () => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  club,
  availability,
  onSelect,
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View details for ${resource.name}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className="bg-white rounded-3xl border border-[#E5E2D9] hover:border-[#2D4A35] transition-colors overflow-hidden flex flex-col cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2D4A35]"
    >
      <div className="relative h-44 overflow-hidden">
        <ResourceImage
          src={resource.images[0]}
          alt={resource.name}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
        />
        <div className="absolute top-3 right-3">
          <StatusBadge status={availability} />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#1F3626] line-clamp-1">
            {resource.name}
          </h3>
          <div className="mt-1.5 space-y-1 text-xs text-[#6B766E]">
            <p className="flex items-center gap-1.5 tabular-nums">
              <Users className="w-3.5 h-3.5 shrink-0 text-[#4A554E]" />
              <span className="truncate">
                {club?.acronym || 'UM Club'} · {resource.availableUnits} unit
                {resource.availableUnits === 1 ? '' : 's'}
              </span>
            </p>
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-[#4A554E]" />
              <span className="truncate">{resource.location}</span>
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <span className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-[#2D4A35] group-hover:bg-[#233B2A] text-white text-xs font-semibold transition-colors">
            View Details
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
