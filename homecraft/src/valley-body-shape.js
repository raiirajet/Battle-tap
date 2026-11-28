// Modest variations that preserve the existing 42-bone binding and navigation capsule.
const shapes={slim:[.89,.985,.94],regular:[1,1,1],athletic:[1.10,1.025,1.05],stocky:[1.17,.985,1.10]};
export function bodyShape(build){return [...(shapes[build]||shapes.regular)]}
