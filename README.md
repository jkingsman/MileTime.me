# MileTime.me

A simple site to generate mi/min, km/min, and race time breakdowns. See the actual site at https://miletime.me/

The bulk of the logic is in `src/components/pace-calculator.tsx`.

`yarn dev` provides a hot-reloading dev environment; `yarn build` generates a static render in `./dist`. This is a pretty vanilla Vite site; overkill for its usage per usual but I decided to branch out from my "bang out the JS by hand" approach for the sake of development speed and flexibility. Run `yarn quality` to `eslint` and `prettier` your work in place.

This site is one of my experiments in LLM-assisted site design; please keep that in mind during code inspection (I am an SRE, not a frontend engineer!).

Please see `LICENSE.md` for relevant cited works.

## Frontend Sanity Test

There is a console-pastable sanity check in `testing.js` that can be used to make sure you didn't break anything major.

For usage:

* Set a wide pace range
* All speed + pace units turned on
* Row interval in round `sec/km`
* Distances at default

You can also test other row intervals, but you'll need to adjust tolerances due to rounding errors. When the test is done, you should see an output for each row validation.
