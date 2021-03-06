import React from 'react';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {Text} from '../../Library/View/Text';
import {Button} from '../../Library/View/Button';
import {appTheme} from '../../Library/Style/appTheme';
import {font, fontWeight, space} from '../../Library/Style/layout';
import {ClickView} from '../../Library/View/ClickView';
import {Image} from '../../Library/View/Image';
import {ShellUtil} from '../../Library/Util/ShellUtil';
import {PlatformUtil} from '../../Library/Util/PlatformUtil';
import {VersionPolling} from '../../Repository/Polling/VersionPolling';

type Props = {
  githubUrl: string;
  onRetry: () => void;
}

type State = {
  lang: 'ja' | 'en';
}

export class PrefScopeErrorFragment extends React.Component<Props, State> {
  state: State = {
    lang: PlatformUtil.getLang(),
  }

  private handleOpenSettings() {
    const url = `${this.props.githubUrl}/settings/tokens`;
    ShellUtil.openExternal(url);
  }

  render() {
    const version = VersionPolling.getVersion();
    return (
      <Modal show={true} onClose={() => null}>
        <Root>
          <LangRow>
            <ClickView onClick={() => this.setState({lang: 'en'})}><LangLabel>English</LangLabel></ClickView>
            <Text style={{fontSize: font.small, padding: `0 ${space.small}px`}}>/</Text>
            <ClickView onClick={() => this.setState({lang: 'ja'})}><LangLabel>Japanese</LangLabel></ClickView>
          </LangRow>

          <Text style={{display: this.state.lang !== 'ja' ? 'inline' : 'none'}}>
            Jasper v{version} requires additional <ScopeName>notifications</ScopeName> and <ScopeName>read:org</ScopeName> scopes.
            <br/>
            Add these scopes to your current access tokens from the GitHub/GHE token edit screen.
            <br/>
            <ScopeNote>requires scopes: repo, user, notifications and read:org</ScopeNote>
          </Text>
          <Text style={{display: this.state.lang === 'ja' ? 'inline' : 'none'}}>
            Jasper v{version}は追加で<ScopeName>notifications</ScopeName>と<ScopeName>read:org</ScopeName>のスコープを必要とします。
            <br/>
            GitHub/GHEのトークン編集画面から、現在利用中のアクセストークンにこれらのスコープを追加してください。
            <br/>
            <ScopeNote>必要なスコープ: repo, user, notifications, read:org</ScopeNote>
          </Text>

          <Images>
            <Image source={{url: '../image/scope_readorg.png'}} style={{width: 200}}/>
            <View style={{height: space.large}}/>
            <Image source={{url: '../image/scope_notifications.png'}} style={{width: 200}}/>
          </Images>

          <ButtonRow>
            <Button onClick={() => this.props.onRetry()}>OK</Button>
            <View style={{width: space.large}}/>
            <Button onClick={() => this.handleOpenSettings()} type='primary'>Open GitHub/GHE</Button>
          </ButtonRow>
        </Root>
      </Modal>
    );
  }
}

const Root = styled(View)`
  padding: ${space.medium}px;
`;

const LangRow = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-bottom: ${space.medium}px;
`;

const LangLabel = styled(Text)`
  font-size: ${font.small}px;
`;

const ScopeName = styled(Text)`
  background: ${() => appTheme().bg.primarySoft};
  font-weight: ${fontWeight.bold};
  padding: ${space.small}px;
  display: inline-block;
  border-radius: 4px;
`;

const ScopeNote = styled(Text)`
  font-size: ${font.small}px;
  padding-top: ${space.small}px;
  color: ${() => appTheme().text.soft};
`;

const Images = styled(View)`
  background: ${() => appTheme().accent.normal};
  margin: ${space.medium2}px 0;
  padding: ${space.large}px;
  border-radius: 4px;
  align-items: center;
  width: 80%;
  align-self: center;
}
`;

const ButtonRow = styled(View)`
  padding-top: ${space.large}px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;
