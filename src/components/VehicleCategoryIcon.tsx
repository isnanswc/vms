import React from 'react';
import { Bike, Car, Truck, Forklift, CarFront, Zap } from 'lucide-react';
import type { VehicleCategory } from '../types';

interface VehicleCategoryIconProps {
  category?: VehicleCategory | string;
  isElectric?: boolean;
  className?: string;
}

export const VehicleCategoryIcon: React.FC<VehicleCategoryIconProps> = ({
  category = 'mobil',
  isElectric = false,
  className = 'w-4 h-4',
}) => {
  const renderCategoryIcon = () => {
    switch (category?.toLowerCase()) {
      case 'motor':
        return <Bike className={className} />;
      case 'truk':
        return <Truck className={className} />;
      case 'forklift':
        return <Forklift className={className} />;
      case 'roda3':
      case 'roda 3':
      case 'tossa':
      case 'viar':
        return <CarFront className={className} />;
      case 'mobil':
      default:
        return <Car className={className} />;
    }
  };

  if (isElectric) {
    return (
      <span className="relative inline-flex items-center">
        {renderCategoryIcon()}
        <Zap className="w-2.5 h-2.5 text-cyan-400 absolute -top-1 -right-1 fill-cyan-400 drop-shadow-xs" />
      </span>
    );
  }

  return renderCategoryIcon();
};

export const getCategoryLabel = (category?: string): string => {
  switch (category?.toLowerCase()) {
    case 'motor':
      return 'Motor';
    case 'truk':
      return 'Truk';
    case 'forklift':
      return 'Forklift';
    case 'roda3':
    case 'roda 3':
      return 'Roda 3';
    case 'mobil':
    default:
      return 'Mobil';
  }
};
