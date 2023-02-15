# Model

Here is a simple data model defined with PADS:

```tsx
@Model()
class City extends BaseModel {
  @Field() name: string;
  @Field() population: number;
}
```

`@Model` decorator registers the `City` model with PADS. `City` has two fields
`name` and `population` annotated by `@Field` decorator. Extending `BaseModel`
is required and provides the default attributes such as `id`, `createdAt`, and
`updatedAt`.

PADS uses the model class name as the DB table/collection name. If you want to
give the table/collection a different name, pass a `name` param to `@Model`:

```tsx
@Model({name:'ex_country'})
class Country extends BaseModel { ... }
```

### Primitive Types

JS/TS primitive types (string, boolean, number) get mapped to PADS types
(String, Bool, Int/Float) automatically. You can specify the field type by
passing the PADS type to `@Field`. For example, `City.population` (JS type
`number`) can be further defined as `Int`:

```tsx
@Field(TInt) population: number;
```

(PADS types have `T` prefix to prevent name collision)

#### TS union / enum

If you want to typecheck field values, you can use TS union or enum. Just pass
the base type to `@Field`:

```tsx
@Model()
class Media extends BaseModel {
  @Field(TString) type: 'audio' | 'video' | 'photo';
```

### Model Reference Type

Model can reference other models. For example, we create a new data model
`Country` that has a reference field `capital` of type `City` as shown below:

```tsx
@Model()
class Country extends BaseModel {
  @Field() capital: City;
}
```

A model-reference type also get mapped to the PADS type automatically.

#### Reference a Model before defined / Circular reference

Sometimes, you have to reference another model before it is defined but may get
a JS error (e.g. `ReferenceError: Cannot access 'XYZ' before initialization`).
In this case, pass a function that returns the _to-be-defined_ model.

```tsx
@Model()
class Country extends BaseModel {
  @Field(TModel(() => City)) capital?: R<City>;
}
// R<City> is short for ReturnType<()=>City>

@Model()
class City extends BaseModel {
  @Field() country?: Country;
}
```

### Inverse Relationship

Model may have an inverse relationship. For instance, `Country` has a reference
to `Continent`. `Continent` may have an inverse field `countries` to query all
`Country` objects that point to it (more on this later).

Annotate `Continent.countries` with `@InverseField` and pass in an `inverse`
param to `@Field` decorating `Country.continent`. Set `many` to `true` if there
are multiple `Country` map to the inverse field:

```tsx
@Model()
class Continent extends BaseModel {
  @InverseField() countries?: R<Country[]>;
}

@Model()
class Country extends BaseModel {
  @Field({inverse: {field: 'countries', many: true}})
  continent: Continent;
}
```

`@InverseField` will not be stored in DB.

### Collection Types

In addition to the primitive and model-reference types, PADS supports two
collection types: `Array` and `Map`.

`Array` type requires an element type (primitive or model-reference type). For
example, we can add an Array of String field `zipcodes` to `City`.

```tsx
@Model()
class City extends BaseModel {
  …
  @Field(TArray(TString)) zipcodes: string[];
}
```

`Map` type represents a simple dictionary with a string `key` and a primitive
type `value`.

```tsx
@Model()
class City extends BaseModel {
  …
  @Field(TMap) demographics: Record<string, number>;
}
```
