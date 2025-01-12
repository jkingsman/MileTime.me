# MileTime.me

A simple site to generate mi/min, km/min, and race time breakdowns. See the actual site at https://miletime.me/

The bulk of the logic is in `src/components/pace-calculator.tsx`.

`yarn dev` provides a hot-reloading dev environment; `yarn build` generates a static render in `./dist`. This is a pretty vanilla Vite site; overkill for its usage per usual but I decided to branch out from my "bang out the JS by hand" approach for the sake of development speed and flexibility.

This site is one of my experiments in LLM-assisted site design; please keep that in mind during code inspection (I am an SRE, not a frontend engineer!).

Please see `LICENSE.md` for relevant cited works.
