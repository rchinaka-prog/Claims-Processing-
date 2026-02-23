
import React from 'react';
import { 
  ClipboardList, PenTool, UserCog, BarChart3, Truck
} from 'lucide-react';
import { UserRole } from './types';

export const COLORS = {
  fmRed: '#E31B23',
  fmBlack: '#000000',
  fmWhite: '#FFFFFF',
  fmGrey: '#F4F4F4',
  fmDarkGrey: '#1A1A1A'
};

export const ROLE_CONFIG = {
  [UserRole.CUSTOMER]: {
    icon: <Truck className="w-5 h-5" />,
    sidebarBg: 'bg-white',
    sidebarText: 'text-black',
    accentColor: 'text-[#E31B23]',
    borderColor: 'border-slate-100'
  },
  [UserRole.ASSESSOR]: {
    icon: <ClipboardList className="w-5 h-5" />,
    sidebarBg: 'bg-black',
    sidebarText: 'text-white',
    accentColor: 'text-[#E31B23]',
    borderColor: 'border-zinc-800'
  },
  [UserRole.REPAIR_PARTNER]: {
    icon: <PenTool className="w-5 h-5" />,
    sidebarBg: 'bg-black',
    sidebarText: 'text-white',
    accentColor: 'text-[#E31B23]',
    borderColor: 'border-zinc-800'
  },
  [UserRole.SUPPORT_STAFF]: {
    icon: <UserCog className="w-5 h-5" />,
    sidebarBg: 'bg-white',
    sidebarText: 'text-black',
    accentColor: 'text-[#E31B23]',
    borderColor: 'border-slate-100'
  },
  [UserRole.MANAGER]: {
    icon: <BarChart3 className="w-5 h-5" />,
    sidebarBg: 'bg-black',
    sidebarText: 'text-white',
    accentColor: 'text-[#E31B23]',
    borderColor: 'border-zinc-800'
  }
};
