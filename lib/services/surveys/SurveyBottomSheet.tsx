/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {Button} from 'react-native-paper';
import {URL} from 'react-native-url-polyfill';
import {useData} from '@toolkit/core/api/DataApi';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useTheme} from '@toolkit/core/client/Theme';
import {Survey} from '@toolkit/services/surveys/Survey';
import {
  GetSurveyForUser,
  LogSurveyImpression,
} from '@toolkit/services/surveys/SurveyApi';
import {useOpenUrl} from '@toolkit/ui/screen/WebScreen';

const SURVEY_PROMPT_DELAY_MS = 1000;
const SURVEY_PROMPT_CLOSE_MS = 1500000;
const USER_SURVEY_COOLDOWN_DAYS = 30;

const injectUserId = (userId: string, surveyUrl: string) => {
  const url = new URL(surveyUrl);
  const contextData = url.searchParams.get('cd');
  const data = contextData ? JSON.parse(contextData) : {};
  url.searchParams.set('cd', JSON.stringify({...data, userId}));

  return url.toString();
};

type Props = {
  headerText?: string;
  bodyText?: string;
  promptDelayMs?: number;
  promptCloseMs?: number;
  userSurveyCooldownDays?: number;
};

export default function SurveyBottomSheet(props: Props) {
  const {
    headerText = 'Share Feedback',
    bodyText = 'Please take a moment to share your thoughts. This will help us improve the experience.',
    promptDelayMs = SURVEY_PROMPT_DELAY_MS,
    promptCloseMs = SURVEY_PROMPT_CLOSE_MS,
    userSurveyCooldownDays = USER_SURVEY_COOLDOWN_DAYS,
  } = props;
  const bottomSheetRef = useRef<BottomSheet>(null);
  const openUrl = useOpenUrl();
  const getSurveyForUser = useData(GetSurveyForUser);
  const [survey, setSurvey] = useState<Survey>();
  const logSurveyImpression = (b: any) => {}; //useData(LogSurveyImpression);
  const user = requireLoggedInUser();
  const {backgroundColor} = useTheme();

  const showSurvey = () => {
    logSurveyImpression({survey: survey!, state: 'OPENED'});
    bottomSheetRef.current!.close();
    openUrl(survey!.url);
  };

  useEffect(() => {
    getSurveyForUser({cooldownDays: userSurveyCooldownDays}).then(survey => {
      if (survey) {
        setSurvey({...survey, url: injectUserId(user.id, survey.url)});
        setTimeout(() => {
          bottomSheetRef.current?.snapToIndex(0);
          logSurveyImpression({survey, state: 'SEEN'});
          setTimeout(() => bottomSheetRef.current?.close(), promptCloseMs);
        }, promptDelayMs);
      }
    });
  }, []);

  const snapPoints = useMemo(() => [375], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior="close"
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      style={{padding: 0, margin: 0, zIndex: 10}}
      backgroundStyle={{backgroundColor}}
      backdropComponent={renderBackdrop}
      index={-1}
      enablePanDownToClose
      snapPoints={snapPoints}
      handleComponent={null}>
      <View style={{flex: 1, alignItems: 'center'}}>
        <Text style={S.bottomSheetHeader}>{headerText}</Text>
        <Text style={S.bottomSheetBody}>{bodyText}</Text>
        <Button
          onPress={showSurvey}
          style={S.continueButton}
          labelStyle={{color: 'white'}}>
          Continue
        </Button>
        <Button
          onPress={() => bottomSheetRef.current!.close()}
          labelStyle={S.notNowButtonText}
          style={{marginTop: 5, backgroundColor: 'white'}}
          mode="text">
          Not Now
        </Button>
      </View>
    </BottomSheet>
  );
}

const S = StyleSheet.create({
  bottomSheetHeader: {
    color: 'black',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 20,
  },
  bottomSheetBody: {
    fontSize: 16,
    fontWeight: '400',
    marginTop: 10,
    paddingHorizontal: 38,
    textAlign: 'center',
  },
  continueButton: {
    marginTop: 20,
    width: 300,
    height: 50,
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  notNowButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
});
