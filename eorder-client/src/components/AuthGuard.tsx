import { useEffect, useState } from 'react';

const SSO_URL = 'https://sso.ceresnl.com?idp=eorder&callback=http://172.17.253.122:5173';
const SSO_COOKIE_NAME = 'SSO_TOKEN';

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

interface AuthGuardProps {
    children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const token = getCookie(SSO_COOKIE_NAME);
        if (!token) {
            // No SSO cookie found, redirect to SSO login
            window.location.href = SSO_URL;
        } else {
            setIsAuthenticated(true);
        }
    }, []);

    // Still checking...
    if (isAuthenticated === null) {
        return (
            <div className="flex items-center justify-center h-screen bg-neutral-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#A51C24] mx-auto mb-4"></div>
                    <p className="text-sm text-neutral-500">Checking authentication...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AuthGuard;
