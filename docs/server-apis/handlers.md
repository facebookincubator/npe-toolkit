## Handler API / Firebase Functions

Firebase Functions makes it easy to run backend code without needing to manage
and scale your own servers. NPE Toolkit helps build secure API handler and
easy-to-use client frameworks on top of Firebase Functions.

### Building API Handlers

#### 1.Initialize Firebase Functions/Server

In your main Functions file (e.g. `server/functions/src/index.ts`), ensure that
you have initialized Firebase.

This will happen by default if you use the new project template.

> TODO: Add example

#### 2.Write a new handler

Use `registerHandler()` to wrap your handler logic. `registerHandler()` provides
Typescript typecheck and layers the handler logic with the default middlewares
(e.g. authentication and logging) and exception handler.

```tsx
import {registerHandler} from '@toolkit/providers/firebase/server/Handler';

type InputType = {foo: string};
type OutputType = {bar: number};
const MY_API_KEY = createApiKey<InputType, OutputType>('myNewHandler');

export const myNewHandler = registerHandler(
  MY_API_KEY,
  async (input: InputType): OutputType => {
    // Add your handler logic here
  },
);
```

Provided authentication middleware adds `user` information to a request scope,
if it’s a call from an authenticated user. Anywhere in your handler code, you
can look up `user` by

```tsx
import {getRequestScope} from'./FirebaseServerHandler';
const user = getLoggedInUser();
// or
const user = requireLoggedInUser(); // throws an exeption if this is not an authenticated user call
```

Default exception handler catches and wraps an error using Firebase
`HttpsError`. It will preserve `CodedError` details, so that clients will
receive the same `CodedError` with `userVisibleMessage` and `devMessage`. This
makes it easy for server and client code to share same errors.

> NOTE: If you create handlers in a new file, make sure they are exported from
> `index.ts` as well.

e.g.

```tsx
export {handler1, handler2, ...} from'./new_handler_file';
```

### Calling Handlers from Client

You can call a handler using our client API lib. The library wraps a Firebase
Function call to provide type-safety and error handling (e.g. `CodedError`
conversion from server).

First, create an API key using `createApiKey({HANDLER_NAME})`. You can pass
input and output types as shown below for Typescript typecheck. Create a
callable API method with `useAPI()` and call.

```tsx
import {createApiKey} from '@toolkit/core/api/DataApi';
import {useApi} from '@toolkit/providers/firebase/client/FunctionsApi';

type InputType = {foo: string};
type OutputType = {bar: number};

const MY_API_KEY = createApiKey<InputType,OutputType>('myNewHandler');
const myApi = useApi(MY_API_KEY);

function MyComponent(props: Props) {
  async functionon Press() {
    try {
      const result = await myApi({foo: 'bar'});
      console.log(result.bar);
    }
    catch (e) {
      // Do something with the coded error here
    }
  }
}
```
