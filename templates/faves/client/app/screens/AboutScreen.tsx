/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @format
 */

import React from 'react';
import {StyleSheet, View} from 'react-native';

import Button from '@toolkit/ui/components/legacy/Button';
import {Body, Title} from '@toolkit/ui/components/legacy/Text';
import {Screen} from '@toolkit/ui/screen/Screen';
import {useNav} from '@toolkit/ui/screen/Nav';

const AboutScreen: Screen<{}> = () => {
  const {back} = useNav();

  return (
    <View style={S.container}>
      <View>
        <Title style={S.title}>Welcome to the NPE Toolkit!</Title>
        <Body style={S.body}>
          When building standalone apps, teams generally start from zero.
          {'\n\n'}
          Most standalone apps share a common set of features and functionality
          that are considered table stakes.
          {'\n\n'}
          We believe that by providing a common, easily deployable and
          customizable common set of components, we will accelerate time to
          learnings for teams building standalone apps.
          {'\n\n'}
          Good luck, and let us know what you're building!
        </Body>
      </View>

      <View style={{alignItems: 'center', marginTop: 48}}>
        <Body style={S.disclaimer}>
          Confidential and for internal-only development purposes. {'\n'}
          Please do not share externally.
        </Body>

        <Button
          text="Continue"
          size="lg"
          onPress={back}
          style={{paddingHorizontal: 48}}
        />
      </View>
    </View>
  );
};

const S = StyleSheet.create({
  container: {
    padding: 42,
    flex: 1,
  },
  title: {
    fontWeight: '600',
    fontSize: 24,
    marginBottom: 12,
    alignSelf: 'center',
    textAlign: 'center',
    paddingBottom: 8,
  },
  body: {fontSize: 18, textAlign: 'center'},
  disclaimer: {
    fontSize: 12,
    color: '#828282',
    textAlign: 'center',
    marginBottom: 16,
  },
});

AboutScreen.style = {nav: 'none', type: 'modal'};

export default AboutScreen;