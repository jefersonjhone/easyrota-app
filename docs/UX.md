
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

### Lucid Icons

Our icon library is [Lucid](https://lucide.dev/icons/), 
just browse their icon list and copy the JSX code.

> [!WARNING]
> I'll replace it by [Phosphor](https://phosphoricons.com/) 
> to follow our design's rules.

### TanStack

We're using [TanStack](https://tanstack.com/) to help us with trivial,
but essential features and behavior.

TanStack provides tools, such as:
- [TanStack Router](https://tanstack.com/router/latest) for application routes
- [TanStack Query](https://tanstack.com/query/latest) to connect to our API
- [TanStack Form](https://tanstack.com/form/latest) for better forms building


