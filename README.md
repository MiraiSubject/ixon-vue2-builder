# vue2-builder for the new IXON CDK

This builder adds backwards compatibility support to vue 2 components in the new IXON CDK. They decided to drop Vue 2 support with the new version of their CDK and you're required to use their CDK to deploy new versions from now on. So this brings back vue 2 support so we can maintain our existing components during the migration phase.

This is made for Ovocloud internal usage first but I have included some instructions below for anybody that runs into this as well. This was made in mind with [vue-custom-element](https://github.com/karol-f/vue-custom-element), so if you use this it will very likely work. It might work with vue 2's official but broken custom-element implementation as well but no guarantees.

## How to use
Create an `.npmrc` file or append your existing file with: 
```
@miraisubject:registry=https://npm.pkg.github.com
```

then run `npm install @miraisubject/ixon-vue2-builder`

In your IXON `config.json` change the builder to `@miraisubject/ixon-vue2-builder:browser`.

Check the following example for a reference: 

```json
{
  "$schema": "./node_modules/@ixon-cdk/core/config/schema.json",
  "prefix": "your-prefix",
  "components": {
    "vue2-component": {
      "runner": {
        "build": {
          "builder": "@miraisubject/ixon-vue2-builder:browser",
          "input": "vue2-component.vue"
        }
      }
    },
  }
}
```

**It's important to note that this will very likely break Vue 3 building due to the different versions of Vue being present. So if both are required please maintain them in separate repos or branches**

