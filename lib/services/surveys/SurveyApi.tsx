/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall npe_central_engineering
 */

import {Opt} from '@toolkit/core/util/Types';
import {dataApi, useData} from '@toolkit/core/api/DataApi';
import {requireLoggedInUser} from '@toolkit/core/api/User';
import {useDataStore} from '@toolkit/data/DataStore';
import {Survey, SurveyImpressions, SurveyImpressionState} from '@toolkit/services/surveys/Survey';

export const LogSurveyImpression = dataApi<
  {survey: Survey; state: SurveyImpressionState},
  void
>('logSurveyImpression', () => {
  const surveyImpStore = useDataStore(SurveyImpressions);
  const user = requireLoggedInUser();

  return async ({survey, state}) => {
    const existing = await surveyImpStore.get(user.id);
    if (existing) {
      await surveyImpStore.update({
        id: user.id,
        state: {...existing.state, [survey.id]: state},
      });
    } else {
      await surveyImpStore.create({
        id: user.id,
        user,
        state: {[survey.id]: state},
      });
    }
  };
});

export const GetSurveyForUser = dataApi<{cooldownDays: number}, Opt<Survey>>(
  'getSurveyForUser',
  () => {
    const surveyImpStore = useDataStore(SurveyImpressions);
    const user = requireLoggedInUser();
    const surveyDatastore = useDataStore(Survey);

    return async ({cooldownDays}) => {
      const getActiveSurveys = surveyDatastore.getMany({
        query: {
          where: [{field: 'active', op: '==', value: true}],
        },
      });
      const [storedImp, activeSurveys] = await Promise.all([
        surveyImpStore.get(user.id),
        getActiveSurveys,
      ]);

      const imp = storedImp ?? {
        updatedAt: 0,
        state: {},
      };

      const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;

      // Cooldown has passed if impression doc was updated
      // more than cooldown days ago
      const cooldownPassed = imp.updatedAt! + cooldownMs < Date.now();

      // A survey is unseen if it's not present in the imp state
      const unseenSurveys = activeSurveys.filter(s => !(s.id in imp.state));

      // Return a survey if cooldown has passed and there's an unseen survey
      if (cooldownPassed && unseenSurveys.length > 0) {
        return unseenSurveys.sort((a, b) => a.createdAt! - b.createdAt!)[0];
      }

      // Otherwise, just return null
      return null;
    };
  },
);
