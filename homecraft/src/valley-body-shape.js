// Modest variations that preserve the existing 42-bone binding and navigation capsule.
const shapes={slim:[.89,.985,.94],regular:[1,1,1],athletic:[1.10,1.025,1.05],stocky:[1.17,.985,1.10]};
export function bodyShape(build){return [...(shapes[build]||shapes.regular)]}

export function torsoProportions(build){return {...({slim:{waist:.146,chest:.191,shoulder:.201,depth:.96},regular:{waist:.155,chest:.198,shoulder:.208,depth:1},athletic:{waist:.146,chest:.208,shoulder:.219,depth:1.03},stocky:{waist:.171,chest:.204,shoulder:.213,depth:1.08}}[build]||{waist:.155,chest:.198,shoulder:.208,depth:1})}}
