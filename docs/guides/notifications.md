> NOTE: This is a WIP and information will be updated as we iterate.

This guide has been tested for iOS, but should work for Android with some
modifications (except the setup which is very different for Android)

# Setup for iOS apps.

First we'll set up your app to receive push notifications.

## 1. Apple Developer Portal

You'll need to do some basic app setup before adding push notifications to your
app. If all you're doing is adding push notifications to an existing app, most
of these should already be done.

### 1.1 Bundle ID and Push Notifications capability

In the Apple Developer Portal, go to
[Certificates, Identifiers & Profiles and then click on Identifers](https://developer.apple.com/account/resources/identifiers/list).

Create a bundle ID for your app and add the Push Notifications capability. If
you generated provisioning profiles before this step,
[you'll need to generate them again after adding this capability.](#1-3-generate-provisionin)

### 1.2 Generate Push Certificates

In the same place where you added the Push Notifications capability, click the
"Configure" button and then click "Create Certificate". If you're using a
development provisioning profile, create a development cert. If you're using an
ad hoc or production provisioning profile, create a production cert.

Follow the instructions to create a push certificate for your app. You'll need
to use
[Keychain Access on your laptop to generate Certificate Signing Request](https://help.apple.com/developer-account/#/devbfa00fef7)
and then upload that to the Developer Portal.

Download these certs and install them in Keychain Access. Right click the
installed cert and then click Export. Create a password and save it somewhere on
your laptop.

### 1.3 Generate provisioning profiles

Go to Profiles and generate a new provisioning profile for your app.

Choose "iOS App Development" if you just want to build with Xcode and develop.

> TODO: Which certs should be selected

When selecting devices, just select all of them unless you want to limit your
builds to only a certain set of phones.

## 2. Configure Firebase

Create an iOS app in your Firebase project. Then in Project Settings > Cloud
Messaging, upload your downloaded certs under your app > APNs Certificates.

## 3. Build your app

> TODO: Add link

# Common Setup

The easiest way to get up and running quickly is to use `NotificationChannel`s
and configure notifications using `NotificationsConfig` and
`NotificationsSendConfig`. These should be stored in a place that's accessible
from both your React Native client code, and your server code (usually Firebase
functions if you're using FCM).

## 1. Notification Channels

`NotificationChannel`s provide a really easy way to format and keep track of the
notifications sent from your app. The configuration is pretty simple - here's
what you'll need to specify:

1. `id`'s are for internal tracking and conventionally have the format
   `<APP_NAME>:<NOTIFICATION_NAME>`. For example a notification for someone
   liking your post might have the format `MY_APP:LIKE_RECEIVED`.

2. `name` should be a user visible name for the notification that users might
   see in a notification preferences screen.

3. `description` should be a user visible string describing what the
   notification is for that users might see in a notification preferences
   screen.

4. `titleFormat` should be format string for your notification's title. This
   should be an
   [ES2015 style template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
   with quotes (' or ") instead of backticks(\`). This string will be rendered
   when the notification is sent with actual data. For example, in a
   notification for someone liking your post, you could use
   `'${liker_name} liked your post'`. See below on how this is actually
   rendered.

5. `bodyFormat` should be a format string for your notification's body. This
   should be an
   [ES2015 style template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
   with quotes (' or ") instead of backticks(\`). This string will be rendered
   when the notification is sent with actual data. For example, in a
   notification for someone liking your post, you could use
   `'${liker_username} and ${others_like_count} others liked your post'`. See
   below on how this is actually rendered.

6. `defaultFeliveryMethod` should be either `'EMAIL'`, `'SMS'`, or `'PUSH'`
   (though only push is supported for now). This is the default deliver method
   for this channel. Users should be able to change this in their preferences.

## 2. Notifications Config

The `NotificationsConfig` defines an interface between the the notification
service and your app's auth/storage.

If you want to configure this for some other auth and storage backend, you'll
need to implement:

1. `registerPushToken`: A function that accepts a user ID and a
   [`PushToken`](https://github.com/facebookincubator/npe-toolkit/blob/d7810a828e46aaaf3337211a606a017ef8dc406b/lib/services/notifications/NotificationTypes.tsx#L34)
   object. This should store the push token in your storage (for example in
   Firestore). In order to use FCM, you'll also need to convert this into an FCM
   token at some point (see more about this below).

2. `unregisterPushToken`: A function that accepts a user ID and a
   [`PushToken`](https://github.com/facebookincubator/npe-toolkit/blob/d7810a828e46aaaf3337211a606a017ef8dc406b/lib/services/notifications/NotificationTypes.tsx#L34)
   object. This should delete the push token for the user. This will be called
   if a push token has expired.

3. `getSendDestination`: A function that accepts a user ID and
   [`DeliveryMethod`](https://github.com/facebookincubator/npe-toolkit/blob/d7810a828e46aaaf3337211a606a017ef8dc406b/lib/services/notifications/NotificationTypes.tsx#L22).
   For push notifications, this should return FCM tokens. For emails, this
   should return the user's email address. For SMS notifications, this should
   return the user's phone number.

4. `setNotificationPrefs`: A function that accepts a user ID,
   `NotificationChannel`, an array of `DeliveryMethod`s, and a boolean flag
   indicating whether this notification should be enabled for the user. You
   should the user's preference somewhere and return it in the next method. You
   can omit this function if you haven't implemented user notification
   preferences in your app yet. By default, this channel will be enabled for all
   users and sent via the `defaultDeliveryMethod` for the channel.

5. `getNotificationPrefs`: A function that accepts a user ID and
   `NotificationChannel`. If the user has disabled the given channel, this
   should return an empty array. Otherwise, this should return the delivery
   methods for this user and channel stored by the set function above.

## 3. Notifications Send Config

The `NotificationsSendConfig` describes how the notification should be sent out.
If you're using FCM, you should just use the helpers provided in
[`FirebaseNotificationsSender.tsx`](https://github.com/facebookincubator/npe-toolkit/blob/6e1620918cac9269ae0031dfb4ec3f65ea84a3c4/lib/providers/firebase/server/PushNotifications.tsx):

```tsx
const sendConfig: SendNotificationConfig = {
  sendPush,
  sendEmail,
  sendSMS,
};
```

NOTE: `sendEmail` and `sendSMS` don't exist for Firebase yet. They should be
available sometime in January 2022.

## 4. NotificationSender

`NotificationsSender` is a wrapper around the function to send your
notifications. It accepts the configurations above (`NotificationsConfig` and
`NotificationsSendConfig`) and returns a function that will send notifications.

You should use this send function to send notificaitons.The send function
accepts a user ID, a `NotificationChannel`, title params, and body params to
insert into the formats described in the channel. The function will then
incorporate user preferences and send out your notification.

## Example Common Setup

Imagine a hypothetical app where users can post photos and like other user's
photos. This is an example of sending a notification to a user when someone
likes their photo.

```tsx
// In a channels file (named Channels.tsx in this example)
import NotificationChannel from '@npe/lib/notifications/NotificationChannel';

export CHANNELS = {
  postLiked: new NotificationChannel({
    id: 'MY_APP:POST_LIKED',
    name: 'Post Liked',
    description: 'Sent when someone likes a photo you posted',
    title_format: '${likerUsername} liked your photo',
    body_format: '${likerUsername} and ${otherLikeCount} others liked your photo',
    default_delivery_method: 'PUSH',
  }),
};

// In a configuration file (named NotifConfig.tsx in this example)
import {sendPush, sendEmail, sendSMS} from '@npe/lib/firebase/FirebaseNotificationsSender';
import {NotificationsConfig} from '@npe/lib/notifications/NotificationsConfig'
import {
  SendNotificationConfig,
  NotificationsSender,
} from '@npe/lib/notifications/NotificationsSender';

export const notifsConfig: NotificationsConfig = { ... };
const sendConfig: SendNotificationconfig = {
  sendPush,
  sendEmail,
  sendSMS,
};

export const sendNotification = NotificationsSender(notifsConfig, sendConfig);

// In your server code
import {sendNotification} from './NotifConfig';
import {CHANNELS} from './Channels';

// In a cloud function
const post = posts.get(postID);
const prevLikes = post.likes;
const postAuthor = posts.author;
const liker = users.get(likerID);

await posts.update({id: post.id, likes: prevLikes + 1});

const channel = CHANNELS.postLiked
const titleParams = {
  likerUsername: liker.username,
}
const bodyParams = {
  likerUsername: liker.username,
  otherLikeCount: prevLikes,
}

await sendNotification(postAuthor.id, channel, titleParams, bodyParams);
```

# Server setup

1. In your function where someone performs an action that should send a
   notification, import the send function from NPE Lib
   (`import {send} from '@npe/lib/notifications/send'`) along with your
   notification channel for this action.

2. Just use this function to send notifications. It'll need the push tokens you
   want to send the notification to, along with the channel object, and the
   parameters for the title and the body of the notification.
