import { Link, type LinkProps } from 'react-router-dom';
import { buttonStyles, type ButtonVariant } from '@/lib/buttonStyles';

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
}

export default function ButtonLink({ variant = 'primary', className, ...props }: ButtonLinkProps) {
  return <Link className={buttonStyles(variant, className)} {...props} />;
}
