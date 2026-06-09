import Image from 'next/image';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  priority?: boolean;
}

const sizes = {
  sm: {
    gap: 'gap-2',
    image: 'h-8 w-8',
    pixels: 32,
    text: 'text-lg',
  },
  md: {
    gap: 'gap-2.5',
    image: 'h-10 w-10',
    pixels: 40,
    text: 'text-xl',
  },
  lg: {
    gap: 'gap-3',
    image: 'h-14 w-14',
    pixels: 56,
    text: 'text-3xl',
  },
};

const BrandLogo = ({
  size = 'sm',
  showText = true,
  className = '',
  imageClassName = '',
  textClassName = '',
  priority = false,
}: BrandLogoProps) => {
  const selectedSize = sizes[size];

  return (
    <span className={`inline-flex items-center ${selectedSize.gap} ${className}`}>
      <Image
        src="/logo-petly.png"
        alt="Logo Petly"
        width={selectedSize.pixels}
        height={selectedSize.pixels}
        priority={priority}
        className={`${selectedSize.image} ${imageClassName}`}
      />
      {showText && (
        <span className={`${selectedSize.text} font-bold text-white tracking-tight ${textClassName}`}>
          Petly
        </span>
      )}
    </span>
  );
};

export default BrandLogo;
