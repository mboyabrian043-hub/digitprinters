import { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { crypto_currencies_display_order, fiat_currencies_display_order } from '@/components/shared';
import { generateDerivApiInstance } from '@/external/bot-skeleton/services/api/appId';
import { observer as globalObserver } from '@/external/bot-skeleton/utils/observer';
import useTMB from '@/hooks/useTMB';
import { clearAuthData } from '@/utils/auth-utils';
import { Callback } from '@deriv-com/auth-client';
import './redirect-page.scss';

const getSelectedCurrency = (
    tokens: Record<string, string>,
    clientAccounts: Record<string, any>,
    state: any
): string => {
    const getQueryParams = new URLSearchParams(window.location.search);
    const currency =
        (state && state?.account) ||
        getQueryParams.get('account') ||
        sessionStorage.getItem('query_param_currency') ||
        '';
    const firstAccountKey = tokens.acct1;
    const firstAccountCurrency = clientAccounts[firstAccountKey]?.currency;

    const validCurrencies = [...fiat_currencies_display_order, ...crypto_currencies_display_order];
    if (tokens.acct1?.startsWith('VR') || currency === 'demo') return 'demo';
    if (currency && validCurrencies.includes(currency.toUpperCase())) return currency;
    return firstAccountCurrency || 'USD';
};

type TStatus = 'processing' | 'verifying' | 'success' | 'error';

const STEPS = [
    { key: 'processing', label: 'Receiving your credentials from Deriv' },
    { key: 'verifying', label: 'Verifying account & setting up session' },
    { key: 'success', label: 'Redirecting to your dashboard' },
];

const CallbackPage = () => {
    const [status, setStatus] = useState<TStatus>('processing');
    const [errorMessage, setErrorMessage] = useState('');
    const callbackProcessed = useRef(false);

    useEffect(() => {
        if (status === 'success') {
            const t = setTimeout(() => {
                window.location.replace(window.location.origin + '/');
            }, 1800);
            return () => clearTimeout(t);
        }
    }, [status]);

    const getStepState = (stepKey: string) => {
        const order = ['processing', 'verifying', 'success'];
        const currentIdx = order.indexOf(status === 'error' ? 'processing' : status);
        const stepIdx = order.indexOf(stepKey);
        if (stepIdx < currentIdx) return 'done';
        if (stepIdx === currentIdx) return 'active';
        return 'pending';
    };

    return (
        <div className='redirect-page'>
            {/* Branded logo */}
            <a className='redirect-page__logo' href='/'>
                <div className='redirect-page__logo-icon'>DP</div>
                <span className='redirect-page__logo-text'>DigitPrinters</span>
            </a>

            <div className='redirect-page__card'>
                {status !== 'error' ? (
                    <>
                        <div className={`redirect-page__icon-wrap redirect-page__icon-wrap--${status === 'success' ? 'success' : 'loading'}`}>
                            {status === 'success' ? (
                                <span className='redirect-page__check'>✓</span>
                            ) : (
                                <div className='redirect-page__spinner' />
                            )}
                        </div>

                        <h2 className='redirect-page__title'>
                            {status === 'success' ? 'You\'re all set!' : 'Connecting your account'}
                        </h2>
                        <p className='redirect-page__subtitle'>
                            {status === 'success'
                                ? 'Authentication successful. Taking you to your dashboard…'
                                : 'Securely completing your Deriv sign-in. This only takes a moment.'}
                        </p>

                        <div className='redirect-page__steps'>
                            {STEPS.map(step => {
                                const state = getStepState(step.key);
                                return (
                                    <div key={step.key} className={`redirect-page__step redirect-page__step--${state}`}>
                                        <span className='redirect-page__step-dot' />
                                        {step.label}
                                    </div>
                                );
                            })}
                        </div>

                        {status !== 'success' && (
                            <div className='redirect-page__progress'>
                                <div className='redirect-page__progress-bar' />
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className='redirect-page__icon-wrap redirect-page__icon-wrap--error'>
                            <span className='redirect-page__error-icon'>✕</span>
                        </div>
                        <h2 className='redirect-page__title'>Authentication failed</h2>
                        <p className='redirect-page__subtitle'>
                            {errorMessage || 'Something went wrong during sign-in. Please try again.'}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <a className='redirect-page__btn' href='/'>
                                Return to DigitPrinters
                            </a>
                        </div>
                    </>
                )}
            </div>

            {/* Hidden: Callback component handles OIDC token exchange */}
            <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}>
                <Callback
                    onSignInSuccess={async (tokens: Record<string, string>, rawState: unknown) => {
                        if (callbackProcessed.current) return;
                        callbackProcessed.current = true;

                        setStatus('verifying');

                        const state = rawState as { account?: string } | null;
                        const accountsList: Record<string, string> = {};
                        const clientAccounts: Record<string, { loginid: string; token: string; currency: string }> = {};

                        for (const [key, value] of Object.entries(tokens)) {
                            if (key.startsWith('acct')) {
                                const tokenKey = key.replace('acct', 'token');
                                if (tokens[tokenKey]) {
                                    accountsList[value] = tokens[tokenKey];
                                    clientAccounts[value] = {
                                        loginid: value,
                                        token: tokens[tokenKey],
                                        currency: '',
                                    };
                                }
                            } else if (key.startsWith('cur')) {
                                const accKey = key.replace('cur', 'acct');
                                if (tokens[accKey]) {
                                    clientAccounts[tokens[accKey]].currency = value;
                                }
                            }
                        }

                        localStorage.setItem('accountsList', JSON.stringify(accountsList));
                        localStorage.setItem('clientAccounts', JSON.stringify(clientAccounts));

                        let is_token_set = false;

                        try {
                            const api = await generateDerivApiInstance();
                            if (api) {
                                const { authorize, error } = await api.authorize(tokens.token1);
                                api.disconnect();
                                if (error) {
                                    if (error.code === 'InvalidToken') {
                                        is_token_set = true;
                                        const { is_tmb_enabled = false } = useTMB();
                                        if (Cookies.get('logged_state') === 'true' && !is_tmb_enabled) {
                                            globalObserver.emit('InvalidToken', { error });
                                        }
                                        if (Cookies.get('logged_state') === 'false') {
                                            clearAuthData(false);
                                        }
                                    }
                                } else {
                                    localStorage.setItem('callback_token', authorize.toString());
                                    const clientAccountsArray = Object.values(clientAccounts);
                                    const firstId = authorize?.account_list[0]?.loginid;
                                    const filteredTokens = clientAccountsArray.filter(a => a.loginid === firstId);
                                    if (filteredTokens.length) {
                                        localStorage.setItem('authToken', filteredTokens[0].token);
                                        localStorage.setItem('active_loginid', filteredTokens[0].loginid);
                                        is_token_set = true;
                                    }
                                }
                            }
                        } catch (err) {
                            console.error('[Callback] API verification error:', err);
                        }

                        if (!is_token_set) {
                            localStorage.setItem('authToken', tokens.token1);
                            localStorage.setItem('active_loginid', tokens.acct1);
                        }

                        const selected_currency = getSelectedCurrency(tokens, clientAccounts, state);

                        Cookies.set('logged_state', 'true', {
                            domain: window.location.hostname.split('.').slice(-2).join('.') || window.location.hostname,
                            expires: 30,
                            path: '/',
                        });

                        setStatus('success');

                        setTimeout(() => {
                            window.location.replace(window.location.origin + `/?account=${selected_currency}`);
                        }, 1800);
                    }}
                    onSignInError={(error: unknown) => {
                        console.error('[Callback] Sign-in error:', error);
                        setErrorMessage(
                            error instanceof Error ? error.message : 'Authentication could not be completed.'
                        );
                        setStatus('error');
                    }}
                    renderReturnButton={() => null}
                />
            </div>
        </div>
    );
};

export default CallbackPage;
