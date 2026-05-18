import React, { useState } from 'react';
import { requestOidcAuthentication } from '@deriv-com/auth-client';
import './landing-page.scss';

const REFERRAL_URL = 'https://partner-tracking.deriv.com/click?a=14252&o=1&c=3&link_id=1';
const DERIV_SIGNUP_URL = 'https://deriv.com/signup/';

// OAuth constants — client_id is for authorization only; app_id=134275 is ONLY for WebSocket after login
const OAUTH_CLIENT_ID = '332LK4VWd9A4pEEfTMn53';
const OAUTH_REDIRECT_URI = 'https://www.digitprinters.site/auth/callback';
const OAUTH_ENDPOINT = 'https://oauth.deriv.com/oauth2/authorize';

const TICKER_ITEMS = [
    { name: 'Volatility 75', value: '1,248.32', change: '+1.24%', up: true },
    { name: 'Volatility 100', value: '842.10', change: '+0.87%', up: true },
    { name: 'Volatility 25', value: '312.45', change: '-0.31%', up: false },
    { name: 'Boom 1000', value: '9,421.00', change: '+2.11%', up: true },
    { name: 'Crash 1000', value: '8,734.55', change: '-1.05%', up: false },
    { name: 'Jump 100', value: '1,902.88', change: '+0.64%', up: true },
    { name: 'Boom 500', value: '7,210.33', change: '+1.80%', up: true },
    { name: 'Crash 500', value: '6,891.22', change: '-0.42%', up: false },
    { name: 'Volatility 50', value: '568.74', change: '+0.19%', up: true },
    { name: 'Step Index', value: '104.22', change: '+0.08%', up: true },
];

const FEATURES = [
    {
        icon: '⚡',
        title: 'No-Code Bot Builder',
        desc: 'Build sophisticated trading strategies using a drag-and-drop visual interface — no programming skills required.',
    },
    {
        icon: '📊',
        title: 'Real-Time Analytics',
        desc: 'Monitor live trades, P&L, win/loss ratios, and bot performance with advanced analytics dashboards.',
    },
    {
        icon: '🔄',
        title: 'Automated 24/7 Trading',
        desc: 'Your bots trade round the clock on synthetic indices and real markets — even while you sleep.',
    },
    {
        icon: '🛡️',
        title: 'Risk Management',
        desc: 'Set stop-loss, take-profit, and max stake limits to keep your trading strategy within your risk tolerance.',
    },
    {
        icon: '📈',
        title: 'Live Market Charts',
        desc: 'TradingView-powered charts with full technical indicator support for precise market analysis.',
    },
    {
        icon: '🚀',
        title: 'Quick Strategies',
        desc: "Launch instantly with pre-built strategies like Martingale, D'Alembert, and Oscar's Grind.",
    },
];

const MARKETS = [
    'Volatility Indices',
    'Boom & Crash',
    'Jump Indices',
    'Step Index',
    'Forex',
    'Commodities',
    'Stock Indices',
    'Crypto',
];

