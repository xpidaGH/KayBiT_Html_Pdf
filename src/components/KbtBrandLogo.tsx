import React, { useState } from 'react';
import { PlatformMode } from '../types';

interface KbtBrandLogoProps {
  variant?: PlatformMode;
  sizeClass?: string;
}

const LOGO_ASSETS: Record<PlatformMode, { src: string; alt: string; defaultSize: string }> = {
  web: {
    src: '/src/assets/images/kbt_brand_logo_web_1793934382969.jpg',
    alt: 'KBT Web Header Brand Logo',
    defaultSize: 'w-9 h-9',
  },
  desktop: {
    src: '/src/assets/images/kbt_app_icon_desktop_1793934372074.jpg',
    alt: 'KBT Desktop Title Bar App Icon',
    defaultSize: 'w-7 h-7',
  },
  mobile: {
    src: '/src/assets/images/kbt_brand_logo_mobile_1793934371796.jpg',
    alt: 'KBT Mobile App Bar Brand Logo',
    defaultSize: 'w-8 h-8',
  },
};

export const KbtBrandLogo: React.FC<KbtBrandLogoProps> = ({
  variant = 'web',
  sizeClass,
}) => {
  const [hasError, setHasError] = useState(false);
  const asset = LOGO_ASSETS[variant];
  const resolvedSize = sizeClass || asset.defaultSize;

  if (hasError) {
    return (
      <div
        className={`${resolvedSize} bg-gradient-to-br from-zinc-900 to-black mask-squircle flex items-center justify-center border border-lime-400/40 shrink-0 shadow-md`}
        title={asset.alt}
      >
        <span className="text-[11px] font-extrabold tracking-tighter text-lime-400">
          KBT
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${resolvedSize} bg-gradient-to-br from-zinc-900 to-black mask-squircle flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-yellow-400/25`}
      title={asset.alt}
    >
      <img
        src={asset.src}
        alt={asset.alt}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover ${
          variant === 'web' ? 'scale-125' : 'scale-100'
        } filter drop-shadow-[0_0_6px_rgba(163,230,53,0.45)]`}
      />
    </div>
  );
};
