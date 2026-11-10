import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { useCallback } from 'react';
import { buttonStyles, type ButtonVariant } from '@/lib/buttonStyles';
import { useFeedback } from '@/hooks/useFeedback';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export default function Button({
  variant = 'primary',
  className,
  type = 'button',
  onClick: onClickProp,
  ...props
}: ButtonProps) {
  const { tap } = useFeedback();
  const onClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      tap();
      onClickProp?.(event);
    },
    [onClickProp, tap],
  );
  return (
    <button type={type} className={buttonStyles(variant, className)} {...props} onClick={onClick} />
  );
}
