import { getAppId } from '../config/config';
import { CookieStorage, isStorageSupported, LocalStore } from '../storage/storage';
import { getStaticUrl } from '../url';

export const redirectToLogin = (is_logged_in: boolean, language: string, has_params = true, redirect_delay = 0) => {
    if (!is_logged_in && isStorageSupported(sessionStorage)) {
        const l = window.location;
        const redirect_url = has_params ? window.location.href : `${l.protocol}//${l.host}${l.pathname}`;
        sessionStorage.setItem('redirect_url', redirect_url);
        setTimeout(() => {
            const new_href = loginUrl({ language });
            window.location.href = new_href;
        }, redirect_delay);
    }
};

export const redirectToSignUp = () => {
    window.open(getStaticUrl('/signup/'));
};

// OAuth2 client_id for DigitPrinters — separate from the numeric app_id used only for WebSocket
const OAUTH_CLIENT_ID = '332LK4VWd9A4pEEfTMn53';
const OAUTH_REDIRECT_URI = 'https://www.digitprinters.site/auth/callback';
const OAUTH_ENDPOINT = 'https://oauth.deriv.com/oauth2/authorize';

type TLoginUrl = {
    language: string;
};

export const loginUrl = ({ language }: TLoginUrl) => {
    const server_url = LocalStore.get('config.server_url');

    // QA/test environments still use the server-based endpoint with app_id (WebSocket testing only)
    if (server_url && /qa/.test(server_url)) {
        const signup_device_cookie = new (CookieStorage as any)('signup_device');
        const signup_device = signup_device_cookie.get('signup_device');
        const date_first_contact_cookie = new (CookieStorage as any)('date_first_contact');
        const date_first_contact = date_first_contact_cookie.get('date_first_contact');
        const marketing_queries = `${signup_device ? `&signup_device=${signup_device}` : ''}${
            date_first_contact ? `&date_first_contact=${date_first_contact}` : ''
        }`;
        return `https://${server_url}/oauth2/authorize?app_id=${getAppId()}&l=${language}${marketing_queries}`;
    }

    // Production OAuth2 Authorization Code flow — client_id ONLY, no app_id
    const state = Math.random().toString(36).substring(2);
    const params = new URLSearchParams({
        client_id: OAUTH_CLIENT_ID,
        redirect_uri: OAUTH_REDIRECT_URI,
        response_type: 'code',
        scope: 'read trade payments admin trading_information',
        state,
    });
    const oauthUrl = `${OAUTH_ENDPOINT}?${params.toString()}`;

    console.log('[Auth] loginUrl — Final OAuth URL:', oauthUrl);
    console.log('[Auth] loginUrl — redirect_uri:', OAUTH_REDIRECT_URI);
    console.log(
        '[Auth] loginUrl — app_id in OAuth URL?',
        oauthUrl.includes('app_id') ? 'YES — ERROR' : 'NO — correct'
    );

    return oauthUrl;
};
