struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
}

struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) worldNormal: vec3<f32>,
  @location(2) uv: vec2<f32>,
}

struct SceneUniforms {
  viewProjection: mat4x4<f32>,
  model: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  cameraPos: vec4<f32>,
  lightDir: vec4<f32>,      // main light direction  (xyz, w unused)
  lightColor: vec4<f32>,    // main light color
  ambientColor: vec4<f32>,  // ambient
  fillDir: vec4<f32>,       // fill light direction
  fillColor: vec4<f32>,     // fill light color (dim)
}

@group(0) @binding(0) var<uniform> scene: SceneUniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
  let worldPos = scene.model * vec4<f32>(input.position, 1.0);
  let worldNormal = normalize((scene.normalMatrix * vec4<f32>(input.normal, 0.0)).xyz);

  var output: VertexOutput;
  output.clipPos = scene.viewProjection * worldPos;
  output.worldPos = worldPos.xyz;
  output.worldNormal = worldNormal;
  output.uv = input.uv;
  return output;
}
