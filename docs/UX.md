
# Development Guide for UX/UI for this project

## Theme and Preview

If you want to have a look about the look&feel of Easy Rota,
have a look at [our custom theme](https://ui.shadcn.com/create?preset=b4HPQUBrn9&item=preview).

## Tooling Overview

### Language: Typescript

We're using Typescript as main language to develop the front-end.
The reason why we choose such tool is to validate types at compile time,
ensuring we won't face fancy issues at runtime due to mistyping.

Plase, refer to their [documentation](https://www.typescriptlang.org/docs/handbook/intro.html)
in order to understand the features this language provides to us.

### React

We're using [React](https://react.dev/) as our main front-end library to 
structure, organize and interact with the UI. 

Please, refer to [their documentation](https://react.dev/learn/describing-the-ui) to 
learn the steps of developing with such tool.


### Shadcn

Shadcn is a powerful UI-kit that facilitates our front-end development
by giving us pre-built generic components.

This gives us powerful flexibility and productivity.
We don't need to do things from scratch,
or even worry too much about design, 
since those components are carefully crafted.

See their [official documentation](https://ui.shadcn.com/docs/components).

### TailwindCSS

Tailwind is our best friend to craft beautiful UI faster.
Tailwind integrates very well on Shadcn.
This help us to avoid un-sync html and css, 
by injecting css into the html code directly.

See [Tailwind's documentation](https://tailwindcss.com/docs/styling-with-utility-classes) 
to understand the classes they provide.

### Phosphor Icons

Our icon library is [Phosphor](https://phosphoricons.com/), 
just browse their icon list and copy the JSX code.


### TanStack

We're using [TanStack](https://tanstack.com/) to help us with trivial,
but essential features and behavior.

TanStack provides tools, such as:
- [TanStack Router](https://tanstack.com/router/latest) for application routes
- [TanStack Query](https://tanstack.com/query/latest) to connect to our API
- [TanStack Form](https://tanstack.com/form/latest) for better forms building


## How to Contribute

Our front-end application is found under `frontend`, 
and it has the following structure:
- `assets/`: to store images, icons, etc.
- `components/`: all components used by the application
- `components/ui/`: base components, such as shadcn's or custom ones.
- `components/<slice>/`: components used by a specific feature.
- `pages/`: all pages of our application. The structure is 1:1 with our application route.
- `lib/`: common functions, types, etc.

### Creating a new page

Open your terminal and type:

```sh
bun dev
```

Open `@/pages/` and create a new react file, matching with the route you want.

Automatically, our tanstack router will notice a file was created inside `@/pages/`
and will fill your file with the needed logic to register this route
inside `routeTree.gen.ts`.

### Adding components

Make sure, you component already exists inside `@/components/ui`.
If the component you wish does not exists, run:

```sh
bunx --bun shadcn@latest add <component>
```

Refer to Shadcn's documentation to add the correct component.
Remember to use `bun` for this task.

### Custom styling

If you need to style some piece of your UI, first, try to do this using Tailwind CSS.
Otherwise, you may create a CSS file.

Some stylings are impossible (or very ugly) to do with Tailwind, so, 
you may create a CSS file and use it instead.

#### Custom backgrounds

[Magic Pattern](https://www.magicpattern.design/) is an awesome resource to create
fancy background to our UI, so it won't look lifeless and empty.

In this case, I encourage you to create a separate CSS file in order to use their
background images.
