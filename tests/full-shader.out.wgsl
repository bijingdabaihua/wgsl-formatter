struct Uniforms {
    modelView:  mat4x4<f32>,
    projection: mat4x4<f32>,
}
struct VertexInput {
    @location(0) pos:    vec3<f32>,
    @location(1) normal: vec3<f32>,
}

@vertex
fn main(input: VertexInput) -> @builtin(position) vec4<f32> {
    var worldPos: vec4<f32> = model * vec4<f32>(input.pos, 1.0);
    return projection * worldPos;
}
@fragment
fn main() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}
