import React from 'react';
import { ICONS, IconName } from '../utils/icons';

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/** Single-colour line icon that inherits the surrounding text colour. */
export const Icon: React.FC<IconProps> = ({ name, size = 16, strokeWidth = 1.75, className, style, title }) => (
  <svg
    className={`ui-icon${className ? ` ${className}` : ''}`}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : undefined}
    dangerouslySetInnerHTML={{ __html: (title ? `<title>${title}</title>` : '') + ICONS[name] }}
  />
);
