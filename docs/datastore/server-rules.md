# Enforcing Firestore Security Rules in Firebase Functions / Server Code

Firebase Functions by default/design use the `firebase-admin` (Admin SDK) server
library. This means your Functions code/handlers can access other Firebase
services (e.g. Realtime Database, Auth, Firestore) with full admin privileges.

While this can be OK in a server environment, we use Firebase Functions to build
client API handlers that execute requests on behalf of an anonymous or
specific/authenticated user, and this is asignificant security concern.

For instance, when accessing Firestore in Functions, Admin SDK will bypass the
Firestore security rules and can read/write to the database with no restriction.
i.e. a request from User A request can read/write User B's data in Firestore.

This guide walks you through how to set up and use the Firebase client library
(Client SDK - `firebase`, `firebase/app`,`firebase/firestore`, etc) so the
existing Firestore access/security rules are enforced as done with the Firebase
apps.

## Setting up a service account

We will need a service account to generate a Custom Token for a user and use
that to authenticate the client JS library. Steps:

1. **Enable Identity and Access Management (IAM) API** <br/>Visit
   [here](https://console.cloud.google.com/apis/api/iam.googleapis.com/overview)
   and enable IAM API for your project.
2. **Set up a service account**<br> Visit the
   [service accounts page](https://console.cloud.google.com/projectselector2/iam-admin/serviceaccounts)
   on GCP here and find the service account of your Firebase project. It should
   have the following format: `{project-name}@appspot.gserviceaccount.com`
   - Click the three-dot icon under `Actions` and select `Manage permissions`
   - In the `PERMISSIONS` page, click `GRANT ACCESS`
   - In the form, enter your service account email address for `New principals`
     and select a `Service Accounts”/”Service Account Token Creator` for the
     role to add, then click `Save`

> TODO: Add notes how to enable / disable this in new server projects
