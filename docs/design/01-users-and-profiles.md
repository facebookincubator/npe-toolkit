# **[01] Users and Profiles**

# Problem Statement

“Users” and “Profiles” are commonly used terms in app development, but there are
some semantics that were tricky to get right in the NPE Toolkit. This note
discusses the requirements for users and profiles, one (one option for) a
precise definition of these terms, and outlines the approach we’re using with
the Toolkit moving forward.

# Definitions

For the purposes of this design discussion:

- `User` refers to user account information that is visible only to that
  specific user.
- `Profile` refers to information about a user that are visible to other users
  in the product. Depending on your app, these fields may be public or visible
  to a subset of other users.

# Requirements

## User Information

We have many libraries that depend on known user fields for proper handling:
backend libraries that work with email, phone # for SMS, and verification status
and frontend components for login and account management.

**Requirement: Common `User` data type with a set of well-known fields**, to
enable common user functionality

## Profile Information

Although there is common `Profile` functionality, a shared a shared `Profile`
data type across across applications isn’t needed to enable this functionality.

Frontend editors and backend validation for specific fields can refer to the
field directly (e.g. `<LocationPicker value={profile.location} />.`

Common profile UI behavior appears to consist only of rendering a name and
profile picture in a “standard” way. These use cases can be handled by passing
in the name and picture separately or using a duck-typed object with these two
fields.

**No requirement for a common `Profile` data type**

## Shared between User and Profile

Fields on the shared `User` data type may also need to be visible to other
users, and so effectively be part of the `Profile` as well. The user’s name
(display name or username) and profile picture are almost always on the
`Profile`, and less frequently fields such as email or phone #.

However, the `Profile` fields fields are not always an exact copy of the fields
on `User`. For example, the `User` may have an email field and a field to
determine if the email is verified, while the `Profile` would only contain the
email if verified.

**Requirement: Clear pattern for syncing fields between `User` and `Profile`**,
with a hook for custom logic

# Approach for Toolkit

- `User` is a common data type that won’t be extended
- `Profile` data type is defined by each app
  - With encouragement to copy with well known semantics
- `User` is source of truth for fields that are on both data types
  - When writing `User` data, the app also needs to write the associated
    `Profile` fields (with app-specific logic)
- Writes can occur from client code during early user testing, but usually need
  to move to a server-side handler for launched apps, to:
  - Validate content of user and profile fields
  - Ensure shared fields are kept in sync, via transactions or triggers

## Previous Toolkit approach (for reference)

The Toolkit originally used a mental model of `User` containing all account
information (public and private), and `Profile` being an ACL on the fields in
`User`.

This led to `Profile` and `User` sharing the same data type, with an app
configuration for the names of the fields to copy over when writing `User` (for
datastore-specific reasons copying fields is a cleaner way to implement ACLs vs.
exposing the fields from the `User`).

This approach had few challenges:

- The data type with the union of all possible common fields between `User` and
  `Profile` was getting unwieldy
- It’s not sufficient to have an ACL on `User` fields - some fields are only
  visible with additional logic (see Requirements)
- Apps want to extend `Profile` arbitrarily, and extending via inheritance for
  shared data types led to awkward use of generics and a large set of optional
  and unused fields
  - Changing to an app-specific `Profile` type made the process and logic of
    building a `Profile` page and editor much simpler

# Full list of user & profile fields

## User fields

| Field         | Description                                                                                                                             | Shared with Profile?                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| name          | User’s real name or a non-unique pseudonym shown to the user in account settings UI (e.g. “Logged in as ${name}”).                      | If visible to other users. Apps with profiles will use this or a username on the profile to identify users |
| pic           | Picture shown to the user in account settings UI                                                                                        | If visible to other users (usually the case if you have profiles)                                          |
| handle        | Unique username or handle. May also be used in the account settings UI.                                                                 | Generally shown to other users (if you have profiles)                                                      |
| dob           | Users date of birth, used for age-specific settings                                                                                     | if visible to other users (very infrequent)                                                                |
| email         | User’s email, used for account communication, notifications, and sometimes login                                                        | if visible to other users and verified                                                                     |
| emailVerified | Whether the user’s email is verified as belonging to them. Many email features aren’t enabled until the user’s email is verified.       | not directly                                                                                               |
| phone         | User’s phone #, used for account communication, notifications, and sometimes login                                                      | if visible to other users and verified (infrequent)                                                        |
| phoneVerified | Whether the user’s phone # is verified as belonging to them. Almost all SMS features aren’t enabled until the user’s phone is verified. | not directly                                                                                               |
| roles         | The system roles assigned to this user                                                                                                  | no                                                                                                         |

## Profile fields

The Profile data type app-defined, and so this is a menu of fields that apps can
(but are not required to) use.

| Field    | Description                                                                                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name     | Stores either handle or name from the User. Using the same field as it is rare to display both to other users, and common profile UI can operate on object with {name, pic} |
| pic      | See User                                                                                                                                                                    |
| about    | Field for information about the user. Can be biographical, or a short user-provided blurb, or other. May support some subset of markdown                                    |
| location | Coarse user-provided location, as a string (e.g. “Bay Area”, or “Oakland, CA”, or “Mars” if the user is feeling fanciful)                                                   |
| links    | Links to the user’s information on other sites, usually with titles for the links                                                                                           |
| employer | Where the person works - may or may not be verified                                                                                                                         |
| email    | See User                                                                                                                                                                    |
| phone    | See User                                                                                                                                                                    |
| age      | See User                                                                                                                                                                    |