const LandingPage = () => {
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async () => {
        setIsLoggingIn(true);

        // Build the fallback OAuth URL once so we can log it before any redirect
        const state = Math.random().toString(36).substring(2);
        const fallbackParams = new URLSearchParams({
            client_id: OAUTH_CLIENT_ID,
            redirect_uri: OAUTH_REDIRECT_URI,
            response_type: 'code',
            scope: 'read trade payments admin trading_information',
            state,
        });
        const fallbackOauthUrl = `${OAUTH_ENDPOINT}?${fallbackParams.toString()}`;

        // Diagnostic console prints (requirement #9)
        console.log('[Auth] Final OAuth URL (fallback):', fallbackOauthUrl);
        console.log('[Auth] Final redirect_uri:', OAUTH_REDIRECT_URI);
        console.log(
            '[Auth] app_id injected into OAuth URL?',
            fallbackOauthUrl.includes('app_id') ? 'YES — ERROR' : 'NO — correct'
        );

        try {
            // Primary path: OIDC via @deriv-com/auth-client (handles PKCE internally)
            await requestOidcAuthentication({
                redirectCallbackUri: OAUTH_REDIRECT_URI,
            });
        } catch (err) {
            console.error('[Auth] OIDC failed, falling back to direct OAuth2 code flow:', err);
            // Fallback: standard OAuth2 Authorization Code — client_id ONLY, no app_id
            window.location.href = fallbackOauthUrl;
        }
    };

    const handleCreateAccount = () => {
        window.open(REFERRAL_URL || DERIV_SIGNUP_URL, '_blank', 'noopener,noreferrer');
    };

    const duplicatedTicker = [...TICKER_ITEMS, ...TICKER_ITEMS];

    return (
        <div className='landing'>
            {/* Navbar */}
            <nav className='landing__navbar'>
                <a className='landing__nav-logo' href='/'>
                    <div className='landing__nav-logo-icon'>DP</div>
                    <span className='landing__nav-logo-text'>DigitPrinters</span>
                </a>
                <div className='landing__nav-actions'>
                    <button className='landing__btn landing__btn--outline landing__btn--sm' onClick={handleCreateAccount}>
                        Create Account
                    </button>
                    <button
                        className='landing__btn landing__btn--primary landing__btn--sm'
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? (
                            <>
                                <span className='landing__loading-spinner' />
                                Connecting...
                            </>
                        ) : (
                            'Log in'
                        )}
                    </button>
                </div>
            </nav>

            {/* Ticker Bar */}
            <div className='landing__ticker-bar' aria-hidden='true'>
                <div className='landing__ticker-track'>
                    {duplicatedTicker.map((item, i) => (
                        <span
                            key={i}
                            className={`landing__ticker-item landing__ticker-item--${item.up ? 'up' : 'down'}`}
                        >
                            <span className='landing__ticker-name'>{item.name}</span>
                            <span>{item.value}</span>
                            <span className='landing__ticker-change'>{item.change}</span>
                        </span>
                    ))}
                </div>
            </div>

            {/* Hero */}
            <section className='landing__hero'>
                <div className='landing__hero-content'>
                    <div className='landing__badge'>
                        <span className='landing__badge-dot' />
                        Powered by Deriv Markets
                    </div>

                    <h1 className='landing__title'>
                        Trade Smarter.
                        <br />
                        <span className='landing__title-accent'>Print Profits.</span>
                    </h1>

                    <p className='landing__subtitle'>
                        DigitPrinters is a professional algorithmic trading platform built on Deriv&apos;s
                        market infrastructure — automate your strategies on synthetic indices, forex, and more.
                    </p>

                    <div className='landing__cta-group'>
                        <button
                            className='landing__btn landing__btn--primary'
                            onClick={handleLogin}
                            disabled={isLoggingIn}
                        >
                            {isLoggingIn ? (
                                <>
                                    <span className='landing__loading-spinner' />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor'>
                                        <path d='M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z' />
                                    </svg>
                                    Login with Deriv
                                </>
                            )}
                        </button>
                        <button className='landing__btn landing__btn--outline' onClick={handleCreateAccount}>
                            <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor'>
                                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z' />
                            </svg>
                            Create Account
                        </button>
                    </div>
                </div>
            </section>

            {/* Markets strip */}
            <div className='landing__markets'>
                <p className='landing__markets-label'>Supported Markets</p>
                <div className='landing__markets-grid'>
                    {MARKETS.map(market => (
                        <div key={market} className='landing__market-chip'>
                            <span className='landing__market-dot' />
                            {market}
                        </div>
                    ))}
                </div>
            </div>

            {/* Features */}
            <section className='landing__features'>
                <p className='landing__features-label'>Why DigitPrinters</p>
                <h2 className='landing__features-title'>Everything you need to trade algorithmically</h2>
                <p className='landing__features-subtitle'>
                    From beginner-friendly bots to advanced strategies — all in one platform.
                </p>
                <div className='landing__features-grid'>
                    {FEATURES.map(f => (
                        <div key={f.title} className='landing__feature-card'>
                            <div className='landing__feature-icon'>{f.icon}</div>
                            <h3 className='landing__feature-title'>{f.title}</h3>
                            <p className='landing__feature-desc'>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className='landing__footer'>
                <span className='landing__footer-copy'>
                    &copy; {new Date().getFullYear()} DigitPrinters. Powered by Deriv markets infrastructure.
                </span>
                <div className='landing__footer-links'>
                    <a
                        className='landing__footer-link'
                        href='https://deriv.com/responsible/'
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        Responsible Trading
                    </a>
                    <a
                        className='landing__footer-link'
                        href='https://deriv.com/terms-and-conditions/'
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        Terms
                    </a>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
