// Test file for line wrapping - long function signature
fn computeShading(position: vec3<f32>, normal: vec3<f32>, lightDirection: vec3<f32>, viewDirection: vec3<f32>, materialColor: vec3<f32>) -> vec3<f32> {
    return position;
}

// Short function - should not wrap
fn add(a: f32, b: f32) -> f32 {
    return a;
}
