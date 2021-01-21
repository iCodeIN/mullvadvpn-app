import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import styled from 'styled-components';
import { colors } from '../../config.json';
import { messages } from '../../shared/gettext';
import { IReduxState } from '../redux/store';
import ImageView from './ImageView';

export enum HeaderBarStyle {
  default = 'default',
  defaultDark = 'defaultDark',
  error = 'error',
  success = 'success',
}

const headerBarStyleColorMap = {
  [HeaderBarStyle.default]: colors.blue,
  [HeaderBarStyle.defaultDark]: colors.darkBlue,
  [HeaderBarStyle.error]: colors.red,
  [HeaderBarStyle.success]: colors.green,
};

interface IHeaderBarContainerProps {
  barStyle?: HeaderBarStyle;
  unpinnedWindow: boolean;
}

const HeaderBarContainer = styled.header({}, (props: IHeaderBarContainerProps) => ({
  padding: '12px 16px',
  paddingTop: window.platform === 'darwin' && !props.unpinnedWindow ? '24px' : '12px',
  backgroundColor: headerBarStyleColorMap[props.barStyle ?? HeaderBarStyle.default],
}));

const HeaderBarContent = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  // In views without the brand components we still want the Header to have the same height.
  minHeight: '51px',
});

interface IHeaderBarProps {
  barStyle?: HeaderBarStyle;
  className?: string;
  children?: React.ReactNode;
}

export default function HeaderBar(props: IHeaderBarProps) {
  const unpinnedWindow = useSelector(
    (state: IReduxState) => state.settings.guiSettings.unpinnedWindow,
  );

  return (
    <HeaderBarContainer
      barStyle={props.barStyle}
      className={props.className}
      unpinnedWindow={unpinnedWindow}>
      <HeaderBarContent>{props.children}</HeaderBarContent>
    </HeaderBarContainer>
  );
}

const BrandContainer = styled.div({
  display: 'flex',
  flex: 1,
  alignItems: 'center',
});

const Title = styled.span({
  fontFamily: 'DINPro',
  fontSize: '24px',
  fontWeight: 900,
  lineHeight: '30px',
  color: colors.white80,
  marginLeft: '9px',
});

const Logo = styled(ImageView)({
  margin: '4px 0 3px',
});

export function Brand(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <BrandContainer {...props}>
      <Logo width={44} height={44} source="logo-icon" />
      <Title>{messages.pgettext('generic', 'MULLVAD VPN')}</Title>
    </BrandContainer>
  );
}

const HeaderBarSettingsButtonContainer = styled.button({
  cursor: 'default',
  padding: 0,
  marginLeft: 8,
  backgroundColor: 'transparent',
  border: 'none',
});

export function HeaderBarSettingsButton() {
  const history = useHistory();

  const openSettings = useCallback(() => {
    history.push('/settings');
  }, [history]);

  return (
    <HeaderBarSettingsButtonContainer
      onClick={openSettings}
      aria-label={messages.gettext('Settings')}>
      <ImageView
        height={24}
        width={24}
        source="icon-settings"
        tintColor={colors.white80}
        tintHoverColor={colors.white}
      />
    </HeaderBarSettingsButtonContainer>
  );
}
