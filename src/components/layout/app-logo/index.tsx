import { useDevice } from '@deriv-com/ui';
import './app-logo.scss';

export const AppLogo = () => {
    const { isDesktop } = useDevice();

    if (!isDesktop) return null;
    return (
        <a className='app-header__logo digit-printers-logo' href='/'>
            <div className='digit-printers-logo__icon'>DP</div>
            <span className='digit-printers-logo__text'>DigitPrinters</span>
        </a>
    );
};
