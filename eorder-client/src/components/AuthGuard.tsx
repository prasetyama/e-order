import { useEffect, useState } from 'react';
import { authApi } from '../api/api';

const SSO_URL = 'https://sso.ceresnl.com?idp=eorder&callback=http://172.16.60.50:5173';
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
        const checkAuth = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const tokenParam = urlParams.get('token');
            const cookie = getCookie(SSO_COOKIE_NAME);

            if (!cookie) {

                if (tokenParam) {
                    try {
                        // Validate token from URL param
                        const response = await authApi.validateToken(tokenParam);
                        if (response.success) {
                            // Set cookie and set authenticated
                            document.cookie = `${SSO_COOKIE_NAME}=${tokenParam}; path=/; max-age=86400`;
                            setIsAuthenticated(true);

                            // Clean up URL: remove token param without refreshing
                            const newUrl = window.location.pathname + window.location.search.replace(/[?&]token=[^&]+/, '').replace(/^&/, '?');
                            window.history.replaceState({}, '', newUrl);
                        } else {
                            window.location.href = SSO_URL;
                        }
                    } catch (error) {
                        console.error('Token validation failed:', error);
                        window.location.href = SSO_URL;
                    }
                } else {
                    window.location.href = SSO_URL;
                    return;
                }
            } else {
                setIsAuthenticated(true);
            }
        };

        checkAuth();
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
