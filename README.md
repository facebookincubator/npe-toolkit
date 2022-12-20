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

## Getting started

While the toolkit is under development, we aren't releasing NPM packages and
only support building from source.

To create your first build:

```
> git clone https://github.com/facebookincubator/npe-toolkit.git
> yarn create expo-app your-app-name ./npe-toolkit/templates/faves
```

Once we are fully launched, you'll be able to use the prebuilt templates by
calling one of the following

```
> npx create-expo-app your-app-name -t @npe-toolkit/template-name
> yarn create expo-app your-app-name -t @npe-toolkit/template-name
```

## License

The NPE Toolkit is MIT licensed, as found in the [LICENSE](LICENSE) file.
