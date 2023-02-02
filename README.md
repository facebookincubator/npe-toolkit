# The NPE Toolkit

The NPE Toolkit is a set of libraries, guides, blueprints, and sample code, to
enable rapidly building 0-1 applications on iOS, Android and web.

As a 0-1 app builder, you should spend your time building the features that make
your app special! The Toolkit provides out-of-the box functionality for common
app flows, including login, settings, profiles, onboarding, and notifications,
so you can focus on your app's unique value proposition.

We’ve also made it easy to customize the screens, flows, and behaviors as your
app grows, as it’s not realistic to have a one-size-fits-all UI experience that
will work for all apps and at all stages. To the extent possible, tools in the
Toolkit are independently adoptable. Specifically all pre-built user-facing
screens are easy to swap out with your own version as your product matures.

The Toolkit is built on top of React Native on the client side (including React
Native web for web applications). We will support multiple server platforms in
the Toolkit, but to start we are building on top of Firebase as it has
higher-level services for authentication, data access, storage, and managed
deployment of server-side functionality that give us a strong baseline to build
upon.

See the [CONTRIBUTING](CONTRIBUTING.md) file for how to help out.

## 🚧 🚧 The NPE Toolkit is Under Construction 🚧🚧

The [New Product Experimentation](https://npe.fb.com) team at Meta has been
using the Toolkit libraries to rapidly prototype and test new application ideas
since early 2022.

We've started the Github project in the
[Meta Incubator](https://github.com/facebookincubator) to iterate in the open,
but there are **lot of rough edges** and as the Toolkit isn't yet ready for
broad usage yet.

Please [reach out](mailto:npe-toolkit-project@meta.com) to the NPE Toolkit team
if you are interested in becoming one of our first external users.

## Getting started

### Create your new Toolkit app from a template

To run your first build, run the following (replacing `your-toolkit-app` with
the name of your app):

```
git clone https://github.com/facebookincubator/npe-toolkit.git
yarn create expo-app your-toolkit-app -t ./npe-toolkit/templates/faves
```

Because the toolkit is under active, daily development and hasn't cut an initial
release, you need to clone the GitHub source code to build apps on the Toolkit.

### Setting up Firebase

Current Toolkit app templates require a Firebase backend to log in and store
data. To set up Firebase for your project, follow the steps at
[Configuring Firebase](docs/getting-started/Firebase.md) - this should take
under 10 minutes.

We're evaluating whether it makes sense to deploy a common project so that when
you first spin up a Toolkit app you'll have a backend — this has a lot of pros
and cons, so for now you need to create your own Firebase project.

### If you have a different directory structure

The default app setup expects your app's directory to be a sibling of the
`npe-toolkit` directory.

If you are installing to a different location, you need to create a symlink
peer, using the following command:

```
ln -snf $PATH_TO_NPE_TOOLKIT $YOUR_APP_DIR/../npe-toolkit
```

### (future plans) How apps will be created in General Availability

When we're in GA, the toolkit will be packaged into an NPM package and you can
get started without cloning the NPE Toolkit Github project.

It will be a single step to get started, calling either

```
> npx create-expo-app your-app-name -t @npe-toolkit/template-name
```

**or**

```
> yarn create expo-app your-app-name -t @npe-toolkit/template-name
```

## License

The NPE Toolkit is MIT licensed, as found in the [LICENSE](LICENSE) file.
