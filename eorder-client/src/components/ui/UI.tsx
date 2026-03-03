import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        const variants = {
            primary: 'bg-[#A51C24] text-white hover:bg-[#8A171D] shadow-sm',
            secondary: 'bg-neutral-800 text-white hover:bg-neutral-900',
            outline: 'border border-neutral-300 bg-transparent hover:bg-neutral-50 text-neutral-700',
            ghost: 'hover:bg-neutral-100 text-neutral-600',
            danger: 'bg-red-600 text-white hover:bg-red-700',
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 text-sm',
            lg: 'h-12 px-6 text-base',
            icon: 'h-9 w-9 items-center justify-center p-0',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A51C24] disabled:pointer-events-none disabled:opacity-50',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="space-y-1 w-full">
                {label && <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">{label}</label>}
                <input
                    ref={ref}
                    className={cn(
                        'flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A51C24] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                        error && 'border-red-500 focus-visible:ring-red-500',
                        className
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export const Card = ({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) => (
    <div className={cn('bg-white border border-neutral-200 rounded-md overflow-hidden shadow-sm', className)}>
        {title && (
            <div className="bg-[#A51C24] px-4 py-2 border-b border-[#A51C24]">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">{title}</h3>
            </div>
        )}
        <div className="p-4">{children}</div>
    </div>
);
